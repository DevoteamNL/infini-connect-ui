import { constructNewThread } from './ThreadContext';
import { NO_NUMBER_YET, NO_TEXT_YET } from './ThreadContext.constants';
import {
  Action,
  Role,
  StreamMetadataTagName,
  Thread
} from './ThreadContext.types';


// returns only time if the creation date was today, otherwise it includes the date
const getFormattedDate = (createdAt = NO_TEXT_YET) => {
  if (createdAt !== NO_TEXT_YET) {
    const ONE_DAY_IN_MILLISECONDS = 86400000;
    const auxCreationDate = new Date(createdAt);
    const creationDate = auxCreationDate.getTime();
    const now = new Date();
    let wasNotCreatedToday = false;
    if ((now.getTime() - creationDate) > ONE_DAY_IN_MILLISECONDS
      || auxCreationDate.getDay() !== now.getDay()) {
      wasNotCreatedToday = true;
    }
    return (wasNotCreatedToday)
      ? `${auxCreationDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })}, ${auxCreationDate.toLocaleTimeString()}`
      : auxCreationDate.toLocaleTimeString();
  }
  return NO_TEXT_YET;
};


// Define the reducer function
export const threadReducer = (state: Thread[], action: Action): Thread[] => {
  switch (action.type) {
    case "SET_THREADS":
      return [
        ...state.filter((thread) => thread.newThread),
        ...action.payload.map(thread => ({
          ...thread,
          messages: thread.messages.map(msg => ({
            ...msg,
            createdAt: getFormattedDate(msg.createdAt)
          }))
        })
        )];
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
                messages[i].createdAt = getFormattedDate(action.payload[StreamMetadataTagName.USER_MESSAGE_CREATED_AT]);
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

          const createdAt = getFormattedDate(action.payload[StreamMetadataTagName.AI_MESSAGE_CREATED_AT]);
          const aiResponseMessage = (isMessageAlreadyPresent)
            ? thread.messages[thread.messages.length - 1]
            : {
              id: action.payload[StreamMetadataTagName.AI_MESSAGE_ID] || NO_NUMBER_YET,
              data: {
                role: action.payload[StreamMetadataTagName.ROLE] || Role.NOT_ATTRIBUTED,
                content: action.payload.messageContent || NO_TEXT_YET,
              },
              createdAt
            };

          if (isMessageAlreadyPresent) {
            if (action.payload[StreamMetadataTagName.AI_MESSAGE_ID]) {
              aiResponseMessage.id = action.payload[StreamMetadataTagName.AI_MESSAGE_ID];
            }
            if (action.payload[StreamMetadataTagName.AI_MESSAGE_CREATED_AT]) {
              aiResponseMessage.createdAt = createdAt;
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