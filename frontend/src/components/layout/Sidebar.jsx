import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Menu,
  School,
  UserCog,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["SYSTEM_ADMIN", "DEPARTMENT_ADMIN", "REGISTRAR", "TEACHER"],
  },
  {
    to: "/students",
    label: "Students",
    icon: GraduationCap,
    roles: ["SYSTEM_ADMIN", "DEPARTMENT_ADMIN", "REGISTRAR"],
  },
  {
    to: "/classes",
    label: "Classes",
    icon: School,
    roles: ["SYSTEM_ADMIN", "DEPARTMENT_ADMIN", "REGISTRAR"],
  },
  {
    to: "/subjects",
    label: "Subjects",
    icon: BookOpen,
    roles: ["SYSTEM_ADMIN", "DEPARTMENT_ADMIN", "REGISTRAR"],
  },
  {
    to: "/teachers",
    label: "Teachers",
    icon: UserCog,
    roles: ["SYSTEM_ADMIN", "DEPARTMENT_ADMIN", "REGISTRAR"],
  },
  {
    to: "/departments",
    label: "Departments",
    icon: Building2,
    roles: ["SYSTEM_ADMIN", "DEPARTMENT_ADMIN"],
  },
  {
    to: "/terms",
    label: "Terms",
    icon: CalendarDays,
    roles: ["SYSTEM_ADMIN", "REGISTRAR"],
  },
  {
    to: "/marks",
    label: "Marks",
    icon: ClipboardCheck,
    roles: ["SYSTEM_ADMIN", "REGISTRAR", "TEACHER"],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["SYSTEM_ADMIN", "DEPARTMENT_ADMIN", "REGISTRAR", "TEACHER"],
  },
];

const Sidebar = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userRoles = user?.roles || [];

  const hasAccess = (itemRoles) =>
    itemRoles.some((role) => userRoles.includes(role));

  const visibleItems = navItems.filter((item) => hasAccess(item.roles));

  const navLinks = (onClick) =>
    visibleItems.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onClick}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-700 hover:bg-emerald-50"
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {item.label}
        </NavLink>
      );
    });

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center gap-2 border-b border-emerald-100 bg-white/90 px-3 py-2 lg:hidden">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-700 hover:bg-emerald-50"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-xs font-semibold text-slate-600">Navigation</span>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-emerald-100 px-4 py-3">
          <span className="text-sm font-bold text-slate-800">Menu</span>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {navLinks(() => setMobileOpen(false))}
        </nav>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-emerald-100 bg-white/90 lg:block">
        <nav className="space-y-1 p-4">{navLinks()}</nav>
      </aside>
    </>
  );
};

export default Sidebar;
