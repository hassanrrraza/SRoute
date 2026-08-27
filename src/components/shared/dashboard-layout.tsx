import { Sidebar } from "@/components/shared/sidebar";
import { TopBar } from "@/components/shared/topbar";

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
