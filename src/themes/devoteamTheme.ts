// theme.js or theme.ts
import { createTheme } from "@mui/material/styles";

const devoteamTheme = createTheme({
  // Define your theme settings here
  palette: {
    primary: {
      main: "#f8485e",
    },
    secondary: {
      main: "#fca2ae",
    },
    background: {
      default: "#ffffff",
    },
  },
  typography: {
    fontFamily: 'Montserrat',
  },
  // You can also customize typography, breakpoints, etc.
});

export default devoteamTheme;
