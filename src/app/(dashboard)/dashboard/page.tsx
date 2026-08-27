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
    SCHEDULED: "bg-neutral-100 text-neutral-700",
    DISPATCHED: "bg-primary-100 text-primary-700",
    IN_PROGRESS: "bg-warning-100 text-warning-700",
    COMPLETED: "bg-success-100 text-success-700",
    CANCELLED: "bg-danger-100 text-danger-700",
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-500">
            Command center for your transportation fleet — real-time overview and key metrics
          </p>
        </div>

        {/* Stats Grid - Command Center */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Vehicles */}
          <Card className="border-neutral-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-neutral-600 flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 rounded-lg">
                  <Truck className="w-5 h-5 text-teal-600" />
                </div>
                Active Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-neutral-900 mb-2">
                {stats.activeVehicles}
              </div>
              <p className="text-sm text-neutral-500">Ready for dispatch</p>
              <div className="mt-4 w-full bg-neutral-200 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-teal-500 h-1"
                  style={{
                    width: `${Math.min((stats.activeVehicles / 10) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Available Drivers */}
          <Card className="border-neutral-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-neutral-600 flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 rounded-lg">
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
                Available Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-neutral-900 mb-2">
                {stats.availableDrivers}
              </div>
              <p className="text-sm text-neutral-500">Ready for assignment</p>
              <div className="mt-4 w-full bg-neutral-200 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-teal-500 h-1"
                  style={{
                    width: `${Math.min((stats.availableDrivers / 10) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Trips Today */}
          <Card className="border-neutral-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-neutral-600 flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-teal-600" />
                </div>
                Trips Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-neutral-900 mb-2">
                {stats.tripsToday}
              </div>
              <p className="text-sm text-neutral-500">
                <span className="font-semibold text-green-600">{stats.completedToday}</span> completed,{" "}
                <span className="font-semibold text-amber-600">{stats.inProgressToday}</span> in progress
              </p>
              <div className="mt-4 w-full bg-neutral-200 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-teal-500 h-1"
                  style={{
                    width: `${Math.min((stats.completedToday / Math.max(stats.tripsToday, 5)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Invoices */}
          <Card className="border-neutral-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-neutral-600 flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 rounded-lg">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                Pending Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-neutral-900 mb-2">
                {stats.pendingInvoices}
              </div>
              <p className="text-sm text-neutral-500">Awaiting payment</p>
              <div className="mt-4 w-full bg-neutral-200 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-teal-500 h-1"
                  style={{
                    width: `${Math.min((stats.pendingInvoices / 20) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-neutral-200">
              <CardHeader className="pb-6">
                <CardTitle className="text-lg font-semibold text-neutral-900">Recent Trips</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTrips.length === 0 ? (
                  <div className="py-12 text-center">
                    <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 font-medium">No trips yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTrips.map((trip) => (
                      <div
                        key={trip.id}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">
                            {trip.pickupAddress.split(",")[0]} → {trip.dropoffAddress.split(",")[0]}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {trip.client?.name} • {trip.driver?.name || "Unassigned"}
                          </p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <span
                            className={`inline-block px-3 py-1 text-xs rounded-full font-semibold mb-2 ${
                              statusColors[trip.status as keyof typeof statusColors] ||
                              "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {trip.status}
                          </span>
                          <p className="text-sm font-bold text-neutral-900">
                            PKR {trip.fare.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Revenue Card */}
            <Card className="border-neutral-200 bg-gradient-to-br from-teal-50 to-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">This Week</p>
                  <p className="text-3xl font-bold text-teal-600 mt-2">
                    PKR {stats.weeklyRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">All-Time Total</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-2">
                    PKR {stats.totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            {stats.overdueInvoices > 0 && (
              <Card className="border-danger-200 bg-danger-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-danger-900 text-sm font-semibold">
                    <AlertCircle className="w-5 h-5" />
                    Overdue Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-danger-600 mb-2">{stats.overdueInvoices}</p>
                  <p className="text-sm text-danger-700">
                    {stats.overdueInvoices === 1
                      ? "1 invoice requires attention"
                      : `${stats.overdueInvoices} invoices need follow-up`}
                  </p>
                </CardContent>
              </Card>
            )}

            {stats.pendingPayrollCount > 0 && (
              <Card className="border-warning-200 bg-warning-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-warning-900 text-sm font-semibold">
                    <AlertCircle className="w-5 h-5" />
                    Pending Payroll
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-warning-600 mb-2">
                    PKR {stats.pendingPayrollAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-warning-700">
                    {stats.pendingPayrollCount} {stats.pendingPayrollCount === 1 ? "entry" : "entries"} pending
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
