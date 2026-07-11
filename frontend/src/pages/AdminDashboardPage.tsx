import { useEffect, useState } from "react";
import { ClipboardList, Shield, Star, UsersRound } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { StatusPill } from "../components/StatusPill";
import { adminApi, getApiError, usersApi } from "../services/api";
import type { Booking, Review, User, UserRole } from "../types/api";

export function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadAdminData = async () => {
    setError("");

    try {
      const [usersResponse, bookingsResponse, reviewsResponse] = await Promise.all([
        usersApi.all(),
        adminApi.bookings(),
        adminApi.reviews()
      ]);
      setUsers(usersResponse.data.data.users);
      setBookings(bookingsResponse.data.data.bookings);
      setReviews(reviewsResponse.data.data.reviews);
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const changeRole = async (id: string, role: UserRole) => {
    setNotice("");
    setError("");

    try {
      await usersApi.updateRole(id, role);
      setNotice("User role updated.");
      await loadAdminData();
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  const removeUser = async (id: string) => {
    setNotice("");
    setError("");

    try {
      await usersApi.remove(id);
      setNotice("User removed.");
      await loadAdminData();
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  const removeReview = async (id: string) => {
    setNotice("");
    setError("");

    try {
      await adminApi.removeReview(id);
      setNotice("Review removed.");
      await loadAdminData();
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-leaf" aria-hidden="true" />
          <h1 className="display-font text-2xl font-extrabold text-ink">Admin workspace</h1>
        </div>
        {error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
        {notice && <p className="mt-4 rounded-lg border border-leaf/20 bg-mint px-3 py-2 text-sm font-medium text-leaf">{notice}</p>}
      </section>

      <section className="surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <UsersRound className="h-5 w-5 text-leaf" aria-hidden="true" />
          <h2 className="text-xl font-bold text-ink">Users</h2>
        </div>
        {users.length === 0 ? (
          <EmptyState icon={UsersRound} title="No users" body="Registered users will appear here." />
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-head">Name</th>
                  <th className="table-head">Email</th>
                  <th className="table-head">Role</th>
                  <th className="table-head text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((item) => (
                  <tr key={item.id}>
                    <td className="table-cell font-semibold text-ink">{item.name}</td>
                    <td className="table-cell">{item.email}</td>
                    <td className="table-cell">
                      <select className="h-9 border border-slate-300 bg-white px-2 text-sm" value={item.role} onChange={(event) => void changeRole(item.id, event.target.value as UserRole)}>
                        <option value="STUDENT">Student</option>
                        <option value="OWNER">Owner</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="table-cell text-right">
                      <button type="button" onClick={() => void removeUser(item.id)} className="text-sm font-bold text-rose-700">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-leaf" aria-hidden="true" />
            <h2 className="text-xl font-bold text-ink">Bookings</h2>
          </div>
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-600">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between gap-3 border border-slate-200 p-3">
                  <div>
                    <p className="mono-value text-sm font-bold text-ink">{booking.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">{new Date(booking.created_at).toLocaleString()}</p>
                  </div>
                  <StatusPill status={booking.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-leaf" aria-hidden="true" />
            <h2 className="text-xl font-bold text-ink">Reviews</h2>
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-600">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink">{review.rating}/5</p>
                      <p className="mt-1 text-sm text-slate-600">{review.comment || "No comment"}</p>
                    </div>
                    <button type="button" onClick={() => void removeReview(review.id)} className="text-sm font-bold text-rose-700">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
