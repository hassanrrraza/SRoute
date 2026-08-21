"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { getInvoices, deleteInvoice } from "./actions";
import { GenerateInvoiceDialog } from "./generate-invoice-dialog";
import { InvoiceDetailDialog } from "./invoice-detail-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoiceNumber: string;
  client?: { name: string };
  trip?: { pickupAddress: string; dropoffAddress: string };
  issuedDate: Date;
  dueDate: Date;
  total: number;
  status: string;
  paidDate?: Date;
}

const invoiceStatusColorMap = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getInvoices();
      const enriched = result.map((inv: any) => {
        const now = new Date();
        let status = inv.status;
        if (inv.status !== "PAID" && new Date(inv.dueDate) < now) {
          status = "OVERDUE";
        }
        return { ...inv, status };
      });
      setInvoices(enriched);
    } catch (error) {
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(query) ||
          inv.client?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [invoices, statusFilter, searchQuery]);

  const handleEditClick = useCallback((invoice: any) => {
    setEditingInvoice(invoice);
    setEditDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setDeletingInvoiceId(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deletingInvoiceId) return;

    setIsDeleting(true);
    try {
      const result = await deleteInvoice(deletingInvoiceId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invoice deleted successfully");
        await loadInvoices();
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeletingInvoiceId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Invoicing</h1>
            <p className="text-slate-500 mt-1">Create and manage invoices</p>
          </div>
          <Button onClick={() => setGenerateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Generate Invoice
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Search by invoice number or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 font-medium">
              {invoices.length === 0 ? "No invoices yet" : "No invoices matching filters"}
            </p>
            {invoices.length === 0 && (
              <Button onClick={() => setGenerateDialogOpen(true)} variant="outline" className="mt-4">
                Generate your first invoice
              </Button>
            )}
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Trip</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono font-semibold">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.client?.name}</TableCell>
                    <TableCell className="text-sm">
                      <div className="max-w-xs">
                        <p className="truncate">{invoice.trip?.pickupAddress?.split(",")[0]}</p>
                        <p className="text-xs text-slate-500 truncate">
                          → {invoice.trip?.dropoffAddress?.split(",")[0]}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(invoice.issuedDate)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      PKR {invoice.total.toFixed(0)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={invoice.status}
                        colorMap={invoiceStatusColorMap}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(invoice)}
                          className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(invoice.id)}
                          className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Generate Invoice Dialog */}
      <GenerateInvoiceDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        onInvoiceGenerated={() => {
          setGenerateDialogOpen(false);
          loadInvoices();
        }}
      />

      {/* Edit Invoice Dialog */}
      {editingInvoice && (
        <InvoiceDetailDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          invoice={editingInvoice}
          onInvoiceUpdated={() => {
            setEditDialogOpen(false);
            setEditingInvoice(null);
            loadInvoices();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? Only DRAFT invoices can be deleted."
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
