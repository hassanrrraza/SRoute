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
import { createShift, getDrivers } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShiftAdded: () => void;
}

export function AddShiftDialog({
  open,
  onOpenChange,
  onShiftAdded,
}: AddShiftDialogProps) {
  const [formData, setFormData] = useState({
    driverId: "",
    title: "Shift",
    startTime: "",
    endTime: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadDrivers();
      const now = new Date();
      setFormData({
        driverId: "",
        title: "Shift",
        startTime: now.toISOString().slice(0, 16),
        endTime: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
      });
    }
  }, [open]);

  const loadDrivers = async () => {
    setDriversLoading(true);
    try {
      const data = await getDrivers();
      setDrivers(data);
    } catch (error) {
      toast.error("Failed to load drivers");
    } finally {
      setDriversLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createShift({
        driverId: formData.driverId,
        title: formData.title,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Shift added successfully");
        onOpenChange(false);
        onShiftAdded();
      }
    } catch (error) {
      toast.error("Failed to add shift");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Driver Shift</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Driver
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
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <Input
              placeholder="e.g. Morning Shift, Evening Shift"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Time
            </label>
            <Input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              End Time
            </label>
            <Input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading || driversLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || driversLoading} className="gap-2">
              {(isLoading || driversLoading) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Add Shift
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
