import { ExpenseCard } from "./ExpenseCard"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { Receipt } from "lucide-react"
import type { Expense } from "@/api/expense"

interface ExpenseListProps {
  expenses: Expense[]
  isLoading?: boolean
  onView: (expense: Expense) => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
  onAdd: () => void
}

export function ExpenseList({
  expenses,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onAdd,
}: ExpenseListProps) {
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

