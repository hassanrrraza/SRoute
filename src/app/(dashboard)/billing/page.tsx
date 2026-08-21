"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { getBillingData, getInvoices } from "../invoicing/actions";
import { toast } from "sonner";

interface BillingClient {
  client: any;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  tripCount: number;
  invoiceCount: number;
}

export default function BillingPage() {
  const [clientData, setClientData] = useState<BillingClient[]>([]);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientInvoices, setClientInvoices] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      const data = await getBillingData();
      setClientData(data.clientData);
      setTotalRevenue(data.totalRevenue);
      setTotalOutstanding(data.totalOutstanding);
      setInvoiceCount(data.invoiceCount);
    } catch (error) {
      toast.error("Failed to load billing data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandClient = async (clientId: string) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
      return;
    }

    if (!clientInvoices[clientId]) {
      try {
        const invoices = await getInvoices(clientId);
        setClientInvoices((prev) => ({
          ...prev,
          [clientId]: invoices,
        }));
      } catch (error) {
        toast.error("Failed to load invoices");
        return;
      }
    }

    setExpandedClient(clientId);
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700",
    SENT: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    OVERDUE: "bg-red-100 text-red-700",
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
          <p className="text-slate-500 mt-1">Client invoicing summary</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                PKR {totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">All paid invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                PKR {totalOutstanding.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Unpaid & overdue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {invoiceCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">All statuses</p>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : clientData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 font-medium">No clients with invoices yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clientData.map((data) => {
              const isExpanded = expandedClient === data.client.id;
              const invoices = clientInvoices[data.client.id] || [];

              return (
                <div key={data.client.id}>
                  {/* Client Row */}
                  <button
                    onClick={() => handleExpandClient(data.client.id)}
                    className="w-full text-left border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center gap-4">
                        <div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{data.client.name}</p>
                          <p className="text-xs text-slate-500">
                            {data.tripCount} trips • {data.invoiceCount} invoices
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-8 text-right min-w-fit">
                        <div>
                          <p className="text-xs text-slate-600">Invoiced</p>
                          <p className="font-semibold text-slate-900">
                            PKR {data.totalInvoiced.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Paid</p>
                          <p className="font-semibold text-green-600">
                            PKR {data.totalPaid.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Outstanding</p>
                          <p className="font-semibold text-orange-600">
                            PKR {data.totalOutstanding.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Invoices */}
                  {isExpanded && (
                    <div className="mt-2 ml-4 border-l-2 border-slate-200 pl-4 space-y-2">
                      {invoices.length === 0 ? (
                        <p className="text-sm text-slate-500 py-2">No invoices</p>
                      ) : (
                        invoices.map((invoice: any) => (
                          <div
                            key={invoice.id}
                            className="flex items-center justify-between bg-slate-50 p-3 rounded text-sm"
                          >
                            <div className="flex-1">
                              <p className="font-mono font-medium">{invoice.invoiceNumber}</p>
                              <p className="text-xs text-slate-500">
                                {formatDate(invoice.issuedDate)} • Due{" "}
                                {formatDate(invoice.dueDate)}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold">
                                PKR {invoice.total.toFixed(0)}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  statusColors[invoice.status] ||
                                  "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
