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
const adminOnly: RoleName[] = ["ADMIN"];

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
    roles: adminOnly,
  },
  {
    href: "/master-data/work-locations",
    label: "Work Locations",
    icon: MapPin,
    roles: adminOnly,
  },
  { href: "/master-data/shifts", label: "Shifts", icon: Clock, roles: adminOnly },
  {
    href: "/master-data/supervisors",
    label: "Supervisors",
    icon: Users,
    roles: adminOnly,
  },
  {
    href: "/master-data/employees",
    label: "Employees",
    icon: Users,
    roles: adminOnly,
  },
  {
    href: "/master-data/assignments",
    label: "Assignments",
    icon: ClipboardCheck,
    roles: adminOnly,
  },
  { href: "/attendances", label: "Attendance", icon: CalendarClock, roles: allRoles },
  { href: "/daily-activities", label: "Activities", icon: Activity, roles: allRoles },
  { href: "/leave-requests", label: "Leave Requests", icon: NotebookTabs, roles: allRoles },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck, roles: adminAndSupervisor },
  { href: "/reports", label: "Reports", icon: FileText, roles: adminOnly },
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
      <aside className="fixed inset-y-0 left-0 hidden w-[17rem] border-r border-white/10 bg-[var(--brand-950)] text-white shadow-2xl shadow-slate-950/10 lg:block">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--brand-500)] text-white shadow-lg shadow-teal-950/25">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">Alih Daya</p>
              <p className="text-xs text-white/55">Attendance Admin</p>
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
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-white/62 transition-all hover:bg-white/8 hover:text-white",
                  isActive &&
                    "bg-white text-[var(--brand-950)] shadow-sm hover:bg-white hover:text-[var(--brand-950)]",
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-[var(--brand-700)]")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="lg:pl-[17rem]">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/88 backdrop-blur-xl">
          <div className="flex min-h-18 items-center justify-between gap-4 px-5 py-4 lg:px-8">
            <div className="min-w-0">
              <p className="mb-1 hidden text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-700)] sm:block">
                Operations Console
              </p>
              <h1 className="truncate text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                  {description}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 rounded-md border border-[var(--border)] bg-white px-3 py-2 shadow-sm shadow-slate-900/4 md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--surface-soft)] text-xs font-bold text-[var(--brand-900)]">
                  {user?.email?.slice(0, 1).toUpperCase() ?? "A"}
                </div>
                <div className="min-w-0">
                  <p className="max-w-44 truncate text-sm font-semibold text-[var(--foreground)]">
                    {user?.email}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{role ?? "User"}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="h-10 px-3 sm:px-4"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </header>
        <div className="px-5 py-6 lg:px-8 lg:py-8">{children}</div>
      </section>
    </main>
  );
}
