import "@fontsource/montserrat/300.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";
import { PaletteMode, ThemeProvider } from "@mui/material";
import { createTheme, StyledEngineProvider } from "@mui/material/styles";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode, StrictMode, useMemo } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { devoteamDesignTokens } from "./themes/devoteamTheme";

const Theme = ({ children }: { children: ReactNode[] | ReactNode }) => {
  const { darkMode } = useSettings();
  const mode: PaletteMode = darkMode ? "dark" : "light";
  const theme = useMemo(() => createTheme(devoteamDesignTokens(mode)), [mode]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <StrictMode>
    <StyledEngineProvider injectFirst>
      <GoogleOAuthProvider
        clientId={config.VITE_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || ""}
      >
        <SettingsProvider>
          <Theme>
            <AuthProvider>
              <App />
            </AuthProvider>
          </Theme>
        </SettingsProvider>
      </GoogleOAuthProvider>
    </StyledEngineProvider>
  </StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
