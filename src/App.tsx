import ChatHistory from "./components/ChatList/ChatHistoryDrawer";
import SignIn from "./components/SignIn/SignIn";
import { useAuthContext } from "./context/AuthContext";
function App() {
  const { profile } = useAuthContext();

  return profile ? <ChatHistory /> : <SignIn />;
}

export default App;
