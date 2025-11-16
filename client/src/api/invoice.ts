import { apiClient } from "./axios"

export interface InvoiceItem {
  description?: string
  quantity?: number
  unitPrice?: number
  amount?: number
}

export interface Invoice {
  id: string
  userId?: string
  fileUrl: string
  fileName: string
  fileType: "pdf" | "image"
  vendor: string
  vendorName?: string
  vendorEmail?: string
  vendorPhone?: string
  invoiceNumber?: string
  amount: number
  totalAmount?: number
  date: string
  invoiceDate?: string
  dueDate?: string
  currency: string
  taxAmount?: number
  subtotal?: number
  items?: InvoiceItem[]
  category: "utilities" | "software" | "office" | "marketing" | "other"
  status: "paid" | "pending" | "overdue"
  paymentMethod?: string
  notes?: string
  isProcessed: boolean
  processingError?: string
  confidence?: number
  createdAt?: string
  updatedAt?: string
}

export interface UploadInvoiceResponse {
  invoice: Invoice
  message: string
}

export interface SSEEvent {
  type: string
  message: string
  progress?: number
  data?: any
}

export type SSEProgressCallback = (event: SSEEvent) => void

export interface InvoiceFilters {
  status?: "all" | "paid" | "pending" | "overdue"
  search?: string
  startDate?: string
  endDate?: string
  category?: string
}

export interface InvoiceListResponse {
  invoices: Invoice[]
  total: number
  page: number
  limit: number
}

export interface DashboardStats {
  totalInvoices: number
  totalExpenses: number
  totalInvoiceAmount: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  topVendor: string
}

export const invoiceAPI = {
  getInvoices: async (filters?: InvoiceFilters, page: number = 1, limit: number = 20): Promise<InvoiceListResponse> => {
    const { data } = await apiClient.get<{ success: boolean; message: string; data: InvoiceListResponse }>("/invoices", {
      params: { ...filters, page, limit },
    })
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to get invoices")
    }
    return data.data
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const { data } = await apiClient.get<{ success: boolean; message: string; data: Invoice }>(`/invoices/${id}`)
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to get invoice")
    }
    return data.data
  },

  uploadInvoice: async (file: File): Promise<UploadInvoiceResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    const { data } = await apiClient.post<{ success: boolean; message: string; data: UploadInvoiceResponse }>("/invoices/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to upload invoice")
    }
    return data.data
  },

  uploadInvoiceSSE: async (
    file: File,
    onProgress: SSEProgressCallback
  ): Promise<UploadInvoiceResponse> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append("file", file)

      fetch(`${apiClient.defaults.baseURL}/invoices/upload/sse`, {
        method: "POST",
        body: formData,
        credentials: "include",
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`)
          }

          if (!response.body) {
            throw new Error("No response body")
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ""

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const eventData = JSON.parse(line.substring(6)) as SSEEvent
                  onProgress(eventData)

                  if (eventData.type === "success" && eventData.data) {
                    resolve({
                      invoice: eventData.data.invoice,
                      message: eventData.message,
                    })
                    return
                  } else if (eventData.type === "error") {
                    reject(new Error(eventData.message))
                    return
                  }
                } catch (e) {
                  console.error("Failed to parse SSE event:", e)
                }
              }
            }
          }

          reject(new Error("Upload completed but no success event received"))
        })
        .catch((error) => {
          reject(error)
        })
    })
  },

  updateInvoice: async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    const { data } = await apiClient.patch<{ success: boolean; message: string; data: Invoice }>(`/invoices/${id}`, updates)
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to update invoice")
    }
    return data.data
  },

  deleteInvoice: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(`/invoices/${id}`)
    if (!data.success) {
      throw new Error(data.message || "Failed to delete invoice")
    }
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<{ success: boolean; message: string; data: DashboardStats }>("/invoices/dashboard/stats")
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to get dashboard stats")
    }
    return data.data
  },

  reprocessInvoice: async (id: string): Promise<Invoice> => {
    const { data } = await apiClient.post<{ success: boolean; message: string; data: Invoice }>(`/invoices/${id}/reprocess`)
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to reprocess invoice")
    }
    return data.data
  },
}

