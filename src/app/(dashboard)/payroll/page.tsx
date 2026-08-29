"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, Trash2, Eye, Wallet } from "lucide-react";
import { getPayrollEntries, deletePayrollEntry } from "./actions";
import { GeneratePayrollDialog } from "./generate-payroll-dialog";
import { PayrollDetailDialog } from "./payroll-detail-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface PayrollEntry {
  id: string;
  driverId: string;
  driver?: { name: string };
  periodStart: Date;
  periodEnd: Date;
  tripsCompleted: number;
  hoursWorked: number;
  grossPay: number;
  status: string;
  paidDate?: Date;
}

const payrollStatusColorMap = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
};

export default function PayrollPage() {
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPayrollEntries();
      setEntries(result as PayrollEntry[]);
    } catch (error) {
      toast.error("Failed to load payroll entries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = useMemo(() => {
    if (statusFilter === "all") {
      return entries;
    }
    return entries.filter((e) => e.status === statusFilter);
  }, [entries, statusFilter]);

  const handleViewDetails = (entry: PayrollEntry) => {
    setSelectedEntry(entry);
    setDetailDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const result = await deletePayrollEntry(deletingId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Payroll entry deleted");
        await loadEntries();
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalPending = useMemo(() => {
    return entries
      .filter((e) => e.status === "PENDING")
      .reduce((sum, e) => sum + e.grossPay, 0);
  }, [entries]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payroll</h1>
            <p className="text-slate-500 mt-1">Manage driver pay</p>
          </div>
          <Button onClick={() => setGenerateDialogOpen(true)} className="gap-2 self-start">
            <Plus className="w-4 h-4" />
            Generate Payroll
          </Button>
        </div>

        {/* Summary */}
        {totalPending > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-900">
              Pending Payroll: {formatCurrency(totalPending)}
            </p>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filteredEntries.length === 0 ? (
          <div className="border border-slate-200 rounded-lg bg-white">
            <EmptyState
              icon={Wallet}
              title={
                entries.length === 0
                  ? "No payroll runs yet"
                  : "No payroll entries match this filter"
              }
              description={
                entries.length === 0
                  ? "Generate payroll for a pay period to calculate driver hours and gross pay from completed trips."
                  : "Try switching between Pending and Paid."
              }
              action={
                entries.length === 0 ? (
                  <Button onClick={() => setGenerateDialogOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Generate your first payroll
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Driver</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-center">Trips</TableHead>
                  <TableHead className="text-center">Hours</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.driver?.name}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(entry.periodStart)} → {formatDate(entry.periodEnd)}
                    </TableCell>
                    <TableCell className="text-center">{entry.tripsCompleted}</TableCell>
                    <TableCell className="text-center">{entry.hoursWorked}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(entry.grossPay)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={entry.status}
                        colorMap={payrollStatusColorMap}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(entry)}
                          className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(entry.id)}
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

      {/* Dialogs */}
      <GeneratePayrollDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        onPayrollGenerated={() => {
          setGenerateDialogOpen(false);
          loadEntries();
        }}
      />

      {selectedEntry && (
        <PayrollDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          entry={selectedEntry}
          onEntryUpdated={() => {
            setDetailDialogOpen(false);
            setSelectedEntry(null);
            loadEntries();
          }}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Payroll Entry"
        description="Are you sure you want to delete this payroll entry? Only PENDING entries can be deleted."
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
