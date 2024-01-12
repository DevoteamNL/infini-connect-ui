import { enableMapSet } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { AuthFetch } from "./context/AuthContext";

interface Message {
  id: number;
  data: {
    role: "user" | "assistant";
    content: string;
  };
}

export interface Thread {
  id: number;
  title?: string;
  newThread?: boolean;
  messages: Array<Message>;
  loading: boolean;
  error: string | null;
  replying?: boolean;
  plugin?: string;
}

const constructNewThread = (): Thread => {
  return {
    id: Math.random(),
    messages: [],
    loading: false,
    error: null,
    newThread: true,
  };
};

type ThreadStore = {
  threads: Map<number, Thread>;
  loading: boolean;
  error: string;
  selectedThreadId?: number;

  setError: (threadId: number, error: string) => void;
  listThreads: (authFetch: AuthFetch) => Promise<void>;
  createThread: () => void;
  addThread: (
    authFetch: AuthFetch,
    threadId: number,
    message: string,
    plugin: string,
  ) => void;
  addMessage: (threadId: number, message: Message) => void;
  postMessage: (
    authFetch: AuthFetch,
    threadId: number,
    message: string,
    plugin: string,
  ) => Promise<void>;
  setSelectedThread: (id: number) => void;
  deleteThread: (authFetch: AuthFetch, threadId: number) => void;
  renameThread: (
    authFetch: AuthFetch,
    threadId: number,
    title: string,
  ) => Promise<void>;
};

enableMapSet();

const useThreadStore = create<ThreadStore>()(
  immer((set, get) => ({
    threads: new Map(),
    loading: false,
    error: "",
    setSelectedThread: (id) =>
      set((state) => {
        state.selectedThreadId = id;
      }),
    setError: (threadId, error) =>
      set((state) => {
        const thread = state.threads.get(threadId);
        if (!thread) return;
        thread.loading = false;
        thread.error = error;
        thread.replying = false;
      }),
    listThreads: async (authFetch) => {
      set((state) => {
        state.loading = true;
        state.error = "";
      });

      try {
        const response = await authFetch({
          pathname: "/api/thread/",
          options: {
            method: "GET",
          },
        });
        if (!response) {
          return;
        }
        const threads = await response.json();
        set((state) => {
          state.loading = false;
          state.error = "";
          state.threads = new Map(
            threads.map((thread: Thread) => [
              thread.id,
              {
                ...thread,
                loading: false,
                error: null,
                replying: false,
              },
            ]),
          );
        });
      } catch (error) {
        set((state) => {
          state.loading = false;
          state.error = "Failed to load threads";
        });
      }
    },
    createThread: () =>
      set((state) => {
        const newThread = constructNewThread();
        state.threads.set(newThread.id, newThread);
        state.selectedThreadId = newThread.id;
      }),
    addMessage: (threadId: number, message: Message) =>
      set((state) => {
        const thread = state.threads.get(threadId);
        if (!thread) return;
        thread.messages.push(message);

        thread.loading = message.data.role === "user";
        thread.error = null;
        thread.replying = message.data.role === "user";
        thread.title = thread.newThread
          ? message.data.content.substring(0, 20)
          : thread.title;
      }),
    addThread: async (authFetch, threadId, message, plugin) => {
      try {
        const response = await authFetch({
          pathname: "/api/thread",
          options: {
            method: "POST",
            body: JSON.stringify({
              title: get().threads.get(threadId)?.title,
              message,
              plugin,
            }),
            headers: { "Content-Type": "application/json" },
          },
        });
        if (!response) {
          return;
        }
        const newThread = await response.json();
        set((state) => {
          state.threads.set(newThread.id, {
            ...newThread,
            messages: newThread.messages.map((message: Message["data"]) => ({
              id: Math.random(),
              data: message,
            })),
            loading: false,
            error: null,
            replying: false,
          });
          state.threads.delete(threadId);
          if (state.selectedThreadId === threadId) {
            state.selectedThreadId = newThread.id;
          }
        });
      } catch (error) {
        get().setError(threadId, "Failed to create thread");
      }
    },
    postMessage: async (authFetch, threadId, message, plugin) => {
      get().addMessage(threadId, {
        id: Math.random(),
        data: { role: "user", content: message },
      });

      if (get().threads.get(threadId)?.newThread) {
        get().addThread(authFetch, threadId, message, plugin);
        return;
      }

      try {
        const response = await authFetch({
          pathname: `/api/thread/${threadId}/messages`,
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
        get().addMessage(threadId, {
          id: Math.random(),
          data: reply,
        });
      } catch (error) {
        get().setError(threadId, "Failed to post message");
      }
    },
    deleteThread: async (authFetch, threadId) => {
      set((state) => {
        const thread = state.threads.get(threadId);
        if (!thread) return;
        thread.loading = true;
        thread.error = "";
      });
      try {
        if (!get().threads.get(threadId)?.newThread) {
          await authFetch({
            pathname: `/api/thread/${threadId}`,
            options: {
              method: "DELETE",
            },
          });
        }
        set((state) => {
          if (state.selectedThreadId === threadId) {
            state.selectedThreadId = undefined;
          }
          state.threads.delete(threadId);
        });
      } catch (error) {
        get().setError(threadId, "Failed to delete thread");
      }
    },
    renameThread: async (authFetch, threadId, title) => {
      set((state) => {
        const thread = state.threads.get(threadId);
        if (!thread) return;
        thread.loading = true;
        thread.error = "";
        thread.title = title;
      });
      try {
        await authFetch({
          pathname: `/api/thread/${threadId}`,
          options: {
            method: "PATCH",
            body: JSON.stringify({ title }),
            headers: { "Content-Type": "application/json" },
          },
        });

        set((state) => {
          const thread = state.threads.get(threadId);
          if (!thread) return;
          thread.loading = false;
          thread.error = "";
        });
      } catch (error) {
        get().setError(threadId, "Failed to rename thread");
      }
    },
  })),
);

export const useThreadSelectors = () => {
  return {
    threads: () => useThreadStore((state) => state.threads),
    loading: () => useThreadStore((state) => state.loading),
    error: () => useThreadStore((state) => state.error),
    selectedThreadId: () => useThreadStore((state) => state.selectedThreadId),
    listThreads: () => useThreadStore((state) => state.listThreads),
    createThread: () => useThreadStore((state) => state.createThread),
    postMessage: () => useThreadStore((state) => state.postMessage),
    setSelectedThread: () => useThreadStore((state) => state.setSelectedThread),
    deleteThread: () => useThreadStore((state) => state.deleteThread),
    renameThread: () => useThreadStore((state) => state.renameThread),
  };
};

export default useThreadStore;
