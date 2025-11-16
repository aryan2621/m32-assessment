import { useQuery } from "@tanstack/react-query"
import { expenseAPI } from "@/api/expense"

export function useAnalytics(startDate?: string, endDate?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", startDate, endDate],
    queryFn: () => expenseAPI.getAnalytics(startDate, endDate),
  })

  return {
    analytics: data,
    isLoading,
    error,
    refetch,
  }
}

export function useCategoryAnalytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics-by-category"],
    queryFn: () => expenseAPI.getByCategory(),
  })

  return {
    categoryData: data,
    isLoading,
    error,
  }
}

export function useVendorAnalytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics-by-vendor"],
    queryFn: () => expenseAPI.getByVendor(),
  })

  return {
    vendorData: data,
    isLoading,
    error,
  }
}

export function useTrends(period: 'monthly' | 'yearly' = 'monthly') {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics-trends", period],
    queryFn: () => expenseAPI.getTrends(period),
  })

  return {
    trendsData: data,
    isLoading,
    error,
  }
}
