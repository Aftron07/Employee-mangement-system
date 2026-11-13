import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  first_name: "",
  last_name: "",
  employee_code: "",
  department_id: "",
  email: "",
  designation: "",
  role: "employee",
  password: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns an object like { first_name: "First name is required." }
function validate(form) {
  const errors = {};

  if (!form.first_name.trim()) {
    errors.first_name = "First name is required.";
  }

  if (!form.last_name.trim()) {
    errors.last_name = "Last name is required.";
  }

  if (!form.employee_code.trim()) {
    errors.employee_code = "Employee code is required.";
  }

  const departmentId = Number(form.department_id);
  if (!form.department_id) {
    errors.department_id = "Department ID is required.";
  } else if (!Number.isInteger(departmentId) || departmentId < 1) {
    errors.department_id = "Enter a valid department ID (1 or higher).";
  }

  if (!form.email.trim()) {
    errors.email = "Work email is required.";
  } else if (!emailPattern.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.designation.trim()) {
    errors.designation = "Designation is required.";
  }

  if (!form.role) {
    errors.role = "Account role is required.";
  }

  if (!form.password) {
    errors.password = "Initial password is required.";
  } else if (form.password.length < 12) {
    errors.password = "Password must be at least 12 characters.";
  }

  return errors;
}

export default function AdminEmployeeForm() {
  const { token } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const errors = validate(form);

  // Only show an error after the user visited the field or tried to submit.
  function errorFor(name) {
    return touched[name] ? errors[name] : "";
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleBlur(event) {
    const { name } = event.target;
    setTouched((previous) => ({ ...previous, [name]: true }));
  }

  // Props shared by every field.
  function fieldProps(name, label, extra = {}) {
    return {
      name,
      label,
      value: form[name],
      onChange: handleChange,
      onBlur: handleBlur,
      error: Boolean(errorFor(name)),
      helperText: errorFor(name) || extra.helperText || " ",
      required: true,
      fullWidth: true,
      ...extra,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    // Mark every field as touched so all errors become visible.
    const allTouched = {};
    Object.keys(initialForm).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields and try again.");
      return;
    }

    setLoading(true);

    try {
      // First create the employee profile.
      const employeeData = await apiRequest(
        "/employees",
        {
          method: "POST",
          body: JSON.stringify({
            employee_code: form.employee_code.trim(),
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim().toLowerCase(),
            designation: form.designation.trim(),
            department_id: Number(form.department_id),
            is_active: true,
          }),
        },
        token
      );

      const employeeId = employeeData.employee?.id;

      if (!employeeId) {
        throw new Error(
          "Employee was created, but the server did not return its ID. Check the employee record before retrying."
        );
      }

      // Then create the linked login account.
      try {
        await apiRequest(
          "/auth/users",
          {
            method: "POST",
            body: JSON.stringify({
              email: form.email.trim().toLowerCase(),
              password: form.password,
              role: form.role,
              employee_id: employeeId,
            }),
          },
          token
        );
      } catch {
        throw new Error(
          `Employee profile #${employeeId} was created, but its login account was not. Do not submit again blindly. Check the employee record and create the linked account or remove the incomplete record before retrying.`
        );
      }

      setMessage(
        `Employee and login account created successfully. Employee ID: ${employeeId}`
      );
      setForm(initialForm);
      setTouched({});
    } catch (err) {
      setError(err.message || "Could not create the employee.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{ maxWidth: 760, mx: "auto", p: { xs: 3, sm: 4 }, borderRadius: 4 }}
    >
      <Typography
        variant="overline"
        color="primary"
        sx={{ fontWeight: 700, letterSpacing: 1.5 }}
      >
        Administration
      </Typography>

      <Typography variant="h5" sx={{ mt: 0.5 }}>
        Add Employee
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Create an employee profile and its login account.
      </Typography>

      <Typography variant="caption" color="text.secondary">
        Fields marked <span style={{ color: "#d32f2f" }}>*</span> are required.
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
        <Box
          sx={{
            display: "grid",
            columnGap: 2.5,
            rowGap: 0.5,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            {...fieldProps("first_name", "First Name", {
              placeholder: "e.g. Priya",
              slotProps: { htmlInput: { maxLength: 100 } },
            })}
          />

          <TextField
            {...fieldProps("last_name", "Last Name", {
              placeholder: "e.g. Sharma",
              slotProps: { htmlInput: { maxLength: 100 } },
            })}
          />

          <TextField
            {...fieldProps("employee_code", "Employee Code", {
              placeholder: "e.g. EMP-001",
              slotProps: { htmlInput: { maxLength: 30 } },
            })}
          />

          <TextField
            {...fieldProps("department_id", "Department ID", {
              type: "number",
              placeholder: "e.g. 1",
              slotProps: { htmlInput: { min: 1 } },
            })}
          />

          <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
            <TextField
              {...fieldProps("email", "Work Email", {
                type: "email",
                autoComplete: "off",
                placeholder: "name@company.com",
                slotProps: { htmlInput: { maxLength: 150 } },
              })}
            />
          </Box>

          <TextField
            {...fieldProps("designation", "Designation", {
              placeholder: "e.g. Software Engineer",
              slotProps: { htmlInput: { maxLength: 100 } },
            })}
          />

          <TextField {...fieldProps("role", "Account Role", { select: true })}>
            <MenuItem value="employee">Employee</MenuItem>
            <MenuItem value="manager">HR / Manager</MenuItem>
          </TextField>

          <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
            <TextField
              {...fieldProps("password", "Initial Password", {
                type: "password",
                autoComplete: "new-password",
                placeholder: "Minimum 12 characters",
                helperText:
                  "At least 12 characters. The employee must change it on first login.",
              })}
            />
          </Box>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            mt: 1,
            px: 4,
            background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
          }}
        >
          {loading ? "Creating account..." : "Create Employee"}
        </Button>
      </Box>
    </Paper>
  );
}