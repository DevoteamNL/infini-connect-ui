import SendIcon from "@mui/icons-material/Send";
import {
  Box,
  Grid,
  IconButton,
  List,
  ListItem,
  Paper,
  Skeleton,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import { Thread, useThreadContext } from "../../context/ThreadContext";
import PluginSelector from "../PluginSelector/PluginSelector";

// Define the MainContentProps interface for the component's props
interface MainContentProps {
  thread?: Thread;
}

const Welcome = styled("p")(({ theme }) => ({
  ...theme.typography.body1,
  border: `1px solid ${theme.palette.secondary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  margin: theme.spacing(1),
}));

const Message = ({
  sender,
  message,
  caption,
}: {
  sender: boolean;
  message?: string;
  caption: string;
}) => {
  const { darkMode } = useSettings();
  return (
    <ListItem
      sx={{
        display: "flex",
        justifyContent: sender ? "flex-end" : "flex-start",
      }}
    >
      <Paper
        sx={{
          p: 1,
          maxWidth: "70%",
          bgcolor: darkMode
            ? sender
              ? "#4a8cca"
              : "#2e2e2e"
            : sender
              ? "#d7ebe7"
              : "#efeeee",
          border: 1,
          borderColor: darkMode ? "grey.800" : "grey.300",
          borderRadius: 2,
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {message || <Skeleton />}
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: "block", textAlign: "right" }}
        >
          {caption}
        </Typography>
      </Paper>
    </ListItem>
  );
};

// MainContent component
const MainContent: React.FC<MainContentProps> = () => {
  const { postMessage, threads, selectedThreadId } = useThreadContext();
  // State for the chat message and text field rows
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState(3);
  const selectedThread = threads.find((t) => t.id === selectedThreadId);
  const messages = selectedThread?.messages;

  // Ref for scrolling to the bottom of the chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Effect for handling text field row size based on message content
  useEffect(() => {
    const lineCount = message.split(/\r*\n/).length;
    setRows(Math.max(2, lineCount));
  }, [message]);

  // Effect for auto-scrolling to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to handle sending a message
  const handleSendMessage = () => {
    if (message && selectedThread && !selectedThread.loading) {
      postMessage(
        selectedThread.id,
        message,
        selectedThread.newThread,
        selectedThread.title,
      );
      setMessage("");
    }
  };

  // JSX for the MainContent component
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <br />
      <br />
      <PluginSelector
        disabled={selectedThread?.messages.some(
          (message) => message.data.role === "user",
        )}
      ></PluginSelector>
      {messages?.length === 0 ? (
        <Box
          sx={{
            flexGrow: 1,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Grid container>
            <Grid item xs={12}>
              <Typography variant="h6">Hi, how can I help you?</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                I can help you with the following:
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Welcome>Find available desks</Welcome>
            </Grid>
            <Grid item xs={6}>
              <Welcome>Search through CVs</Welcome>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
          <List>
            {messages?.map((msg) => (
              <Message
                key={msg.id}
                sender={msg.data.role === "user"}
                message={msg.data.content}
                caption={new Date().toLocaleTimeString() /** Mock sent date */}
              ></Message>
            ))}
            {selectedThread?.replying && (
              <Message sender={false} caption="thinking..."></Message>
            )}
            <div ref={chatEndRef} />
          </List>
        </Box>
      )}
      <Box sx={{ mt: 1 }}>
        <TextField
          fullWidth
          multiline
          rows={rows}
          maxRows={Infinity}
          label="Type a message"
          variant="outlined"
          value={message}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              if (!ev.shiftKey) {
                handleSendMessage();
                ev.preventDefault();
              }
            }
          }}
          onChange={(e) => setMessage(e.target.value)}
          InputProps={{
            endAdornment: (
              <IconButton
                onClick={handleSendMessage}
                disabled={selectedThread?.loading}
              >
                <SendIcon />
              </IconButton>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default MainContent;
