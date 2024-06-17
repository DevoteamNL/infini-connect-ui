import AddIcon from "@mui/icons-material/Add";
import { Fab } from "@mui/material";
import { useThreadContext } from '../../context/ThreadContext';

export const NewChatButton = () => {
  const { createThread } = useThreadContext();

  return (
    <Fab
      variant="extended"
      color="primary"
      onClick={() => createThread()}
    >
      <AddIcon sx={{ mr: 1 }} />
      New Chat
    </Fab>);
};