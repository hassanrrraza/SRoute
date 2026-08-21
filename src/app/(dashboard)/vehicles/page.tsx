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
import { VehicleDialog } from "./vehicle-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { deleteVehicle, getVehicles } from "./actions";
import { toast } from "sonner";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";

const vehicleStatusColorMap = {
  ACTIVE: "bg-green-100 text-green-700",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
  INACTIVE: "bg-slate-100 text-slate-600",
};

interface Vehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  capacity: number;
  status: string;
  driver?: {
    name: string;
  } | null;
}

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load vehicles
  const loadVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getVehicles();
      setVehicles(result as Vehicle[]);
    } catch (error) {
      toast.error("Failed to load vehicles");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const query = searchQuery.toLowerCase();
      return (
        vehicle.plate.toLowerCase().includes(query) ||
        vehicle.make.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        vehicle.status.toLowerCase().includes(query)
      );
    });
  }, [vehicles, searchQuery]);

  const handleAddVehicle = useCallback(() => {
    setEditingVehicle(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditVehicle = useCallback((vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setDeletingVehicleId(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deletingVehicleId) return;

    setIsDeleting(true);
    try {
      const result = await deleteVehicle(deletingVehicleId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Vehicle deleted successfully");
        await loadVehicles();
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeletingVehicleId(null);
    }
  };

  const handleDialogClose = (saved: boolean) => {
    setIsDialogOpen(false);
    setEditingVehicle(null);
    if (saved) {
      loadVehicles();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vehicles</h1>
            <p className="text-slate-500 mt-1">Manage your vehicle fleet</p>
          </div>
          <Button onClick={handleAddVehicle} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Button>
        </div>

        {/* Search */}
        <div>
          <Input
            placeholder="Search by plate, make, model, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 font-medium">
              {searchQuery ? "No vehicles found" : "No vehicles yet"}
            </p>
            {!searchQuery && (
              <Button onClick={handleAddVehicle} variant="outline" className="mt-4">
                Create your first vehicle
              </Button>
            )}
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Plate</TableHead>
                  <TableHead>Make / Model</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Driver</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium font-mono">{vehicle.plate}</TableCell>
                    <TableCell>
                      {vehicle.make} {vehicle.model}
                    </TableCell>
                    <TableCell>{vehicle.capacity} seats</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={vehicle.status}
                        colorMap={vehicleStatusColorMap}
                      />
                    </TableCell>
                    <TableCell>
                      {vehicle.driver?.name || (
                        <span className="text-slate-400 text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditVehicle(vehicle)}
                          className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(vehicle.id)}
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
      <VehicleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        vehicle={editingVehicle}
        onClose={handleDialogClose}
      />

      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Vehicle"
        description="Are you sure you want to delete this vehicle? This action cannot be undone."
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
