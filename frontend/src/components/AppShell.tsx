import {
  AlertCircle,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  XCircle,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminApi, bookingsApi, getApiError, ownersApi } from "../services/api";
import type { Booking } from "../types/api";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `dashboard-nav-link ${isActive ? "dashboard-nav-link-active" : ""}`;

function pageTitle(pathname: string) {
  if (pathname.startsWith("/settings")) return ["Settings", "Manage your account preferences"];
  if (pathname.startsWith("/dashboard")) return ["My Dashboard", "Manage your bookings and profile"];
  if (pathname.startsWith("/owner")) return ["Owner Dashboard", "Manage listings and booking requests"];
  if (pathname.startsWith("/admin")) return ["Admin Dashboard", "Review users, bookings, and content"];
  if (pathname.startsWith("/listings/")) return ["Listing Details", "Review accommodation details"];
  return ["Browse Listings", "Find your perfect accommodation"];
}

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  href: string;
  tone: "info" | "success" | "warning" | "danger";
};

const notificationIcon = {
  info: Bell,
  success: CheckCircle2,
  warning: Clock3,
  danger: XCircle
};

function formatNotificationTime(createdAt: string) {
  return new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function bookingNotification(booking: Booking, href: string): NotificationItem {
  if (booking.status === "APPROVED") {
    return {
      id: booking.id,
      title: "Booking approved",
      body: "Your stay request has been approved.",
      createdAt: booking.created_at,
      href,
      tone: "success"
    };
  }

  if (booking.status === "REJECTED" || booking.status === "CANCELLED") {
    return {
      id: booking.id,
      title: booking.status === "REJECTED" ? "Booking rejected" : "Booking cancelled",
      body: "Check your booking history for the latest status.",
      createdAt: booking.created_at,
      href,
      tone: "danger"
    };
  }

  if (booking.status === "COMPLETED") {
    return {
      id: booking.id,
      title: "Stay completed",
      body: "Your completed stay is saved in booking history.",
      createdAt: booking.created_at,
      href,
      tone: "info"
    };
  }

  return {
    id: booking.id,
    title: "Booking pending",
    body: booking.message || "Your stay request is waiting for owner review.",
    createdAt: booking.created_at,
    href,
    tone: "warning"
  };
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [title, subtitle] = pageTitle(location.pathname);
  const unreadCount = useMemo(
    () => notifications.filter((item) => item.tone === "warning").length,
    [notifications]
  );

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const loadNotifications = async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError("");

    try {
      const response =
        user.role === "STUDENT"
          ? await bookingsApi.mine()
          : user.role === "OWNER"
            ? await ownersApi.bookings()
            : await adminApi.bookings();

      const href = user.role === "STUDENT" ? "/dashboard" : user.role === "OWNER" ? "/owner" : "/admin";
      const nextNotifications = response.data.data.bookings
        .slice(0, 6)
        .map((booking) => bookingNotification(booking, href));

      setNotifications(nextNotifications);
    } catch (error) {
      setNotificationsError(getApiError(error));
    } finally {
      setNotificationsLoading(false);
    }
  };

  const toggleNotifications = () => {
    setNotificationsOpen((current) => {
      const next = !current;

      if (next) {
        void loadNotifications();
      }

      return next;
    });
  };

  useEffect(() => {
    setNotificationsOpen(false);
  }, [location.pathname]);

  if (location.pathname === "/auth") {
    return (
      <main className="min-h-screen bg-canvas">
        <Outlet />
      </main>
    );
  }

  return (
    <div className={`min-h-screen bg-canvas text-ink md:grid ${isSidebarOpen ? "md:grid-cols-[206px_1fr]" : "md:grid-cols-[56px_1fr]"}`}>
      <aside className="sticky top-0 z-30 flex border-b border-slate-200 bg-white md:h-screen md:flex-col md:border-b-0 md:border-r">
        <div className="flex h-[53px] items-center justify-between border-b border-slate-200 px-3 md:px-3">
          <NavLink to="/" className="flex min-w-0 items-center gap-2" aria-label="RentEasy home">
            <img src="/renteasy-icon-64.png" alt="" className="h-8 w-8 shrink-0 rounded-lg" />
            {isSidebarOpen && <span className="display-font truncate text-base font-extrabold text-leaf">RentEasy</span>}
          </NavLink>
          <button
            type="button"
            onClick={() => setIsSidebarOpen((current) => !current)}
            className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            aria-label={isSidebarOpen ? "Hide sidebar menu" : "Show sidebar menu"}
            aria-expanded={isSidebarOpen}
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {isSidebarOpen && user && (
          <div className="hidden items-center gap-3 border-b border-slate-200 px-2 py-3 md:flex">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-leaf text-sm font-extrabold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-4 text-ink">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role === "STUDENT" ? "Student" : user.role === "OWNER" ? "Owner" : "Admin"}</p>
            </div>
          </div>
        )}

        <nav className={`${isSidebarOpen ? "flex" : "hidden"} flex-1 flex-col gap-1 px-1 py-3 md:flex ${isSidebarOpen ? "md:flex" : "md:hidden"}`}>
          <NavLink to="/" className={navLinkClass}>
            <Search className="h-4 w-4" aria-hidden="true" />
            Browse Listings
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={navLinkClass}>
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              My Bookings
            </NavLink>
          )}
          {user && (
            <NavLink to="/dashboard" className={navLinkClass}>
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Profile
            </NavLink>
          )}
          {user?.role === "OWNER" && (
            <NavLink to="/owner" className={navLinkClass}>
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Owner
            </NavLink>
          )}
          {user?.role === "ADMIN" && (
            <NavLink to="/admin" className={navLinkClass}>
              <Shield className="h-4 w-4" aria-hidden="true" />
              Admin
            </NavLink>
          )}
          {!user && (
            <NavLink to="/auth" className={navLinkClass}>
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Sign in
            </NavLink>
          )}
        </nav>

        {isSidebarOpen && (
        <div className="mt-auto hidden border-t border-slate-200 px-1 py-3 md:block">
          <NavLink to="/settings" className={navLinkClass}>
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </NavLink>
          {user && (
            <button type="button" onClick={handleLogout} className="dashboard-nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          )}
        </div>
        )}

        <nav className={`${isSidebarOpen ? "flex" : "hidden"} ml-auto items-center gap-1 overflow-x-auto px-2 md:hidden`}>
          <NavLink to="/" className={navLinkClass}>
            <Search className="h-4 w-4" aria-hidden="true" />
            Browse
          </NavLink>
          {user && (
            <button type="button" onClick={handleLogout} className="dashboard-nav-link text-red-500">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          )}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-[53px] items-center justify-between border-b border-slate-200 bg-white px-5">
          <div>
            <h1 className="display-font text-base font-extrabold leading-5 text-ink">{title}</h1>
            <p className="text-xs font-medium text-slate-500">{subtitle}</p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={toggleNotifications}
              className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {user && (
                <span className="absolute right-1.5 top-1.5 min-h-4 min-w-4 rounded-full bg-coral px-1 text-[10px] font-extrabold leading-4 text-white">
                  {unreadCount > 0 ? unreadCount : ""}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <section className="absolute right-0 top-11 z-40 w-[320px] rounded-lg border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <h2 className="display-font text-sm font-extrabold text-ink">Notifications</h2>
                    <p className="text-xs text-slate-500">{user ? "Latest booking activity" : "Sign in to see updates"}</p>
                  </div>
                  {user && (
                    <button type="button" onClick={() => void loadNotifications()} className="text-xs font-extrabold text-leaf">
                      Refresh
                    </button>
                  )}
                </div>

                <div className="max-h-[360px] overflow-y-auto p-2">
                  {!user && (
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate("/auth");
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-slate-50"
                    >
                      <UserRound className="h-5 w-5 text-leaf" aria-hidden="true" />
                      <span>
                        <span className="block text-sm font-bold text-ink">Sign in required</span>
                        <span className="block text-xs text-slate-500">Login to view booking notifications.</span>
                      </span>
                    </button>
                  )}

                  {user && notificationsLoading && (
                    <p className="px-3 py-6 text-center text-sm font-medium text-slate-500">Loading notifications...</p>
                  )}

                  {user && notificationsError && (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                      {notificationsError}
                    </p>
                  )}

                  {user && !notificationsLoading && !notificationsError && notifications.length === 0 && (
                    <div className="px-3 py-8 text-center">
                      <AlertCircle className="mx-auto h-6 w-6 text-slate-400" aria-hidden="true" />
                      <p className="mt-2 text-sm font-bold text-ink">No notifications yet</p>
                      <p className="text-xs text-slate-500">Booking updates will appear here.</p>
                    </div>
                  )}

                  {user && !notificationsLoading && !notificationsError && notifications.map((item) => {
                    const Icon = notificationIcon[item.tone];

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate(item.href);
                        }}
                        className="flex w-full gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-slate-50"
                      >
                        <span
                          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                            item.tone === "success"
                              ? "bg-mint text-leaf"
                              : item.tone === "warning"
                                ? "bg-amber-50 text-amber-600"
                                : item.tone === "danger"
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <span className="truncate text-sm font-bold text-ink">{item.title}</span>
                            <span className="shrink-0 text-xs text-slate-400">{formatNotificationTime(item.createdAt)}</span>
                          </span>
                          <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.body}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </header>

        <main className="px-5 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
