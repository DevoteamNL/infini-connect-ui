import { GoogleLogin } from "@react-oauth/google";
import { useContext } from "react";
import ChatHistoryDrawer from "./components/ChatList/ChatHistoryDrawer";
import { AuthContext } from "./context/AuthContext";
function App() {
  const { loggedIn, login } = useContext(AuthContext);

  return loggedIn ? (
    <ChatHistoryDrawer />
  ) : (
    <GoogleLogin onSuccess={login} onError={console.error} />
  );
}

export default App;
