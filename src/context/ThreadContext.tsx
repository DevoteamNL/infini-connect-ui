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
  ) => Promise<void>;
  setSelectedThread: (id: number) => void;
}

interface Message {
  id: number;
  data: {
    role: "user" | "assistant";
    content: string;
  };
}

// Define the thread object
interface Thread {
  id: number;
  title?: string;
  newThread?: boolean;
  messages: Array<Message>;
  loading: boolean;
  error: string | null;
  replying?: boolean;
}

// Define the action types
type Action =
  | { type: "SET_THREADS"; payload: Thread[] }
  | { type: "SET_LOADING"; payload: { id: number; loading: boolean } }
  | { type: "SET_ERROR"; payload: { id: number; error: string } }
  | {
      type: "SET_THREAD";
      payload: { id: number; thread: Thread };
    }
  | { type: "ADD_THREAD"; payload: Thread }
  | { type: "DELETE_THREAD"; payload: number }
  | { type: "SET_THREAD_TITLE"; payload: { id: number; title: string } }
  | {
      type: "ADD_MESSAGE";
      payload: { id: number; message: Message };
    };

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
    case "SET_THREAD":
      return state.map((thread) =>
        thread.id === action.payload.id
          ? {
              ...action.payload.thread,
              loading: false,
              newThread: false,
              replying: false,
            }
          : thread,
      );
    case "DELETE_THREAD":
      const withThreadRemoved = state.filter(
        (thread) => thread.id !== action.payload,
      );

      return withThreadRemoved.length === 0
        ? [constructNewThread()]
        : withThreadRemoved;
    case "ADD_MESSAGE":
      return state.map((thread) =>
        thread.id === action.payload.id
          ? {
              ...thread,
              title: thread.title || action.payload.message.data.content,
              messages: [...thread.messages, action.payload.message],
              loading: false,
              replying: action.payload.message.data.role === "user",
            }
          : thread,
      );
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
  };
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
      const url = new URL(process.env.REACT_APP_API_BASE_URL || "");
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
      setLoading(false);
    } catch (error) {
      setError("Failed to fetch threads");
    }
  }, [authFetch]);

  // Create a new thread
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

  // Post a message to a thread
  const postMessage = useCallback(
    async (
      id: number,
      message: string,
      newThread?: boolean,
      title?: string,
    ) => {
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id,
          message: {
            id: Math.random(),
            data: { role: "user", content: message },
          },
        },
      });
      dispatch({ type: "SET_LOADING", payload: { id, loading: true } });

      if (newThread) {
        try {
          const response = await authFetch({
            options: {
              method: "POST",
              body: JSON.stringify({
                title: title || message.substring(0, 20),
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
            payload: {
              id: id,
              thread: {
                ...newThread,
                messages: newThread.messages.map((message: any) => ({
                  id: Math.random(),
                  data: message,
                })),
              },
            },
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
        const reply = await response.json();
        dispatch({
          type: "ADD_MESSAGE",
          payload: { id, message: { id: Math.random(), data: reply } },
        });
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
