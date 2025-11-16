import {
  MoreVertical,
  Eye,
  Download,
  Trash2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { Invoice } from "@/api/invoice";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface InvoiceCardProps {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
}

export function InvoiceCard({
  invoice,
  onView,
  onDownload,
  onDelete,
}: InvoiceCardProps) {
  const [copied, setCopied] = useState(false);

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

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(invoice.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-shadow cursor-pointer",
        invoice.processingError &&
          !invoice.isProcessed &&
          "border-destructive/50"
      )}
      onClick={() => onView(invoice)}
    >
      <CardContent className="p-6">
        {invoice.processingError && !invoice.isProcessed && (
          <div className="flex items-center gap-2 mb-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Processing failed - Click to retry</span>
          </div>
        )}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">
                {invoice.vendor || "Unknown Vendor"}
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-muted-foreground">
                ID: {invoice.id.slice(0, 8)}...
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyId();
                }}
                title="Copy Invoice ID"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <p className="text-2xl font-bold text-primary mb-2">
              {formatCurrency(invoice.amount)}
            </p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{formatDate(invoice.date)}</span>
              {invoice.category && (
                <>
                  <span>•</span>
                  <span>{invoice.category}</span>
                </>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onView(invoice);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(invoice);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(invoice);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant={getStatusVariant(invoice.status)}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
          {invoice.dueDate && (
            <span className="text-xs text-muted-foreground">
              Due: {formatDate(invoice.dueDate)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
