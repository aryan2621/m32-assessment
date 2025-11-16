import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FileText, Zap, Shield, BarChart3, ArrowRight } from "lucide-react"
import { authStore } from "@/store/authStore"

const features = [
  {
    icon: FileText,
    title: "Automated Processing",
    description: "Upload invoices and let AI extract all the important details automatically.",
  },
  {
    icon: Zap,
    title: "Instant Insights",
    description: "Get real-time answers about your expenses and invoices through natural conversation.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your financial data is encrypted and stored securely. We never share your information.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Visualize your spending patterns and make informed business decisions.",
  },
]

export function Landing() {
  const { isAuthenticated } = authStore()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Invoice Copilot</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">Sign in</Button>
                  </Link>
                  <Link to="/signup">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Automate your invoice processing with AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Save hours every week by letting AI handle your invoice management. Upload, analyze, and get insights
            instantly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              <Button size="lg" className="h-12 px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-12 px-8">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="p-6 rounded-lg border bg-card">
                  <Icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

