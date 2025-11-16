import axios from "axios";
import { authStore } from "@/store/authStore";
import { getApiBaseUrl } from "@/utils/apiConfig";

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with every request
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      const isNetworkError =
        error.code === "ERR_NETWORK" || error.message.includes("Network Error");
      if (isNetworkError) {
        console.error(
          "Network error - Backend may be unreachable:",
          error.message
        );
        error.message =
          "Unable to connect to server. Please check your connection or try again later.";
      } else {
        console.error("Network error:", error.message);
        error.message = "Network error. Please check your internet connection.";
      }
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      const currentPath = window.location.pathname;
      const isPublicPage =
        currentPath === "/login" ||
        currentPath === "/signup" ||
        currentPath === "/";

      if (!isPublicPage) {
        const authState = authStore.getState();
        if (authState.isAuthenticated) {
          authStore.getState().logout();
          localStorage.removeItem("auth-storage");
        }
        window.location.href = "/login";
      }
    }

    // Handle 403 Forbidden
    if (error.response.status === 403) {
      error.message =
        error.response.data?.message ||
        "You don't have permission to perform this action.";
    }

    // Handle 404 Not Found
    if (error.response.status === 404) {
      error.message =
        error.response.data?.message || "The requested resource was not found.";
    }

    // Handle 500 Server Error
    if (error.response.status >= 500) {
      error.message =
        error.response.data?.message || "Server error. Please try again later.";
    }

    // For all other errors, use the message from the server if available
    if (error.response.data?.message) {
      error.message = error.response.data.message;
    }

    return Promise.reject(error);
  }
);
