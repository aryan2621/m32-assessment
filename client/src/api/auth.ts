import { apiClient } from "./axios"

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<{ success: boolean; message: string; data: AuthResponse }>("/auth/login", credentials)
    if (!data.success || !data.data) {
      throw new Error(data.message || "Login failed")
    }
    return data.data
  },

  signup: async (signupData: SignupData): Promise<AuthResponse> => {
    const { data } = await apiClient.post<{ success: boolean; message: string; data: AuthResponse }>("/auth/signup", signupData)
    if (!data.success || !data.data) {
      throw new Error(data.message || "Signup failed")
    }
    return data.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout")
  },
}

