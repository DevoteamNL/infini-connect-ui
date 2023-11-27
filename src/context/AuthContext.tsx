import { CredentialResponse } from "@react-oauth/google";
import { createContext, ReactNode, useState } from "react";

const oauthCookie = localStorage.getItem("oauth2-response");
const parsedCookie = oauthCookie && JSON.parse(oauthCookie);
export const AuthContext = createContext({
  loggedIn: !!parsedCookie,
  login: (_: CredentialResponse) => {},
  logout: () => {},
});

export const AuthContextProvider = ({
  children,
}: {
  children: ReactNode[] | ReactNode;
}) => {
  const [loggedIn, setLoggedIn] = useState(!!parsedCookie);
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider
      value={{
        loggedIn: loggedIn,
        login: (response: CredentialResponse) => {
          setLoggedIn(true);
          localStorage.setItem("oauth2-response", JSON.stringify(response));
        },
        logout: () => {
          setLoggedIn(false);
          localStorage.removeItem("oauth2-response");
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
