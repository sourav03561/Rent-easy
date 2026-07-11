import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BedDouble, IndianRupee, MapPin, MessageSquare, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getListingImage } from "../components/ListingCard";
import { StatusPill } from "../components/StatusPill";
import { useAuth } from "../context/AuthContext";
import { bookingsApi, getApiError, listingsApi, reviewsApi } from "../services/api";
import type { Booking, Listing, Review } from "../types/api";

export function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [bookingMessage, setBookingMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadListing = async () => {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      const response = await listingsApi.details(id);
      setListing(response.data.data.listing);
      setReviews(response.data.data.reviews);
      setActivePhotoIndex(0);

      if (user?.role === "STUDENT") {
        const bookingsResponse = await bookingsApi.mine();
        setBookings(bookingsResponse.data.data.bookings);
      }
    } catch (apiError) {
      setError(getApiError(apiError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadListing();
  }, [id, user?.role]);

  const photos = useMemo(() => {
    if (!listing) return [];
    return listing.photos?.length ? listing.photos : [getListingImage(listing)];
  }, [listing]);

  const reviewEligibility = useMemo(() => {
    if (!listing || user?.role !== "STUDENT") {
      return { canReview: false, message: "Only students can review completed stays." };
    }

    const completedBooking = bookings.find((booking) => booking.listing_id === listing.id && booking.status === "COMPLETED");

    if (!completedBooking?.completed_at) {
      return { canReview: false, message: "You can review after your booking is completed and one month has passed." };
    }

    const reviewUnlocksAt = new Date(completedBooking.completed_at);
    reviewUnlocksAt.setMonth(reviewUnlocksAt.getMonth() + 1);

    if (reviewUnlocksAt > new Date()) {
      return {
        canReview: false,
        message: `Rating unlocks on ${reviewUnlocksAt.toLocaleDateString()}.`
      };
    }

    return { canReview: true, message: "Your completed stay is eligible for review." };
  }, [bookings, listing, user?.role]);

  const requestBooking = async (event: FormEvent) => {
    event.preventDefault();
    if (!listing) return;
    setNotice("");
    setError("");

    try {
      await bookingsApi.create({ listingId: listing.id, message: bookingMessage || undefined });
      setBookingMessage("");
      setNotice("Booking request sent.");
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!listing) return;
    setNotice("");
    setError("");

    try {
      await reviewsApi.create(listing.id, { rating, comment: comment || undefined });
      setComment("");
      setRating(5);
      setNotice("Review submitted.");
      await loadListing();
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm font-semibold text-slate-600">Loading listing...</div>;
  }

  if (!listing) {
    return (
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-leaf">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Link>
        <p className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error || "Listing not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-leaf">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to listings
      </Link>

      {error && <p className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
      {notice && <p className="border border-leaf/20 bg-mint px-3 py-2 text-sm font-medium text-leaf">{notice}</p>}

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="aspect-[16/9] bg-slate-100">
            <img src={photos[activePhotoIndex] ?? getListingImage(listing)} alt={listing.title} className="h-full w-full object-cover" />
          </div>
          {photos.length > 1 && (
            <div className="grid grid-cols-4 gap-2 border-b border-slate-100 p-3 sm:grid-cols-6">
              {photos.map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  onClick={() => setActivePhotoIndex(index)}
                  className={`aspect-[4/3] overflow-hidden rounded-md border ${
                    activePhotoIndex === index ? "border-leaf ring-2 ring-leaf/20" : "border-slate-200"
                  }`}
                  aria-label={`Show room photo ${index + 1}`}
                >
                  <img src={photo} alt={`${listing.title} room ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-leaf">{listing.type}</p>
                <h1 className="mt-1 text-3xl font-black text-ink">{listing.title}</h1>
              </div>
              <StatusPill status={listing.available ? "AVAILABLE" : "UNAVAILABLE"} />
            </div>
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-coral" aria-hidden="true" />
              {listing.city}, {listing.address}
            </p>
            <div className="flex items-center text-ink">
              <IndianRupee className="h-5 w-5" aria-hidden="true" />
              <span className="text-3xl font-black">{listing.price.toLocaleString("en-IN")}</span>
              <span className="ml-1 text-sm text-slate-500">/month</span>
            </div>
            <p className="inline-flex items-center gap-2 rounded-lg bg-mint px-3 py-2 text-sm font-extrabold text-leaf">
              <BedDouble className="h-4 w-4" aria-hidden="true" />
              {listing.vacant_rooms} room{listing.vacant_rooms === 1 ? "" : "s"} vacant
            </p>
            {listing.description && <p className="leading-7 text-slate-700">{listing.description}</p>}
            {(listing.amenities?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {listing.amenities?.map((amenity) => (
                  <span key={amenity} className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                    {amenity}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {user?.role === "STUDENT" ? (
            <form onSubmit={requestBooking} className="border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-ink">Request booking</h2>
              <label className="field-label mt-4">
                Message
                <textarea
                  className="field-input min-h-28 resize-y"
                  value={bookingMessage}
                  onChange={(event) => setBookingMessage(event.target.value)}
                  maxLength={500}
                />
              </label>
              <button type="submit" disabled={!listing.available || listing.vacant_rooms <= 0} className="primary-button mt-4 w-full">
                Send request
              </button>
            </form>
          ) : (
            <div className="border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-ink">Booking</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Students can request this listing after signing in.</p>
            </div>
          )}

          {user?.role === "STUDENT" && (
            <form onSubmit={submitReview} className="border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-ink">Review</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{reviewEligibility.message}</p>
              <label className="field-label mt-4">
                Rating
                <select className="field-input" value={rating} onChange={(event) => setRating(Number(event.target.value))} disabled={!reviewEligibility.canReview}>
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="field-label mt-4">
                Comment
                <textarea
                  className="field-input min-h-24 resize-y"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  disabled={!reviewEligibility.canReview}
                />
              </label>
              <button type="submit" disabled={!reviewEligibility.canReview} className="secondary-button mt-4 w-full">
                Submit review
              </button>
            </form>
          )}
        </aside>
      </section>

      <section className="border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-leaf" aria-hidden="true" />
          <h2 className="text-xl font-bold text-ink">Reviews</h2>
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-600">No reviews yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.map((review) => (
              <article key={review.id} className="border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-1 text-sm font-bold text-ink">
                  <Star className="h-4 w-4 fill-sun text-sun" aria-hidden="true" />
                  {review.rating}/5
                </div>
                <p className="text-sm leading-6 text-slate-700">{review.comment || "No comment"}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
