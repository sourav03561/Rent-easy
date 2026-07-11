import { BedDouble, Images, IndianRupee, MapPin, Star, Tv, WashingMachine, Wifi } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusPill } from "./StatusPill";
import type { Listing } from "../types/api";

const fallbackImages = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80",
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

function AmenityIcon({ amenity }: { amenity: string }) {
  const key = amenity.toLowerCase();

  if (key.includes("wifi")) return <Wifi className="h-3 w-3" aria-hidden="true" />;
  if (key.includes("laundry") || key.includes("wash")) return <WashingMachine className="h-3 w-3" aria-hidden="true" />;
  if (key.includes("tv")) return <Tv className="h-3 w-3" aria-hidden="true" />;
  return <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />;
}

export function ListingCard({ listing, compact = false }: ListingCardProps) {
  const amenities = listing.amenities?.slice(0, compact ? 3 : 4) ?? [];
  const imageHeight = compact ? "h-[118px]" : "h-[142px]";

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
      <Link to={`/listings/${listing.id}`} className={`relative block ${imageHeight} overflow-hidden bg-slate-100`}>
        <img src={getListingImage(listing)} alt={listing.title} className="h-full w-full object-cover object-center" />
        <span className="absolute left-2 top-2 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-extrabold leading-none text-violet-700">
          {listing.type === "HOSTEL" ? "Hostel" : listing.type}
        </span>
        <span className="absolute right-2 top-2">
          <StatusPill status={listing.available ? "AVAILABLE" : "UNAVAILABLE"} />
        </span>
        {(listing.photos?.length ?? 0) > 1 && (
          <span className="absolute bottom-2 right-2 inline-flex h-6 items-center gap-1 rounded-md bg-black/65 px-2 text-[11px] font-extrabold text-white">
            <Images className="h-3 w-3" aria-hidden="true" />
            {listing.photos?.length}
          </span>
        )}
      </Link>

      <div className="p-3">
        <Link to={`/listings/${listing.id}`} className="display-font block truncate text-sm font-extrabold text-ink hover:text-leaf">
          {listing.title}
        </Link>
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="truncate">{listing.address}, {listing.city}</span>
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-600">
          <BedDouble className="h-3.5 w-3.5 text-leaf" aria-hidden="true" />
          <span>{listing.vacant_rooms} room{listing.vacant_rooms === 1 ? "" : "s"} vacant</span>
        </p>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-end text-leaf">
            <IndianRupee className="h-3.5 w-3.5 translate-y-[-2px]" aria-hidden="true" />
            <span className="text-lg font-extrabold">{listing.price.toLocaleString("en-IN")}</span>
            <span className="ml-1 text-xs font-medium text-slate-500">/mo</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
            <Star className="h-3.5 w-3.5 fill-sun text-sun" aria-hidden="true" />
            <span>4.7</span>
            <span className="text-slate-400">(42)</span>
          </div>
        </div>

        {amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {amenities.map((amenity) => (
              <span key={amenity} className="inline-flex h-6 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-500">
                <AmenityIcon amenity={amenity} />
                {amenity}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
