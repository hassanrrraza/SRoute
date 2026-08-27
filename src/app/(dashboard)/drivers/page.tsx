"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { DriverDialog } from "./driver-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { deleteDriver, getDrivers } from "./actions";
import { toast } from "sonner";
import { Trash2, Edit2, Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/skeletons";

const driverStatusColorMap = {
  AVAILABLE: "bg-green-100 text-green-700",
  ON_TRIP: "bg-blue-100 text-blue-700",
  OFF_DUTY: "bg-slate-100 text-slate-600",
};

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: string;
  hourlyRate: number;
  assignedVehicleId: string | null;
  assignedVehicle?: {
    plate: string;
  } | null;
}

export default function DriversPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingDriverId, setDeletingDriverId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load drivers
  const loadDrivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDrivers();
      setDrivers(result as Driver[]);
    } catch (error) {
      toast.error("Failed to load drivers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  // Filter drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const query = searchQuery.toLowerCase();
      return (
        driver.name.toLowerCase().includes(query) ||
        driver.status.toLowerCase().includes(query) ||
        driver.licenseNumber.toLowerCase().includes(query)
      );
    });
  }, [drivers, searchQuery]);

  const handleAddDriver = useCallback(() => {
    setEditingDriver(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditDriver = useCallback((driver: Driver) => {
    setEditingDriver(driver);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setDeletingDriverId(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deletingDriverId) return;

    setIsDeleting(true);
    try {
      const result = await deleteDriver(deletingDriverId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Driver deleted successfully");
        await loadDrivers();
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeletingDriverId(null);
    }
  };

  const handleDialogClose = (saved: boolean) => {
    setIsDialogOpen(false);
    setEditingDriver(null);
    if (saved) {
      loadDrivers();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Drivers</h1>
            <p className="text-slate-500 mt-1">Manage your driver fleet</p>
          </div>
          <Button onClick={handleAddDriver} className="gap-2 self-start">
            <Plus className="w-4 h-4" />
            Add Driver
          </Button>
        </div>

        {/* Search */}
        <div>
          <Input
            placeholder="Search by name, status, or license number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={7} cols={6} />
        ) : filteredDrivers.length === 0 ? (
          <div className="border border-slate-200 rounded-lg bg-white">
            <EmptyState
              icon={Users}
              title={searchQuery ? "No drivers match your search" : "No drivers on the roster yet"}
              description={
                searchQuery
                  ? "Try a different name, status, or license number."
                  : "Add a driver to start assigning trips and generating payroll."
              }
              action={
                !searchQuery ? (
                  <Button onClick={handleAddDriver} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add your first driver
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
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>License Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Assigned Vehicle</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell className="font-mono text-sm">{driver.licenseNumber}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={driver.status}
                        colorMap={driverStatusColorMap}
                      />
                    </TableCell>
                    <TableCell>PKR {driver.hourlyRate.toFixed(0)}</TableCell>
                    <TableCell>
                      {driver.assignedVehicle?.plate || (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditDriver(driver)}
                          className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(driver.id)}
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
      <DriverDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        driver={editingDriver}
        onClose={handleDialogClose}
      />

      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Driver"
        description="Are you sure you want to delete this driver? This action cannot be undone."
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
