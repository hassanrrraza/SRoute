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

export default function Dashboard() {
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
              <div className="text-2xl font-bold text-slate-900">5</div>
              <p className="text-xs text-slate-500 mt-1">2 in maintenance</p>
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
              <div className="text-2xl font-bold text-slate-900">6</div>
              <p className="text-xs text-slate-500 mt-1">2 on trip</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Today's Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">8</div>
              <p className="text-xs text-slate-500 mt-1">
                1 in progress, 3 pending
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
              <div className="text-2xl font-bold text-slate-900">3</div>
              <p className="text-xs text-slate-500 mt-1">PKR 12,500 total</p>
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
                  {[
                    {
                      id: 1,
                      pickup: "Airport Terminal 1",
                      dropoff: "Pearl Continental Hotel",
                      driver: "Ahmed Hassan",
                      status: "Completed",
                      fare: "2,500",
                    },
                    {
                      id: 2,
                      pickup: "Ghulamali Station",
                      dropoff: "Dolmen Mall",
                      driver: "Muhammad Ali",
                      status: "In Progress",
                      fare: "1,800",
                    },
                    {
                      id: 3,
                      pickup: "Clifton",
                      dropoff: "DHA",
                      driver: "Fatima Khan",
                      status: "Scheduled",
                      fare: "3,000",
                    },
                  ].map((trip) => (
                    <div
                      key={trip.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {trip.pickup} → {trip.dropoff}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {trip.driver}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                            trip.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : trip.status === "In Progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {trip.status}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 mt-1">
                          PKR {trip.fare}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">This Week</span>
                  <span className="text-lg font-bold text-slate-900">
                    PKR 45,200
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: "72%" }}
                  ></div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Target</span>
                    <span className="text-slate-900">PKR 60,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-900">
                  <AlertCircle className="w-4 h-4" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li>• Vehicle XY-05-IJ maintenance pending</li>
                  <li>• Driver Hassan Raza off duty</li>
                  <li>• 1 invoice overdue</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
