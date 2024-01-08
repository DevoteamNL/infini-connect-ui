import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { useSettings } from "./SettingsContext";

const parseJwt = (token?: string): { exp: number; picture: string } | null => {
  if (!token) {
    return null;
  }
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

const oauthCookie = localStorage.getItem("oauth2-response");
const parsedCookie: CredentialResponse | undefined =
  oauthCookie && JSON.parse(oauthCookie);
const parsedProfile = parseJwt(parsedCookie?.credential);

const AuthContext = createContext({
  profile: parsedProfile,
  login: (_: CredentialResponse) => {},
  logout: () => {},
  credential: parsedCookie,
  checkExpired: (): boolean => false,
});

const AuthProvider = ({ children }: { children: ReactNode[] | ReactNode }) => {
  const { darkMode } = useSettings();
  const [profile, setProfile] = useState(parsedProfile);
  const [credential, setCredential] = useState<CredentialResponse | undefined>(
    parsedCookie,
  );
  const [expired, setExpired] = useState(false);

  const onLogin = (response: CredentialResponse) => {
    setProfile(parseJwt(response.credential));
    setCredential(response);
    localStorage.setItem("oauth2-response", JSON.stringify(response));
    setExpired(false);
  };

  const checkExpired = useCallback(() => {
    if (profile && profile.exp < Date.now() / 1000) {
      setExpired(true);
      return true;
    }
    return false;
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        profile: profile,
        login: onLogin,
        logout: () => {
          setProfile(null);
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
        <DialogContent>
          <GoogleLogin
            onSuccess={onLogin}
            onError={console.error}
            auto_select={true}
            theme={darkMode ? "filled_black" : "outline"}
          />
        </DialogContent>
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
