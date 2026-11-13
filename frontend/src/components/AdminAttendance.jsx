import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

const ATTENDANCE_STORAGE_PREFIX = "ems_attendance_";

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

export default function AdminAttendance() {
  const { token } = useAuth();
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString("en-CA")
  );
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!date) return;

    let cancelled = false;
    const storageKey = `${ATTENDANCE_STORAGE_PREFIX}${date}`;

    const storedRecords = sessionStorage.getItem(storageKey);
    if (storedRecords) {
      try {
        const parsedRecords = JSON.parse(storedRecords);
        if (Array.isArray(parsedRecords)) setRecords(parsedRecords);
      } catch (storageError) {
        console.error("Could not read cached attendance records:", storageError);
      }
    }

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await apiRequest(
          `/attendance?date=${encodeURIComponent(date)}`,
          {},
          token
        );
        sessionStorage.setItem(storageKey, JSON.stringify(data.records));
        if (!cancelled) setRecords(data.records);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load attendance.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [date, token]);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "flex-end" }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ color: "info.main", fontWeight: 700, letterSpacing: 1.5 }}
          >
            Attendance
          </Typography>
          <Typography variant="h5">Attendance records</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {loading ? "Loading..." : `${records.length} present on this date`}
          </Typography>
        </Box>

        <TextField
          label="Date"
          type="date"
          size="small"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && records.length === 0 && !error ? (
        <Typography color="text.secondary" sx={{ mt: 4 }}>
          No attendance records for this date.
        </Typography>
      ) : (
        <TableContainer
          sx={{ mt: 3, border: 1, borderColor: "divider", borderRadius: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Check in</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Check out</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {record.first_name} {record.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {record.designation}
                    </Typography>
                  </TableCell>
                  <TableCell>{record.employee_code}</TableCell>
                  <TableCell>{record.department_name || "—"}</TableCell>
                  <TableCell>{formatTime(record.check_in_at)}</TableCell>
                  <TableCell>
                    {record.check_out_at ? (
                      formatTime(record.check_out_at)
                    ) : (
                      <Chip label="Still working" size="small" color="warning" />
                    )}
                  </TableCell>
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