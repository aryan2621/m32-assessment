import { apiClient } from "./axios";

export interface GoogleDriveSettings {
  isConnected: boolean;
  folderName?: string;
  connectedAt?: string;
}

export interface SettingsResponse {
  googleDrive: GoogleDriveSettings;
}

export interface SSEEvent {
  type: string;
  message: string;
  progress?: number;
  data?: any;
}

export type SSEProgressCallback = (event: SSEEvent) => void;

export const settingsApi = {
  getSettings: async (): Promise<SettingsResponse> => {
    const response = await apiClient.get<{
      success: boolean;
      data: SettingsResponse;
    }>("/settings");
    return response.data.data;
  },

  initiateGoogleDriveAuth: async (): Promise<string> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { authUrl: string };
    }>("/settings/google-drive/auth");
    return response.data.data.authUrl;
  },

  disconnectGoogleDrive: async (): Promise<void> => {
    await apiClient.post("/settings/google-drive/disconnect");
  },

  syncAllInvoices: async (onProgress: SSEProgressCallback): Promise<void> => {
    return new Promise((resolve, reject) => {
      fetch(`${apiClient.defaults.baseURL}/settings/google-drive/sync-all`, {
        method: "POST",
        credentials: "include",
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Sync failed with status ${response.status}`);
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
                  onProgress(eventData);

                  if (eventData.type === "success") {
                    resolve();
                    return;
                  } else if (eventData.type === "error") {
                    reject(new Error(eventData.message));
                    return;
                  } else if (eventData.type === "sync_complete") {
                    resolve();
                    return;
                  }
                } catch (e) {
                  console.error("Failed to parse SSE event:", e);
                }
              }
            }
          }

          reject(new Error("Sync completed but no success event received"));
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
};
