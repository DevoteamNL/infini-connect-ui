import { Delete, MoreHoriz } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import DriveFileRenameIcon from "@mui/icons-material/DriveFileRenameOutlineSharp";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import {
  Avatar,
  Button,
  Container,
  Drawer,
  Fab,
  ListItemButton,
  Menu,
  MenuItem,
  Skeleton,
  TextField,
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
import { useEffect, useRef, useState } from "react";
import { Thread, useThreadSelectors } from "../../ThreadStore";
import { useAuthContext } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import ChatWindow from "../ChatWindow/ChatWindow";

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

const RenameText = styled(TextField)(({ theme }) => ({
  paddingBlock: theme.spacing(1),
  paddingInline: theme.spacing(2),
}));

const ThreadItem = ({ thread }: { thread: Thread }) => {
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(thread.title || "New Chat");

  const { authFetch } = useAuthContext();

  const selectors = useThreadSelectors();
  const threads = selectors.threads();
  const selectedThreadId =
    selectors.selectedThreadId() || Array.from(threads.values())[0].id;

  const setSelectedThread = selectors.setSelectedThread();
  const renameThread = selectors.renameThread();
  const deleteThread = selectors.deleteThread();

  const inputRef = useRef<HTMLInputElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <ListItem
      key={thread.id}
      disablePadding
      secondaryAction={
        <IconButton edge="end" onClick={handleClick} disabled={thread.loading}>
          <MoreHoriz />
        </IconButton>
      }
    >
      {renaming ? (
        <RenameText
          variant="standard"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          inputRef={inputRef}
          onBlur={() => {
            setRenaming(false);
            renameThread(authFetch, thread.id, newTitle);
          }}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              (ev.target as HTMLElement).blur();
            }
          }}
        />
      ) : (
        <ListItemButton
          onClick={() => setSelectedThread(thread.id)}
          selected={selectedThreadId === thread.id}
        >
          <ListItemText primary={thread.title || "New Chat"} />
        </ListItemButton>
      )}
      <Menu anchorEl={anchorEl} onClose={() => handleClose()} open={open}>
        <MenuItem
          onClick={() => {
            deleteThread(authFetch, thread.id);
            handleClose();
          }}
        >
          <Delete sx={{ marginRight: 1 }} />
          Delete
        </MenuItem>
        <MenuItem
          onClick={() => {
            setRenaming(true);
            setTimeout(() => {
              inputRef.current?.focus();
              inputRef.current?.select();
            });
            handleClose();
          }}
        >
          <DriveFileRenameIcon sx={{ marginRight: 1 }} />
          Rename
        </MenuItem>
      </Menu>
    </ListItem>
  );
};

const ChatHistoryDrawer = () => {
  const { logout, profile } = useAuthContext();

  const { authFetch } = useAuthContext();

  const selectors = useThreadSelectors();
  const createThread = selectors.createThread();
  const listThreads = selectors.listThreads();
  const error = selectors.error();
  const loading = selectors.loading();
  const threads = selectors.threads();

  const { darkMode, toggleDarkMode } = useSettings();

  useEffect(() => {
    listThreads(authFetch);
  }, [listThreads, authFetch]);

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
              <Button onClick={() => listThreads(authFetch)}>Retry</Button>
            </Error>
          </Container>
        ) : (
          <List>
            {[...Array(loading ? 4 : 0)].map((_, index) => (
              <ListItem key={index}>
                <Skeleton sx={{ flexGrow: 1, fontSize: "1rem" }} />
              </ListItem>
            ))}
            {Array.from(threads.values()).map((thread) => (
              <ThreadItem key={thread.id} thread={thread} />
            ))}
          </List>
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
