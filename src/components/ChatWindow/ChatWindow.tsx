import SendIcon from "@mui/icons-material/Send";
import {
  Box,
  IconButton,
  List,
  ListItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { Thread, useThreadContext } from "../../context/ThreadContext";
import PluginSelector from "../PluginSelector/PluginSelector";

// Define the MainContentProps interface for the component's props
interface MainContentProps {
  thread?: Thread;
}

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
    if (message && selectedThread) {
      postMessage(selectedThread.id, message, selectedThread.newThread);
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
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List>
          {messages?.map((msg) => (
            <ListItem
              key={msg.id}
              sx={{
                display: "flex",
                justifyContent:
                  msg.data.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Paper
                sx={{
                  p: 1,
                  maxWidth: "70%",
                  bgcolor:
                    msg.data.role === "user"
                      ? "rgba(173, 216, 230, 0.5)"
                      : "rgba(211, 211, 211, 0.5)",
                  border: 1,
                  borderColor: "grey.300",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1">{msg.data.content}</Typography>
                <Typography
                  variant="caption"
                  sx={{ display: "block", textAlign: "right" }}
                >
                  {/* mock timestamp */ new Date().toLocaleTimeString()}
                </Typography>
              </Paper>
            </ListItem>
          ))}
          <div ref={chatEndRef} />
        </List>
      </Box>
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
              handleSendMessage();
              ev.preventDefault();
            }
          }}
          onChange={(e) => setMessage(e.target.value)}
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleSendMessage}>
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
