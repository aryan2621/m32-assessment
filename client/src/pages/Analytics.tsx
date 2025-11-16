import { Layout } from "@/components/layout/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileDown } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/utils/formatters"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAnalytics, useCategoryAnalytics } from "@/hooks/useAnalytics"
import { expenseAPI } from "@/api/expense"
import { toast } from "sonner"
import { CustomTooltip } from "@/components/common/CustomTooltip"

const getChartColors = () => {
  return [
    "var(--chart-blue)",
    "var(--chart-indigo)",
    "var(--chart-purple)",
    "var(--chart-green)",
    "var(--chart-yellow)",
    "var(--chart-orange)",
    "var(--chart-pink)",
    "var(--chart-teal)",
    "var(--chart-cyan)",
  ]
}

export function Analytics() {
  const { analytics, isLoading } = useAnalytics()
  const { categoryData: categoryDataRaw, isLoading: categoryLoading } = useCategoryAnalytics()
  const chartColors = getChartColors()

  // Transform category data for pie chart
  const categoryData = categoryDataRaw ? Object.entries(categoryDataRaw).map(([name, data]) => ({
    name,
    value: data.total,
  })) : []

  // Transform monthly trends data for line chart
  const monthlyTrendData = analytics?.monthlyTrends?.map((trend) => ({
    month: new Date(trend.month + "-01").toLocaleString('default', { month: 'short' }),
    expenses: trend.amount,
  })) || []

  // Get top vendors data for bar chart
  const vendorData = analytics?.topVendors || []

  // Transform category data for breakdown table
  const totalAmount = categoryData.reduce((sum, cat) => sum + cat.value, 0)
  const expenseBreakdown = categoryDataRaw ? Object.entries(categoryDataRaw).map(([category, data]) => ({
    category,
    amount: data.total,
    count: data.count,
    percentage: totalAmount > 0 ? Math.round((data.total / totalAmount) * 100) : 0,
  })) : []

  const handleExportPDF = () => {
    toast.info("PDF export coming soon!")
  }

  const handleExportCSV = async () => {
    try {
      const blob = await expenseAPI.exportCSV()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("CSV exported successfully!")
    } catch (error) {
      toast.error("Failed to export CSV")
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">Insights into your expenses and invoices</p>
          </div>
          <div className="flex gap-3">
            <Select defaultValue="last-6-months">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <FileDown className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Expense by Category</CardTitle>
              <CardDescription>Distribution of expenses across categories</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <LoadingSpinner text="Loading category data..." />
                </div>
              ) : categoryData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No category data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="var(--primary-blue)"
                      dataKey="value"
                    >
                      {categoryData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
              <CardDescription>Expense trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <LoadingSpinner text="Loading trend data..." />
                </div>
              ) : monthlyTrendData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      className="text-xs"
                    />
                    <YAxis
                      tickFormatter={(value) => `$${value / 1000}k`}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      className="text-xs"
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
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Vendors</CardTitle>
            <CardDescription>Vendors with highest expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <LoadingSpinner text="Loading vendor data..." />
              </div>
            ) : vendorData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No vendor data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vendorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis
                    dataKey="vendor"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(value) => `$${value / 1000}k`}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    className="text-xs"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="amount" fill="var(--primary-blue)" name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Detailed breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <LoadingSpinner text="Loading breakdown..." />
              </div>
            ) : expenseBreakdown.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No expense data available
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseBreakdown.map((item) => (
                  <TableRow key={item.category}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell>{formatCurrency(item.amount)}</TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

