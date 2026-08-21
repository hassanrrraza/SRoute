import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Truck,
  MapPin,
  FileText,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/db";

async function getStats() {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: "ACTIVE" },
  });

  const drivers = await prisma.driver.findMany({
    where: { status: "AVAILABLE" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tripsToday = await prisma.trip.findMany({
    where: {
      scheduledTime: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  const completedToday = tripsToday.filter((t) => t.status === "COMPLETED").length;
  const inProgressToday = tripsToday.filter((t) => t.status === "IN_PROGRESS").length;

  const pendingInvoices = await prisma.invoice.count({
    where: { status: { in: ["DRAFT", "SENT"] } },
  });

  // Overdue invoices (past due date and not paid)
  const overdueInvoices = await prisma.invoice.count({
    where: {
      status: { not: "PAID" },
      dueDate: { lt: new Date() },
    },
  });

  // Total all-time revenue
  const totalRevenue = await prisma.invoice.aggregate({
    where: { status: "PAID" },
    _sum: { total: true },
  });

  // Weekly revenue (last 7 days, paid invoices)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyRevenue = await prisma.invoice.aggregate({
    where: {
      status: "PAID",
      paidDate: { gte: weekAgo },
    },
    _sum: { total: true },
  });

  // Pending payroll
  const pendingPayrollEntries = await prisma.payrollEntry.findMany({
    where: { status: "PENDING" },
  });

  const pendingPayrollCount = pendingPayrollEntries.length;
  const pendingPayrollAmount = pendingPayrollEntries.reduce((sum, e) => sum + e.grossPay, 0);

  return {
    activeVehicles: vehicles.length,
    availableDrivers: drivers.length,
    tripsToday: tripsToday.length,
    completedToday,
    inProgressToday,
    pendingInvoices,
    overdueInvoices,
    totalRevenue: totalRevenue._sum.total || 0,
    weeklyRevenue: weeklyRevenue._sum.total || 0,
    pendingPayrollCount,
    pendingPayrollAmount,
  };
}

async function getRecentTrips() {
  const trips = await prisma.trip.findMany({
    include: { client: true, driver: true },
    orderBy: { scheduledTime: "desc" },
    take: 5,
  });
  return trips;
}

export default async function Dashboard() {
  const stats = await getStats();
  const recentTrips = await getRecentTrips();

  const statusColors = {
    SCHEDULED: "bg-slate-100 text-slate-700",
    DISPATCHED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back! Here's an overview of your transportation fleet.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Active Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.activeVehicles}
              </div>
              <p className="text-xs text-slate-500 mt-1">Ready for dispatch</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Available Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.availableDrivers}
              </div>
              <p className="text-xs text-slate-500 mt-1">Ready for assignment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Trips Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.tripsToday}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.inProgressToday} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Pending Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.pendingInvoices}
              </div>
              <p className="text-xs text-slate-500 mt-1">Awaiting payment</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTrips.length === 0 ? (
                    <p className="text-sm text-slate-500">No trips found</p>
                  ) : (
                    recentTrips.map((trip) => (
                      <div
                        key={trip.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {trip.pickupAddress.split(",")[0]} →{" "}
                            {trip.dropoffAddress.split(",")[0]}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {trip.client?.name} | {trip.driver?.name || "Unassigned"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                              statusColors[trip.status as keyof typeof statusColors] ||
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {trip.status}
                          </span>
                          <p className="text-sm font-semibold text-slate-900 mt-1">
                            PKR {trip.fare.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">This Week</span>
                  <span className="text-lg font-bold text-green-600">
                    PKR {stats.weeklyRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (stats.weeklyRevenue / Math.max(stats.weeklyRevenue, 50000)) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">All-time total</p>
                  <p className="text-lg font-bold text-slate-900">
                    PKR {stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {stats.overdueInvoices > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <AlertCircle className="w-4 h-4" />
                    Overdue Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600 mb-2">
                    {stats.overdueInvoices}
                  </p>
                  <p className="text-sm text-red-800">
                    {stats.overdueInvoices === 1
                      ? "1 invoice is overdue"
                      : `${stats.overdueInvoices} invoices are overdue`}
                  </p>
                </CardContent>
              </Card>
            )}

            {stats.pendingPayrollCount > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-yellow-900">
                    <AlertCircle className="w-4 h-4" />
                    Pending Payroll
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-600 mb-2">
                    PKR {stats.pendingPayrollAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-yellow-800">
                    {stats.pendingPayrollCount} {stats.pendingPayrollCount === 1 ? "entry" : "entries"}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <AlertCircle className="w-4 h-4" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li>• {stats.completedToday} trips completed today</li>
                  <li>• {stats.pendingInvoices} invoices pending</li>
                  <li>• {stats.availableDrivers} drivers available</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
