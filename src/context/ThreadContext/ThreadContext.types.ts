export interface ThreadContextProps {
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

export interface Message {
  id: number;
  data: {
    role: Role;
    content: string;
  };
  createdAt?: string;
}

// Define the thread object
export interface Thread {
  id: number;
  title?: string;
  newThread: boolean;
  messages: Array<Message>;
  loading: boolean;
  error: string | null;
  replying: boolean;
  plugin?: string;
}

export interface UserRequestPayload {
  id: number;
  [StreamMetadataTagName.THREAD_ID]: number;
  title: string;
  [StreamMetadataTagName.USER_MESSAGE_ID]?: number;
  [StreamMetadataTagName.USER_MESSAGE_CREATED_AT]?: string;
}

export interface AiResponsePayload {
  id: number;
  [StreamMetadataTagName.THREAD_ID]: number;
  [StreamMetadataTagName.USER_MESSAGE_CREATED_AT]?: string;
  [StreamMetadataTagName.USER_MESSAGE_ID]?: number;
  [StreamMetadataTagName.ROLE]?: Role;
  messageContent: string;
  [StreamMetadataTagName.AI_MESSAGE_ID]?: number;
  [StreamMetadataTagName.AI_MESSAGE_CREATED_AT]?: string;
}

// Define the action types
export type Action =
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

export enum StreamMetadataTagName {
  USER_MESSAGE_ID = 'userMessageId',
  USER_MESSAGE_CREATED_AT = 'userMessageCreatedAt',
  THREAD_ID = 'threadId',
  ROLE = 'role',
  AI_MESSAGE_ID = 'aiMessageId',
  AI_MESSAGE_CREATED_AT = 'aiMessageCreatedAt',
}

export interface StreamExtractedData {
  [StreamMetadataTagName.THREAD_ID]?: number;
  [StreamMetadataTagName.USER_MESSAGE_ID]?: number;
  [StreamMetadataTagName.USER_MESSAGE_CREATED_AT]?: string;
  [StreamMetadataTagName.ROLE]?: Role;
  [StreamMetadataTagName.AI_MESSAGE_ID]?: number;
  messageContent?: string;
  [StreamMetadataTagName.AI_MESSAGE_CREATED_AT]?: string;
}