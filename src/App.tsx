import { useContext } from "react";
import ChatHistoryDrawer from "./components/ChatList/ChatHistoryDrawer";
import SignIn from "./components/SignIn/SignIn";
import { AuthContext } from "./context/AuthContext";
import { ThreadProvider } from "./context/ThreadContext";
function App() {
  const { loggedIn } = useContext(AuthContext);

  return loggedIn ? (
    <ThreadProvider>
      <ChatHistoryDrawer />
    </ThreadProvider>
  ) : (
    <SignIn />
  );
}

export default App;
