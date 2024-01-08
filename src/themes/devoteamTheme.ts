// theme.js or theme.ts
import { PaletteMode } from "@mui/material";

export const devoteamDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    primary: {
      main: "#f8485e",
    },
    secondary: {
      main: "#fca2ae",
    },
    background: {
      default: mode === "light" ? "#ffffff" : "#000000",
    },
  },
  typography: {
    fontFamily: ["Montserrat", "Calibri", "Arial", "sans-serif"].join(","),
  },
});
