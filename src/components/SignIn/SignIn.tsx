import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Box, Stack } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import CssBaseline from "@mui/material/CssBaseline";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthContext } from "../../context/AuthContext";

const SignIn = () => {
  const { login } = useAuthContext();

  return (
    <Stack
      spacing={4}
      alignItems="center"
      sx={{
        paddingTop: 8,
        paddingBottom: 8,
        height: "100vh",
      }}
      component="main"
      maxWidth="xs"
    >
      <CssBaseline />
      <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
        <LockOutlinedIcon />
      </Avatar>
      <Typography component="h1" variant="h5" marginBottom={8}>
        Sign in to InfiniConnect
      </Typography>

      <Box flex={1}>
        <GoogleLogin
          onSuccess={login}
          onError={console.error}
          auto_select={true}
        />
      </Box>

      <img src="/static/images/devoteam_rgb.png" alt="logo" width="200px" />

      <Typography variant="body2" color="text.secondary" align="center">
        For internal Devoteam use only!{" "}
        <Link
          color="inherit"
          href="https://github.com/DevoteamNL/infini-connect-ui"
        >
          InfiniConnect
        </Link>
      </Typography>
    </Stack>
  );
};

export default SignIn;
