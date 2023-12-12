import { CredentialResponse } from "@react-oauth/google";
import { createContext, ReactNode, useContext, useState } from "react";

const oauthCookie = localStorage.getItem("oauth2-response");
const parsedCookie: CredentialResponse | undefined =
  oauthCookie && JSON.parse(oauthCookie);

const AuthContext = createContext({
  loggedIn: !!parsedCookie,
  login: (_: CredentialResponse) => {},
  logout: () => {},
  credential: parsedCookie,
});

const AuthProvider = ({ children }: { children: ReactNode[] | ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(!!parsedCookie);
  const [credential, setCredential] = useState<CredentialResponse | undefined>(
    parsedCookie,
  );

  return (
    <AuthContext.Provider
      value={{
        loggedIn: loggedIn,
        login: (response: CredentialResponse) => {
          setLoggedIn(true);
          setCredential(response);
          localStorage.setItem("oauth2-response", JSON.stringify(response));
        },
        logout: () => {
          setLoggedIn(false);
          setCredential(undefined);
          localStorage.removeItem("oauth2-response");
        },
        credential: credential,
      }}
    >
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
