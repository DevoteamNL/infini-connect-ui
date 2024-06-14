import AddIcon from "@mui/icons-material/Add";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import {
  Avatar,
  Button,
  Container,
  Drawer,
  Fab,
  ListItemButton,
  Skeleton,
  styled,
} from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import { useEffect, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useThreadContext } from "../../context/ThreadContext";
import ChatWindow from "../ChatWindow/ChatWindow";
import { ThreadItem } from "./ChatHistoryThreadItem";
import { ChatSearch } from './ChatSearch';

const drawerWidth = 300;

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

const ChatHistoryDrawer = () => {
  const { logout, profile } = useAuthContext();
  const { darkMode, toggleDarkMode } = useSettings();
  const { threads, listThreads, createThread, loading, error } =
    useThreadContext();
  // result of the search input filtering
  const [filteredThreadsIndexes, setFilteredThreadsIndexes] = useState<number[]>([]);
  // search input (split, if a logical operator was used)
  const [searchFilter, setSearchFilter] = useState<string[]>([]);

  useEffect(() => {
    listThreads();
  }, [listThreads]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
        <Toolbar>
          <img
            src={`/static/images/devoteam_rgb${darkMode ? "_white" : ""}.png`}
            alt="logo"
            height="50px"
          />
        </Toolbar>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Fab
            variant="extended"
            color="primary"
            onClick={() => createThread()}
          >
            <AddIcon sx={{ mr: 1 }} />
            New Chat
          </Fab>
        </Box>
        <Divider />
        {error ? (
          <Container>
            <Error>
              {error}
              <br />
              <br />
              Contact:{" "}
              <a href="mailto:nl.infini.connect@devoteam.com">
                nl.infini.connect
              </a>
              <br />
              <Button onClick={() => listThreads()}>Retry</Button>
            </Error>
          </Container>
        ) : (
          <>
            <ChatSearch
              setFilteredThreadsIndexes={setFilteredThreadsIndexes}
              setSearchFilter={setSearchFilter}
              searchFilter={searchFilter}
              filteredThreadsIndexes={filteredThreadsIndexes}
            />
            <List>
              {[...Array(loading ? 4 : 0)].map((_, index) => (
                <ListItem key={index}>
                  <Skeleton sx={{ flexGrow: 1, fontSize: "1rem" }} />
                </ListItem>
              ))}
              {threads.filter((_it, idx) => (searchFilter.length === 0
                || filteredThreadsIndexes.includes(idx)
              )).map((thread) => (
                <ThreadItem key={thread.id} thread={thread} />
              ))}
            </List>
          </>

        )}
      </Box>
      <Box flexGrow={1} />
      <Divider />
      <Box>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={toggleDarkMode}>
              <ListItemIcon>
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </ListItemIcon>
              <ListItemText primary={darkMode ? "Light mode" : "Dark mode"} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={logout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
              <ListItemIcon>
                <Avatar src={profile?.picture} />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );
};

export default function ChatHistory() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          <ChatHistoryDrawer />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          <ChatHistoryDrawer />
        </Drawer>
      </Box>
      <ChatWindow />
    </Box>
  );
}
