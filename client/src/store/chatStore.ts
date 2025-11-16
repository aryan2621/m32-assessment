import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ChatMessage, ChatSession } from "@/api/chat"

interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  messages: ChatMessage[]
  isTyping: boolean
  createSession: (session: ChatSession) => void
  setActiveSession: (id: string | null) => void
  addMessage: (message: ChatMessage) => void
  setMessages: (messages: ChatMessage[]) => void
  clearMessages: () => void
  setTyping: (isTyping: boolean) => void
  addSession: (session: ChatSession) => void
  removeSession: (sessionId: string) => void
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void
}

export const chatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,
      messages: [],
      isTyping: false,
      createSession: (session) => {
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: session.id,
          messages: [],
        }))
      },
      setActiveSession: (id) => {
        set({ activeSessionId: id })
      },
      addMessage: (message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }))
      },
      setMessages: (messages) => {
        set({ messages })
      },
      clearMessages: () => {
        set({ messages: [] })
      },
      setTyping: (isTyping) => {
        set({ isTyping })
      },
      addSession: (session) => {
        set((state) => ({
          sessions: [session, ...state.sessions],
        }))
      },
      removeSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
        }))
      },
      updateSession: (sessionId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)),
        }))
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
    }
  )
)

