import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { InvoiceList } from "@/components/invoice/InvoiceList";
import { InvoiceTable } from "@/components/invoice/InvoiceTable";
import { InvoiceDetails } from "@/components/invoice/InvoiceDetails";
import { InvoiceUpload } from "@/components/invoice/InvoiceUpload";
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
import { useInvoices } from "@/hooks/useInvoices";
import type { Invoice } from "@/api/invoice";
import { invoiceStore } from "@/store/invoiceStore";

export function Invoices() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "paid" | "pending" | "overdue"
  >("all");
  const { selectedInvoice, setSelectedInvoice } = invoiceStore();
  const { invoices, isLoading, deleteInvoice, reprocessInvoice, isReprocessing, isDeleting } = useInvoices(
    { status: statusFilter, search },
    1,
    20
  );
  const prevIsDeletingRef = useRef(false);

  // Close delete dialog after successful deletion
  useEffect(() => {
    if (prevIsDeletingRef.current && !isDeleting && deleteDialogOpen) {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
    prevIsDeletingRef.current = isDeleting;
  }, [isDeleting, deleteDialogOpen]);

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailsOpen(true);
  };

  const handleDelete = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      deleteInvoice(invoiceToDelete.id);
      // Don't close dialog immediately - let the mutation handle it
    }
  };

  const handleDownload = (invoice: Invoice) => {
    if (invoice.fileUrl) {
      window.open(invoice.fileUrl, "_blank");
    }
  };

  const handleReprocess = (invoice: Invoice) => {
    reprocessInvoice(invoice.id);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your invoices
            </p>
          </div>
          <Button size="lg" onClick={() => setUploadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Invoice
          </Button>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: any) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
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
          <InvoiceTable
            invoices={invoices}
            isLoading={isLoading}
            onView={handleView}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onReprocess={handleReprocess}
            onUpload={() => setUploadOpen(true)}
          />
        ) : (
          <InvoiceList
            invoices={invoices}
            isLoading={isLoading}
            onView={handleView}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onUpload={() => setUploadOpen(true)}
          />
        )}

        <InvoiceUpload open={uploadOpen} onOpenChange={setUploadOpen} />
        <InvoiceDetails
          invoice={selectedInvoice}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onDownload={handleDownload}
          onReprocess={handleReprocess}
          isReprocessing={isReprocessing}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !isDeleting && setDeleteDialogOpen(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete invoice from{" "}
                <strong>{invoiceToDelete?.vendor || "this vendor"}</strong>? This action
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
