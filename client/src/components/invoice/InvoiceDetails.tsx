import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, ExternalLink, RefreshCw, AlertCircle, Mail, Phone, FileText, Calendar, DollarSign, Tag, CreditCard, MessageSquare } from "lucide-react"
import { formatCurrency, formatDate } from "@/utils/formatters"
import type { Invoice } from "@/api/invoice"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface InvoiceDetailsProps {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload: (invoice: Invoice) => void
  onReprocess?: (invoice: Invoice) => void
  isReprocessing?: boolean
}

export function InvoiceDetails({ invoice, open, onOpenChange, onDownload, onReprocess, isReprocessing }: InvoiceDetailsProps) {
  if (!invoice) return null

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "pending":
        return "secondary"
      case "overdue":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      utilities: "bg-blue-100 text-blue-800",
      software: "bg-purple-100 text-purple-800",
      office: "bg-green-100 text-green-800",
      marketing: "bg-pink-100 text-pink-800",
      other: "bg-gray-100 text-gray-800",
    }
    return colors[category] || colors.other
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{invoice.vendorName || invoice.vendor || "Unknown Vendor"}</DialogTitle>
              <DialogDescription className="mt-1">
                {invoice.invoiceNumber && `Invoice #${invoice.invoiceNumber}`}
              </DialogDescription>
            </div>
            <Badge variant={getStatusVariant(invoice.status)} className="text-sm">
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {invoice.processingError && !invoice.isProcessed && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Processing Failed</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p className="text-sm">{invoice.processingError}</p>
                {onReprocess && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReprocess(invoice)}
                    disabled={isReprocessing}
                    className="mt-2"
                  >
                    {isReprocessing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Reprocessing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry Processing
                      </>
                    )}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </h3>
                <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                  {invoice.subtotal !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Subtotal</span>
                      <span className="text-sm font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                    </div>
                  )}
                  {invoice.taxAmount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tax</span>
                      <span className="text-sm font-medium">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-base font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold">{formatCurrency(invoice.totalAmount || invoice.amount, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">Currency</span>
                    <Badge variant="outline">{invoice.currency}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Dates
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">Invoice Date</span>
                    <span className="text-sm font-medium">{formatDate(invoice.invoiceDate || invoice.date)}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-muted-foreground">Due Date</span>
                      <span className="text-sm font-medium">{formatDate(invoice.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Classification
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <Badge className={cn("text-xs", getCategoryColor(invoice.category))}>
                      {invoice.category.charAt(0).toUpperCase() + invoice.category.slice(1)}
                    </Badge>
                  </div>
                  {invoice.paymentMethod && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Payment Method</span>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{invoice.paymentMethod}</span>
                      </div>
                    </div>
                  )}
                  {invoice.confidence !== undefined && (
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-muted-foreground">Processing Confidence</span>
                      <span className="text-sm font-medium">{Math.round(invoice.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  File Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">File Name</span>
                    <span className="text-sm font-medium truncate ml-2">{invoice.fileName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">File Type</span>
                    <Badge variant="outline" className="uppercase">{invoice.fileType}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Processing Status</span>
                    <Badge variant={invoice.isProcessed ? "default" : "secondary"}>
                      {invoice.isProcessed ? "Processed" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">Vendor Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Vendor Name</p>
                <p className="text-base font-medium">{invoice.vendorName || invoice.vendor || "N/A"}</p>
              </div>
              {invoice.vendorEmail && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </p>
                  <a href={`mailto:${invoice.vendorEmail}`} className="text-base font-medium text-primary hover:underline">
                    {invoice.vendorEmail}
                  </a>
                </div>
              )}
              {invoice.vendorPhone && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </p>
                  <a href={`tel:${invoice.vendorPhone}`} className="text-base font-medium text-primary hover:underline">
                    {invoice.vendorPhone}
                  </a>
                </div>
              )}
              {invoice.invoiceNumber && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Invoice Number</p>
                  <p className="text-base font-medium font-mono">{invoice.invoiceNumber}</p>
                </div>
              )}
            </div>
          </div>

          {invoice.items && invoice.items.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Line Items</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.description || "—"}</TableCell>
                          <TableCell className="text-right">{item.quantity ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            {item.unitPrice !== undefined ? formatCurrency(item.unitPrice, invoice.currency) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.amount !== undefined ? formatCurrency(item.amount, invoice.currency) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          {invoice.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notes
                </h3>
                <p className="text-base text-muted-foreground bg-muted/50 p-4 rounded-lg">{invoice.notes}</p>
              </div>
            </>
          )}

          {(invoice.createdAt || invoice.updatedAt) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                {invoice.createdAt && (
                  <div>
                    <span className="font-medium">Created:</span> {formatDate(invoice.createdAt)}
                  </div>
                )}
                {invoice.updatedAt && (
                  <div>
                    <span className="font-medium">Last Updated:</span> {formatDate(invoice.updatedAt)}
                  </div>
                )}
              </div>
            </>
          )}

          {invoice.fileUrl && (
            <>
              <Separator />
              <div className="flex gap-3">
                <Button
                  onClick={() => onDownload(invoice)}
                  className="flex-1"
                  size="lg"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(invoice.fileUrl, "_blank")}
                  size="lg"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in New Tab
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

