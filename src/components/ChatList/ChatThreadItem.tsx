import { Delete, MoreHoriz } from "@mui/icons-material";
import DriveFileRenameIcon from "@mui/icons-material/DriveFileRenameOutlineSharp";
import {
  ListItemButton,
  Menu,
  MenuItem,
  styled,
  TextField,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { Thread, useThreadContext } from "../../context/ThreadContext";
import { useRef, useState } from 'react';

const RenameText = styled(TextField)(({ theme }) => ({
  paddingBlock: theme.spacing(1),
  paddingInline: theme.spacing(2),
}));

export const ThreadItem = ({ thread }: { thread: Thread }) => {
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(thread.title || "New Chat");
  const { setSelectedThread, selectedThreadId, deleteThread, renameThread } =
    useThreadContext();
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
            renameThread(thread.id, newTitle, thread.newThread);
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
            deleteThread(thread.id, thread.newThread);
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