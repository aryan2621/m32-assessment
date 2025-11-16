export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_BACKEND_SERVER_URL) {
    return `${import.meta.env.VITE_BACKEND_SERVER_URL}/api`;
  }

  if (import.meta.env.PROD) {
    return "https://m32-assessment-production.up.railway.app/api";
  }

  return "/api";
};
