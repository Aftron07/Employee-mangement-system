import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return "—";
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

// work_date arrives as "YYYY-MM-DD".
function formatDay(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AttendanceCard() {
  const { token } = useAuth();
  const [today, setToday] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [todayData, myData] = await Promise.all([
        apiRequest("/attendance/today", {}, token),
        apiRequest("/attendance/my", {}, token),
      ]);
      setToday(todayData.attendance);
      setRecords(myData.records);
    } catch (err) {
      setError(err.message || "Could not load attendance.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(path) {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const data = await apiRequest(path, { method: "POST" }, token);
      setMessage(data.message);
      await load();
    } catch (err) {
      setError(err.message || "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  const checkedIn = Boolean(today);
  const checkedOut = Boolean(today?.check_out_at);

  let statusText = "Loading...";
  if (!loading) {
    if (!checkedIn) {
      statusText = "You have not checked in yet.";
    } else if (!checkedOut) {
      statusText = `Checked in at ${formatTime(today.check_in_at)}`;
    } else {
      statusText = `${formatTime(today.check_in_at)} to ${formatTime(
        today.check_out_at
      )} · ${formatDuration(today.working_minutes)} worked`;
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "common.white",
              background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
              boxShadow: 3,
            }}
          >
            <AccessTimeOutlined />
          </Box>

          <Box>
            <Typography variant="h6">Today&apos;s attendance</Typography>
            <Typography
              variant="body2"
              color={checkedIn && !checkedOut ? "success.main" : "text.secondary"}
            >
              {statusText}
            </Typography>
          </Box>
        </Stack>

        {!loading && !checkedIn && (
          <Button
            variant="contained"
            color="success"
            disabled={busy}
            onClick={() => handleAction("/attendance/check-in")}
          >
            {busy ? "Please wait..." : "Check in"}
          </Button>
        )}

        {!loading && checkedIn && !checkedOut && (
          <Button
            variant="contained"
            color="error"
            disabled={busy}
            onClick={() => handleAction("/attendance/check-out")}
          >
            {busy ? "Please wait..." : "Check out"}
          </Button>
        )}

        {!loading && checkedOut && (
          <Chip label="Done for today" color="success" variant="outlined" />
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}

      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "block", mt: 3, fontWeight: 700 }}
      >
        My recent attendance
      </Typography>

      {records.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No attendance records yet.
        </Typography>
      ) : (
        <TableContainer
          sx={{
            mt: 1,
            maxHeight: 300,
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Check in</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Check out</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{formatDay(record.work_date)}</TableCell>
                  <TableCell>{formatTime(record.check_in_at)}</TableCell>
                  <TableCell>{formatTime(record.check_out_at)}</TableCell>
                  <TableCell>{formatDuration(record.working_minutes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}