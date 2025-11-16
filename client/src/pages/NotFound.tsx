import { useNavigate } from "react-router-dom"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardContent className="pt-12 pb-12 px-8">
          <div className="text-center space-y-6">
            {/* Animated 404 Icon */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-full p-8 mb-6">
                <FileQuestion className="h-24 w-24 text-primary mx-auto" strokeWidth={1.5} />
              </div>
            </div>

            {/* 404 Text */}
            <div className="space-y-2">
              <h1 className="text-8xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                404
              </h1>
              <h2 className="text-3xl font-semibold text-foreground">
                Page Not Found
              </h2>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Oops! The page you're looking for seems to have wandered off.
              It might have been moved, deleted, or never existed at all.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button
                onClick={() => navigate("/")}
                size="lg"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </div>

            {/* Helpful Links */}
            <div className="pt-8 border-t mt-8">
              <p className="text-sm text-muted-foreground mb-4">
                Looking for something specific?
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/chat")}
                >
                  Chat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/invoices")}
                >
                  Invoices
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/analytics")}
                >
                  Analytics
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
