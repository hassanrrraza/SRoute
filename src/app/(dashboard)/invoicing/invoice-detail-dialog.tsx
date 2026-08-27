"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils";
import { updateInvoice, markInvoicePaid } from "./actions";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Check } from "lucide-react";

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

function formatDate(date: Date | string | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [isSaving, setIsSaving] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

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
      const calculatedTax =
        invoice.subtotal > 0 ? (invoice.tax / invoice.subtotal) * 100 : 8;
      setTaxRate(calculatedTax.toFixed(1));
    }
  }, [invoice, open]);

  const calculateTotals = () => {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0
    );
    const tax = (subtotal * (parseFloat(taxRate) || 0)) / 100;
    return { subtotal, tax, total: subtotal + tax };
  };

  const { subtotal, tax, total } = calculateTotals();
  const displayStatus =
    invoice?.status !== "PAID" && invoice?.dueDate && new Date(invoice.dueDate) < new Date()
      ? "OVERDUE"
      : status;

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLineItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleLineItemChange = (idx: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setLineItems(updated);
  };

  const handleSave = async () => {
    if (lineItems.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    setIsSaving(true);
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
      setIsSaving(false);
    }
  };

  const handleMarkPaid = async () => {
    setIsMarkingPaid(true);
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
      setIsMarkingPaid(false);
    }
  };

  const isBusy = isSaving || isMarkingPaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="bg-white px-8 pt-8 pb-6">
          {/* Document header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Invoice
              </p>
              <h2 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                {invoice?.invoiceNumber}
              </h2>
              <p className="text-sm font-medium text-slate-800">{invoice?.client?.name}</p>
              {invoice?.trip && (
                <p className="text-xs text-slate-500 truncate">
                  {invoice.trip.pickupAddress?.split(",")[0]} →{" "}
                  {invoice.trip.dropoffAddress?.split(",")[0]}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
              <StatusBadge status={displayStatus} />
              {status !== "PAID" && (
                <Button
                  onClick={handleMarkPaid}
                  disabled={isBusy}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {isMarkingPaid ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Mark as Paid
                </Button>
              )}
            </div>
          </div>

          {/* Meta dates */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-5 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                Issued
              </p>
              <p className="text-slate-800 mt-0.5">{formatDate(invoice?.issuedDate)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                Due
              </p>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-0.5 w-full text-sm border border-slate-200 rounded-md px-2 py-1 text-slate-800"
              />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                Status
              </p>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-0.5 h-8">
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

          {/* Line items table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left font-semibold text-slate-600 px-3 py-2.5">
                      Description
                    </th>
                    <th className="text-right font-semibold text-slate-600 px-3 py-2.5 w-20">
                      Qty
                    </th>
                    <th className="text-right font-semibold text-slate-600 px-3 py-2.5 w-32">
                      Unit price
                    </th>
                    <th className="text-right font-semibold text-slate-600 px-3 py-2.5 w-32">
                      Amount
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) =>
                            handleLineItemChange(idx, "description", e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-sm border-0 bg-transparent focus:bg-slate-50 rounded"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleLineItemChange(idx, "quantity", parseInt(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1.5 text-sm text-right tabular-nums border-0 bg-transparent focus:bg-slate-50 rounded"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleLineItemChange(
                              idx,
                              "unitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1.5 text-sm text-right tabular-nums border-0 bg-transparent focus:bg-slate-50 rounded"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-medium text-slate-800 whitespace-nowrap">
                        {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                      </td>
                      <td className="px-1 py-1.5">
                        <button
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleAddLineItem}
              className="flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 px-3 py-2.5 w-full border-t border-slate-100 hover:bg-teal-50/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add line item
            </button>
          </div>

          {/* Totals — bottom right, document style */}
          <div className="flex justify-end mt-6">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  Tax
                  <input
                    type="number"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-14 px-1.5 py-0.5 text-xs text-right tabular-nums border border-slate-200 rounded"
                  />
                  <span className="text-xs">%</span>
                </span>
                <span className="tabular-nums text-slate-800">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between items-baseline border-t-2 border-slate-800 pt-2 mt-1">
                <span className="text-sm font-semibold text-slate-900">Total due</span>
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 py-4 border-t border-slate-200 bg-slate-50 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={isBusy} className="gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
