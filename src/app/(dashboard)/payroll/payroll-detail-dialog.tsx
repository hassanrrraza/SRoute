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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { markPayrollPaid, getPayrollEntryDetails } from "./actions";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

interface PayrollDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: any;
  onEntryUpdated: () => void;
}

export function PayrollDetailDialog({
  open,
  onOpenChange,
  entry,
  onEntryUpdated,
}: PayrollDetailDialogProps) {
  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  useEffect(() => {
    if (open && entry?.id) {
      loadDetails();
    }
  }, [open, entry?.id]);

  const loadDetails = async () => {
    setIsLoading(true);
    try {
      const result = await getPayrollEntryDetails(entry.id);
      setDetails(result);
    } catch (error) {
      toast.error("Failed to load payroll details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setIsMarkingPaid(true);
    try {
      const result = await markPayrollPaid({ id: entry.id });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Payroll marked as paid");
        onEntryUpdated();
      }
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!details) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Payroll Details — {details.driver?.name}
            {details.status === "PAID" && <Check className="w-5 h-5 text-green-600 ml-2" />}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Period</p>
              <p className="font-semibold">
                {formatDate(details.periodStart).split(",")[0]} →{" "}
                {formatDate(details.periodEnd).split(",")[0]}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Status</p>
              <p className="font-semibold">
                {details.status === "PENDING" && (
                  <span className="text-amber-600">PENDING</span>
                )}
                {details.status === "PAID" && (
                  <span className="text-green-600">
                    PAID ({formatDate(details.paidDate).split(",")[1]})
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Trips Completed</p>
              <p className="font-semibold">{details.tripsCompleted}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Hours Worked</p>
              <p className="font-semibold">{details.hoursWorked} hrs</p>
            </div>
          </div>

          {/* Calculation */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-xs text-slate-500 uppercase font-medium mb-2">Calculation</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Hourly Rate (PKR) × Hours = {details.driver?.hourlyRate} × {details.hoursWorked}
                </span>
                <span className="font-semibold">
                  = PKR {(details.driver?.hourlyRate * details.hoursWorked).toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-medium">Gross Pay</span>
                <span className="font-bold text-lg">PKR {details.grossPay.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Trips */}
          <div>
            <p className="text-xs text-slate-500 uppercase font-medium mb-3">
              Contributing Trips ({details.trips?.length || 0})
            </p>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Date</TableHead>
                    <TableHead>Pickup → Dropoff</TableHead>
                    <TableHead className="text-right">Fare</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.trips?.map((trip: any) => (
                    <TableRow key={trip.id}>
                      <TableCell className="text-sm">
                        {new Date(trip.scheduledTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="truncate">
                          {trip.pickupAddress?.substring(0, 20)}... →{" "}
                          {trip.dropoffAddress?.substring(0, 20)}...
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        PKR {trip.fare?.toFixed(0) || "0"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Actions */}
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {details.status === "PENDING" && (
              <Button
                onClick={handleMarkPaid}
                disabled={isMarkingPaid}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isMarkingPaid && <Loader2 className="w-4 h-4 animate-spin" />}
                Mark as Paid
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
