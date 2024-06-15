import {
  Skeleton,
} from "@mui/material";
import PropTypes from 'prop-types';
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import { useThreadContext } from "../../context/ThreadContext";
import { ThreadItem } from "./ChatThreadItem";

export const ChatThreadList = ({
  searchFilter,
  filteredThreadsIndexes
}: {
  searchFilter: string[];
  filteredThreadsIndexes: number[];
}) => {
  const { threads, loading } = useThreadContext();

  return (<List>
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
  </List>);
};


ChatThreadList.propTypes = {
  filteredThreadsIndexes: PropTypes.array.isRequired,
  searchFilter: PropTypes.array.isRequired,
};