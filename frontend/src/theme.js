import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#4f46e5" },
    secondary: { main: "#7c3aed" },
    info: { main: "#0ea5e9" },
    success: { main: "#059669" },
    warning: { main: "#f59e0b" },
    error: { main: "#e11d48" },
    background: { default: "#f1f5ff", paper: "#ffffff" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      'Inter, "Segoe UI", system-ui, -apple-system, Roboto, sans-serif',
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
  },
});

export default theme;