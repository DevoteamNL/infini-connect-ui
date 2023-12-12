import { CredentialResponse } from "@react-oauth/google";
import { createContext, ReactNode, useState } from "react";

const oauthCookie = localStorage.getItem("oauth2-response");
const parsedCookie: CredentialResponse | undefined =
  oauthCookie && JSON.parse(oauthCookie);

export const AuthContext = createContext({
  loggedIn: !!parsedCookie,
  login: (_: CredentialResponse) => {},
  logout: () => {},
  credential: parsedCookie,
});

export const AuthContextProvider = ({
  children,
}: {
  children: ReactNode[] | ReactNode;
}) => {
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
