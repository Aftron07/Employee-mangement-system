import { useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import EventAvailableOutlined from "@mui/icons-material/EventAvailableOutlined";
import VerifiedUserOutlined from "@mui/icons-material/VerifiedUserOutlined";
import { useAuth } from "../../context/AuthContext";

const features = [
  { Icon: AccessTimeOutlined, text: "Check in and out with one click" },
  { Icon: EventAvailableOutlined, text: "Apply for leave and track requests" },
  { Icon: VerifiedUserOutlined, text: "Secure, role-based access" },
];

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setSubmitting(true);

      const loggedInUser = await login(email.trim(), password);

      if (loggedInUser.must_change_password) {
        navigate("/change-password", { replace: true });
        return;
      }

      if (loggedInUser.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (loggedInUser.role === "manager") {
        navigate("/manager", { replace: true });
      } else if (loggedInUser.role === "employee") {
        navigate("/employee", { replace: true });
      } else {
        setError("Your account has an unrecognized role.");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 5,
        background:
          "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #e0f2fe 100%)",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: 1000,
          overflow: "hidden",
          borderRadius: 4,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        {/* Left brand panel (hidden on phones) */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "space-between",
            p: 5,
            color: "common.white",
            background:
              "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #0ea5e9 100%)",
          }}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(255,255,255,0.2)",
                }}
              >
                <BusinessOutlined />
              </Box>
              <Typography
                variant="overline"
                sx={{ letterSpacing: 2, fontWeight: 700, lineHeight: 1.3 }}
              >
                Employee Management System
              </Typography>
            </Stack>

            <Typography variant="h4" sx={{ mt: 5, lineHeight: 1.2 }}>
              One place for your workday.
            </Typography>

            <Typography sx={{ mt: 2, opacity: 0.9, lineHeight: 1.8 }}>
              Access your employee information, attendance, leave requests and
              company updates.
            </Typography>

            <Stack spacing={2} sx={{ mt: 4 }}>
              {features.map(({ Icon, text }) => (
                <Stack key={text} direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(255,255,255,0.2)",
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                  <Typography variant="body2">{text}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Secure access for your organization
          </Typography>
        </Box>

        {/* Right form panel */}
        <Box sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ display: { xs: "flex", md: "none" }, mb: 2 }}
          >
            <BusinessOutlined color="primary" />
            <Typography variant="subtitle2" color="primary">
              Employee Management System
            </Typography>
          </Stack>

          <Typography variant="h4">Welcome back</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            Sign in with your registered company account.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <TextField
                label="Email address"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          onClick={() => setShowPassword((value) => !value)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Box sx={{ textAlign: "right" }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  underline="hover"
                  variant="body2"
                  fontWeight={600}
                >
                  Forgot password?
                </Link>
              </Box>

              {error && (
                <Alert severity="error" role="alert">
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
                sx={{
                  py: 1.4,
                  background:
                    "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
                }}
              >
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 4 }}
          >
            Need access? Contact your system administrator.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}