import {
  FileText,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { Invoice } from "@/api/invoice";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { useState } from "react";

interface InvoiceTableProps {
  invoices: Invoice[];
  isLoading?: boolean;
  onView: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onReprocess?: (invoice: Invoice) => void;
  onUpload: () => void;
}

export function InvoiceTable({
  invoices,
  isLoading,
  onView,
  onDownload,
  onDelete,
  onReprocess,
  onUpload,
}: InvoiceTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner text="Loading invoices..." />
      </div>
    );
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
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow
              key={invoice.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(invoice)}
            >
              <TableCell>
                <FileText className="h-5 w-5 text-red-500" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {invoice.id.slice(0, 8)}...
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyId(invoice.id);
                    }}
                    title="Copy Invoice ID"
                  >
                    {copiedId === invoice.id ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {invoice.vendor || "Unknown Vendor"}
              </TableCell>
              <TableCell>{formatDate(invoice.date)}</TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(invoice.amount)}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() +
                    invoice.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div
                  className="flex items-center justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(invoice);
                    }}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(invoice);
                    }}
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {invoice.processingError && onReprocess && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReprocess(invoice);
                      }}
                      title="Retry Processing"
                    >
                      <RefreshCw className="h-4 w-4 text-orange-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(invoice);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
