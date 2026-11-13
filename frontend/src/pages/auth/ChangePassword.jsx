import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Stack } from "@mui/material";
import LockResetOutlined from "@mui/icons-material/LockResetOutlined";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/AuthLayout";
import PasswordField from "../../components/PasswordField";

export default function ChangePassword() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();

  const forced = Boolean(user?.must_change_password);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 12) {
      setError("New password must be at least 12 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    try {
      setSubmitting(true);
      await changePassword(currentPassword, newPassword);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Could not change the password.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <AuthLayout
      icon={<LockResetOutlined fontSize="large" />}
      title={forced ? "Set your new password" : "Change password"}
      subtitle={
        forced
          ? "You are using a temporary password. Choose a new password to continue."
          : "Enter your current password and choose a new one."
      }
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          <PasswordField
            label={forced ? "Temporary password" : "Current password"}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
          />

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
            sx={{
              py: 1.4,
              background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
            }}
          >
            {submitting ? "Saving..." : "Change password"}
          </Button>

          {forced ? (
            <Button color="inherit" onClick={handleLogout}>
              Log out
            </Button>
          ) : (
            <Button color="inherit" onClick={() => navigate("/dashboard")}>
              Cancel and go back
            </Button>
          )}
        </Stack>
      </Box>
    </AuthLayout>
  );
}