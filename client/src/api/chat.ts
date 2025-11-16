import { apiClient } from "./axios";

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId?: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  title: string;
  lastMessageAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  preview?: string;
}

export interface SendMessageRequest {
  message: string;
  sessionId?: string;
  file?: File;
}

export interface SSEEvent {
  type: string;
  message: string;
  progress?: number;
  data?: any;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  message: ChatMessage;
  session: ChatSession;
}

export const chatAPI = {
  getSessions: async (): Promise<ChatSession[]> => {
    const { data } = await apiClient.get<{
      success: boolean;
      message: string;
      data: ChatSession[];
    }>("/chat/sessions");
    if (!data.success) {
      throw new Error(data.message || "Failed to get chat sessions");
    }
    return data.data || [];
  },

  getSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const { data } = await apiClient.get<{
      success: boolean;
      message: string;
      data: ChatMessage[];
    }>(`/chat/sessions/${sessionId}/messages`);
    if (!data.success) {
      throw new Error(data.message || "Failed to get messages");
    }
    // Return empty array if data is null/undefined (safe default)
    return data.data || [];
  },

  sendMessage: async (
    request: SendMessageRequest
  ): Promise<SendMessageResponse> => {
    if (request.file) {
      return chatAPI.uploadPdfToChat(request.file, request.sessionId);
    }

    const { data } = await apiClient.post<{
      success: boolean;
      message: string;
      data: SendMessageResponse;
    }>("/chat/message", {
      message: request.message,
      sessionId: request.sessionId,
    });
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to send message");
    }
    return data.data;
  },

  uploadPdfToChat: async (
    file: File,
    sessionId?: string
  ): Promise<SendMessageResponse> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      if (sessionId) {
        formData.append("sessionId", sessionId);
      }

      fetch(`${apiClient.defaults.baseURL}/chat/upload-pdf`, {
        method: "POST",
        body: formData,
        credentials: "include",
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
          }

          if (!response.body) {
            throw new Error("No response body");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const eventData = JSON.parse(line.substring(6)) as SSEEvent;

                  if (eventData.type === "complete" && eventData.data) {
                    resolve({
                      userMessage: eventData.data.userMessage,
                      message: eventData.data.assistantMessage,
                      session: eventData.data.session,
                    });
                    return;
                  } else if (eventData.type === "error") {
                    reject(new Error(eventData.message));
                    return;
                  }
                } catch (e) {
                  console.error("Failed to parse SSE event:", e);
                }
              }
            }
          }

          reject(new Error("Upload completed but no success event received"));
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    const { data } = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/chat/sessions/${sessionId}`);
    if (!data.success) {
      throw new Error(data.message || "Failed to delete session");
    }
  },

  createSession: async (title?: string): Promise<ChatSession> => {
    const { data } = await apiClient.post<{
      success: boolean;
      message: string;
      data: ChatSession;
    }>("/chat/sessions", { title });
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to create session");
    }
    return data.data;
  },
};
