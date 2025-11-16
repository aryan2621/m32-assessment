import { MoreVertical, Eye, Trash2, Edit, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/utils/formatters"
import type { Expense } from "@/api/expense"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ExpenseCardProps {
  expense: Expense
  onView: (expense: Expense) => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export function ExpenseCard({ expense, onView, onEdit, onDelete }: ExpenseCardProps) {
  const [copied, setCopied] = useState(false)

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

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(expense.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(expense)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">{expense.vendor || "No Vendor"}</h3>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-muted-foreground">
                ID: {expense.id.slice(0, 8)}...
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyId()
                }}
                title="Copy Expense ID"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <p className="text-2xl font-bold text-primary mb-2">{formatCurrency(expense.amount, expense.currency)}</p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <span>{formatDate(expense.date)}</span>
            </div>
            {expense.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{expense.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onView(expense)
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onEdit(expense)
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(expense)
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
          <Badge className={cn("text-xs", getCategoryColor(expense.category))}>
            {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
          </Badge>
          {expense.invoiceId && (
            <span className="text-xs text-muted-foreground">
              From Invoice
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

