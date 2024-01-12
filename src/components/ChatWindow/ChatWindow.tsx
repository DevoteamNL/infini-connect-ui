import { ThumbDown, ThumbUp } from "@mui/icons-material";
import SendIcon from "@mui/icons-material/Send";
import {
  Box,
  Button,
  Grid,
  IconButton,
  List,
  ListItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useThreadSelectors } from "../../ThreadStore";
import { useAuthContext } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import PluginSelector from "../PluginSelector/PluginSelector";

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
const MainContent = () => {
  const [addingFeedback, setAddingFeedback] = useState<
    "positive" | "negative" | "neutral" | undefined
  >();
  const { authFetch } = useAuthContext();

  const selectors = useThreadSelectors();
  const selectedThreadId = selectors.selectedThreadId();
  const threads = selectors.threads();
  const postMessage = selectors.postMessage();
  // State for the chat message and text field rows
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState(3);
  const selectedThread = selectedThreadId
    ? threads.get(selectedThreadId)
    : Array.from(threads.values())[0];
  const messages = selectedThread?.messages;

  const [plugin, setPlugin] = useState<string>("");

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
  }, [messages, addingFeedback]);

  // Function to handle sending a message
  const handleSendMessage = () => {
    if (!message || !selectedThread || selectedThread.loading) return;

    if (addingFeedback) {
      // TODO: send feedback
      setAddingFeedback(undefined);
    } else {
      postMessage(authFetch, selectedThread.id, message, plugin);
    }
    setMessage("");
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
        plugin={selectedThread?.plugin || plugin}
        onPluginChange={setPlugin}
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

            {selectedThread?.replying ? (
              <Message sender={false} caption="thinking..."></Message>
            ) : addingFeedback ? (
              <>
                <Message
                  sender={false}
                  caption=""
                  message={`Can you share a bit more info on what you ${
                    {
                      neutral: "think of",
                      negative: "dislike about",
                      positive: "like about",
                    }[addingFeedback]
                  } the previous response or your general experience with the app?`}
                ></Message>
                <Stack
                  direction="row"
                  spacing={1}
                  paddingX={2}
                  justifyContent={"flex-end"}
                >
                  <Button onClick={() => setAddingFeedback(undefined)}>
                    Cancel feedback
                  </Button>
                </Stack>
              </>
            ) : (
              <Stack
                direction="row"
                spacing={1}
                paddingX={2}
                justifyContent={"flex-end"}
              >
                <Button onClick={() => setAddingFeedback("neutral")}>
                  How was this response?
                </Button>

                <IconButton onClick={() => setAddingFeedback("negative")}>
                  <ThumbDown />
                </IconButton>
                <IconButton onClick={() => setAddingFeedback("positive")}>
                  <ThumbUp />
                </IconButton>
              </Stack>
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
