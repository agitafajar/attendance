"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  Clock,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  NotebookTabs,
  LogOut,
  MapPin,
  Users,
} from "lucide-react";
import { clearAuthSession, type AuthUser, type RoleName } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const allRoles: RoleName[] = ["ADMIN", "SUPERVISOR", "EMPLOYEE"];
const adminAndSupervisor: RoleName[] = ["ADMIN", "SUPERVISOR"];

const navigation: Array<{
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles: RoleName[];
}> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: allRoles },
  {
    href: "/master-data/clients",
    label: "Clients",
    icon: Building2,
    roles: adminAndSupervisor,
  },
  {
    href: "/master-data/work-locations",
    label: "Work Locations",
    icon: MapPin,
    roles: adminAndSupervisor,
  },
  { href: "/master-data/shifts", label: "Shifts", icon: Clock, roles: adminAndSupervisor },
  {
    href: "/master-data/supervisors",
    label: "Supervisors",
    icon: Users,
    roles: adminAndSupervisor,
  },
  {
    href: "/master-data/employees",
    label: "Employees",
    icon: Users,
    roles: adminAndSupervisor,
  },
  {
    href: "/master-data/assignments",
    label: "Assignments",
    icon: ClipboardCheck,
    roles: adminAndSupervisor,
  },
  { href: "/attendances", label: "Attendance", icon: CalendarClock, roles: allRoles },
  { href: "/daily-activities", label: "Activities", icon: Activity, roles: allRoles },
  { href: "/leave-requests", label: "Leave Requests", icon: NotebookTabs, roles: allRoles },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck, roles: adminAndSupervisor },
  { href: "/reports", label: "Reports", icon: FileText, roles: adminAndSupervisor },
];

export function AdminShell({
  title,
  description,
  user,
  children,
}: {
  title: string;
  description?: string;
  user: AuthUser | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const role = user?.role?.name;
  const visibleNavigation = navigation.filter((item) =>
    role ? item.roles.includes(role) : false,
  );

  function logout() {
    clearAuthSession();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[var(--brand-900)] bg-[var(--brand-900)] text-white lg:block">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--brand-yellow)] text-[var(--brand-900)]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Alih Daya</p>
              <p className="text-xs text-white/50">Attendance Admin</p>
            </div>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-white/62 transition-colors hover:bg-white/8 hover:text-white",
                  isActive &&
                    "bg-[var(--brand-yellow)] text-[var(--brand-900)] hover:bg-[var(--brand-yellow)] hover:text-[var(--brand-900)]",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="lg:pl-64">
        <header className="border-b border-[var(--border)] bg-[var(--surface)]/92 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-5 py-4 lg:px-6">
            <div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden max-w-56 truncate text-sm text-[var(--muted)] sm:inline">
                {user?.email}
              </span>
              <Button
                variant="outline"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </Button>
            </div>
          </div>
        </header>
        <div className="px-5 py-5 lg:px-6">{children}</div>
      </section>
    </main>
  );
}
