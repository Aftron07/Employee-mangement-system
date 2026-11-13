import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Typography,
} from "@mui/material";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import EventAvailableOutlined from "@mui/icons-material/EventAvailableOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import WbSunnyOutlined from "@mui/icons-material/WbSunnyOutlined";
import { useAuth } from "../context/AuthContext";
import DashboardHeader from "./DashboardHeader";
import AttendanceCard from "./AttendanceCard";

const icons = {
  users: PeopleOutlined,
  user: PersonOutlined,
  building: BusinessOutlined,
  clock: AccessTimeOutlined,
  calendar: EventAvailableOutlined,
  file: InsertDriveFileOutlined,
  chart: BarChartOutlined,
  megaphone: CampaignOutlined,
  sun: WbSunnyOutlined,
};

const themes = {
  indigo: { bar: "#6366f1", tile: "linear-gradient(135deg, #6366f1, #4338ca)" },
  violet: { bar: "#8b5cf6", tile: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
  emerald: { bar: "#10b981", tile: "linear-gradient(135deg, #10b981, #047857)" },
  amber: { bar: "#f59e0b", tile: "linear-gradient(135deg, #f59e0b, #ea580c)" },
  rose: { bar: "#f43f5e", tile: "linear-gradient(135deg, #f43f5e, #be123c)" },
  sky: { bar: "#0ea5e9", tile: "linear-gradient(135deg, #0ea5e9, #0369a1)" },
};

// Each module: [title, description, icon name, color]
const roleDetails = {
  admin: {
    title: "Admin Dashboard",
    description: "Manage employees, departments and organization settings.",
    modules: [
      ["Employee Management", "Manage employee records and account access", "users", "indigo"],
      ["Department Management", "Create and update departments", "building", "emerald"],
      ["Leave Management", "Review leave requests", "calendar", "amber"],
      ["Documents", "Verify employee documents", "file", "violet"],
      ["Reports", "View organization reports", "chart", "rose"],
    ],
  },
  manager: {
    title: "Manager Dashboard",
    description: "Manage your team and review team activity.",
    modules: [
      ["My Team", "View your assigned team", "users", "indigo"],
      ["Leave Approvals", "Review your team's leave requests", "calendar", "amber"],
      ["Announcements", "Read company updates", "megaphone", "rose"],
    ],
  },
  employee: {
    title: "Employee Dashboard",
    description: "Access your profile and everyday employee services.",
    modules: [
      ["My Profile", "View your employee information", "user", "indigo"],
      ["My Leave", "Apply for leave and check its status", "calendar", "amber"],
      ["Documents", "Submit permitted documents", "file", "violet"],
      ["Announcements", "Read company updates", "megaphone", "rose"],
      ["Holidays", "View company holidays", "sun", "emerald"],
    ],
  },
};

export default function DashboardHome() {
  const { user } = useAuth();
  const details = roleDetails[user?.role];

  if (!details) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Unknown account role.</Typography>
      </Box>
    );
  }

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);

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
        <Chip
          label={roleLabel}
          color="primary"
          size="small"
          sx={{ fontWeight: 700, letterSpacing: 1 }}
        />

        <Typography variant="h4" sx={{ mt: 1.5 }}>
          {details.title}
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {details.description}
        </Typography>

        {(user.role === "employee" || user.role === "manager") && (
          <Box sx={{ mt: 4 }}>
            <AttendanceCard />
          </Box>
        )}

        <Box
          sx={{
            mt: 4,
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
          }}
        >
          {details.modules.map(([title, description, iconName, color]) => {
            const theme = themes[color];
            const ModuleIcon = icons[iconName];

            return (
              <Card
                key={title}
                variant="outlined"
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                }}
              >
                <Box sx={{ height: 6, bgcolor: theme.bar }} />

                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "common.white",
                      background: theme.tile,
                      boxShadow: 3,
                    }}
                  >
                    {ModuleIcon && <ModuleIcon fontSize="large" />}
                  </Box>

                  <Typography variant="h6" sx={{ mt: 2 }}>
                    {title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, lineHeight: 1.7 }}
                  >
                    {description}
                  </Typography>

                  <Chip
                    label="Module to be connected"
                    size="small"
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}