import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { Fab, Skeleton } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import * as React from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useThreadContext } from "../../context/ThreadContext";
import ChatWindow from "../ChatWindow/ChatWindow";

const drawerWidth = 300;
const settings = ["Profile", "Account", "Dashboard"];

interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * Remove this when copying and pasting into your project.
   */
  window?: () => Window;
}

export default function ChatHistoryDrawer(props: Props) {
  const { logout } = useAuthContext();
  const {
    threads,
    listThreads,
    createThread,
    setSelectedThread,
    selectedThreadId,
    loading,
  } = useThreadContext();
  // const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
  //   null,
  // );
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  // const handleCloseUserMenu = () => {
  //   setAnchorElUser(null);
  // };

  React.useEffect(() => {
    listThreads();
  }, [listThreads]);

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
        <Toolbar>
          <img src="/static/images/devoteam_rgb.png" alt="logo" height="50px" />
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
        <List>
          {[...Array(loading ? 4 : 0)].map(() => (
            <ListItem>
              <Skeleton sx={{ flexGrow: 1, fontSize: "1rem" }} />
            </ListItem>
          ))}
          {threads.map((thread, index) => (
            <ListItem key={thread.id} disablePadding>
              <ListItemButton
                onClick={() => setSelectedThread(thread.id)}
                selected={selectedThreadId === thread.id}
              >
                {/*<ListItemIcon>
                                    {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                                </ListItemIcon>*/}
                <ListItemText primary={thread.title} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Box flexGrow={1} />
      <Divider />
      <Box>
        <Divider />
        <List>
          {settings.map((text, index) => (
            <ListItem key={text} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  {/*{index % 2 === 0 ? <InboxIcon/> : <MailIcon/>}*/}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem key="Logout" disablePadding>
            <ListItemButton onClick={logout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

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
          {drawer}
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
          {drawer}
        </Drawer>
      </Box>
      <ChatWindow />
    </Box>
  );
}
