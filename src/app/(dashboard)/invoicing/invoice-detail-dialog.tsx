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
import { updateInvoice, markInvoicePaid } from "./actions";
import { toast } from "sonner";
import { Loader2, Trash2, Plus } from "lucide-react";

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  onInvoiceUpdated: () => void;
}

export function InvoiceDetailDialog({
  open,
  onOpenChange,
  invoice,
  onInvoiceUpdated,
}: InvoiceDetailDialogProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [taxRate, setTaxRate] = useState("8");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && invoice) {
      setLineItems(
        invoice.lineItems?.map((li: any) => ({
          id: li.id,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        })) || []
      );
      setDueDate(new Date(invoice.dueDate).toISOString().split("T")[0]);
      setStatus(invoice.status);
      const calculatedTax = invoice.subtotal > 0 ? (invoice.tax / invoice.subtotal) * 100 : 8;
      setTaxRate(calculatedTax.toFixed(1));
    }
  }, [invoice, open]);

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = (subtotal * parseFloat(taxRate)) / 100;
    return { subtotal, tax, total: subtotal + tax };
  };

  const { subtotal, tax, total } = calculateTotals();

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveLineItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleLineItemChange = (
    idx: number,
    field: keyof LineItem,
    value: any
  ) => {
    const updated = [...lineItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setLineItems(updated);
  };

  const handleSave = async () => {
    if (lineItems.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateInvoice({
        id: invoice.id,
        dueDate: new Date(dueDate),
        status: status as any,
        lineItems,
        taxRate: parseFloat(taxRate),
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invoice updated successfully");
        onOpenChange(false);
        onInvoiceUpdated();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setIsLoading(true);
    try {
      const result = await markInvoicePaid({ id: invoice.id });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invoice marked as paid");
        onOpenChange(false);
        onInvoiceUpdated();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice?.invoiceNumber} - {invoice?.client?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600 font-medium">Client</p>
              <p className="text-slate-900">{invoice?.client?.name}</p>
            </div>
            <div>
              <p className="text-slate-600 font-medium">Trip</p>
              <p className="text-xs text-slate-900">
                {invoice?.trip?.pickupAddress?.split(",")[0]} →{" "}
                {invoice?.trip?.dropoffAddress?.split(",")[0]}
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Line Items</label>
              <button
                onClick={handleAddLineItem}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3 h-3" />
                Add Item
              </button>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      handleLineItemChange(idx, "description", e.target.value)
                    }
                    className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      handleLineItemChange(idx, "quantity", parseInt(e.target.value))
                    }
                    className="w-16 px-2 py-1 text-xs border border-slate-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleLineItemChange(idx, "unitPrice", parseFloat(e.target.value))
                    }
                    className="w-24 px-2 py-1 text-xs border border-slate-300 rounded"
                  />
                  <span className="w-20 px-2 py-1 text-xs text-right font-medium">
                    PKR {(item.quantity * item.unitPrice).toFixed(0)}
                  </span>
                  <button
                    onClick={() => handleRemoveLineItem(idx)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 bg-slate-50 p-3 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-medium">PKR {subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Tax:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-16 px-2 py-1 text-xs border border-slate-300 rounded text-right"
                />
                <span>%</span>
                <span className="font-medium min-w-20 text-right">PKR {tax.toFixed(0)}</span>
              </div>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-lg">PKR {total.toFixed(0)}</span>
            </div>
          </div>

          {/* Due Date & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {status !== "PAID" && (
              <Button
                onClick={handleMarkPaid}
                disabled={isLoading}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Mark Paid
              </Button>
            )}
            <Button onClick={handleSave} disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
