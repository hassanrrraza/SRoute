"use client";

import { useState, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GripVertical } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateTrip, getTrips, getAllDrivers, getActiveVehicles } from "../trips/actions";
import { toast } from "sonner";
import { TripDialog } from "../trips/trip-dialog";

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
  driverId?: string;
  vehicleId?: string;
}

interface Driver {
  id: string;
  name: string;
  status: string;
}

interface Vehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  status: string;
}

function TripCard({ trip, onEdit }: { trip: Trip; onEdit: (trip: Trip) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: trip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-slate-200 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? "shadow-lg" : ""
      }`}
      onClick={() => onEdit(trip)}
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-1">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{formatTime(trip.scheduledTime)}</div>
          <div className="text-xs text-slate-600 truncate">
            {trip.pickupAddress.split(",")[0]} → {trip.dropoffAddress.split(",")[0]}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {trip.client?.name}
          </div>
          <div className="text-xs font-medium text-slate-900 mt-1">
            PKR {trip.fare.toFixed(0)}
          </div>
          {trip.driver && (
            <div className="text-xs text-slate-700 mt-1">
              👤 {trip.driver.name}
            </div>
          )}
          {trip.vehicle && (
            <div className="text-xs text-slate-700">
              🚗 {trip.vehicle.plate}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({
  title,
  trips,
  onEdit,
}: {
  title: string;
  trips: Trip[];
  onEdit: (trip: Trip) => void;
}) {
  return (
    <div className="flex-1 min-w-0 bg-slate-50 rounded-lg p-4 border-2 border-dashed border-slate-200">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{trips.length} trips</p>
      </div>

      <div className="space-y-2 min-h-96">
        <SortableContext
          items={trips.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onEdit={onEdit} />
          ))}
        </SortableContext>
        {trips.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-8">
            No trips
          </div>
        )}
      </div>
    </div>
  );
}

export default function DispatchPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { distance: 8 } as any)
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tripsData, driversData, vehiclesData] = await Promise.all([
        getTrips(),
        getAllDrivers(),
        getActiveVehicles(),
      ]);
      setTrips(tripsData as Trip[]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch (error) {
      toast.error("Failed to load dispatch data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const tripId = active.id as string;
    const newStatus = over.id as string;

    const trip = trips.find((t) => t.id === tripId);
    if (!trip || trip.status === newStatus) return;

    const updatedTrips = trips.map((t) =>
      t.id === tripId ? { ...t, status: newStatus } : t
    );
    setTrips(updatedTrips);

    try {
      const result = await updateTrip({
        id: tripId,
        pickupAddress: trip.pickupAddress,
        dropoffAddress: trip.dropoffAddress,
        scheduledTime: trip.scheduledTime,
        clientId: trip.client?.name || "",
        driverId: trip.driverId || null,
        vehicleId: trip.vehicleId || null,
        fare: trip.fare,
        status: newStatus as any,
      });

      if (result.error) {
        toast.error(result.error);
        await loadData();
      } else {
        toast.success(`Trip status updated`);
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to update trip");
      await loadData();
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (saved: boolean) => {
    setIsDialogOpen(false);
    setEditingTrip(null);
    if (saved) {
      loadData();
    }
  };

  const unassignedTrips = trips.filter((t) => t.status === "SCHEDULED" && !t.driverId);
  const dispatchedTrips = trips.filter((t) => t.status === "DISPATCHED");
  const inProgressTrips = trips.filter((t) => t.status === "IN_PROGRESS");
  const completedTodayTrips = trips.filter((t) => {
    if (t.status !== "COMPLETED") return false;
    const today = new Date();
    const tripDate = new Date(t.scheduledTime);
    return (
      tripDate.getFullYear() === today.getFullYear() &&
      tripDate.getMonth() === today.getMonth() &&
      tripDate.getDate() === today.getDate()
    );
  });

  const availableDriversCount = drivers.filter((d) => d.status === "AVAILABLE").length;
  const activeVehiclesCount = vehicles.filter((v) => v.status === "ACTIVE").length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dispatch Board</h1>
          <p className="text-slate-500 mt-1">
            Manage trips in real-time — drag cards between columns to update status
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Available Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{availableDriversCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Active Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeVehiclesCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Total Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{trips.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{completedTodayTrips.length}</div>
            </CardContent>
          </Card>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-4 gap-4">
            <SortableContext items={unassignedTrips.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <Column title="Unassigned" trips={unassignedTrips} onEdit={handleEditTrip} />
            </SortableContext>

            <SortableContext items={dispatchedTrips.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <Column title="Dispatched" trips={dispatchedTrips} onEdit={handleEditTrip} />
            </SortableContext>

            <SortableContext items={inProgressTrips.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <Column title="In Progress" trips={inProgressTrips} onEdit={handleEditTrip} />
            </SortableContext>

            <SortableContext items={completedTodayTrips.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <Column title="Completed Today" trips={completedTodayTrips} onEdit={handleEditTrip} />
            </SortableContext>
          </div>
        </DndContext>
      </div>

      <TripDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        trip={editingTrip}
        onClose={handleDialogClose}
      />
    </DashboardLayout>
  );
}
