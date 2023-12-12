import ChatHistoryDrawer from "./components/ChatList/ChatHistoryDrawer";
import SignIn from "./components/SignIn/SignIn";
import { useAuthContext } from "./context/AuthContext";
import { ThreadProvider } from "./context/ThreadContext";
function App() {
  const { loggedIn } = useAuthContext();

  return loggedIn ? (
    <ThreadProvider>
      <ChatHistoryDrawer />
    </ThreadProvider>
  ) : (
    <SignIn />
  );
}

export default App;
