import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { invoiceAPI } from "@/api/invoice"
import type { InvoiceFilters } from "@/api/invoice"
import { invoiceStore } from "@/store/invoiceStore"
import { toast } from "sonner"

export function useInvoices(filters?: InvoiceFilters, page: number = 1, limit: number = 20, enableFetch: boolean = true) {
  const queryClient = useQueryClient()
  const { invoices, selectedInvoice, addInvoice, updateInvoice, removeInvoice, setSelectedInvoice } =
    invoiceStore()

  // Clean filters - remove "all" status and empty search
  const cleanFilters = filters ? {
    ...filters,
    status: filters.status === "all" ? undefined : filters.status,
    search: filters.search?.trim() || undefined,
  } : undefined

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["invoices", cleanFilters, page, limit],
    queryFn: () => invoiceAPI.getInvoices(cleanFilters, page, limit),
    enabled: enableFetch,
  })

  const uploadMutation = useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (event: any) => void }) =>
      invoiceAPI.uploadInvoiceSSE(file, onProgress || (() => {})),
    onSuccess: (data) => {
      addInvoice(data.invoice)
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] })
      toast.success(data.message || "Invoice uploaded successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload invoice")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<typeof invoices[0]> }) =>
      invoiceAPI.updateInvoice(id, updates),
    onSuccess: (updatedInvoice) => {
      updateInvoice(updatedInvoice.id, updatedInvoice)
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] })
      toast.success("Invoice updated successfully")
    },
    onError: () => {
      toast.error("Failed to update invoice")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceAPI.deleteInvoice(id),
    onSuccess: (_, id) => {
      removeInvoice(id)
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] })
      toast.success("Invoice deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete invoice")
    },
  })

  const reprocessMutation = useMutation({
    mutationFn: (id: string) => invoiceAPI.reprocessInvoice(id),
    onSuccess: (updatedInvoice) => {
      updateInvoice(updatedInvoice.id, updatedInvoice)
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] })
      toast.success("Invoice reprocessed successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reprocess invoice")
    },
  })

  return {
    invoices: data?.invoices || invoices,
    total: data?.total || 0,
    page: data?.page || page,
    limit: data?.limit || limit,
    selectedInvoice,
    isLoading,
    uploadInvoice: (file: File, onProgress?: (event: any) => void) =>
      uploadMutation.mutate({ file, onProgress }),
    updateInvoice: updateMutation.mutate,
    deleteInvoice: deleteMutation.mutate,
    reprocessInvoice: reprocessMutation.mutate,
    setSelectedInvoice,
    refetch,
    isUploading: uploadMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReprocessing: reprocessMutation.isPending,
  }
}

export function useInvoice(id: string) {
  const { selectedInvoice } = invoiceStore()

  const { data, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoiceAPI.getInvoice(id),
    enabled: !!id,
  })

  return {
    invoice: data || selectedInvoice,
    isLoading,
  }
}

export function useDashboardStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: invoiceAPI.getDashboardStats,
  })

  return {
    stats: data,
    isLoading,
  }
}

