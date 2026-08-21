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
import { createVehicle, updateVehicle } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface VehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: any | null;
  onClose: (saved: boolean) => void;
}

export function VehicleDialog({
  open,
  onOpenChange,
  vehicle,
  onClose,
}: VehicleDialogProps) {
  const [formData, setFormData] = useState({
    plate: "",
    make: "",
    model: "",
    capacity: "",
    status: "ACTIVE",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        plate: vehicle.plate,
        make: vehicle.make,
        model: vehicle.model,
        capacity: vehicle.capacity.toString(),
        status: vehicle.status,
      });
    } else {
      setFormData({
        plate: "",
        make: "",
        model: "",
        capacity: "",
        status: "ACTIVE",
      });
    }
  }, [vehicle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        capacity: parseInt(formData.capacity),
      };

      let result;
      if (vehicle) {
        result = await updateVehicle({
          ...data,
          id: vehicle.id,
          status: formData.status as "ACTIVE" | "MAINTENANCE" | "INACTIVE",
        });
      } else {
        result = await createVehicle({
          ...data,
          status: formData.status as "ACTIVE" | "MAINTENANCE" | "INACTIVE",
        });
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          vehicle ? "Vehicle updated successfully" : "Vehicle created successfully"
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
            {vehicle ? "Edit Vehicle" : "Add Vehicle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Plate Number
            </label>
            <Input
              placeholder="XY-01-AB"
              value={formData.plate}
              onChange={(e) =>
                setFormData({ ...formData, plate: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Make
              </label>
              <Input
                placeholder="Toyota"
                value={formData.make}
                onChange={(e) =>
                  setFormData({ ...formData, make: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Model
              </label>
              <Input
                placeholder="Camry"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Capacity (Seats)
            </label>
            <Input
              type="number"
              placeholder="5"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: e.target.value })
              }
              min="1"
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
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
              {vehicle ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
