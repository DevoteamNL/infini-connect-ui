import HelpOutlineSharpIcon from "@mui/icons-material/HelpOutlineSharp";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import * as React from "react";
import { useAuthContext } from "../../context/AuthContext";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function PluginSelector({
  disabled,
  plugin,
  onPluginChange,
}: {
  disabled?: boolean;
  plugin: string;
  onPluginChange: (plugin: string) => void;
}) {
  const [wereFetched, setWereFetched] = React.useState(false);
  const [plugins, setPlugins] = React.useState<
    { displayName: string; name: string }[]
  >([]);

  const { credential, checkExpired } = useAuthContext();

  React.useEffect(() => {
    const expired = checkExpired();
    if (expired || wereFetched) {
      return;
    }
    const url = new URL(window.config.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL || "");
    url.pathname = "api/plugin/";

    fetch(url, {
      headers: {
        Authorization: `Bearer ${credential?.credential}`,
      },
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      response.json().then((data) => {
        setPlugins(data);
        setWereFetched(true);
      });
    });
  }, [checkExpired, credential?.credential, wereFetched, setWereFetched]);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <FormControl sx={{ m: 1, width: 300 }}>
          <InputLabel id="demo-multiple-chip-label">Plugin</InputLabel>
          <Select
            disabled={disabled || !wereFetched}
            labelId="demo-multiple-chip-label"
            id="demo-multiple-chip"
            value={plugin}
            onChange={(event) => onPluginChange(event.target.value as string)}
            input={<OutlinedInput id="select-multiple-chip" label="Plugin" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                <Chip
                  key={selected}
                  label={plugins.find((p) => p.name === selected)?.displayName}
                />
              </Box>
            )}
            MenuProps={MenuProps}
          >
            {plugins.map(({ displayName, name }) => (
              <MenuItem key={name} value={name}>
                {displayName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          component="label"
          variant="contained"
          endIcon={<HelpOutlineSharpIcon />}
        >
          More Info
        </Button>
      </Box>
      <Divider />
    </Box>
  );
}
