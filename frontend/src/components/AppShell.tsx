import { Building2, ClipboardList, Home, LogOut, Search, Shield, UserRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex h-10 items-center gap-2 px-3 text-sm font-semibold transition ${
    isActive ? "bg-ink text-white" : "text-slate-700 hover:bg-slate-100 hover:text-ink"
  }`;

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] text-ink">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-leaf text-white">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-black leading-5">RentEasy</span>
              <span className="block text-xs font-medium text-slate-500">Student accommodation</span>
            </span>
          </NavLink>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/" className={navLinkClass}>
              <Search className="h-4 w-4" aria-hidden="true" />
              Browse
            </NavLink>
            {user && (
              <NavLink to="/dashboard" className={navLinkClass}>
                <Home className="h-4 w-4" aria-hidden="true" />
                Dashboard
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
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-ink">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.role}</p>
                </div>
                <button type="button" onClick={handleLogout} className="icon-button" aria-label="Log out">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <NavLink to="/auth" className={navLinkClass}>
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Sign in
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
