import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import VpnKeyOutlined from "@mui/icons-material/VpnKeyOutlined";
import Logout from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const initial = (
    user?.employee?.first_name?.[0] ||
    user?.email?.[0] ||
    "?"
  ).toUpperCase();

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "";

  function handleClose() {
    setAnchorEl(null);
  }

  function handleChangePassword() {
    handleClose();
    navigate("/change-password");
  }

  function handleLogout() {
    handleClose();
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <IconButton
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-label="Open profile menu"
        aria-haspopup="menu"
        aria-expanded={open ? "true" : undefined}
        sx={{ p: 0.5 }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: "common.white",
            color: "primary.main",
            fontWeight: 700,
            boxShadow: 2,
          }}
        >
          {initial}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: { sx: { mt: 1, minWidth: 260, borderRadius: 3 } },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {user?.email}
          </Typography>
          <Typography variant="caption" color="primary" fontWeight={600}>
            {roleLabel}
          </Typography>
        </Box>

        <Divider />

        <MenuItem onClick={handleChangePassword}>
          <ListItemIcon>
            <VpnKeyOutlined fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Change password</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}