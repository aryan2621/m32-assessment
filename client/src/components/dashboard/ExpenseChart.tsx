import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { CustomTooltip } from "@/components/common/CustomTooltip"

interface ExpenseChartProps {
  data: Array<{ month: string; expenses: number }>
  isLoading?: boolean
}

export function ExpenseChart({ data, isLoading }: ExpenseChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Trend</CardTitle>
          <CardDescription>Last 6 months of expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Check if data is empty or has no meaningful values
  const hasData = data && data.length > 0 && data.some(item => item.expenses > 0)

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Trend</CardTitle>
          <CardDescription>Last 6 months of expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Expense data not available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Trend</CardTitle>
        <CardDescription>Last 6 months of expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickFormatter={(value) => `$${value / 1000}k`}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="var(--primary-blue)"
              strokeWidth={2}
              name="Expenses"
              dot={{ fill: "var(--primary-blue)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

