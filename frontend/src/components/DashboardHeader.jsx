import { AppBar, Box, Stack, Toolbar, Typography } from "@mui/material";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import { useAuth } from "../context/AuthContext";
import ProfileMenu from "./ProfileMenu";

export default function DashboardHeader() {
  const { user } = useAuth();

  return (
    <AppBar
      position="static"
      elevation={3}
      sx={{
        background:
          "linear-gradient(90deg, #4f46e5 0%, #7c3aed 55%, #0ea5e9 100%)",
      }}
    >
      <Toolbar
        sx={{
          maxWidth: 1280,
          width: "100%",
          mx: "auto",
          py: 1,
          justifyContent: "space-between",
        }}
      >
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

          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              Employee Management System
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: 0.85, display: { xs: "none", sm: "block" } }}
            >
              Signed in as {user?.email}
            </Typography>
          </Box>
        </Stack>

        <ProfileMenu />
      </Toolbar>
    </AppBar>
  );
}