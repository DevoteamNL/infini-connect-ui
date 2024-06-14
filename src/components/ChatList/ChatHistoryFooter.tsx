import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  Avatar,
  ListItemButton,
} from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useAuthContext } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";

export const ChatHistoryFooter = () => {
  const { logout, profile } = useAuthContext();
  const { darkMode, toggleDarkMode } = useSettings();

  return (
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
    </List>);
};