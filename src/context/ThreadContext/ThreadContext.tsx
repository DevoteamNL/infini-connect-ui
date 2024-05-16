// Define the thread context
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useReducer,
  useState,
} from "react";
import { useAuthContext } from "../AuthContext";
import { threadReducer } from './ThreadContext.reducers';
import {
  AiResponsePayload,
  Role,
  StreamExtractedData,
  StreamMetadataTagName,
  Thread,
  ThreadContextProps,
  UserRequestPayload
} from './ThreadContext.types';
import { NO_TEXT_YET, NO_THREAD_ID_YET } from './ThreadContext.constants';

export { Role } from './ThreadContext.types';

// parses the string chunks received as a response from OpenAI
const parseStreamedData = (
  messageChunk: string,
  streamThreadIdWasParsed: boolean
): StreamExtractedData => {
  const extractedData: StreamExtractedData = {};
  let aux = messageChunk;

  const extract = (
    regex: RegExp,
    groupName: StreamMetadataTagName,
    isValueNumber: boolean
  ) => {
    const found = aux.match(regex);
    if (found?.groups && found.groups[groupName]) {
      // @ts-ignore
      extractedData[groupName] = isValueNumber
        ? Number(found.groups[groupName])
        : found.groups[groupName];
      aux = aux.replace(found.groups[`${groupName}Block`], "");
    }
  };

  // the order of the extraction of the metadata from the string chunks matters
  if (!streamThreadIdWasParsed) {
    extract(metadataRegExs.threadIdRegex, StreamMetadataTagName.THREAD_ID, true);
  }
  [
    { tag: StreamMetadataTagName.USER_MESSAGE_ID, isValueNumber: true },
    { tag: StreamMetadataTagName.USER_MESSAGE_CREATED_AT, isValueNumber: false },
    { tag: StreamMetadataTagName.ROLE, isValueNumber: false },
    { tag: StreamMetadataTagName.AI_MESSAGE_ID, isValueNumber: true },
  ].forEach(it => {
    if (aux.length > 0) {
      extract(metadataRegExs[`${it.tag}Regex`], it.tag, it.isValueNumber);
    }
  });
  extract(metadataRegExs.aiMessageCreationDateRegex, StreamMetadataTagName.AI_MESSAGE_CREATED_AT, false);
  // data extraction must be last, after the metadata extraction
  if (aux.length > 0) {
    extractedData.messageContent = aux;
  }
  return extractedData;
};

// Create the thread context
const ThreadContext = createContext<ThreadContextProps | undefined>(undefined);

export const constructNewThread = (): Thread => {
  return {
    id: Math.random(),
    messages: [],
    loading: false,
    error: null,
    newThread: true,
    replying: false
  };
};

class FetchError extends Error {
  url: URL;
  status: number;
  statusText: string;
  errorMessage: string;

  constructor(url: URL, status: number, statusText: string, errorMessage?: string) {
    super(errorMessage);
    this.name = "FetchError";
    this.url = url;
    this.status = status;
    this.statusText = statusText;
    this.errorMessage = errorMessage || `Failed to fetch ${url} - ${status}: ${statusText}`;
  }
}

const REGEX_STUB = /^./;
const metadataRegExs: Record<string, RegExp> = {
  threadIdRegex: REGEX_STUB,
  userMessageIdRegex: REGEX_STUB,
  userMessageCreationDateRegex: REGEX_STUB,
  roleRegex: REGEX_STUB,
  aiMessageIdRegex: new RegExp(
    `(?<${StreamMetadataTagName.AI_MESSAGE_ID}Block>\\[\\[${StreamMetadataTagName.AI_MESSAGE_ID}=(?<${StreamMetadataTagName.AI_MESSAGE_ID}>[^\\]]+)\\]\\])`
  ),
  aiMessageCreationDateRegex: new RegExp(
    `(?<${StreamMetadataTagName.AI_MESSAGE_CREATED_AT}Block>\\[\\[${StreamMetadataTagName.AI_MESSAGE_CREATED_AT}=(?<${StreamMetadataTagName.AI_MESSAGE_CREATED_AT}>[^\\]]+)\\]\\])$`
  ),
};
// replaces the regEx stubs with the actual regExs
const createMetadataRegExs = () => {
  [
    StreamMetadataTagName.THREAD_ID,
    StreamMetadataTagName.USER_MESSAGE_ID,
    StreamMetadataTagName.USER_MESSAGE_CREATED_AT,
    StreamMetadataTagName.ROLE
  ].forEach(it => {
    metadataRegExs[`${it}Regex`] = new RegExp(`^(?<${it}Block>\\[\\[${it}=(?<${it}>[^\\]]+)\\]\\])`);
  });
};

// Create the thread provider
const ThreadProvider = ({
  children,
}: {
  children: ReactNode[] | ReactNode;
}) => {
  const [threads, dispatch] = useReducer(threadReducer, [constructNewThread()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedThread, setSelectedThread] = useState<number | undefined>();
  const { credential, checkExpired } = useAuthContext();

  createMetadataRegExs();

  const authFetch = useCallback(
    async (
      params: {
        threadId?: number;
        messagesEndpoint?: boolean;
        options?: RequestInit;
      } = {},
    ) => {
      const expired = checkExpired();
      if (expired) {
        return;
      }
      const url = new URL(window.config.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL || "");
      url.pathname = "api/thread/";
      if (params.threadId) {
        url.pathname +=
          params.threadId + "/" + (params.messagesEndpoint ? "messages" : "");
      }

      const response = await fetch(url, {
        ...params.options,
        headers: {
          ...(params.options?.headers || {}),
          Authorization: `Bearer ${credential?.credential}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response
          .json()
          .catch(
            () =>
              "Internal server error. Failed to retrieve detailed error message",
          );
        const errorMessage =
          errorBody.error || `Failed to retrieve detailed error message`;
        throw new FetchError(
          url,
          response.status,
          response.statusText,
          `${errorMessage} (Status: ${errorBody.status || response.status})`,
        );
      }
      return response;
    },
    [checkExpired, credential?.credential],
  );

  // Fetch all threads
  const listThreads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authFetch();
      if (!response) {
        return;
      }
      const threads = await response.json();
      dispatch({ type: "SET_THREADS", payload: threads });
      setLoading(false);
    } catch (error) {
      setError("Failed to fetch threads");
    }
  }, [authFetch]);

  // Create a thread
  const createThread = async () => {
    const newThread = constructNewThread();
    dispatch({
      type: "ADD_THREAD",
      payload: newThread,
    });
    setSelectedThread(newThread.id);
  };

  // Delete a thread by ID
  const deleteThread = useCallback(
    async (id: number, newThread?: boolean) => {
      dispatch({ type: "SET_LOADING", payload: { id, loading: true } });

      try {
        if (!newThread) {
          await authFetch({
            threadId: id,
            options: {
              method: "DELETE",
            },
          });
        }
        dispatch({ type: "DELETE_THREAD", payload: id });
        setSelectedThread(undefined);
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: { id, error: "Failed to delete thread" },
        });
      }
    },
    [authFetch],
  );

  // Rename a thread by ID
  const renameThread = useCallback(
    async (id: number, title: string, newThread?: boolean) => {
      dispatch({ type: "SET_THREAD_TITLE", payload: { id, title } });
      if (newThread) {
        return;
      }
      dispatch({ type: "SET_LOADING", payload: { id, loading: true } });

      try {
        await authFetch({
          threadId: id,
          options: {
            method: "PATCH",
            body: JSON.stringify({
              title: title,
            }),
            headers: { "Content-Type": "application/json" },
          },
        });

        dispatch({ type: "SET_THREAD_TITLE", payload: { id, title } });
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: { id, error: "Failed to rename thread" },
        });
      }
    },
    [authFetch],
  );

  // including metadata
  const dispatchExtractedStreamedData = async (
    streamedBody: ReadableStream<Uint8Array>,
    titleSent: string,
    id: number
  ) => {
    const decoder = new TextDecoder('utf8');

    let messageChunk: string;
    let threadId = NO_THREAD_ID_YET;
    let messageContent = NO_TEXT_YET;
    let userMessageIdFound = false;
    let userMessageCreatedAt = false;

    // @ts-ignore
    for await (const chunk of streamedBody) {
      messageChunk = decoder.decode(chunk);
      const values: StreamExtractedData = parseStreamedData(messageChunk, !!threadId);
      if (values[StreamMetadataTagName.THREAD_ID]
        && (threadId !== values[StreamMetadataTagName.THREAD_ID]
          || selectedThread !== values[StreamMetadataTagName.THREAD_ID])) {
        threadId = Number(values[StreamMetadataTagName.THREAD_ID]);
      }

      if (values.messageContent) {
        messageContent += values.messageContent;
      }

      if (!userMessageIdFound || !userMessageCreatedAt) {
        const userPayload: UserRequestPayload = {
          id: Number(id), // previously attributed random id for the thread
          threadId,
          title: titleSent
        };
        if (!userMessageIdFound && values[StreamMetadataTagName.USER_MESSAGE_ID]) {
          userPayload[StreamMetadataTagName.USER_MESSAGE_ID] = values[StreamMetadataTagName.USER_MESSAGE_ID];
          userMessageIdFound = true;
        }
        if (!userMessageCreatedAt && values[StreamMetadataTagName.USER_MESSAGE_CREATED_AT]) {
          userPayload[StreamMetadataTagName.USER_MESSAGE_CREATED_AT] = values[StreamMetadataTagName.USER_MESSAGE_CREATED_AT];
          userMessageCreatedAt = true;
        }

        dispatch({
          type: "SET_USER_REQUEST",
          payload: userPayload
        });
      }

      dispatch({
        type: "SET_AI_RESPONSE",
        payload: {
          id,
          [StreamMetadataTagName.THREAD_ID]: threadId || 0,
          [StreamMetadataTagName.USER_MESSAGE_ID]: values[StreamMetadataTagName.USER_MESSAGE_ID],
          [StreamMetadataTagName.USER_MESSAGE_CREATED_AT]: values[StreamMetadataTagName.USER_MESSAGE_CREATED_AT],
          [StreamMetadataTagName.ROLE]: values[StreamMetadataTagName.ROLE],
          [StreamMetadataTagName.AI_MESSAGE_ID]: values[StreamMetadataTagName.AI_MESSAGE_ID],
          [StreamMetadataTagName.AI_MESSAGE_CREATED_AT]: values[StreamMetadataTagName.AI_MESSAGE_CREATED_AT],
          messageContent
        } as AiResponsePayload
      });
      if (threadId && threadId !== NO_THREAD_ID_YET && threadId !== selectedThread) {
        setSelectedThread(threadId);
      }
    }
  };

  // Post a message to a thread
  const postMessage = useCallback(
    async (
      id: number,
      message: string,
      isNewThread?: boolean,
      title?: string,
      plugin?: string,
    ) => {
      const trimmedMessage = message.trim();

      dispatch({
        type: "ADD_CHAT_MESSAGE_REQUEST",
        payload: {
          threadId: id,
          role: Role.USER,
          messageId: Math.random(),
          messageContent: trimmedMessage,
        },
      });
      dispatch({ type: "SET_LOADING", payload: { id, loading: true } });

      const titleAux = title || trimmedMessage.substring(0, 20);
      const trimmedTitle = titleAux.trim();
      let response: Response | undefined;

      if (isNewThread) {
        try {
          response = await authFetch({
            options: {
              method: "POST",
              body: JSON.stringify({
                title: trimmedTitle,
                message: trimmedMessage,
                plugin,
              }),
              headers: { "Content-Type": "application/json" }
            },
          });
          if (!response) {
            return;
          }
        } catch (error) {
          dispatch({
            type: "SET_ERROR",
            payload: { id, error: "Failed to create thread" },
          });
        }
      } else {
        try {
          response = await authFetch({
            threadId: id,
            messagesEndpoint: true,
            options: {
              method: "POST",
              body: JSON.stringify({ text: trimmedMessage }),
              headers: { "Content-Type": "application/json" },
            },
          });
          if (!response) {
            dispatch({
              type: "SET_ERROR",
              payload: { id, error: "Failed to fetch" },
            });
          }
        } catch (err) {
          dispatch({
            type: "SET_ERROR",
            payload: { id, error: "Failed to fetch" },
          });
        }
      }

      const streamedBody = response?.body;
      if (streamedBody) {
        dispatchExtractedStreamedData(streamedBody, trimmedTitle, id);
      } else {
        throw new Error("Response is missing the streamed body");
      }
    },
    [authFetch],
  );

  // Render the thread provider with the context value
  return (
    <ThreadContext.Provider
      value={{
        threads,
        loading,
        error,
        selectedThreadId: selectedThread || threads[0]?.id,
        listThreads,
        createThread,
        deleteThread,
        postMessage,
        setSelectedThread,
        renameThread,
      }}
    >
      {children}
    </ThreadContext.Provider>
  );
};

// Custom hook to access the thread context
const useThreadContext = () => {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error("useThreadContext must be used within a ThreadProvider");
  }
  return context;
};

export { ThreadProvider, useThreadContext, type Thread };
