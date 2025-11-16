import { Layout } from "@/components/layout/Layout"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { ExpenseChart } from "@/components/dashboard/ExpenseChart"
import { RecentInvoices } from "@/components/dashboard/RecentInvoices"
import { VendorAnalytics } from "@/components/dashboard/VendorAnalytics"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare } from "lucide-react"
import { Link } from "react-router-dom"
import { useDashboardStats, useInvoices } from "@/hooks/useInvoices"
import { useAnalytics } from "@/hooks/useAnalytics"

export function Dashboard() {
  const { stats, isLoading: statsLoading } = useDashboardStats()
  const { invoices, isLoading: invoicesLoading } = useInvoices({}, 1, 5)
  const { analytics, isLoading: analyticsLoading } = useAnalytics()

  // Transform monthly trends data for the chart
  const expenseData = analytics?.monthlyTrends?.map((trend) => ({
    month: new Date(trend.month + "-01").toLocaleString('default', { month: 'short' }),
    expenses: trend.amount,
  })) || []

  // Get top vendors data
  const vendorData = analytics?.topVendors?.map((vendor) => ({
    vendor: vendor.vendor,
    amount: vendor.amount,
  })) || []

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/invoices">
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Upload Invoice
              </Button>
            </Link>
            <Link to="/chat">
              <Button size="lg" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Ask AI
              </Button>
            </Link>
          </div>
        </div>

        <DashboardStats stats={stats} isLoading={statsLoading} />

        <div className="grid gap-6 lg:grid-cols-2">
          <ExpenseChart data={expenseData} isLoading={analyticsLoading} />
          <VendorAnalytics data={vendorData} isLoading={analyticsLoading} />
        </div>

        <RecentInvoices invoices={invoices} isLoading={invoicesLoading} />
      </div>
    </Layout>
  )
}

