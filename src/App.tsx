import ChatHistoryDrawer from "./components/ChatList/ChatHistoryDrawer";
import SignIn from "./components/SignIn/SignIn";
import { useAuthContext } from "./context/AuthContext";
import { ThreadProvider } from "./context/ThreadContext";
function App() {
  const { profile } = useAuthContext();

  return profile ? (
    <ThreadProvider>
      <ChatHistoryDrawer />
    </ThreadProvider>
  ) : (
    <SignIn />
  );
}

export default App;
