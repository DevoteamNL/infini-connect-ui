import { Box, Dialog, DialogTitle } from "@mui/material";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

const oauthCookie = localStorage.getItem("oauth2-response");
const parsedCookie: CredentialResponse | undefined =
  oauthCookie && JSON.parse(oauthCookie);

const parseJwt = (token: string): { exp: number } | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const AuthContext = createContext({
  loggedIn: !!parsedCookie,
  login: (_: CredentialResponse) => {},
  logout: () => {},
  credential: parsedCookie,
  checkExpired: (): boolean => false,
});

const AuthProvider = ({ children }: { children: ReactNode[] | ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(!!parsedCookie);
  const [credential, setCredential] = useState<CredentialResponse | undefined>(
    parsedCookie,
  );
  const [expired, setExpired] = useState(false);

  const onLogin = (response: CredentialResponse) => {
    setLoggedIn(true);
    setCredential(response);
    localStorage.setItem("oauth2-response", JSON.stringify(response));
    setExpired(false);
  };

  const checkExpired = useCallback(() => {
    if (credential?.credential) {
      const payload = parseJwt(credential.credential);
      if (payload && payload.exp < Date.now() / 1000) {
        setExpired(true);
        return true;
      }
    }
    return false;
  }, [credential]);

  return (
    <AuthContext.Provider
      value={{
        loggedIn: loggedIn,
        login: onLogin,
        logout: () => {
          setLoggedIn(false);
          setCredential(undefined);
          localStorage.removeItem("oauth2-response");
          setExpired(false);
        },
        credential: credential,
        checkExpired: checkExpired,
      }}
    >
      <Dialog
        open={expired}
        onClose={(event: Event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <DialogTitle>Sign in again</DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <GoogleLogin
            onSuccess={onLogin}
            onError={console.error}
            auto_select={true}
          />
        </Box>
      </Dialog>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access the thread context
const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within a AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuthContext };
