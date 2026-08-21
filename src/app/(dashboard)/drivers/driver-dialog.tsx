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
import { createDriver, updateDriver, getVehicles } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: any | null;
  onClose: (saved: boolean) => void;
}

export function DriverDialog({
  open,
  onOpenChange,
  driver,
  onClose,
}: DriverDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    licenseNumber: "",
    status: "AVAILABLE",
    hourlyRate: "",
    assignedVehicleId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        status: driver.status,
        hourlyRate: driver.hourlyRate.toString(),
        assignedVehicleId: driver.assignedVehicleId || "",
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        licenseNumber: "",
        status: "AVAILABLE",
        hourlyRate: "",
        assignedVehicleId: "",
      });
    }
  }, [driver, open]);

  useEffect(() => {
    if (open) {
      loadVehicles();
    }
  }, [open]);

  const loadVehicles = async () => {
    try {
      const result = await getVehicles();
      setVehicles(result);
    } catch (error) {
      toast.error("Failed to load vehicles");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        hourlyRate: parseFloat(formData.hourlyRate),
        assignedVehicleId: formData.assignedVehicleId || null,
      };

      let result;
      if (driver) {
        result = await updateDriver({
          ...data,
          id: driver.id,
          status: formData.status as "AVAILABLE" | "ON_TRIP" | "OFF_DUTY",
        });
      } else {
        result = await createDriver({
          ...data,
          status: formData.status as "AVAILABLE" | "ON_TRIP" | "OFF_DUTY",
        });
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          driver ? "Driver updated successfully" : "Driver created successfully"
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
          <DialogTitle>
            {driver ? "Edit Driver" : "Add Driver"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name
            </label>
            <Input
              placeholder="Driver name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone
            </label>
            <Input
              placeholder="+92-300-1234567"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              License Number
            </label>
            <Input
              placeholder="DL-2025-001"
              value={formData.licenseNumber}
              onChange={(e) =>
                setFormData({ ...formData, licenseNumber: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hourly Rate (PKR)
            </label>
            <Input
              type="number"
              placeholder="500"
              value={formData.hourlyRate}
              onChange={(e) =>
                setFormData({ ...formData, hourlyRate: e.target.value })
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
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="ON_TRIP">On Trip</SelectItem>
                <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Assigned Vehicle (Optional)
            </label>
            <Select
              value={formData.assignedVehicleId}
              onValueChange={(value) =>
                setFormData({ ...formData, assignedVehicleId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle..." />
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {driver ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
