import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useReducer,
  useState,
} from "react";
import { useAuthContext } from "./AuthContext";

// Define the thread context
interface ThreadContextProps {
  threads: Thread[];
  loading: boolean;
  error: string;
  selectedThreadId?: number;
  listThreads: () => Promise<void>;
  createThread: () => Promise<void>;
  deleteThread: (id: number, newThread?: boolean) => Promise<void>;
  renameThread: (
    id: number,
    title: string,
    newThread?: boolean,
  ) => Promise<void>;
  postMessage: (
    id: number,
    message: string,
    newThread?: boolean,
    title?: string,
    plugin?: string,
  ) => Promise<void>;
  setSelectedThread: (id: number) => void;
}

export enum Role {
  NOT_ATTRIBUTED = "notAttributed",
  USER = "user",
  ASSISTANT = "assistant",
}

interface Message {
  id: number;
  data: {
    role: Role;
    content: string;
  };
  createdAt?: string;
}

// Define the thread object
interface Thread {
  id: number;
  title?: string;
  newThread: boolean;
  messages: Array<Message>;
  loading: boolean;
  error: string | null;
  replying: boolean;
  plugin?: string;
}

interface UserRequestPayload {
  id: number;
  [StreamMetadataTagName.THREAD_ID]: number;
  title: string;
  [StreamMetadataTagName.USER_MESSAGE_ID]?: number;
  [StreamMetadataTagName.USER_MESSAGE_CREATED_AT]?: string;
}

interface AiResponsePayload {
  id: number;
  [StreamMetadataTagName.THREAD_ID]: number;
  [StreamMetadataTagName.USER_MESSAGE_CREATED_AT] ?: string;
  [StreamMetadataTagName.USER_MESSAGE_ID] ?: number;
  [StreamMetadataTagName.ROLE] ?: Role;
  messageContent: string;
  [StreamMetadataTagName.AI_MESSAGE_ID] ?: number;
  [StreamMetadataTagName.AI_MESSAGE_CREATED_AT] ?: string;
}

// Define the action types
type Action =
  | { type: "SET_THREADS"; payload: Thread[]; }
  | { type: "SET_LOADING"; payload: { id: number; loading: boolean; }; }
  | { type: "SET_ERROR"; payload: { id: number; error: string; }; }
  | { type: "ADD_THREAD"; payload: Thread; }
  | { type: "DELETE_THREAD"; payload: number; }
  | { type: "SET_THREAD_TITLE"; payload: { id: number; title: string; }; }
  | {
    // initial message displayed
    type: "ADD_CHAT_MESSAGE_REQUEST";
    payload: { threadId: number; createdAt?: string; role: Role; messageContent: string; messageId?: number; };
  }
  | {
    type: "SET_USER_REQUEST";
    payload: UserRequestPayload;
  }
  | {
    // from the first chunk of a streamed chat message
    type: "SET_AI_RESPONSE";
    payload: AiResponsePayload;
  };

enum StreamMetadataTagName {
  USER_MESSAGE_ID = 'userMessageId',
  USER_MESSAGE_CREATED_AT = 'userMessageCreatedAt',
  THREAD_ID = 'threadId',
  ROLE = 'role',
  AI_MESSAGE_ID = 'aiMessageId',
  AI_MESSAGE_CREATED_AT = 'aiMessageCreatedAt',
}

interface StreamExtractedData {
  [StreamMetadataTagName.THREAD_ID]?: number;
  [StreamMetadataTagName.USER_MESSAGE_ID]?: number;
  [StreamMetadataTagName.USER_MESSAGE_CREATED_AT]?: string;
  [StreamMetadataTagName.ROLE]?: Role;
  [StreamMetadataTagName.AI_MESSAGE_ID]?: number;
  messageContent?: string;
  [StreamMetadataTagName.AI_MESSAGE_CREATED_AT]?: string;
}

interface StreamReducerPayload extends StreamExtractedData {
  isLoading?: boolean;
  messageContent: string;
}

const NO_NUMBER_YET = 0;
const NO_TEXT_YET = "";

// Define the reducer function
const threadReducer = (state: Thread[], action: Action): Thread[] => {
  switch (action.type) {
    case "SET_THREADS":
      return [...state.filter((thread) => thread.newThread), ...action.payload];
    case "SET_ERROR":
      return state.map((thread) =>
        thread.id === action.payload.id
          ? { ...thread, error: action.payload.error, loading: false }
          : thread,
      );
    case "SET_LOADING":
      return state.map((thread) =>
        thread.id === action.payload.id
          ? { ...thread, error: null, loading: true }
          : thread,
      );
    case "ADD_THREAD":
      return [...state, action.payload];
    case "DELETE_THREAD": {
      const withThreadRemoved = state.filter(
        (thread) => thread.id !== action.payload,
      );

      return withThreadRemoved.length === 0
        ? [constructNewThread()]
        : withThreadRemoved;
    }
    case "ADD_CHAT_MESSAGE_REQUEST":
      return state.map((thread) => {
        return thread.id === action.payload.threadId
          ? {
            ...thread,
            title: thread.title || NO_TEXT_YET,
            messages: [...thread.messages, {
              id: action.payload.messageId || NO_NUMBER_YET,
              data: {
                role: action.payload.role || Role.NOT_ATTRIBUTED,
                content: action.payload.messageContent || NO_TEXT_YET
              },
              createdAt: action.payload.createdAt,
            }],
            loading: !(action.type === "ADD_CHAT_MESSAGE_REQUEST") || !action.payload.messageContent,
            replying: action.payload.role === Role.USER,
          }
          : thread;
      });
    case "SET_USER_REQUEST":
      return state.map((thread) => {
        if (thread.id === action.payload[StreamMetadataTagName.THREAD_ID] || thread.id === action.payload.id) {
          const { messages } = thread;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].data.role === Role.USER) {
              if (action.payload[StreamMetadataTagName.USER_MESSAGE_ID]) {
                messages[i].id = Number(action.payload[StreamMetadataTagName.USER_MESSAGE_ID]);
              }
              if (action.payload[StreamMetadataTagName.USER_MESSAGE_CREATED_AT]) {
                messages[i].createdAt = action.payload[StreamMetadataTagName.USER_MESSAGE_CREATED_AT];
              }
              break;
            }
          }
          return {
            ...thread,
            id: action.payload[StreamMetadataTagName.THREAD_ID],
            title: action.payload.title,
            messages,
            loading: true,
            newThread: false,
            replying: true
          };
        }
        return thread;
      });
    case "SET_AI_RESPONSE": {
      return state.map((thread) => {
        if (
          thread.id === action.payload[StreamMetadataTagName.THREAD_ID]
          || thread.id === action.payload.id) {
          if (thread.id === action.payload.id) {
            thread.id = action.payload[StreamMetadataTagName.THREAD_ID];
          }
          const isMessageAlreadyPresent = thread.messages[thread.messages.length - 1]
            && (thread.messages[thread.messages.length - 1].data.role === Role.ASSISTANT
              || thread.messages[thread.messages.length - 1].id === NO_NUMBER_YET);
          const aiResponseMessage = (isMessageAlreadyPresent)
            ? thread.messages[thread.messages.length - 1]
            : {
              id: action.payload[StreamMetadataTagName.AI_MESSAGE_ID] || NO_NUMBER_YET,
              data: {
                role: action.payload[StreamMetadataTagName.ROLE] || Role.NOT_ATTRIBUTED,
                content: action.payload.messageContent || NO_TEXT_YET,
              },
              createdAt: action.payload[StreamMetadataTagName.AI_MESSAGE_CREATED_AT] || NO_TEXT_YET,
            };

          if (isMessageAlreadyPresent) {
            if (action.payload[StreamMetadataTagName.AI_MESSAGE_ID]) {
              aiResponseMessage.id = action.payload[StreamMetadataTagName.AI_MESSAGE_ID];
            }
            if (action.payload[StreamMetadataTagName.AI_MESSAGE_CREATED_AT]) {
              aiResponseMessage.createdAt = action.payload[StreamMetadataTagName.AI_MESSAGE_CREATED_AT];
            }
            if (action.payload[StreamMetadataTagName.ROLE]) {
              aiResponseMessage.data.role = action.payload[StreamMetadataTagName.ROLE];
            }
            if (action.payload.messageContent) {
              aiResponseMessage.data.content = action.payload.messageContent;
            }
          } else {
            thread.messages.push(aiResponseMessage);
          }

          const hasMessageReachedTheEnd = !!aiResponseMessage.createdAt;
          thread.loading = !hasMessageReachedTheEnd;
          thread.replying = aiResponseMessage.data.content === NO_TEXT_YET;
        }
        return thread;
      });
    }
    case "SET_THREAD_TITLE":
      return state.map((thread) =>
        thread.id === action.payload.id
          ? {
            ...thread,
            title: action.payload.title,
            loading: false,
          }
          : thread,
      );
    default:
      return state;
  }
};

// Create the thread context
const ThreadContext = createContext<ThreadContextProps | undefined>(undefined);

const constructNewThread = (): Thread => {
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
// replaces the stubs with the actual regExs
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

  // including metadata
  const dispatchExtractedStreamedData = async (
    streamedBody: ReadableStream<Uint8Array>,
    titleSent: string,
    id: number
  ) => {
    const NO_THREAD_ID = 0;
    const decoder = new TextDecoder('utf8');

    let messageChunk: string;
    let threadId = NO_THREAD_ID;
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
      if (threadId && threadId !== NO_THREAD_ID && threadId !== selectedThread) {
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
