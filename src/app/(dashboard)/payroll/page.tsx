import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PayrollPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payroll</h1>
            <p className="text-slate-500 mt-1">Manage driver payroll</p>
          </div>
          <Button>Process Payroll</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payroll Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-slate-500 py-8">
              Payroll system coming soon...
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
