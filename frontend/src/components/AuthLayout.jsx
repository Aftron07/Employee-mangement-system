import { Box, Paper, Stack, Typography } from "@mui/material";

export default function AuthLayout({ icon, title, subtitle, children }) {
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
          maxWidth: 440,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
        }}
      >
        <Stack alignItems="center" sx={{ mb: 3, textAlign: "center" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              mb: 2,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "common.white",
              background:
                "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #0ea5e9 100%)",
            }}
          >
            {icon}
          </Box>

          <Typography variant="h5">{title}</Typography>

          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              {subtitle}
            </Typography>
          )}
        </Stack>

        {children}
      </Paper>
    </Box>
  );
}