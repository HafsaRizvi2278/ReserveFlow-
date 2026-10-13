"use client";
import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "../lib/navigation";
import { apiService } from "../services/apiService";
import { useStore } from "../app/store";
import { Button, Modal } from "./ui";

const employeeNav = [
  { to: "/dashboard", label: "Overview", icon: "⌂" },
  { to: "/resources", label: "Resources", icon: "◇" },
  { to: "/reservations", label: "My Reservations", icon: "▣" },
];
const adminNav = [
  { to: "/admin/resources", label: "Manage Resources", icon: "□" },
  { to: "/admin/reservations", label: "All Reservations", icon: "≡" },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, reservations } = useStore();
  const upcoming = reservations.filter(
    (item) =>
      item.userId === user?.id &&
      item.status === "confirmed" &&
      new Date(item.endsAt) > new Date(),
  ).length;
  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white text-slate-600">
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className="flex h-20 items-center gap-3 border-b border-slate-200 px-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-700"
        aria-label="ReserveFlow overview"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 font-semibold text-white">
          R
        </span>
        <span>
          <strong className="block text-card-title font-semibold text-slate-900">
            ReserveFlow
          </strong>
          <small className="text-helper text-slate-500">
            Workspace operations
          </small>
        </span>
      </Link>
      <nav
        className="flex-1 space-y-1 px-3 py-6"
        aria-label="Primary navigation"
      >
        {[...employeeNav, ...(user?.role === "admin" ? adminNav : [])].map(
          (item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-button font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 ${isActive ? "bg-brand-50 text-brand-800 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
              }
            >
              <span className="w-5 text-center text-base" aria-hidden="true">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.to === "/reservations" && upcoming > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-helper tabular-nums">
                  {upcoming}
                </span>
              )}
            </NavLink>
          ),
        )}
      </nav>
      <div className="border-t border-slate-200 p-4 text-helper text-slate-500">
        ReserveFlow workspace
        <br />
        Asia/Colombo timezone
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [failure, setFailure] = useState("");
  useEffect(() => {
    if (!profileOpen) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    const outside = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("mousedown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("mousedown", outside);
    };
  }, [profileOpen]);
  const titles: Record<string, string> = {
    "/dashboard": "Overview",
    "/resources": "Resources",
    "/reservations": "My Reservations",
    "/admin/resources": "Manage Resources",
    "/admin/reservations": "All Reservations",
  };
  const title = location.pathname.startsWith("/resources/")
    ? "Resource details"
    : (titles[location.pathname] ?? "ReserveFlow");
  const logout = async () => {
    try {
      await apiService.signOut();
      window.location.assign("/login");
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Unable to sign out.");
    }
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar />
      </aside>
      <Modal
        open={mobileOpen}
        title="Navigation"
        onClose={() => setMobileOpen(false)}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Modal>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="min-h-9 px-3 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <span aria-hidden="true">☰</span>
            </Button>
            <div>
              <div className="text-card-title font-semibold text-slate-900">
                {title}
              </div>
              <div className="hidden text-helper text-slate-500 sm:block">
                Sri Lanka time (UTC+05:30)
              </div>
            </div>
          </div>
          <div className="relative" ref={profileRef}>
            <Button
              variant="ghost"
              className="gap-3 px-2"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-expanded={profileOpen}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-800 ring-1 ring-brand-200">
                {user?.name.charAt(0)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-button font-semibold text-slate-800">
                  {user?.name}
                </span>
                <span className="block text-helper font-normal capitalize text-slate-500">
                  {user?.role}
                </span>
              </span>
              <span aria-hidden="true">⌄</span>
            </Button>
            {profileOpen && (
              <div
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                aria-label="Profile menu"
              >
                <div className="border-b border-slate-100 px-3 py-2 text-helper text-slate-500">
                  {user?.email}
                </div>

                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-button text-danger-700 hover:bg-danger-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
                  onClick={logout}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {failure && (
            <p role="alert" className="mb-4 text-danger-700">
              {failure}
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
