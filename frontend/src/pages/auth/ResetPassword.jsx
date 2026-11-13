import { useState } from "react";
import {
  Link as RouterLink,
  useSearchParams,
} from "react-router-dom";
import { Alert, Box, Button, Link, Stack, Typography } from "@mui/material";
import LockResetOutlined from "@mui/icons-material/LockResetOutlined";
import { apiRequest } from "../../services/api";
import AuthLayout from "../../components/AuthLayout";
import PasswordField from "../../components/PasswordField";

const gradientButton = {
  py: 1.4,
  background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 12) {
      setError("New password must be at least 12 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const data = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setMessage(data.message);
    } catch (err) {
      setError(err.message || "Could not reset the password.");
    } finally {
      setSubmitting(false);
    }
  }

  let content;

  if (!token) {
    content = (
      <Stack spacing={2.5}>
        <Alert severity="error">
          This reset link is missing its token. Please request a new one.
        </Alert>

        <Button
          component={RouterLink}
          to="/forgot-password"
          variant="contained"
          size="large"
          fullWidth
          sx={gradientButton}
        >
          Request a new reset link
        </Button>
      </Stack>
    );
  } else if (message) {
    content = (
      <Stack spacing={2.5}>
        <Alert severity="success">{message}</Alert>

        <Button
          component={RouterLink}
          to="/login"
          variant="contained"
          size="large"
          fullWidth
          sx={gradientButton}
        >
          Go to sign in
        </Button>
      </Stack>
    );
  } else {
    content = (
      <>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <PasswordField
              label="New password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              helperText="At least 12 characters."
            />

            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={submitting}
              sx={gradientButton}
            >
              {submitting ? "Saving..." : "Reset password"}
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
      </>
    );
  }

  return (
    <AuthLayout
      icon={<LockResetOutlined fontSize="large" />}
      title="Choose a new password"
      subtitle={
        token && !message
          ? "Pick a strong password you have not used before."
          : undefined
      }
    >
      {content}
    </AuthLayout>
  );
}