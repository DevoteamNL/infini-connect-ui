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
  const {
    settings: { darkMode },
  } = useSettings();
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
        clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ""}
      >
        <AuthProvider>
          <SettingsProvider>
            <Theme>
              <App />
            </Theme>
          </SettingsProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </StyledEngineProvider>
  </StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
