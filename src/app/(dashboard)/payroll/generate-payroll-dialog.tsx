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
import { generatePayroll } from "./actions";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

interface GeneratePayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayrollGenerated: () => void;
}

export function GeneratePayrollDialog({
  open,
  onOpenChange,
  onPayrollGenerated,
}: GeneratePayrollDialogProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (open) {
      // Default to last 2 weeks
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 14);

      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
      setResult(null);
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both dates");
      return;
    }

    setIsLoading(true);
    try {
      const result = await generatePayroll({
        periodStart: new Date(startDate),
        periodEnd: new Date(endDate),
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        setResult(result);
        toast.success(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (result?.created && result.created.length > 0) {
      onPayrollGenerated();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Payroll</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Period Start
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Period End
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">Calculation Method:</p>
              <p>Hours = 1 hour per completed trip × driver hourly rate</p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isLoading} className="gap-2">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-900">
                ✓ {result.created?.length || 0} payroll entries created
              </p>
            </div>

            {result.skipped && result.skipped.length > 0 && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {result.skipped.length} entries skipped
                </p>
                <ul className="space-y-1">
                  {result.skipped.map((skip: any, idx: number) => (
                    <li key={idx} className="text-xs text-yellow-800">
                      <strong>{skip.driverName}:</strong> {skip.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  onPayrollGenerated();
                }}
                className="gap-2"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
