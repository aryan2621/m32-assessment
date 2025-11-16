import { InvoiceCard } from "./InvoiceCard"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { FileText } from "lucide-react"
import type { Invoice } from "@/api/invoice"

interface InvoiceListProps {
  invoices: Invoice[]
  isLoading?: boolean
  onView: (invoice: Invoice) => void
  onDownload: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
  onUpload: () => void
}

export function InvoiceList({
  invoices,
  isLoading,
  onView,
  onDownload,
  onDelete,
  onUpload,
}: InvoiceListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner text="Loading invoices..." />
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        heading="No invoices yet"
        description="Upload your first invoice to get started with automated processing"
        action={{
          label: "Upload Invoice",
          onClick: onUpload,
        }}
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {invoices.map((invoice) => (
        <InvoiceCard
          key={invoice.id}
          invoice={invoice}
          onView={onView}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

