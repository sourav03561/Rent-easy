import { IndianRupee, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusPill } from "./StatusPill";
import type { Listing } from "../types/api";

const fallbackImages = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=900&q=80"
];

export function getListingImage(listing: Listing) {
  if (listing.photos?.[0]) {
    return listing.photos[0];
  }

  const index = Math.abs(listing.title.length + listing.city.length) % fallbackImages.length;
  return fallbackImages[index];
}

type ListingCardProps = {
  listing: Listing;
  compact?: boolean;
};

export function ListingCard({ listing, compact = false }: ListingCardProps) {
  const amenities = listing.amenities?.slice(0, compact ? 2 : 4) ?? [];

  return (
    <article className="overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link to={`/listings/${listing.id}`} className="block">
        <div className="aspect-[16/10] overflow-hidden bg-slate-100">
          <img src={getListingImage(listing)} alt={listing.title} className="h-full w-full object-cover" />
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-leaf">{listing.type}</p>
            <Link to={`/listings/${listing.id}`} className="mt-1 block text-lg font-semibold text-ink hover:text-leaf">
              {listing.title}
            </Link>
          </div>
          <StatusPill status={listing.available ? "AVAILABLE" : "UNAVAILABLE"} />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-coral" aria-hidden="true" />
          <span className="truncate">{listing.city}, {listing.address}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center text-ink">
            <IndianRupee className="h-4 w-4" aria-hidden="true" />
            <span className="text-xl font-bold">{listing.price.toLocaleString("en-IN")}</span>
            <span className="ml-1 text-sm text-slate-500">/mo</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-slate-600">
            <Star className="h-4 w-4 fill-sun text-sun" aria-hidden="true" />
            <span>New</span>
          </div>
        </div>
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <span key={amenity} className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                {amenity}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
