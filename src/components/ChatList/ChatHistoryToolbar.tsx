import Toolbar from "@mui/material/Toolbar";
import { useSettings } from "../../context/SettingsContext";

export const ChatHistoryToolbar = () => {
  const { darkMode } = useSettings();

  return (
    <Toolbar>
      <img
        src={`/static/images/devoteam_rgb${darkMode ? "_white" : ""}.png`}
        alt="logo"
        height="50px"
      />
    </Toolbar>
  );
};