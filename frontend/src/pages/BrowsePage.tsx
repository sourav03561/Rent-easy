import { FormEvent, useEffect, useState } from "react";
import { Filter, Home, Search } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { ListingCard } from "../components/ListingCard";
import { getApiError, listingsApi } from "../services/api";
import type { Listing, ListingType } from "../types/api";

export function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [city, setCity] = useState("");
  const [type, setType] = useState<ListingType | "">("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadListings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await listingsApi.search({ city, type, minRent, maxRent, available: "true" });
      setListings(response.data.data.listings);
    } catch (apiError) {
      setError(getApiError(apiError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadListings();
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void loadListings();
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-leaf">Available stays</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Browse student accommodation</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Search PGs, hostels, and mess listings by city, rent, and property type.
          </p>
        </div>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <label className="field-label">
            City
            <input className="field-input" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Siliguri" />
          </label>
          <label className="field-label">
            Type
            <select className="field-input" value={type} onChange={(event) => setType(event.target.value as ListingType | "")}>
              <option value="">Any</option>
              <option value="PG">PG</option>
              <option value="HOSTEL">Hostel</option>
              <option value="MESS">Mess</option>
            </select>
          </label>
          <label className="field-label">
            Min rent
            <input className="field-input" value={minRent} onChange={(event) => setMinRent(event.target.value)} inputMode="numeric" />
          </label>
          <label className="field-label">
            Max rent
            <input className="field-input" value={maxRent} onChange={(event) => setMaxRent(event.target.value)} inputMode="numeric" />
          </label>
          <button type="submit" className="primary-button sm:col-span-2 lg:col-span-1">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Apply filters
          </button>
        </form>
      </section>

      {error && <p className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-80 animate-pulse bg-slate-200" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState icon={Home} title="No listings found" body="Try another city, rent range, or property type." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
