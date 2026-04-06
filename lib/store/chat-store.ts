import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chat, Message, ModelConfig, Folder } from '@/types';
import { DEFAULT_MODEL_CONFIG } from '@/config/constants';
import { generateId } from '@/lib/utils';
import { generateMessagesSummary, shouldUpdateSummary } from '@/lib/chat-summarizer';

interface ChatStore {
  chats: Chat[];
  currentChatId: string | null;
  folders: Folder[];
  
  createChat: (title?: string) => string;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, title: string) => void;
  autoRenameChat: (chatId: string, firstMessage: string) => void;
  starChat: (chatId: string) => void;
  setCurrentChat: (chatId: string) => void;
  getCurrentChat: () => Chat | null;
  importChats: (chats: Chat[]) => void;
  
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  regenerateMessage: (chatId: string, messageId: string) => void;
  updateChatSummary: (chatId: string) => void; // NEW: Update summary
  
  createFolder: (name: string, parentId?: string) => void;
  deleteFolder: (folderId: string) => void;
  moveToFolder: (chatId: string, folderId: string) => void;
  
  updateModelConfig: (chatId: string, config: Partial<ModelConfig>) => void;
  
  searchChats: (query: string) => Chat[];
  
  clearAll: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      currentChatId: null,
      folders: [],

      createChat: (title = 'New Chat') => {
        const newChat: Chat = {
          id: generateId(),
          title,
          messages: [],
          modelConfig: { ...DEFAULT_MODEL_CONFIG, id: generateId() },
          createdAt: new Date(),
          updatedAt: new Date(),
          isStarred: false,
          totalTokens: 0,
        };
        
        set((state: ChatStore) => ({
          chats: [newChat, ...state.chats],
          currentChatId: newChat.id,
        }));
        
        return newChat.id;
      },

      deleteChat: (chatId: string) => {
        set((state: ChatStore) => ({
          chats: state.chats.filter((chat: Chat) => chat.id !== chatId),
          currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
        }));
      },

      renameChat: (chatId: string, title: string) => {
        set((state: ChatStore) => ({
          chats: state.chats.map((chat: Chat) =>
            chat.id === chatId ? { ...chat, title, updatedAt: new Date() } : chat
          ),
        }));
      },

      autoRenameChat: (chatId: string, firstMessage: string) => {
        const title = firstMessage.length > 50 
          ? firstMessage.substring(0, 50) + '...'
          : firstMessage;
        
        set((state: ChatStore) => ({
          chats: state.chats.map((chat: Chat) =>
            chat.id === chatId ? { ...chat, title, updatedAt: new Date() } : chat
          ),
        }));
      },

      starChat: (chatId: string) => {
        set((state: ChatStore) => ({
          chats: state.chats.map((chat: Chat) =>
            chat.id === chatId ? { ...chat, isStarred: !chat.isStarred } : chat
          ),
        }));
      },

      setCurrentChat: (chatId: string) => {
        set({ currentChatId: chatId });
      },

      getCurrentChat: () => {
        const state = get();
        return state.chats.find((chat: Chat) => chat.id === state.currentChatId) || null;
      },

      importChats: (importedChats: Chat[]) => {
        set((state: ChatStore) => {
          const processedChats = importedChats.map((chat: any) => ({
            ...chat,
            id: chat.id || generateId(),
            createdAt: chat.createdAt instanceof Date ? chat.createdAt : new Date(chat.createdAt),
            updatedAt: chat.updatedAt instanceof Date ? chat.updatedAt : new Date(chat.updatedAt),
            messages: chat.messages.map((msg: any) => ({
              ...msg,
              id: msg.id || generateId(),
              timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
            })),
          }));

          const existingIds = new Set(state.chats.map((c: Chat) => c.id));
          const newChats = processedChats.filter((c: Chat) => !existingIds.has(c.id));

          return {
            chats: [...newChats, ...state.chats],
          };
        });
      },

      addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
        const newMessage: Message = {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        };

        set((state: ChatStore) => ({
          chats: state.chats.map((chat: Chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, newMessage],
                  updatedAt: new Date(),
                  totalTokens: chat.totalTokens + (message.tokens || 0),
                }
              : chat
          ),
        }));

        // Auto-update summary jika perlu
        const chat = get().chats.find((c: Chat) => c.id === chatId);
        if (chat && shouldUpdateSummary(chat.messages.length, chat.lastSummarizedIndex)) {
          get().updateChatSummary(chatId);
        }
      },

      updateChatSummary: (chatId: string) => {
        set((state: ChatStore) => {
          const chat = state.chats.find((c: Chat) => c.id === chatId);
          if (!chat) return state;

          const summary = generateMessagesSummary(chat.messages);
          
          return {
            chats: state.chats.map((c: Chat) =>
              c.id === chatId
                ? {
                    ...c,
                    summary,
                    lastSummarizedIndex: c.messages.length - 1,
                    updatedAt: new Date(),
                  }
                : c
            ),
          };
        });
      },

      updateMessage: (chatId: string, messageId: string, content: string) => {
        set((state: ChatStore) => ({
          chats: state.chats.map((chat: Chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg: Message) =>
                    msg.id === messageId ? { ...msg, content, isEdited: true } : msg
                  ),
                  updatedAt: new Date(),
                }
              : chat
          ),
        }));
      },

      deleteMessage: (chatId: string, messageId: string) => {
        set((state: ChatStore) => ({
          chats: state.chats.map((chat: Chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.filter((msg: Message) => msg.id !== messageId),
                  updatedAt: new Date(),
                }
              : chat
          ),
        }));
      },

      regenerateMessage: (chatId: string, messageId: string) => {
        console.log('Regenerating message:', chatId, messageId);
      },

      createFolder: (name: string, parentId?: string) => {
        const newFolder: Folder = {
          id: generateId(),
          name,
          parentId,
          chatIds: [],
          createdAt: new Date(),
        };
        
        set((state: ChatStore) => ({
          folders: [...state.folders, newFolder],
        }));
      },

      deleteFolder: (folderId: string) => {
        set((state: ChatStore) => ({
          folders: state.folders.filter((folder: Folder) => folder.id !== folderId),
          chats: state.chats.map((chat: Chat) =>
            chat.folderId === folderId ? { ...chat, folderId: undefined } : chat
          ),
        }));
      },

      moveToFolder: (chatId: string, folderId: string) => {
        set((state: ChatStore) => ({
          chats: state.chats.map((chat: Chat) =>
            chat.id === chatId ? { ...chat, folderId } : chat
          ),
          folders: state.folders.map((folder: Folder) =>
            folder.id === folderId
              ? { ...folder, chatIds: [...folder.chatIds, chatId] }
              : { ...folder, chatIds: folder.chatIds.filter((id: string) => id !== chatId) }
          ),
        }));
      },

      updateModelConfig: (chatId: string, config: Partial<ModelConfig>) => {
        set((state: ChatStore) => ({
          chats: state.chats.map((chat: Chat) =>
            chat.id === chatId
              ? { ...chat, modelConfig: { ...chat.modelConfig, ...config } }
              : chat
          ),
        }));
      },

      searchChats: (query: string) => {
        const state = get();
        const lowerQuery = query.toLowerCase();
        
        return state.chats.filter(
          (chat: Chat) =>
            chat.title.toLowerCase().includes(lowerQuery) ||
            chat.messages.some((msg: Message) => msg.content.toLowerCase().includes(lowerQuery))
        );
      },

      clearAll: () => {
        set({ chats: [], currentChatId: null, folders: [] });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        ...state,
        chats: state.chats.map((chat: Chat) => ({
          ...chat,
          createdAt: chat.createdAt instanceof Date ? chat.createdAt.toISOString() : chat.createdAt,
          updatedAt: chat.updatedAt instanceof Date ? chat.updatedAt.toISOString() : chat.updatedAt,
          messages: chat.messages.map((msg: Message) => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
          })),
        })),
      }),
      merge: (persistedState: any, currentState: any) => {
        if (!persistedState) return currentState;
        
        return {
          ...currentState,
          ...persistedState,
          chats: (persistedState.chats || []).map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            updatedAt: new Date(chat.updatedAt),
            messages: (chat.messages || []).map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          })),
        };
      },
    }
  )
);
