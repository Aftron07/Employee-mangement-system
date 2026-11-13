import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import VerifiedUserOutlined from "@mui/icons-material/VerifiedUserOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import EventAvailableOutlined from "@mui/icons-material/EventAvailableOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import ArrowBack from "@mui/icons-material/ArrowBack";
import AdminEmployeeForm from "../components/AdminEmployeeForm";
import AdminAttendance from "../components/AdminAttendance";
import DashboardHeader from "../components/DashboardHeader";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

const themes = {
  indigo: { bar: "#6366f1", tile: "linear-gradient(135deg, #6366f1, #4338ca)" },
  violet: { bar: "#8b5cf6", tile: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
  emerald: { bar: "#10b981", tile: "linear-gradient(135deg, #10b981, #047857)" },
  amber: { bar: "#f59e0b", tile: "linear-gradient(135deg, #f59e0b, #ea580c)" },
  sky: { bar: "#0ea5e9", tile: "linear-gradient(135deg, #0ea5e9, #0369a1)" },
  rose: { bar: "#f43f5e", tile: "linear-gradient(135deg, #f43f5e, #be123c)" },
};

const adminModules = [
  {
    title: "Employee Management",
    description: "Create employee profiles and login accounts.",
    Icon: PeopleOutlined,
    action: "employees",
    color: "indigo",
  },
  {
    title: "Manager & Team Management",
    description: "Manage manager accounts and team access.",
    Icon: PersonOutlined,
    action: "managers",
    color: "violet",
  },
  {
    title: "Department Management",
    description: "View and manage company departments.",
    Icon: BusinessOutlined,
    action: "departments",
    color: "emerald",
  },
  {
    title: "Account Security",
    description: "Manage account access and security.",
    Icon: VerifiedUserOutlined,
    action: "security",
    color: "amber",
  },
  {
    title: "Attendance",
    description: "Review daily attendance records.",
    Icon: AccessTimeOutlined,
    action: "attendance",
    color: "sky",
  },
];

// Numbers that have real data behind them.
const liveStats = [
  { key: "employees", label: "Total employees", Icon: PeopleOutlined, color: "indigo" },
  { key: "departments", label: "Active departments", Icon: BusinessOutlined, color: "emerald" },
  { key: "present_today", label: "Present today", Icon: AccessTimeOutlined, color: "sky" },
  { key: "locked_accounts", label: "Locked accounts", Icon: LockOutlined, color: "amber" },
];

// Numbers that need modules we have not built yet.
const comingSoonStats = [
  { label: "On leave today", Icon: EventAvailableOutlined, color: "violet" },
  { label: "Pending requests", Icon: InsertDriveFileOutlined, color: "rose" },
];

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

function IconTile({ Icon, color, size = 48 }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "common.white",
        background: themes[color].tile,
        boxShadow: 3,
      }}
    >
      <Icon />
    </Box>
  );
}

function StatCard({ label, Icon, color, value, soon }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <IconTile Icon={Icon} color={color} />
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          {soon ? (
            <Chip label="Coming soon" size="small" sx={{ mt: 0.5 }} />
          ) : (
            <Typography variant="h5">{value}</Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [activeModule, setActiveModule] = useState("home");
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Reload the numbers every time the user returns to the dashboard home.
  useEffect(() => {
    if (activeModule !== "home") return;

    let cancelled = false;

    async function loadSummary() {
      try {
        setLoadingSummary(true);
        setSummaryError("");

        const data = await apiRequest("/dashboard/admin", {}, token);

        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) {
          setSummaryError(err.message || "Could not load dashboard data.");
        }
      } finally {
        if (!cancelled) setLoadingSummary(false);
      }
    }

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [activeModule, token]);

  function statValue(key) {
    if (loadingSummary) return "…";
    const value = summary?.totals?.[key];
    return value === undefined ? "—" : value;
  }

  const backButton = (
    <Button
      startIcon={<ArrowBack />}
      onClick={() => setActiveModule("home")}
      sx={{ mb: 3 }}
    >
      Back to Dashboard
    </Button>
  );

  const activeInfo = adminModules.find((m) => m.action === activeModule);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #e0f2fe 100%)",
      }}
    >
      <DashboardHeader />

      <Container maxWidth="lg" sx={{ py: 5 }}>
        {activeModule === "home" && (
          <>
            <Chip
              label="Administration"
              color="primary"
              size="small"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            />

            <Typography variant="h4" sx={{ mt: 1.5 }}>
              Admin Dashboard
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Manage employees, departments and account access.
            </Typography>

            {summaryError && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {summaryError}
              </Alert>
            )}

            <Box
              sx={{
                mt: 4,
                display: "grid",
                gap: 2.5,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
              }}
            >
              {liveStats.map((stat) => (
                <StatCard
                  key={stat.key}
                  label={stat.label}
                  Icon={stat.Icon}
                  color={stat.color}
                  value={statValue(stat.key)}
                />
              ))}

              {comingSoonStats.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  Icon={stat.Icon}
                  color={stat.color}
                  soon
                />
              ))}
            </Box>

            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 4 }}>
              <Button
                variant="contained"
                startIcon={<PersonAddOutlined />}
                onClick={() => setActiveModule("employees")}
                sx={{
                  background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
                }}
              >
                Add Employee
              </Button>

              <Button
                variant="outlined"
                disabled
                title="Available when the Announcements module is built"
              >
                Post Announcement (coming soon)
              </Button>
            </Stack>

            <Paper variant="outlined" sx={{ mt: 4, p: 3, borderRadius: 4 }}>
              <Typography variant="h6">Recently added employees</Typography>

              {loadingSummary ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading...
                </Typography>
              ) : summary?.recent_employees?.length ? (
                <Box sx={{ mt: 1 }}>
                  {summary.recent_employees.map((employee, index) => (
                    <Box key={employee.id}>
                      {index > 0 && <Divider />}
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ py: 1.5 }}
                      >
                        <Box>
                          <Typography fontWeight={600}>
                            {employee.first_name} {employee.last_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {employee.designation || "No designation"} ·{" "}
                            {employee.employee_code}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(employee.created_at)}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  No employees yet. Use Add Employee to create the first one.
                </Typography>
              )}
            </Paper>

            <Typography variant="h6" sx={{ mt: 5 }}>
              Modules
            </Typography>

            <Box
              sx={{
                mt: 2,
                display: "grid",
                gap: 3,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
              }}
            >
              {adminModules.map((module) => (
                <Card
                  key={module.action}
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    overflow: "hidden",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                  }}
                >
                  <CardActionArea onClick={() => setActiveModule(module.action)}>
                    <Box sx={{ height: 6, bgcolor: themes[module.color].bar }} />

                    <CardContent sx={{ p: 3 }}>
                      <IconTile Icon={module.Icon} color={module.color} size={56} />

                      <Typography variant="h6" sx={{ mt: 2 }}>
                        {module.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, lineHeight: 1.7 }}
                      >
                        {module.description}
                      </Typography>

                      <Typography
                        variant="button"
                        color="primary"
                        sx={{ mt: 2, display: "block" }}
                      >
                        Open module →
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </>
        )}

        {activeModule === "employees" && (
          <>
            {backButton}
            <AdminEmployeeForm />
          </>
        )}

        {activeModule === "attendance" && (
          <>
            {backButton}
            <AdminAttendance />
          </>
        )}

        {activeModule !== "home" &&
          activeModule !== "employees" &&
          activeModule !== "attendance" && (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
              {backButton}

              <Typography variant="h5">{activeInfo?.title}</Typography>

              <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                This module will be connected in the next implementation step.
              </Typography>
            </Paper>
          )}
      </Container>
    </Box>
  );
}