"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { DispatchSkeleton } from "@/components/shared/skeletons";
import { cn, formatCurrency } from "@/lib/utils";
import {
  GripVertical,
  Inbox,
  Send,
  Timer,
  CheckCircle2,
  Users,
  Truck,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type CollisionDetection,
} from "@dnd-kit/core";
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
  clientId?: string;
  driverId?: string | null;
  vehicleId?: string | null;
  client?: { name: string };
  driver?: { name: string } | null;
  vehicle?: { plate: string } | null;
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

const COLUMN_IDS = ["SCHEDULED", "DISPATCHED", "IN_PROGRESS", "COMPLETED"] as const;
type ColumnId = (typeof COLUMN_IDS)[number];

const COLUMN_META: Record<
  ColumnId,
  {
    title: string;
    empty: string;
    icon: typeof Inbox;
    tint: string;
    headerTint: string;
    accent: string;
  }
> = {
  SCHEDULED: {
    title: "Unassigned",
    empty: "No unassigned trips",
    icon: Inbox,
    tint: "bg-slate-50",
    headerTint: "bg-slate-100 text-slate-700",
    accent: "border-l-slate-400",
  },
  DISPATCHED: {
    title: "Dispatched",
    empty: "No dispatched trips",
    icon: Send,
    tint: "bg-teal-50/40",
    headerTint: "bg-teal-50 text-teal-800",
    accent: "border-l-teal-500",
  },
  IN_PROGRESS: {
    title: "In Progress",
    empty: "No trips in progress",
    icon: Timer,
    tint: "bg-amber-50/40",
    headerTint: "bg-amber-50 text-amber-800",
    accent: "border-l-amber-500",
  },
  COMPLETED: {
    title: "Completed Today",
    empty: "No trips completed today",
    icon: CheckCircle2,
    tint: "bg-green-50/40",
    headerTint: "bg-green-50 text-green-800",
    accent: "border-l-green-500",
  },
};

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const columnHit = pointerHits.find((hit) =>
    COLUMN_IDS.includes(String(hit.id) as ColumnId)
  );
  if (columnHit) return [columnHit];
  if (pointerHits.length > 0) return pointerHits;
  return closestCorners(args);
};

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function TripCardBody({ trip, accent }: { trip: Trip; accent: string }) {
  return (
    <div className="flex items-start gap-2">
      <GripVertical className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold text-slate-900 leading-none tracking-tight">
          {formatTime(trip.scheduledTime)}
        </div>
        <div className="text-sm font-medium text-slate-800 mt-1.5 truncate">
          {trip.client?.name || "Unknown client"}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 truncate">
          {trip.driver?.name || "Unassigned"}
          {trip.vehicle?.plate ? ` · ${trip.vehicle.plate}` : ""}
        </div>
        <div className="text-xs text-slate-400 mt-1.5 truncate">
          {trip.pickupAddress.split(",")[0]} → {trip.dropoffAddress.split(",")[0]}
        </div>
        <div className="text-xs font-semibold text-slate-700 mt-2 tabular-nums">
          {formatCurrency(trip.fare)}
        </div>
      </div>
      <span className={cn("sr-only", accent)} />
    </div>
  );
}

function TripCard({
  trip,
  accent,
  onEdit,
}: {
  trip: Trip;
  accent: string;
  onEdit: (trip: Trip) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: trip.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (!isDragging) onEdit(trip);
      }}
      className={cn(
        "bg-white border border-slate-200 border-l-4 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-shadow duration-150",
        accent,
        isDragging ? "opacity-30" : "hover:shadow-md"
      )}
    >
      <TripCardBody trip={trip} accent={accent} />
    </div>
  );
}

function Column({
  id,
  trips,
  onEdit,
}: {
  id: ColumnId;
  trips: Trip[];
  onEdit: (trip: Trip) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const meta = COLUMN_META[id];
  const EmptyIcon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[210px] rounded-lg p-3 border transition-colors duration-150 min-h-[420px]",
        meta.tint,
        isOver
          ? "border-dashed border-teal-400 bg-teal-50 ring-2 ring-teal-300/70"
          : "border-slate-200"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between rounded-md px-2.5 py-1.5 mb-3",
          meta.headerTint
        )}
      >
        <h2 className="text-sm font-semibold">
          {meta.title}{" "}
          <span className="font-medium opacity-70">({trips.length})</span>
        </h2>
      </div>

      <div className="flex-1 space-y-2">
        {trips.length === 0 ? (
          <EmptyState icon={EmptyIcon} title={meta.empty} compact className="py-16" />
        ) : (
          trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} accent={meta.accent} onEdit={onEdit} />
          ))
        )}
      </div>
    </div>
  );
}

function AvailabilityPanel({
  drivers,
  vehicles,
}: {
  drivers: Driver[];
  vehicles: Vehicle[];
}) {
  const availableDrivers = drivers.filter((d) => d.status === "AVAILABLE");
  const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE");

  return (
    <div className="w-full xl:w-72 shrink-0 space-y-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            Available drivers
            <span className="ml-auto text-xs font-medium text-slate-500">
              {availableDrivers.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {availableDrivers.length === 0 ? (
            <p className="text-xs text-slate-500">All drivers are currently assigned.</p>
          ) : (
            <ul className="space-y-2">
              {availableDrivers.map((driver) => (
                <li
                  key={driver.id}
                  className="flex items-center gap-2.5 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-[11px] font-semibold text-teal-800">
                    {initials(driver.name)}
                  </span>
                  <span className="text-sm text-slate-800 truncate">{driver.name}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Truck className="w-4 h-4 text-teal-600" />
            Active vehicles
            <span className="ml-auto text-xs font-medium text-slate-500">
              {activeVehicles.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {activeVehicles.length === 0 ? (
            <p className="text-xs text-slate-500">No active vehicles available.</p>
          ) : (
            <ul className="space-y-2">
              {activeVehicles.map((vehicle) => (
                <li
                  key={vehicle.id}
                  className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2"
                >
                  <span className="font-mono text-sm font-medium text-slate-800">
                    {vehicle.plate}
                  </span>
                  <span className="text-xs text-slate-500 truncate ml-2">
                    {vehicle.make} {vehicle.model}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
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
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const isDraggingRef = useRef(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadData = useCallback(async (silent = false) => {
    if (isDraggingRef.current) return;
    if (!silent) setIsLoading(true);
    try {
      const [tripsData, driversData, vehiclesData] = await Promise.all([
        getTrips(),
        getAllDrivers(),
        getActiveVehicles(),
      ]);
      setTrips(tripsData as Trip[]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch {
      toast.error("Failed to load dispatch data");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const resolveColumn = (overId: string): ColumnId | null => {
    if (COLUMN_IDS.includes(overId as ColumnId)) return overId as ColumnId;
    const overTrip = trips.find((t) => t.id === overId);
    if (!overTrip) return null;
    if (overTrip.status === "SCHEDULED" && !overTrip.driverId) return "SCHEDULED";
    if (COLUMN_IDS.includes(overTrip.status as ColumnId)) return overTrip.status as ColumnId;
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    isDraggingRef.current = true;
    const trip = trips.find((t) => t.id === event.active.id);
    setActiveTrip(trip ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    isDraggingRef.current = false;
    setActiveTrip(null);

    if (!over) return;

    const tripId = String(active.id);
    const newStatus = resolveColumn(String(over.id));
    const trip = trips.find((t) => t.id === tripId);
    if (!trip || !newStatus || trip.status === newStatus) return;

    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: newStatus } : t))
    );

    try {
      const result = await updateTrip({
        id: tripId,
        pickupAddress: trip.pickupAddress,
        dropoffAddress: trip.dropoffAddress,
        scheduledTime: trip.scheduledTime,
        clientId: trip.clientId || "",
        driverId: trip.driverId || null,
        vehicleId: trip.vehicleId || null,
        fare: trip.fare,
        status: newStatus,
      });

      if (result.error) {
        toast.error(result.error);
        await loadData(true);
      } else {
        toast.success("Trip status updated");
        await loadData(true);
      }
    } catch {
      toast.error("Failed to update trip");
      await loadData(true);
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (saved: boolean) => {
    setIsDialogOpen(false);
    setEditingTrip(null);
    if (saved) loadData(true);
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

  const columns: { id: ColumnId; trips: Trip[] }[] = [
    { id: "SCHEDULED", trips: unassignedTrips },
    { id: "DISPATCHED", trips: dispatchedTrips },
    { id: "IN_PROGRESS", trips: inProgressTrips },
    { id: "COMPLETED", trips: completedTodayTrips },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <DispatchSkeleton />
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

        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            isDraggingRef.current = false;
            setActiveTrip(null);
          }}
        >
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 min-w-0 overflow-x-auto">
              <div className="grid grid-cols-4 gap-3 min-w-[880px]">
                {columns.map((col) => (
                  <Column key={col.id} id={col.id} trips={col.trips} onEdit={handleEditTrip} />
                ))}
              </div>
            </div>
            <AvailabilityPanel drivers={drivers} vehicles={vehicles} />
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTrip ? (
              <div
                className={cn(
                  "bg-white border border-slate-200 border-l-4 rounded-lg p-3 shadow-lg scale-[1.02] cursor-grabbing",
                  COLUMN_META[(activeTrip.status === "SCHEDULED" ? "SCHEDULED" : activeTrip.status) as ColumnId]
                    ?.accent ?? "border-l-slate-400"
                )}
              >
                <TripCardBody
                  trip={activeTrip}
                  accent={
                    COLUMN_META[(activeTrip.status === "SCHEDULED" ? "SCHEDULED" : activeTrip.status) as ColumnId]
                      ?.accent ?? "border-l-slate-400"
                  }
                />
              </div>
            ) : null}
          </DragOverlay>
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
