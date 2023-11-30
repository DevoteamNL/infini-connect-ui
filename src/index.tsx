import { ThemeProvider } from "@mui/material";
import { StyledEngineProvider } from "@mui/material/styles";
import { GoogleOAuthProvider } from "@react-oauth/google";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthContextProvider } from "./context/AuthContext";
import devoteamTheme from "./themes/devoteamTheme";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={devoteamTheme}>
        <GoogleOAuthProvider clientId="779787791084-sf0tjf22s5cl3odf9sjg6rch0if9c0qq.apps.googleusercontent.com">
          <AuthContextProvider>
            <App />
          </AuthContextProvider>
        </GoogleOAuthProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
