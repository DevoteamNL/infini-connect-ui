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
  selectedThreadId?: string;
  listThreads: () => Promise<void>;
  getThreadById: (id: string) => Promise<void>;
  createThread: () => Promise<void>;
  deleteThread: (id: string) => Promise<void>;
  postMessage: (
    id: string,
    message: string,
    newThread?: boolean,
  ) => Promise<void>;
  setSelectedThread: (id: string) => void;
}

// Define the thread object
interface Thread {
  id: string;
  title: string;
  newThread?: boolean;
  messages: {
    id: number;
    data: {
      role: "user" | "assistant";
      content: string;
    };
  }[];
  loading: boolean;
  error: string | null;
}

// Define the action types
type Action =
  | { type: "SET_THREADS"; payload: Thread[] }
  | { type: "SET_ALL_LOADING"; payload: { loading: boolean } }
  | { type: "SET_LOADING"; payload: { id: string; loading: boolean } }
  | { type: "SET_ERROR"; payload: { id: string; error: string } }
  | { type: "SET_THREAD"; payload: { id: string; thread: Thread } }
  | { type: "ADD_THREAD"; payload: Thread }
  | { type: "DELETE_THREAD"; payload: string }
  | {
      type: "ADD_MESSAGE";
      payload: { id: string; message: string; messageId: number };
    };

// Define the reducer function
const threadReducer = (state: Thread[], action: Action): Thread[] => {
  switch (action.type) {
    case "SET_THREADS":
      return action.payload;
    case "SET_LOADING":
      return state.map((thread) =>
        thread.id === action.payload.id
          ? { ...thread, loading: action.payload.loading }
          : thread,
      );
    case "SET_ERROR":
      return state.map((thread) =>
        thread.id === action.payload.id
          ? { ...thread, error: action.payload.error, loading: false }
          : thread,
      );
    case "ADD_THREAD":
      return [...state, action.payload];
    case "SET_THREAD":
      return state.map((thread) =>
        thread.id === action.payload.id
          ? {
              ...thread,
              ...action.payload.thread,
              loading: false,
              newThread: false,
            }
          : thread,
      );
    case "DELETE_THREAD":
      return state.filter((thread) => thread.id !== action.payload);
    case "ADD_MESSAGE":
      return state.map((thread) =>
        thread.id === action.payload.id
          ? {
              ...thread,
              messages: [
                ...thread.messages,
                {
                  id: action.payload.messageId,
                  data: { role: "user", content: action.payload.message },
                },
              ],
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

// Create the thread provider
const ThreadProvider = ({
  children,
}: {
  children: ReactNode[] | ReactNode;
}) => {
  const [threads, dispatch] = useReducer(threadReducer, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedThread, setSelectedThread] = useState<string | undefined>();
  const { credential, checkExpired } = useAuthContext();

  const authFetch = useCallback(
    async (
      params: {
        threadId?: string;
        messagesEndpoint?: boolean;
        options?: RequestInit;
      } = {},
    ) => {
      const expired = checkExpired();
      if (expired) {
        return;
      }
      const url = new URL(process.env.REACT_APP_API_BASE_URL || "");
      url.pathname = "api/thread/";
      const threadId = params.threadId || "";
      const messagesEndpoint =
        params.messagesEndpoint && params.threadId ? "messages" : "";
      url.pathname += threadId + "/" + messagesEndpoint;

      const response = await fetch(url, {
        ...params.options,
        headers: {
          ...(params.options?.headers || {}),
          Authorization: `Bearer ${credential?.credential}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch");
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
      setSelectedThread(threads[0]?.id);
      setLoading(false);
    } catch (error) {
      setError("Failed to fetch threads");
    }
  }, [authFetch]);

  // Fetch a thread by ID
  const getThreadById = useCallback(
    async (id: string) => {
      dispatch({ type: "SET_LOADING", payload: { id, loading: true } });

      try {
        const response = await authFetch({ threadId: id });
        if (!response) {
          return;
        }
        dispatch({ type: "SET_THREADS", payload: await response.json() });
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: { id, error: "Failed to fetch thread" },
        });
      }
    },
    [authFetch],
  );

  // Create a new thread
  const createThread = async () => {
    const tempId = Math.random().toString(36).substring(7);
    dispatch({
      type: "ADD_THREAD",
      payload: {
        id: tempId,
        title: "New Chat",
        messages: [
          {
            id: 1,
            data: { role: "assistant", content: "Hello, how can I help?" },
          },
        ],
        loading: false,
        error: null,
        newThread: true,
      },
    });
    setSelectedThread(tempId);
  };

  // Delete a thread by ID
  const deleteThread = useCallback(
    async (id: string) => {
      dispatch({ type: "SET_LOADING", payload: { id, loading: true } });

      try {
        await authFetch({
          threadId: id,
          options: {
            method: "DELETE",
          },
        });
        dispatch({ type: "DELETE_THREAD", payload: id });
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: { id, error: "Failed to delete thread" },
        });
      }
    },
    [authFetch],
  );

  // Post a message to a thread
  const postMessage = useCallback(
    async (id: string, message: string, newThread?: boolean) => {
      dispatch({ type: "SET_LOADING", payload: { id, loading: true } });

      if (newThread) {
        try {
          const response = await authFetch({
            options: {
              method: "POST",
              body: JSON.stringify({
                title: message.substring(0, 20),
                message,
              }),
              headers: { "Content-Type": "application/json" },
            },
          });
          if (!response) {
            return;
          }
          const newThread = await response.json();
          dispatch({
            type: "SET_THREAD",
            payload: { id: id, thread: newThread },
          });
          setSelectedThread(newThread.id);
        } catch (error) {
          dispatch({
            type: "SET_ERROR",
            payload: { id: id, error: "Failed to create thread" },
          });
        }
        return;
      }

      try {
        const response = await authFetch({
          threadId: id,
          messagesEndpoint: true,
          options: {
            method: "POST",
            body: JSON.stringify({ text: message }),
            headers: { "Content-Type": "application/json" },
          },
        });
        if (!response) {
          return;
        }
        const { id: messageId } = await response.json();
        dispatch({ type: "ADD_MESSAGE", payload: { id, message, messageId } });
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: { id, error: "Failed to post message" },
        });
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
        selectedThreadId: selectedThread,
        listThreads,
        getThreadById,
        createThread,
        deleteThread,
        postMessage,
        setSelectedThread,
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
