import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, Clock, Building2, TrendingUp, TrendingDown } from "lucide-react"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { formatCurrency } from "@/utils/formatters"
import { cn } from "@/lib/utils"

interface Stat {
  label: string
  value: number | string
  change?: number
  icon: React.ElementType
  type?: 'currency' | 'count' | 'text'
}

interface DashboardStatsProps {
  stats?: {
    totalExpenses?: number
    totalInvoices?: number
    pendingInvoices?: number
    topVendor?: string
    expensesChange?: number
    invoicesChange?: number
  }
  isLoading?: boolean
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  const statCards: Stat[] = [
    {
      label: "Total Expenses (This Month)",
      value: stats?.totalExpenses ?? 0,
      change: stats?.expensesChange,
      icon: DollarSign,
      type: 'currency',
    },
    {
      label: "Total Invoices",
      value: stats?.totalInvoices ?? 0,
      change: stats?.invoicesChange,
      icon: FileText,
      type: 'count',
    },
    {
      label: "Pending Invoices",
      value: stats?.pendingInvoices ?? 0,
      icon: Clock,
      type: 'count',
    },
    {
      label: "Top Vendor",
      value: stats?.topVendor ?? "N/A",
      icon: Building2,
      type: 'text',
    },
  ]

  const formatValue = (value: number | string, type: 'currency' | 'count' | 'text' = 'currency'): string => {
    if (typeof value === "number") {
      if (type === 'count') {
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`
        }
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`
        }
        return value.toLocaleString()
      }

      if (type === 'currency') {
        if (value >= 1000000) {
          return `$${(value / 1000000).toFixed(1)}M`
        }
        if (value >= 1000) {
          return `$${(value / 1000).toFixed(1)}K`
        }
        return formatCurrency(value)
      }
    }
    return value.toString()
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <LoadingSpinner size="sm" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        const isPositive = stat.change !== undefined && stat.change > 0
        const isNegative = stat.change !== undefined && stat.change < 0

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatValue(stat.value, stat.type)}</div>
              {stat.change !== undefined && (
                <div className="flex items-center gap-1 text-xs mt-2">
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : isNegative ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : null}
                  <span
                    className={cn(
                      isPositive && "text-green-600",
                      isNegative && "text-red-600",
                      !isPositive && !isNegative && "text-muted-foreground"
                    )}
                  >
                    {stat.change > 0 ? "+" : ""}
                    {stat.change.toFixed(1)}% from last month
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

