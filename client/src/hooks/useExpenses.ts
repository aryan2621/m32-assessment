import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { expenseAPI } from "@/api/expense"
import type { ExpenseFilters, Expense } from "@/api/expense"
import { toast } from "sonner"

export function useExpenses(filters?: ExpenseFilters, page: number = 1, limit: number = 20, enableFetch: boolean = true) {
  const queryClient = useQueryClient()

  const cleanFilters = filters ? {
    ...filters,
    search: filters.search?.trim() || undefined,
  } : undefined

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["expenses", cleanFilters, page, limit],
    queryFn: () => expenseAPI.getExpenses(cleanFilters, page, limit),
    enabled: enableFetch,
  })

  const createMutation = useMutation({
    mutationFn: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) =>
      expenseAPI.createExpense(expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] })
      toast.success("Expense created successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create expense")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Expense> }) =>
      expenseAPI.updateExpense(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] })
      toast.success("Expense updated successfully")
    },
    onError: () => {
      toast.error("Failed to update expense")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseAPI.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] })
      toast.success("Expense deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete expense")
    },
  })

  return {
    expenses: data?.expenses || [],
    total: data?.total || 0,
    page: data?.page || page,
    limit: data?.limit || limit,
    isLoading,
    createExpense: createMutation.mutate,
    updateExpense: updateMutation.mutate,
    deleteExpense: deleteMutation.mutate,
    refetch,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

export function useExpense(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["expense", id],
    queryFn: () => expenseAPI.getExpense(id),
    enabled: !!id,
  })

  return {
    expense: data,
    isLoading,
  }
}

