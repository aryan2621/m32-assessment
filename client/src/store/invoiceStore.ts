import { create } from "zustand"
import type { Invoice, InvoiceFilters } from "@/api/invoice"

interface InvoiceState {
  invoices: Invoice[]
  selectedInvoice: Invoice | null
  filters: InvoiceFilters
  setInvoices: (invoices: Invoice[]) => void
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  removeInvoice: (id: string) => void
  setSelectedInvoice: (invoice: Invoice | null) => void
  updateFilters: (filters: Partial<InvoiceFilters>) => void
}

export const invoiceStore = create<InvoiceState>((set) => ({
  invoices: [],
  selectedInvoice: null,
  filters: {
    status: "all",
    search: "",
  },
  setInvoices: (invoices) => {
    set({ invoices })
  },
  addInvoice: (invoice) => {
    set((state) => ({
      invoices: [invoice, ...state.invoices],
    }))
  },
  updateInvoice: (id, updates) => {
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)),
      selectedInvoice:
        state.selectedInvoice?.id === id ? { ...state.selectedInvoice, ...updates } : state.selectedInvoice,
    }))
  },
  removeInvoice: (id) => {
    set((state) => ({
      invoices: state.invoices.filter((inv) => inv.id !== id),
      selectedInvoice: state.selectedInvoice?.id === id ? null : state.selectedInvoice,
    }))
  },
  setSelectedInvoice: (invoice) => {
    set({ selectedInvoice: invoice })
  },
  updateFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }))
  },
}))

