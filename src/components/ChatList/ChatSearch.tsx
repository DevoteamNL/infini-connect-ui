import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
} from "@mui/material";
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from 'prop-types';
import { useThreadContext } from "../../context/ThreadContext";

enum LogicalOperator {
  AND = "AND",
  OR = "OR"
};
type LogicalOperatorT = keyof typeof LogicalOperator;
const logicalOperators = Object.values(LogicalOperator) as LogicalOperatorT[];

const NEW_THREAD_SEARCH_CONTENT = "";

export const ChatSearch = ({
  setFilteredThreadsIndexes,
  setSearchFilter,
  searchFilter,
  filteredThreadsIndexes
}: {
  setFilteredThreadsIndexes: React.Dispatch<React.SetStateAction<number[]>>;
  setSearchFilter: React.Dispatch<React.SetStateAction<string[]>>;
  searchFilter: string[];
  filteredThreadsIndexes: number[];
}) => {
  const { threads, listThreads, loading } =
    useThreadContext();
  // lower case thread data to be searched and filtered (including a stub for the "New Chat" thread)
  const [searchableThreads, setSearchableThreads] = useState<string[][]>();
  // AND or OR or undefined
  const [searchLogicalOperator, setSearchLogicalOperator] = useState<LogicalOperatorT>();
  const searchInput = useRef(null);

  useEffect(() => {
    listThreads();
  }, [listThreads]);

  // groups and transforms to lower case the messages from each thread
  useEffect(() => {
    if (threads.length > 0) {
      const newSearchableThreads: string[][] = [];
      for (let i = 0; i < threads.length; i++) {
        const threadMessagesContent: string[] = [];
        if (threads[i].newThread) {
          newSearchableThreads.push([NEW_THREAD_SEARCH_CONTENT]);
        } else {
          if (threads[i].title) {
            // @ts-ignore
            threadMessagesContent.push(threads[i].title.toLocaleLowerCase());
          }
          for (const msg of threads[i].messages) {
            threadMessagesContent.push(msg.data.content.toLocaleLowerCase());
          }
          newSearchableThreads.push(
            threadMessagesContent
          );
        }
      }
      setSearchableThreads(newSearchableThreads);
    }
  }, [threads, setSearchableThreads]);

  // filters the threads according to the search input
  useEffect(() => {
    if (threads.length > 0) {
      if ((!searchFilter || searchFilter.length === 0) && threads.length !== filteredThreadsIndexes.length) {
        setFilteredThreadsIndexes(threads.map((it, idx) => idx));
      } else if (searchableThreads) {
        const newFilteredThreadsIndexes: number[] = [];
        const NEW_THREAD_INDEX = threads.findIndex(it => it.newThread);
        searchableThreads.forEach((searchableThread, idx) => {
          if (idx === NEW_THREAD_INDEX
            && searchableThreads.length > 0
            && searchableThreads[NEW_THREAD_INDEX].length === 1
            && searchableThreads[NEW_THREAD_INDEX][0] === NEW_THREAD_SEARCH_CONTENT
          ) {
            newFilteredThreadsIndexes.push(NEW_THREAD_INDEX);
          } else {
            // used with the OR and the "no logical operator" scenarios 
            let isIncluded = false;
            // used with the AND scenario
            const andPartsFoundOnThread: boolean[] = Array(searchFilter.length).fill(false);
            let searchFilterPart;
            for (let i = 0; i < searchFilter.length; i++) {
              searchFilterPart = searchFilter[i];
              if (isIncluded || andPartsFoundOnThread.every((it) => it)) {
                break;
              }
              for (const searchableThreadPart of searchableThread) {
                if (searchableThreadPart.includes(searchFilterPart)) {
                  if (searchFilter.length === 1 || searchLogicalOperator === LogicalOperator.OR) {
                    isIncluded = true;
                  } else {
                    andPartsFoundOnThread[i] = true;
                  }
                  break;
                }
              }
            }
            if (isIncluded || andPartsFoundOnThread.every((it) => it)) {
              newFilteredThreadsIndexes.push(idx);
            }
          }
        });
        setFilteredThreadsIndexes(newFilteredThreadsIndexes);
      }
    }
  }, [searchFilter, searchLogicalOperator, searchableThreads, setFilteredThreadsIndexes, threads]);

  const clearSearchInputState = useCallback(() => {
    if (searchFilter.length > 0) {
      setSearchFilter([]);
    }
    if (searchLogicalOperator) {
      setSearchLogicalOperator(undefined);
    }
  }, [setSearchFilter, setSearchLogicalOperator, searchLogicalOperator, searchFilter]);

  const handleSearchOnChange = useCallback((event: { target: { value: string; }; }) => {
    const { value } = event.target;
    const trimmedValue = value.trim().toLocaleLowerCase();
    if (trimmedValue.length > 0) {
      let logicalOperatorOnSearch;
      for (const logicalOperator of logicalOperators) {
        if (value.includes(` ${logicalOperator} `)) {
          logicalOperatorOnSearch = logicalOperator;
          break;
        }
      }
      const splitPhrases = (logicalOperatorOnSearch)
        ? value
          .split(` ${logicalOperatorOnSearch} `)
          .map(it => it.trim().toLocaleLowerCase())
          .filter(it => it !== "")
        : [trimmedValue];
      setSearchFilter(splitPhrases);
      if (searchLogicalOperator !== logicalOperatorOnSearch) {
        setSearchLogicalOperator(logicalOperatorOnSearch);
      }
    } else {
      clearSearchInputState();
    }
  }, [setSearchFilter, searchFilter, searchLogicalOperator, setSearchLogicalOperator, clearSearchInputState]);

  const handleClickClearText = useCallback(() => {
    // @ts-ignore
    searchInput.current.value = "";
    clearSearchInputState();
  }, [clearSearchInputState]);

  return (
    <Box
      display="flex"
      alignItems="center"
      sx={{
        width: "100%",
        justifyContent: "center",
        marginTop: "0.5rem",
        paddingLeft: "16px",
        paddingRight: "16px"
      }}
    >
      <Tooltip title="Optional use of OR or AND">
        <TextField
          label="Search"
          type="text"
          size="small"
          inputRef={searchInput}
          disabled={loading || !searchableThreads || searchableThreads.length === 0}
          onChange={handleSearchOnChange}
          InputProps={{
            endAdornment: <InputAdornment position="end">
              <IconButton
                aria-label="clear inserted text"
                onClick={handleClickClearText}
                onMouseDown={handleClickClearText}
                edge="end"
              >
                <CancelOutlinedIcon
                />
              </IconButton>
            </InputAdornment>,
          }}
        />
      </Tooltip>
    </Box>
  );
};

ChatSearch.propTypes = {
  setFilteredThreadsIndexes: PropTypes.func.isRequired,
  setSearchFilter: PropTypes.func.isRequired,
  searchFilter: PropTypes.array.isRequired,
  filteredThreadsIndexes: PropTypes.array.isRequired
};
