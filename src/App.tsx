import ChatHistory from "./components/ChatList/ChatHistoryDrawer";
import SignIn from "./components/SignIn/SignIn";
import { useAuthContext } from "./context/AuthContext";
import { ThreadProvider } from "./context/ThreadContext/ThreadContext";
function App() {
  const { profile } = useAuthContext();

  return profile ? (
    <ThreadProvider>
      <ChatHistory />
    </ThreadProvider>
  ) : (
    <SignIn />
  );
}

export default App;
