"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTrip, updateTrip, getClients, getAllDrivers, getAllVehicles } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip?: any | null;
  onClose: (saved: boolean) => void;
}

export function TripDialog({
  open,
  onOpenChange,
  trip,
  onClose,
}: TripDialogProps) {
  const [formData, setFormData] = useState({
    pickupAddress: "",
    dropoffAddress: "",
    scheduledTime: "",
    clientId: "",
    driverId: "",
    vehicleId: "",
    fare: "",
    status: "SCHEDULED",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  useEffect(() => {
    if (trip) {
      const scheduledDate = new Date(trip.scheduledTime);
      setFormData({
        pickupAddress: trip.pickupAddress,
        dropoffAddress: trip.dropoffAddress,
        scheduledTime: scheduledDate.toISOString().slice(0, 16),
        clientId: trip.clientId,
        driverId: trip.driverId || "",
        vehicleId: trip.vehicleId || "",
        fare: trip.fare.toString(),
        status: trip.status,
      });
    } else {
      const now = new Date();
      setFormData({
        pickupAddress: "",
        dropoffAddress: "",
        scheduledTime: now.toISOString().slice(0, 16),
        clientId: "",
        driverId: "",
        vehicleId: "",
        fare: "",
        status: "SCHEDULED",
      });
    }
  }, [trip, open]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setClientsLoading(true);
    try {
      const [clientsData, driversData, vehiclesData] = await Promise.all([
        getClients(),
        getAllDrivers(),
        getAllVehicles(),
      ]);
      setClients(clientsData);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setClientsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        fare: parseFloat(formData.fare),
        scheduledTime: new Date(formData.scheduledTime),
        driverId: formData.driverId || null,
        vehicleId: formData.vehicleId || null,
      };

      let result;
      if (trip) {
        result = await updateTrip({
          ...data,
          id: trip.id,
          status: formData.status as any,
        });
      } else {
        result = await createTrip({
          ...data,
          status: formData.status as any,
        });
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          trip ? "Trip updated successfully" : "Trip created successfully"
        );
        onOpenChange(false);
        onClose(true);
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{trip ? "Edit Trip" : "Create Trip"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pickup Address
            </label>
            <Input
              placeholder="Pickup location"
              value={formData.pickupAddress}
              onChange={(e) =>
                setFormData({ ...formData, pickupAddress: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dropoff Address
            </label>
            <Input
              placeholder="Dropoff location"
              value={formData.dropoffAddress}
              onChange={(e) =>
                setFormData({ ...formData, dropoffAddress: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Scheduled Date & Time
            </label>
            <Input
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) =>
                setFormData({ ...formData, scheduledTime: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Client
            </label>
            <Select
              value={formData.clientId}
              onValueChange={(value) =>
                setFormData({ ...formData, clientId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Driver (Optional)
            </label>
            <Select
              value={formData.driverId}
              onValueChange={(value) =>
                setFormData({ ...formData, driverId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select driver..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} ({driver.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Vehicle (Optional)
            </label>
            <Select
              value={formData.vehicleId}
              onValueChange={(value) =>
                setFormData({ ...formData, vehicleId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fare (PKR)
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.fare}
              onChange={(e) =>
                setFormData({ ...formData, fare: e.target.value })
              }
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading || clientsLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || clientsLoading} className="gap-2">
              {(isLoading || clientsLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
              {trip ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
