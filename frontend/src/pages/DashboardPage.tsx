import { FormEvent, useEffect, useMemo, useState } from "react";
import { ClipboardList, Home, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { StatusPill } from "../components/StatusPill";
import { useAuth } from "../context/AuthContext";
import { bookingsApi, getApiError, usersApi } from "../services/api";
import type { Booking, Profile } from "../types/api";

export function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const isStudent = user?.role === "STUDENT";

  const loadDashboard = async () => {
    setError("");

    try {
      const profileResponse = await usersApi.me();
      setProfile(profileResponse.data.data.profile);
      setName(profileResponse.data.data.user.name);
      setPhone(profileResponse.data.data.profile?.phone ?? "");

      if (isStudent) {
        const bookingsResponse = await bookingsApi.mine();
        setBookings(bookingsResponse.data.data.bookings);
      }
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [isStudent]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setNotice("");
    setError("");

    try {
      await usersApi.updateMe({ name, fullName: name, phone });
      await refreshUser();
      setNotice("Profile updated.");
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  const cancelBooking = async (id: string) => {
    setNotice("");
    setError("");

    try {
      await bookingsApi.cancel(id);
      setNotice("Booking cancelled.");
      await loadDashboard();
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  const roleLink = useMemo(() => {
    if (user?.role === "OWNER") return { to: "/owner", label: "Open owner workspace", icon: Home };
    if (user?.role === "ADMIN") return { to: "/admin", label: "Open admin workspace", icon: Shield };
    return null;
  }, [user?.role]);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">{user?.email}</p>

        {error && <p className="mt-4 border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
        {notice && <p className="mt-4 border border-leaf/20 bg-mint px-3 py-2 text-sm font-medium text-leaf">{notice}</p>}

        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          <label className="field-label">
            Name
            <input className="field-input" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="field-label">
            Phone
            <input className="field-input" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <button type="submit" className="primary-button w-full">Save profile</button>
        </form>

        {profile?.created_at && <p className="mt-4 text-xs text-slate-500">Joined {new Date(profile.created_at).toLocaleDateString()}</p>}

        {roleLink && (
          <Link to={roleLink.to} className="secondary-button mt-5 w-full">
            <roleLink.icon className="h-4 w-4" aria-hidden="true" />
            {roleLink.label}
          </Link>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">{isStudent ? "My bookings" : "Workspace"}</h2>
          {isStudent && <Link to="/" className="secondary-button">Browse listings</Link>}
        </div>

        {!isStudent && roleLink ? (
          <EmptyState icon={roleLink.icon} title={roleLink.label} body="Use your role workspace for listings, requests, moderation, and account operations." />
        ) : bookings.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No bookings yet" body="Booking requests will appear here after you send them." />
        ) : (
          <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-head">Booking</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Created</th>
                  <th className="table-head text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="table-cell font-semibold text-ink">{booking.id.slice(0, 8)}</td>
                    <td className="table-cell"><StatusPill status={booking.status} /></td>
                    <td className="table-cell">{new Date(booking.created_at).toLocaleDateString()}</td>
                    <td className="table-cell text-right">
                      {booking.status === "PENDING" && (
                        <button type="button" onClick={() => void cancelBooking(booking.id)} className="text-sm font-bold text-rose-700">
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
