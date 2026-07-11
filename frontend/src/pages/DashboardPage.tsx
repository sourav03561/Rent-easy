import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpen, Check, Clock3, IndianRupee, Shield } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { StatusPill } from "../components/StatusPill";
import { useAuth } from "../context/AuthContext";
import { bookingsApi, getApiError, usersApi } from "../services/api";
import type { Booking, Profile } from "../types/api";

type DashboardTab = "history" | "profile";

type StatCardProps = {
  icon: React.ElementType;
  iconClassName: string;
  label: string;
  value: string;
};

function StatCard({ icon: Icon, iconClassName, label, value }: StatCardProps) {
  return (
    <article className="surface flex h-[76px] items-center gap-4 px-4">
      <span className={`grid h-10 w-10 place-items-center rounded-lg ${iconClassName}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className="display-font mt-1 text-xl font-extrabold leading-none text-ink">{value}</p>
      </div>
    </article>
  );
}

export function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [college, setCollege] = useState("IIT Bangalore");
  const [programme, setProgramme] = useState("B.Tech Computer Science");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("history");
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
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();
      const response = await usersApi.updateMe({
        name: trimmedName,
        fullName: trimmedName,
        ...(trimmedPhone ? { phone: trimmedPhone } : {})
      });

      setName(response.data.data.profile.full_name ?? trimmedName);
      setPhone(response.data.data.profile.phone ?? "");
      setProfile(response.data.data.profile);
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

  const stats = useMemo(() => {
    const active = bookings.filter((booking) => booking.status === "APPROVED" || booking.status === "COMPLETED").length;
    const pending = bookings.filter((booking) => booking.status === "PENDING").length;

    return {
      total: bookings.length,
      active,
      pending,
      spent: active > 0 ? `₹${(active * 20.5).toFixed(1)}k` : "₹0"
    };
  }, [bookings]);

  if (!isStudent) {
    return (
      <EmptyState
        icon={Shield}
        title="Workspace available from the sidebar"
        body="Use the owner or admin workspace for role-specific actions."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-4">
        <StatCard icon={BookOpen} iconClassName="bg-mint text-leaf" label="Total Bookings" value={String(stats.total)} />
        <StatCard icon={Check} iconClassName="bg-mint text-leaf" label="Active Stays" value={String(stats.active)} />
        <StatCard icon={Clock3} iconClassName="bg-amber-50 text-amber-600" label="Pending" value={String(stats.pending)} />
        <StatCard icon={IndianRupee} iconClassName="bg-violet-50 text-violet-600" label="Spent (2025)" value={stats.spent} />
      </section>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
      {notice && <p className="rounded-lg border border-leaf/20 bg-mint px-3 py-2 text-sm font-medium text-leaf">{notice}</p>}

      <section>
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`h-11 px-4 text-sm font-extrabold ${
              activeTab === "history" ? "-mb-px border-b-2 border-leaf text-leaf" : "text-ink"
            }`}
          >
            Booking History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`h-11 px-4 text-sm font-extrabold ${
              activeTab === "profile" ? "-mb-px border-b-2 border-leaf text-leaf" : "text-ink"
            }`}
          >
            Edit Profile
          </button>
        </div>

        {activeTab === "history" && (
          <div className="mt-5">
            {bookings.length === 0 ? (
              <EmptyState icon={BookOpen} title="No booking history yet" body="Your booking requests will appear here after you request a stay." />
            ) : (
              <section className="surface overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-head">Booking</th>
                      <th className="table-head">Status</th>
                      <th className="table-head">Created</th>
                      <th className="table-head">Message</th>
                      <th className="table-head text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="table-cell mono-value font-semibold text-ink">{booking.id.slice(0, 8)}</td>
                        <td className="table-cell"><StatusPill status={booking.status} /></td>
                        <td className="table-cell">{new Date(booking.created_at).toLocaleDateString()}</td>
                        <td className="table-cell">{booking.message || "No message"}</td>
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
              </section>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="mt-5 grid gap-5 lg:grid-cols-[232px_1fr]">
            <aside className="surface flex h-fit flex-col items-center p-5 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-mint text-2xl font-extrabold text-leaf">
                {(name || user?.name || "U").slice(0, 1).toUpperCase()}
              </div>
              <h2 className="display-font mt-4 text-lg font-extrabold text-ink">{name || user?.name}</h2>
              <p className="text-sm text-slate-500">{profile?.email ?? user?.email}</p>
              <span className="mt-2 inline-flex h-7 items-center gap-1 rounded border border-leaf/30 bg-mint px-2 text-xs font-bold text-leaf">
                <Check className="h-3 w-3" aria-hidden="true" />
                active
              </span>

              <div className="mt-4 grid w-full grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="display-font text-lg font-extrabold text-ink">{stats.total}</p>
                  <p className="text-xs text-slate-500">Bookings</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="display-font text-lg font-extrabold text-ink">{stats.active}</p>
                  <p className="text-xs text-slate-500">Active Stay</p>
                </div>
              </div>
            </aside>

            <form onSubmit={saveProfile} className="surface p-5">
              <h2 className="display-font text-xl font-extrabold text-ink">Edit Profile</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="field-label">
                  Full name
                  <input className="field-input" value={name} onChange={(event) => setName(event.target.value)} />
                </label>
                <label className="field-label">
                  Email
                  <input className="field-input" value={user?.email ?? ""} disabled />
                </label>
                <label className="field-label">
                  Phone number
                  <input className="field-input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" />
                </label>
                <label className="field-label">
                  City
                  <input className="field-input" value={city} onChange={(event) => setCity(event.target.value)} />
                </label>
                <label className="field-label">
                  College / University
                  <input className="field-input" value={college} onChange={(event) => setCollege(event.target.value)} />
                </label>
                <label className="field-label">
                  Programme
                  <input className="field-input" value={programme} onChange={(event) => setProgramme(event.target.value)} />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="secondary-button" onClick={() => void loadDashboard()}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
