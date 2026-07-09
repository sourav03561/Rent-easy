import { FormEvent, useEffect, useState } from "react";
import { Building2, ClipboardList, Plus } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { ListingCard } from "../components/ListingCard";
import { StatusPill } from "../components/StatusPill";
import { bookingsApi, getApiError, listingsApi, ownersApi, type ListingPayload } from "../services/api";
import type { Booking, Listing, ListingType } from "../types/api";

const initialListing: ListingPayload = {
  title: "",
  type: "PG",
  city: "",
  address: "",
  price: 5000,
  amenities: [],
  photos: [],
  available: true,
  description: ""
};

export function OwnerDashboardPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [form, setForm] = useState<ListingPayload>(initialListing);
  const [amenitiesText, setAmenitiesText] = useState("");
  const [photosText, setPhotosText] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadOwnerData = async () => {
    setError("");

    try {
      const [listingsResponse, bookingsResponse] = await Promise.all([ownersApi.listings(), ownersApi.bookings()]);
      setListings(listingsResponse.data.data.listings);
      setBookings(bookingsResponse.data.data.bookings);
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  useEffect(() => {
    void loadOwnerData();
  }, []);

  const createListing = async (event: FormEvent) => {
    event.preventDefault();
    setNotice("");
    setError("");

    try {
      await listingsApi.create({
        ...form,
        amenities: amenitiesText.split(",").map((item) => item.trim()).filter(Boolean),
        photos: photosText.split(",").map((item) => item.trim()).filter(Boolean)
      });
      setForm(initialListing);
      setAmenitiesText("");
      setPhotosText("");
      setNotice("Listing created.");
      await loadOwnerData();
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  const removeListing = async (id: string) => {
    setNotice("");
    setError("");

    try {
      await listingsApi.remove(id);
      setNotice("Listing removed.");
      await loadOwnerData();
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  const updateBooking = async (id: string, action: "approve" | "reject") => {
    setNotice("");
    setError("");

    try {
      if (action === "approve") {
        await bookingsApi.approve(id);
      } else {
        await bookingsApi.reject(id);
      }

      setNotice(`Booking ${action}d.`);
      await loadOwnerData();
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form onSubmit={createListing} className="border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Plus className="h-5 w-5 text-leaf" aria-hidden="true" />
            <h1 className="text-xl font-black text-ink">New listing</h1>
          </div>

          {error && <p className="mb-4 border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
          {notice && <p className="mb-4 border border-leaf/20 bg-mint px-3 py-2 text-sm font-medium text-leaf">{notice}</p>}

          <div className="grid gap-4">
            <label className="field-label">
              Title
              <input className="field-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field-label">
                Type
                <select className="field-input" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ListingType })}>
                  <option value="PG">PG</option>
                  <option value="HOSTEL">Hostel</option>
                  <option value="MESS">Mess</option>
                </select>
              </label>
              <label className="field-label">
                Rent
                <input className="field-input" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
              </label>
            </div>
            <label className="field-label">
              City
              <input className="field-input" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required />
            </label>
            <label className="field-label">
              Address
              <input className="field-input" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
            </label>
            <label className="field-label">
              Amenities
              <input className="field-input" value={amenitiesText} onChange={(event) => setAmenitiesText(event.target.value)} placeholder="WiFi, Food, Laundry" />
            </label>
            <label className="field-label">
              Photo URLs
              <input className="field-input" value={photosText} onChange={(event) => setPhotosText(event.target.value)} />
            </label>
            <label className="field-label">
              Description
              <textarea className="field-input min-h-24 resize-y" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <button type="submit" className="primary-button">Create listing</button>
          </div>
        </form>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Owned listings</h2>
            <span className="text-sm font-semibold text-slate-500">{listings.length} total</span>
          </div>
          {listings.length === 0 ? (
            <EmptyState icon={Building2} title="No listings yet" body="Create your first listing to start receiving booking requests." />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {listings.map((listing) => (
                <div key={listing.id} className="space-y-2">
                  <ListingCard listing={listing} compact />
                  <button type="button" onClick={() => void removeListing(listing.id)} className="secondary-button w-full">
                    Remove listing
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-leaf" aria-hidden="true" />
          <h2 className="text-xl font-bold text-ink">Booking requests</h2>
        </div>
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-600">No booking requests yet.</p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-head">Booking</th>
                  <th className="table-head">Listing</th>
                  <th className="table-head">Status</th>
                  <th className="table-head text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="table-cell font-semibold text-ink">{booking.id.slice(0, 8)}</td>
                    <td className="table-cell">{booking.listing_id.slice(0, 8)}</td>
                    <td className="table-cell"><StatusPill status={booking.status} /></td>
                    <td className="table-cell text-right">
                      {booking.status === "PENDING" && (
                        <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => void updateBooking(booking.id, "approve")} className="text-sm font-bold text-leaf">
                            Approve
                          </button>
                          <button type="button" onClick={() => void updateBooking(booking.id, "reject")} className="text-sm font-bold text-rose-700">
                            Reject
                          </button>
                        </div>
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
