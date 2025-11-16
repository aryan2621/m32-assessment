import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { ExpenseList } from "@/components/expense/ExpenseList";
import { ExpenseTable } from "@/components/expense/ExpenseTable";
import { ExpenseDetails } from "@/components/expense/ExpenseDetails";
import { ExpenseForm } from "@/components/expense/ExpenseForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, LayoutGrid, List, Loader2 } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import type { Expense } from "@/api/expense";
import type { ExpenseFilters } from "@/api/expense";

const categories = ["utilities", "software", "office", "marketing", "other"];

export function Expenses() {
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filters: ExpenseFilters = {
    search: search || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  };

  const { expenses, isLoading, createExpense, updateExpense, deleteExpense, isCreating, isUpdating, isDeleting } = useExpenses(
    filters,
    1,
    20
  );
  const prevIsDeletingRef = useRef(false);

  useEffect(() => {
    if (prevIsDeletingRef.current && !isDeleting && deleteDialogOpen) {
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
    prevIsDeletingRef.current = isDeleting;
  }, [isDeleting, deleteDialogOpen]);

  const handleView = (expense: Expense) => {
    setSelectedExpense(expense);
    setDetailsOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete.id);
    }
  };

  const handleSubmit = (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingExpense) {
      updateExpense({ id: editingExpense.id, updates: expenseData });
    } else {
      createExpense(expenseData);
    }
    setFormOpen(false);
    setEditingExpense(null);
  };

  const handleAddNew = () => {
    setEditingExpense(null);
    setFormOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Expenses</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage all your expenses
            </p>
          </div>
          <Button size="lg" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {viewMode === "table" ? (
          <ExpenseTable
            expenses={expenses}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAddNew}
          />
        ) : (
          <ExpenseList
            expenses={expenses}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAddNew}
          />
        )}

        <ExpenseForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingExpense(null);
          }}
          expense={editingExpense}
          onSubmit={handleSubmit}
          isSubmitting={isCreating || isUpdating}
        />

        <ExpenseDetails
          expense={selectedExpense}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onEdit={handleEdit}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !isDeleting && setDeleteDialogOpen(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this expense from{" "}
                <strong>{expenseToDelete?.vendor || "this vendor"}</strong>? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}

