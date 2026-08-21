"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCompletedTripsWithoutInvoice, generateInvoice } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceGenerated: () => void;
}

export function GenerateInvoiceDialog({
  open,
  onOpenChange,
  onInvoiceGenerated,
}: GenerateInvoiceDialogProps) {
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tripsLoading, setTripsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTrips();
    }
  }, [open]);

  const loadTrips = async () => {
    setTripsLoading(true);
    try {
      const result = await getCompletedTripsWithoutInvoice();
      setTrips(result as any[]);
      if (result.length > 0) {
        setSelectedTripId(result[0].id);
      }
    } catch (error) {
      toast.error("Failed to load trips");
    } finally {
      setTripsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTripId) {
      toast.error("Please select a trip");
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateInvoice({ tripId: selectedTripId });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invoice generated successfully");
        onOpenChange(false);
        onInvoiceGenerated();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Completed Trip
            </label>
            {tripsLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            ) : trips.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">
                No completed trips without invoices
              </p>
            ) : (
              <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trip..." />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.pickupAddress?.split(",")[0]} →{" "}
                      {trip.dropoffAddress?.split(",")[0]} ({trip.client?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-1">Default Invoice Items:</p>
            <p>A line item will be created with the trip fare amount.</p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading || tripsLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isLoading || tripsLoading || !selectedTripId}
              className="gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
