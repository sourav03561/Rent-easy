import { FormEvent, useState } from "react";
import { Building2, KeyRound, Mail, UserRound } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiError } from "../services/api";
import type { UserRole } from "../types/api";

type Mode = "login" | "register";

export function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "ADMIN">>("STUDENT");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ name, email, password, role });
      }

      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (apiError) {
      setError(getApiError(apiError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-140px)] gap-6 lg:grid-cols-[1fr_440px] lg:items-stretch">
      <section className="relative min-h-[420px] overflow-hidden bg-ink text-white">
        <img
          src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=80"
          alt="Student accommodation lounge"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-8 sm:p-10">
          <span className="mb-4 grid h-12 w-12 place-items-center bg-coral">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="max-w-xl text-4xl font-black leading-tight sm:text-5xl">RentEasy</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/85">
            Find and manage student PGs, hostels, and mess stays from one focused workspace.
          </p>
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 grid grid-cols-2 border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`h-10 text-sm font-bold ${mode === "login" ? "bg-ink text-white" : "text-slate-600"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`h-10 text-sm font-bold ${mode === "register" ? "bg-ink text-white" : "text-slate-600"}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <label className="field-label">
              Name
              <span className="field-wrap">
                <UserRound className="field-icon" aria-hidden="true" />
                <input className="field-input pl-10" value={name} onChange={(event) => setName(event.target.value)} required />
              </span>
            </label>
          )}

          <label className="field-label">
            Email
            <span className="field-wrap">
              <Mail className="field-icon" aria-hidden="true" />
              <input
                className="field-input pl-10"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </span>
          </label>

          <label className="field-label">
            Password
            <span className="field-wrap">
              <KeyRound className="field-icon" aria-hidden="true" />
              <input
                className="field-input pl-10"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </span>
          </label>

          {mode === "register" && (
            <label className="field-label">
              Role
              <select className="field-input" value={role} onChange={(event) => setRole(event.target.value as Exclude<UserRole, "ADMIN">)}>
                <option value="STUDENT">Student</option>
                <option value="OWNER">Property owner</option>
              </select>
            </label>
          )}

          {error && <p className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

          <button type="submit" disabled={busy} className="primary-button w-full">
            {busy ? "Please wait" : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </section>
    </div>
  );
}
