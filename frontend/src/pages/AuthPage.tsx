import { FormEvent, useState } from "react";
import { KeyRound, Mail, UserRound } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiError } from "../services/api";
import type { UserRole } from "../types/api";

type Mode = "login" | "register";
type RegisterRole = Exclude<UserRole, "ADMIN">;

const registerRoles: RegisterRole[] = ["STUDENT", "OWNER"];

export function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRole>("STUDENT");
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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <section className="w-full max-w-[420px]">
        <div className="mb-9 flex items-center justify-center gap-2">
          <img src="/renteasy-icon-64.png" alt="" className="h-8 w-8 rounded-lg" />
          <span className="display-font text-lg font-extrabold text-leaf">RentEasy</span>
        </div>

        <div className="mb-7 text-center">
          <h1 className="display-font text-3xl font-extrabold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Sign in to your account to continue.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`h-10 rounded-lg text-sm font-bold transition ${
              mode === "login" ? "bg-white text-ink shadow-panel" : "text-slate-500 hover:text-ink"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`h-10 rounded-lg text-sm font-bold transition ${
              mode === "register" ? "bg-white text-ink shadow-panel" : "text-slate-500 hover:text-ink"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <label className="field-label">
              Full name
              <span className="field-wrap">
                <UserRound className="field-icon" aria-hidden="true" />
                <input
                  className="field-input pl-10"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Sourav Sarkar"
                  required
                />
              </span>
            </label>
          )}

          <label className="field-label">
            Email address
            <span className="field-wrap">
              <Mail className="field-icon" aria-hidden="true" />
              <input
                className="field-input pl-10"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
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
                placeholder="••••••••"
                required
              />
            </span>
          </label>

          {mode === "register" && (
            <div>
              <p className="field-label">I am a</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {registerRoles.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={`h-10 rounded-lg border text-sm font-bold transition ${
                      role === item
                        ? "border-leaf bg-mint text-leaf"
                        : "border-slate-200 bg-white text-slate-600 hover:border-leaf/50 hover:text-leaf"
                    }`}
                  >
                    {item === "STUDENT" ? "Student" : "Owner"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

          <button type="submit" disabled={busy} className="primary-button mt-2 w-full">
            {busy ? "Please wait" : mode === "login" ? "Sign In" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {mode === "login" ? "No account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="font-extrabold text-leaf"
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </p>
      </section>
    </div>
  );
}
