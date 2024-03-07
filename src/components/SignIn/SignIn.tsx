import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Box, Stack } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import CssBaseline from "@mui/material/CssBaseline";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthContext } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';

const SignIn = () => {
  const { login } = useAuthContext();
  const { darkMode } = useSettings();

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
      <Avatar sx={{ m: 1, bgcolor: "primary.main", color: "text.primary" }}>
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
          theme={darkMode ? "filled_black" : "outline"}
        />
      </Box>

      <img src="/static/images/devoteam_rgb.png" alt="logo" width="200px" />

      <Typography variant="body2" color="text.secondary" align="center">
        For internal Devoteam use only!

        <Grid container direction="column" alignItems="center" style={{ marginTop: '8px' }}>
          <Grid item>
            <Link color="inherit" href="https://github.com/DevoteamNL/infini-connect-ui" underline="none">
              <IconButton>
                <GitHubIcon />
              </IconButton>
              InfiniConnect
            </Link>
          </Grid>

          <Grid item>
            <Link color="inherit" href="mailto:nl.infini.connect@devoteam.com" underline="none">
              <IconButton>
                <EmailIcon />
              </IconButton>
              nl.infini.connect@devoteam.com
            </Link>
          </Grid>
        </Grid>
      </Typography>
    </Stack>
  );
};

export default SignIn;
