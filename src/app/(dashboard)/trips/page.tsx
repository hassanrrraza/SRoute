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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { TripDialog } from "./trip-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { deleteTrip, getTrips } from "./actions";
import { toast } from "sonner";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";

const tripStatusColorMap = {
  SCHEDULED: "bg-slate-100 text-slate-700",
  DISPATCHED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

interface Trip {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledTime: Date;
  status: string;
  fare: number;
  client?: { name: string };
  driver?: { name: string } | null;
  vehicle?: { plate: string } | null;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getTrips();
      setTrips(result as Trip[]);
    } catch (error) {
      toast.error("Failed to load trips");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // Get unique drivers for filter
  const uniqueDrivers = useMemo(() => {
    return Array.from(
      new Map(
        trips
          .filter((t) => t.driver)
          .map((t) => [t.driver!.name, t.driver!.name])
      ).values()
    ).sort();
  }, [trips]);

  // Filter trips
  const filteredTrips = useMemo(() => {
    let filtered = [...trips];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Driver filter
    if (driverFilter !== "all") {
      filtered = filtered.filter((t) => t.driver?.name === driverFilter);
    }

    // Date range filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    if (dateRangeFilter === "today") {
      filtered = filtered.filter((t) => {
        const tripDate = new Date(t.scheduledTime);
        return (
          tripDate.getFullYear() === today.getFullYear() &&
          tripDate.getMonth() === today.getMonth() &&
          tripDate.getDate() === today.getDate()
        );
      });
    } else if (dateRangeFilter === "week") {
      filtered = filtered.filter((t) => {
        const tripDate = new Date(t.scheduledTime);
        return tripDate >= weekStart && tripDate < weekEnd;
      });
    }

    return filtered;
  }, [trips, statusFilter, driverFilter, dateRangeFilter]);

  const handleAddTrip = useCallback(() => {
    setEditingTrip(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditTrip = useCallback((trip: Trip) => {
    setEditingTrip(trip);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setDeletingTripId(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deletingTripId) return;

    setIsDeleting(true);
    try {
      const result = await deleteTrip(deletingTripId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Trip deleted successfully");
        await loadTrips();
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeletingTripId(null);
    }
  };

  const handleDialogClose = (saved: boolean) => {
    setIsDialogOpen(false);
    setEditingTrip(null);
    if (saved) {
      loadTrips();
    }
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Trips</h1>
            <p className="text-slate-500 mt-1">Manage all trips and dispatches</p>
          </div>
          <Button onClick={handleAddTrip} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Trip
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="DISPATCHED">Dispatched</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>

          {uniqueDrivers.length > 0 && (
            <Select value={driverFilter} onValueChange={setDriverFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All drivers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {uniqueDrivers.map((driver) => (
                  <SelectItem key={driver} value={driver}>
                    {driver}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 font-medium">
              {trips.length === 0 ? "No trips yet" : "No trips matching filters"}
            </p>
            {trips.length === 0 && (
              <Button onClick={handleAddTrip} variant="outline" className="mt-4">
                Create your first trip
              </Button>
            )}
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Time</TableHead>
                  <TableHead>Pickup → Dropoff</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Fare</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium">
                        {formatTime(trip.scheduledTime)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDate(trip.scheduledTime)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm truncate">{trip.pickupAddress}</p>
                        <p className="text-xs text-slate-500 truncate">
                          → {trip.dropoffAddress}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{trip.client?.name}</TableCell>
                    <TableCell className="text-sm">
                      {trip.driver?.name || (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {trip.vehicle?.plate || (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      PKR {trip.fare.toFixed(0)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={trip.status}
                        colorMap={tripStatusColorMap}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTrip(trip)}
                          className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(trip.id)}
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
      <TripDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        trip={editingTrip}
        onClose={handleDialogClose}
      />

      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Trip"
        description="Are you sure you want to delete this trip? This action cannot be undone."
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
