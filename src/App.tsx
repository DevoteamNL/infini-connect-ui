import { useContext } from "react";
import ChatHistoryDrawer from "./components/ChatList/ChatHistoryDrawer";
import SignIn from "./components/SignIn/SignIn";
import { AuthContext } from "./context/AuthContext";
function App() {
  const { loggedIn } = useContext(AuthContext);

  return loggedIn ? <ChatHistoryDrawer /> : <SignIn />;
}

export default App;
