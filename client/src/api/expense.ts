import { apiClient } from "./axios"

export interface Expense {
  id: string
  userId?: string
  invoiceId?: string
  amount: number
  currency: string
  category: string
  vendor?: string
  description?: string
  date: string
  createdAt?: string
  updatedAt?: string
}

export interface AnalyticsData {
  totalExpenses: number
  expenseCount: number
  averageExpense: number
  byCategory: Record<string, number>
  topVendors: Array<{ vendor: string; amount: number }>
  monthlyTrends: Array<{ month: string; amount: number }>
}

export interface CategoryData {
  [category: string]: {
    total: number
    count: number
  }
}

export interface VendorData {
  [vendor: string]: {
    total: number
    count: number
  }
}

export interface TrendsData {
  period: string
  trends: Array<{
    period: string
    amount: number
  }>
}

export interface ExpenseListResponse {
  expenses: Expense[]
  total: number
  page: number
  limit: number
}

export interface ExpenseFilters {
  category?: string
  vendor?: string
  search?: string
  startDate?: string
  endDate?: string
}

export const expenseAPI = {
  getExpenses: async (filters?: ExpenseFilters, page: number = 1, limit: number = 20): Promise<ExpenseListResponse> => {
    const { data } = await apiClient.get<{ success: boolean; message: string; data: ExpenseListResponse }>("/expenses", {
      params: { ...filters, page, limit },
    })
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to get expenses")
    }
    return data.data
  },

  getExpense: async (id: string): Promise<Expense> => {
    const { data } = await apiClient.get<{ success: boolean; message: string; data: Expense }>(`/expenses/${id}`)
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to get expense")
    }
    return data.data
  },

  createExpense: async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> => {
    const { data } = await apiClient.post<{ success: boolean; message: string; data: Expense }>("/expenses", expense)
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to create expense")
    }
    return data.data
  },

  updateExpense: async (id: string, updates: Partial<Expense>): Promise<Expense> => {
    const { data } = await apiClient.put<{ success: boolean; message: string; data: Expense }>(`/expenses/${id}`, updates)
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to update expense")
    }
    return data.data
  },

  deleteExpense: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(`/expenses/${id}`)
    if (!data.success) {
      throw new Error(data.message || "Failed to delete expense")
    }
  },

  getAnalytics: async (startDate?: string, endDate?: string): Promise<AnalyticsData> => {
    const params: any = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const { data } = await apiClient.get<{ success: boolean; message: string; data: AnalyticsData }>(
      "/expenses/analytics",
      { params }
    )
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to get analytics")
    }
    return data.data
  },

  getByCategory: async (): Promise<CategoryData> => {
    const { data } = await apiClient.get<{ success: boolean; message: string; data: CategoryData }>(
      "/expenses/by-category"
    )
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to get category data")
    }
    return data.data
  },

  getByVendor: async (): Promise<VendorData> => {
    const { data } = await apiClient.get<{ success: boolean; message: string; data: VendorData }>(
      "/expenses/by-vendor"
    )
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to get vendor data")
    }
    return data.data
  },

  getTrends: async (period: 'monthly' | 'yearly' = 'monthly'): Promise<TrendsData> => {
    const { data } = await apiClient.get<{ success: boolean; message: string; data: TrendsData }>(
      "/expenses/trends",
      { params: { period } }
    )
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to get trends")
    }
    return data.data
  },

  exportCSV: async (startDate?: string, endDate?: string): Promise<Blob> => {
    const params: any = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const { data } = await apiClient.get("/expenses/export", {
      params,
      responseType: "blob"
    })
    return data
  },

  generateReport: async (): Promise<any> => {
    const { data } = await apiClient.post<{ success: boolean; message: string; data: any }>(
      "/expenses/report"
    )
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to generate report")
    }
    return data.data
  },
}
