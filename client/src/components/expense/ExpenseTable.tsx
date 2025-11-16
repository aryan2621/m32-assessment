import { Receipt, Trash2, Eye, Edit, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/utils/formatters"
import type { Expense } from "@/api/expense"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { EmptyState } from "@/components/common/EmptyState"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ExpenseTableProps {
  expenses: Expense[]
  isLoading?: boolean
  onView: (expense: Expense) => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
  onAdd: () => void
}

export function ExpenseTable({
  expenses,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onAdd,
}: ExpenseTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner text="Loading expenses..." />
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        heading="No expenses yet"
        description="Add your first expense to start tracking your spending"
        action={{
          label: "Add Expense",
          onClick: onAdd,
        }}
      />
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow
              key={expense.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(expense)}
            >
              <TableCell>
                <Receipt className="h-5 w-5 text-green-500" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {expense.id.slice(0, 8)}...
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyId(expense.id)
                    }}
                    title="Copy Expense ID"
                  >
                    {copiedId === expense.id ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {expense.vendor || "No Vendor"}
              </TableCell>
              <TableCell>
                <Badge className={cn("text-xs", getCategoryColor(expense.category))}>
                  {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(expense.date)}</TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(expense.amount, expense.currency)}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[200px] truncate">
                {expense.description || "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onView(expense)
                    }}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(expense)
                    }}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(expense)
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
  )
}

