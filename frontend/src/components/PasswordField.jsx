import { useState } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import LockOutlined from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete = "current-password",
  helperText,
  ...rest
}) {
  const [show, setShow] = useState(false);

  return (
    <TextField
      label={label}
      type={show ? "text" : "password"}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      helperText={helperText}
      required
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlined fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow((value) => !value)}
                edge="end"
              >
                {show ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      {...rest}
    />
  );
}
