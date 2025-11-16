import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { SignupForm } from "@/components/auth/SignupForm"
import { authStore } from "@/store/authStore"

export function Signup() {
  const navigate = useNavigate()
  const hasNavigated = useRef(false)
  const navigateRef = useRef(navigate)

  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => {
    const checkAndNavigate = () => {
      if (hasNavigated.current) return
      const isAuthenticated = authStore.getState().isAuthenticated
      if (isAuthenticated) {
        hasNavigated.current = true
        navigateRef.current("/dashboard", { replace: true })
      }
    }

    const timeoutId = setTimeout(checkAndNavigate, 150)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  const isAuthenticated = authStore((state) => state.isAuthenticated)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-12">
      <SignupForm />
    </div>
  )
}

