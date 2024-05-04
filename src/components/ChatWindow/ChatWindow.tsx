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
  styled, AccordionSummary, Accordion, AccordionDetails, Container
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { Thread, useThreadContext } from "../../context/ThreadContext";
import PluginSelector from "../PluginSelector/PluginSelector";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// Define the MainContentProps interface for the component's props
interface MainContentProps {
  thread?: Thread;
}

const Error = styled("div")(({ theme }) => ({
  color: theme.palette.error.main,
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.error.light}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  margin: theme.spacing(1),
  textAlign: "center",
  display: "flex",
  justifyContent: "center",
  flexDirection: "column",
}));

// Styled StyledAccordionDetails with left-aligned Typography
const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  '& .MuiTypography-root': { // Targeting all Typography components within StyledAccordionDetails
    textAlign: 'left',
  },
  // You can add more styles for StyledAccordionDetails here
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

export enum FeedbackRating {
  BAD = 2,
  NEUTRAL = 3,
  GOOD = 4,
}

// MainContent component
const MainContent: React.FC<MainContentProps> = () => {
  const { credential, checkExpired } = useAuthContext();

  const [addingFeedback, setAddingFeedback] = useState<
    FeedbackRating | undefined
  >();
  const { postMessage, threads, selectedThreadId } = useThreadContext();
  // State for the chat message and text field rows
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState(3);
  const selectedThread = threads.find((t) => t.id === selectedThreadId);
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

  const sendFeedback = (feedbackRating: FeedbackRating) => {
    if (checkExpired()) return;
    const messageId = messages?.[messages.length - 1].id;
    if (!messageId) return;

    const url = new URL(window.config.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL || "");
    url.pathname = `api/message/${messageId}/feedback`;

    fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential?.credential}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: message,
        rating: feedbackRating,
      }),
    }).then((response) => {
      if (!response.ok) {
        // @ts-ignore
        throw new Error("Failed to fetch");
      }
    });
  };

  // Function to handle sending a message
  const handleSendMessage = () => {
    if (!message || !selectedThread || selectedThread.loading) return;

    if (addingFeedback) {
      sendFeedback(addingFeedback);
      setAddingFeedback(undefined);
    } else {
      postMessage(
        selectedThread.id,
        message,
        selectedThread.newThread,
        selectedThread.title,
        plugin,
      );
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
        width: "100%",
        paddingTop: "80px"
      }}
    >
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
                I can help you with the following (Only for the Amsterdam
                office):
              </Typography>
            </Grid>

            <Grid container>
              <Grid item xs={1}></Grid>
              <Grid item xs={10}>
                <div>
                  <Accordion defaultExpanded>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel1a-content"
                      id="panel1a-header"
                    >
                      <Typography>Find available desks</Typography>
                    </AccordionSummary>
                    <StyledAccordionDetails>
                      <Typography>
                        <b>Sample Question:</b> "Can you please find available
                        dual monitor desks for next week Tuesday?"
                      </Typography>
                      <Typography>
                        <b>Sample Question:</b> "find desk for tomorrow?"
                      </Typography>
                    </StyledAccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel2a-content"
                      id="panel2a-header"
                    >
                      <Typography>Make a desk reservation</Typography>
                    </AccordionSummary>
                    <StyledAccordionDetails>
                      <Typography>
                        <b>Sample Question:</b> "Reserve dual desk monitor for
                        tomorrow."
                      </Typography>
                    </StyledAccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel3a-content"
                      id="panel3a-header"
                    >
                      <Typography>Get desk reservation details</Typography>
                    </AccordionSummary>
                    <StyledAccordionDetails>
                      <Typography>
                        <b>Sample Question:</b> "Do I have desk reserved for
                        tomorrow?"
                      </Typography>
                      <Typography>
                        <b>Sample Question:</b> "Who is coming to office
                        tomorrow?"
                      </Typography>
                      <Typography>
                        <b>Sample Question:</b> "Is Ratko coming to office
                        tomorrow?"
                      </Typography>
                    </StyledAccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel4a-content"
                      id="panel4a-header"
                    >
                      <Typography>Check available parking spots</Typography>
                    </AccordionSummary>
                    <StyledAccordionDetails>
                      <Typography>
                        <b>Sample Question:</b> "Any parking available for 5th
                        of march?"
                      </Typography>
                    </StyledAccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel5a-content"
                      id="panel5a-header"
                    >
                      <Typography>Make a parking reservation</Typography>
                    </AccordionSummary>
                    <StyledAccordionDetails>
                      <Typography>
                        <b>Sample Question:</b> "I need to reserve a parking
                        spot for next Monday."
                      </Typography>
                    </StyledAccordionDetails>
                  </Accordion>
                </div>
              </Grid>
              <Grid item xs={1}></Grid>
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
                      [FeedbackRating.NEUTRAL]: "think of",
                      [FeedbackRating.BAD]: "dislike about",
                      [FeedbackRating.GOOD]: "like about",
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
                <Button
                  onClick={() => {
                    setAddingFeedback(FeedbackRating.NEUTRAL);
                    sendFeedback(FeedbackRating.NEUTRAL);
                  }}
                >
                  How was this response?
                </Button>

                <IconButton
                  onClick={() => {
                    setAddingFeedback(FeedbackRating.BAD);
                    sendFeedback(FeedbackRating.BAD);
                  }}
                >
                  <ThumbDown />
                </IconButton>
                <IconButton
                  onClick={() => {
                    setAddingFeedback(FeedbackRating.GOOD);
                    sendFeedback(FeedbackRating.GOOD);
                  }}
                >
                  <ThumbUp />
                </IconButton>
              </Stack>
            )}
            <div ref={chatEndRef} />
          </List>
        </Box>
      )}
      <Box sx={{ mt: 1 }}>
        {selectedThread?.error ? (
          <Container>
            <Error>
              {selectedThread?.error}
              <br />
              <br />
              Contact:{" "}
              <a href="mailto:nl.infini.connect@devoteam.com">
                nl.infini.connect
              </a>
              <br />

            </Error>
          </Container>
        ) : (
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
        )}

      </Box>
    </Box>
  );
};

export default MainContent;
