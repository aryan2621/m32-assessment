import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CustomTooltip } from "@/components/common/CustomTooltip";

interface VendorAnalyticsProps {
  data: Array<{ vendor: string; amount: number }>;
  isLoading?: boolean;
}

export function VendorAnalytics({ data, isLoading }: VendorAnalyticsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Vendors</CardTitle>
          <CardDescription>Vendors with highest expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if data is empty or has no meaningful values
  const hasData =
    data && data.length > 0 && data.some((item) => item.amount > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Vendors</CardTitle>
          <CardDescription>Vendors with highest expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Vendor data not available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Vendors</CardTitle>
        <CardDescription>Vendors with highest expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="vendor"
              angle={-45}
              textAnchor="end"
              height={100}
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
            <Bar
              dataKey="amount"
              fill="var(--primary-blue)"
              name="Amount"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
