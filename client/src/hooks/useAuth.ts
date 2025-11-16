import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authAPI } from "@/api/auth";
import type { LoginCredentials, SignupData } from "@/api/auth";
import { authStore } from "@/store/authStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    user,
    isAuthenticated,
    login: setAuth,
    logout: clearAuth,
  } = authStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authAPI.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user);
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: data.user,
            isAuthenticated: true,
          },
          version: 0,
        })
      );
      toast.success("Welcome back!");
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Login failed. Please try again."
      );
    },
  });

  const signupMutation = useMutation({
    mutationFn: (signupData: SignupData) => authAPI.signup(signupData),
    onSuccess: (data) => {
      setAuth(data.user);
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: data.user,
            isAuthenticated: true,
          },
          version: 0,
        })
      );
      toast.success("Account created successfully!");
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Signup failed. Please try again."
      );
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate("/login");
      toast.success("Logged out successfully");
    },
    onError: () => {
      clearAuth();
      queryClient.clear();
      navigate("/login");
    },
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout: logoutMutation.mutate,
    isLoading: loginMutation.isPending || signupMutation.isPending,
  };
}
