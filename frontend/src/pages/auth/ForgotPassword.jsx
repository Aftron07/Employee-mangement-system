import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import { apiRequest } from "../../services/api";
import AuthLayout from "../../components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setSubmitting(true);
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setMessage(data.message);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      icon={<EmailOutlined fontSize="large" />}
      title="Forgot your password?"
      subtitle="Enter your account email and we will send you a reset link."
    >
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

          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={submitting}
            sx={{
              py: 1.4,
              background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
            }}
          >
            {submitting ? "Sending..." : "Send reset link"}
          </Button>
        </Stack>
      </Box>

      <Typography align="center" variant="body2" sx={{ mt: 3 }}>
        <Link
          component={RouterLink}
          to="/login"
          underline="hover"
          fontWeight={600}
        >
          Back to sign in
        </Link>
      </Typography>
    </AuthLayout>
  );
}