import { FormEvent, useEffect, useMemo, useState } from "react";
import { Filter, Home, Search, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { ListingCard } from "../components/ListingCard";
import { getApiError, listingsApi } from "../services/api";
import type { Listing, ListingType } from "../types/api";

export function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [query, setQuery] = useState("");
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

  const visibleListings = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return listings;

    return listings.filter((listing) =>
      [listing.title, listing.city, listing.address, listing.type].join(" ").toLowerCase().includes(search)
    );
  }, [listings, query]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void loadListings();
  };

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-ink shadow-panel outline-none transition placeholder:text-slate-400 focus:border-leaf focus:ring-2 focus:ring-leaf/15"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, city..."
        />
      </div>

      <form onSubmit={submit} className="surface p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-600">
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          Filters
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="field-label">
            City
            <input className="field-input" value={city} onChange={(event) => setCity(event.target.value)} placeholder="All Cities" />
          </label>
          <label className="field-label">
            Type
            <select className="field-input" value={type} onChange={(event) => setType(event.target.value as ListingType | "")}>
              <option value="">All Types</option>
              <option value="PG">PG</option>
              <option value="HOSTEL">Hostel</option>
              <option value="MESS">Mess</option>
            </select>
          </label>
          <label className="field-label">
            Min rent (₹)
            <input className="field-input" value={minRent} onChange={(event) => setMinRent(event.target.value)} placeholder="4000" inputMode="numeric" />
          </label>
          <label className="field-label">
            Max rent (₹)
            <input className="field-input" value={maxRent} onChange={(event) => setMaxRent(event.target.value)} placeholder="20000" inputMode="numeric" />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={loading} className="primary-button w-full md:w-auto">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {loading ? "Applying" : "Apply filters"}
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
        <p>
          <span className="font-extrabold text-ink">{visibleListings.length}</span> listings found
        </p>
        <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
          Sort: <span className="font-extrabold text-ink">Price ↑</span>
        </button>
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

      {loading ? (
        <div className="room-card-grid">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-lg bg-slate-200" />
          ))}
        </div>
      ) : visibleListings.length === 0 ? (
        <EmptyState icon={Home} title="No listings found" body="Try another city, rent range, or property type." />
      ) : (
        <div className="room-card-grid">
          {visibleListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
