import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { authStore } from "@/store/authStore";

export function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleCallback = () => {
      const token = searchParams.get("token");
      const userEncoded = searchParams.get("user");

      if (!token || !userEncoded) {
        toast.error("Authentication failed. No token received.");
        navigate("/login");
        return;
      }

      try {
        // Store the token in cookies
        Cookies.set("token", token, {
          expires: 7, // 7 days
          secure: window.location.protocol === "https:",
          sameSite: "lax",
        });

        // Decode user data from base64
        const user = JSON.parse(atob(userEncoded));

        // Update auth store
        authStore.getState().login(user);

        // Update localStorage (same format as email/password login)
        localStorage.setItem(
          "auth-storage",
          JSON.stringify({
            state: {
              user: user,
              isAuthenticated: true,
            },
            version: 0,
          })
        );

        toast.success("Successfully signed in with Google!");
        navigate("/dashboard");
      } catch (error) {
        console.error("Google OAuth callback error:", error);
        toast.error("Authentication failed. Please try again.");
        Cookies.remove("token");
        navigate("/login");
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
