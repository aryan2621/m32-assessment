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
import { Edit, Receipt, DollarSign, Calendar, Tag, FileText, ExternalLink, Building2, MessageSquare } from "lucide-react"
import { formatCurrency, formatDate } from "@/utils/formatters"
import type { Expense } from "@/api/expense"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

interface ExpenseDetailsProps {
  expense: Expense | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (expense: Expense) => void
}

export function ExpenseDetails({ expense, open, onOpenChange, onEdit }: ExpenseDetailsProps) {
  if (!expense) return null

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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{expense.vendor || "No Vendor"}</DialogTitle>
              <DialogDescription className="mt-1">
                Expense Details
              </DialogDescription>
            </div>
            <Badge className={cn("text-sm", getCategoryColor(expense.category))}>
              {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Information
                </h3>
                <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-2xl font-bold">{formatCurrency(expense.amount, expense.currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Currency</span>
                    <Badge variant="outline">{expense.currency}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Date Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">Expense Date</span>
                    <span className="text-sm font-medium">{formatDate(expense.date)}</span>
                  </div>
                  {expense.createdAt && (
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm font-medium">{formatDate(expense.createdAt)}</span>
                    </div>
                  )}
                  {expense.updatedAt && (
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-sm font-medium">{formatDate(expense.updatedAt)}</span>
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
                    <Badge className={cn("text-xs", getCategoryColor(expense.category))}>
                      {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                    </Badge>
                  </div>
                  {expense.invoiceId && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Source</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Receipt className="h-3 w-3" />
                        From Invoice
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Vendor Information
                </h3>
                <div className="space-y-2">
                  {expense.vendor ? (
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-muted-foreground">Vendor Name</span>
                      <span className="text-sm font-medium">{expense.vendor}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-muted-foreground">Vendor</span>
                      <span className="text-sm text-muted-foreground italic">Not specified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {expense.description && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Description
              </h3>
              <p className="text-base text-muted-foreground bg-muted/50 p-4 rounded-lg">{expense.description}</p>
            </div>
          )}

          {expense.invoiceId && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Related Invoice
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">
                    This expense was automatically created from an invoice.
                  </p>
                  <Link to={`/invoices`} onClick={() => onOpenChange(false)}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Related Invoices
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => onEdit(expense)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Expense
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


