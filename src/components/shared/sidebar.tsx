"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Truck,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  Briefcase,
  LogOut,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/vehicles", label: "Vehicles", icon: Truck },
  { href: "/trips", label: "Trips", icon: MapPin },
  { href: "/dispatch", label: "Dispatch", icon: Briefcase },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/invoicing", label: "Invoicing", icon: FileText },
  { href: "/billing", label: "Billing", icon: DollarSign },
  { href: "/payroll", label: "Payroll", icon: DollarSign },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-50 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">
            S
          </div>
          <span className="text-xl font-bold">Seemroute</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 space-y-2">
        <button
          className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          onClick={() => {
            // Logout logic will go here
          }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
