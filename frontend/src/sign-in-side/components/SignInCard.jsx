import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiCard from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import { styled } from "@mui/material/styles";

import { AuthContext } from "../../contexts/AuthContext";
import { GoogleIcon, FacebookIcon, SitemarkIcon } from "./CustomIcons";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
}));

export default function SignInCard() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [formState, setFormState] = React.useState(0);

  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async (e) => {
    e.preventDefault();
    // setError('');

    try {
      if (formState === 0) {
        let result = await handleLogin(username, password);
      }
      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        console.log(result);
        setUsername("");
        setMessage(result);
        setOpen(true);
        setError("");
        setFormState(0);
        setPassword("");
      }
    } catch (err) {
      console.log(err);
      let message = err.response.data.message;
      setError(message);
    }
  };

  return (
    <Card variant="outlined">
      <Box sx={{ display: { xs: "flex", md: "none" } }}>
        <SitemarkIcon />
      </Box>

      <Typography component="h1" variant="h4">
        {formState === 0 ? "Sign in" : "Sign up"}
      </Typography>

      {/* Toggle Buttons */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          fullWidth
          variant={formState === 0 ? "contained" : "outlined"}
          onClick={() => setFormState(0)}
        >
          Sign In
        </Button>
        <Button
          fullWidth
          variant={formState === 1 ? "contained" : "outlined"}
          onClick={() => setFormState(1)}
        >
          Sign Up
        </Button>
      </Box>

      <Box
        component="form"
        onSubmit={handleAuth}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {formState === 1 && (
          <FormControl>
            <FormLabel>Full Name</FormLabel>
            <TextField
              required
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>
        )}

        <FormControl>
          <FormLabel>Username</FormLabel>
          <TextField
            required
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Password</FormLabel>
          <TextField
            required
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>

        {error && (
          <Typography color="error" sx={{ fontSize: 14 }}>
            {error}
          </Typography>
        )}

        <Button type="submit" fullWidth variant="contained">
          {formState === 0 ? "Login" : "Register"}
        </Button>
      </Box>

      <Divider>or</Divider>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Button fullWidth variant="outlined" startIcon={<GoogleIcon />}>
          Continue with Google
        </Button>
        <Button fullWidth variant="outlined" startIcon={<FacebookIcon />}>
          Continue with Facebook
        </Button>
      </Box>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        message={message}
        onClose={() => setOpen(false)}
      />
    </Card>
  );
}
