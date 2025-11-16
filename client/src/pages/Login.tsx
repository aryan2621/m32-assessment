import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LoginForm } from "@/components/auth/LoginForm"
import { authStore } from "@/store/authStore"

export function Login() {
  const navigate = useNavigate()
  const isAuthenticated = authStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <LoginForm />
    </div>
  )
}

