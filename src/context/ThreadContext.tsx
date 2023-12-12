import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useReducer,
  useState,
} from "react";
import { AuthContext } from "./AuthContext";

// Define the thread context
interface ThreadContextProps {
  threads: Thread[];
  loading: boolean;
  error: string;
  listThreads: () => Promise<void>;
  getThreadById: (id: string) => Promise<void>;
  createThread: (thread: { title: string; message: string }) => Promise<void>;
  deleteThread: (id: string) => Promise<void>;
  postMessage: (id: string, message: string) => Promise<void>;
}

// Define the thread object
export interface Thread {
  id: string;
  title: string;
  messages: {
    id: number;
    data: {
      role: "user" | "other";
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
  | { type: "SET_THREAD_ID"; payload: { id: string; newId: string } }
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
    case "SET_THREAD_ID":
      return state.map((thread) =>
        thread.id === action.payload.id
          ? { ...thread, id: action.payload.newId, loading: false }
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
  const { credential } = useContext(AuthContext);

  const authFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      return await fetch(url, {
        ...options,
        headers: {
          ...(options?.headers || {}),
          Authorization: `Bearer ${credential?.credential}`,
        },
      });
    },
    [credential?.credential],
  );

  // Fetch all threads
  const listThreads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authFetch("http://localhost:8080/api/thread");
      dispatch({ type: "SET_THREADS", payload: await response.json() });
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
        const response = await authFetch(
          `http://localhost:8080/api/thread/${id}`,
        );
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
  const createThread = useCallback(
    async (params: { title: string; message: string }) => {
      const tempId = Math.random().toString(36).substring(7);
      dispatch({
        type: "ADD_THREAD",
        payload: {
          id: tempId,
          title: params.title,
          messages: [
            { id: 1, data: { role: "user", content: params.message } },
          ],
          loading: true,
          error: null,
        },
      });

      try {
        const response = await authFetch("http://localhost:8080/api/thread", {
          method: "POST",
          body: JSON.stringify(params),
          headers: { "Content-Type": "application/json" },
        });
        const thread = await response.json();
        dispatch({
          type: "SET_THREAD_ID",
          payload: { id: tempId, newId: thread.id },
        });
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: { id: tempId, error: "Failed to create thread" },
        });
      }
    },
    [authFetch],
  );

  // Delete a thread by ID
  const deleteThread = useCallback(
    async (id: string) => {
      dispatch({ type: "SET_LOADING", payload: { id, loading: true } });

      try {
        await authFetch(`http://localhost:8080/api/thread/${id}`, {
          method: "DELETE",
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
    async (id: string, message: string) => {
      dispatch({ type: "SET_LOADING", payload: { id, loading: true } });

      try {
        const response = await authFetch(
          `http://localhost:8080/api/thread/${id}/messages`,
          {
            method: "POST",
            body: JSON.stringify({ text: message }),
            headers: { "Content-Type": "application/json" },
          },
        );
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
        listThreads,
        getThreadById,
        createThread,
        deleteThread,
        postMessage,
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

export { ThreadProvider, useThreadContext };
