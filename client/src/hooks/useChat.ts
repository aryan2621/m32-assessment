import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatAPI } from "@/api/chat";
import { chatStore } from "@/store/chatStore";
import { toast } from "sonner";

export function useChat() {
  const queryClient = useQueryClient();
  const {
    sessions,
    activeSessionId,
    messages,
    isTyping,
    setActiveSession,
    setMessages,
    addMessage,
    setTyping,
    createSession,
    removeSession: removeSessionFromStore,
    updateSession,
  } = chatStore();

  const { data: fetchedSessions, refetch: refetchSessions } = useQuery({
    queryKey: ["chatSessions"],
    queryFn: chatAPI.getSessions,
  });

  const { data: fetchedMessages } = useQuery({
    queryKey: ["chatMessages", activeSessionId],
    queryFn: () =>
      activeSessionId ? chatAPI.getSessionMessages(activeSessionId) : [],
    enabled: !!activeSessionId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ message, sessionId, file }: { message: string; sessionId?: string; file?: File }) =>
      chatAPI.sendMessage({ message, sessionId, file }),
    onMutate: async (variables) => {
      setTyping(true);
      // Optimistically add user message
      const userMessage = {
        id: `temp-${Date.now()}`,
        role: "user" as const,
        content: variables.message,
        sessionId: activeSessionId || "",
        createdAt: new Date().toISOString(),
      };
      addMessage(userMessage);
      return { tempMessageId: userMessage.id };
    },
    onSuccess: async (data, _variables, context) => {
      setTyping(false);

      // If new session was created, update the store
      if (data.session.id !== activeSessionId) {
        createSession(data.session);
        setActiveSession(data.session.id);
        // For new sessions, clear old messages and add the new ones
        setMessages([data.userMessage, data.message]);
      } else {
        // For existing sessions, remove temp message and add real messages
        const filteredMessages = messages.filter(m => m.id !== context?.tempMessageId);
        setMessages([...filteredMessages, data.userMessage, data.message]);

        updateSession(data.session.id, {
          lastMessageAt: data.session.lastMessageAt,
        });
      }

      // Refetch in background to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["chatMessages", data.session.id] });
      refetchSessions();
    },
    onError: (error: any, _variables, context) => {
      setTyping(false);
      // Remove the temporary optimistic message on error
      if (context?.tempMessageId) {
        setMessages(messages.filter(m => m.id !== context.tempMessageId));
      }
      toast.error(
        error.response?.data?.message ||
          "Failed to send message. Please try again."
      );
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => chatAPI.deleteSession(sessionId),
    onSuccess: (_, sessionId) => {
      removeSessionFromStore(sessionId);
      if (activeSessionId === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
      refetchSessions();
      toast.success("Chat deleted");
    },
    onError: () => {
      toast.error("Failed to delete chat");
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: (title?: string) => chatAPI.createSession(title),
    onSuccess: (session) => {
      createSession(session);
      setActiveSession(session.id);
      setMessages([]);
      refetchSessions();
    },
    onError: () => {
      toast.error("Failed to create new chat");
    },
  });

  useEffect(() => {
    if (fetchedSessions) {
      chatStore.setState({ sessions: fetchedSessions });
    }
  }, [fetchedSessions]);

  // Clear messages when switching sessions
  useEffect(() => {
    if (activeSessionId === null) {
      setMessages([]);
    }
  }, [activeSessionId, setMessages]);

  useEffect(() => {
    if (fetchedMessages && activeSessionId) {
      // Only update if we're not currently sending a message
      // This prevents overwriting optimistic updates
      if (!sendMessageMutation.isPending && !isTyping) {
        setMessages(fetchedMessages);
      }
    }
  }, [fetchedMessages, activeSessionId, setMessages, sendMessageMutation.isPending, isTyping]);

  return {
    sessions: fetchedSessions || sessions || [],
    activeSessionId,
    messages: messages || [],
    isTyping,
    setActiveSession,
    sendMessage: sendMessageMutation.mutate,
    deleteSession: deleteSessionMutation.mutate,
    createNewSession: createSessionMutation.mutate,
    isLoading: sendMessageMutation.isPending,
    isDeleting: deleteSessionMutation.isPending,
  };
}
