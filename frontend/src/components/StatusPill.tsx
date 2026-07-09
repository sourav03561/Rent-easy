import type { BookingStatus } from "../types/api";

const styles: Record<BookingStatus | "AVAILABLE" | "UNAVAILABLE", string> = {
  PENDING: "border-sun/40 bg-sun/15 text-amber-800",
  APPROVED: "border-leaf/30 bg-mint text-leaf",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
  COMPLETED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  AVAILABLE: "border-leaf/30 bg-mint text-leaf",
  UNAVAILABLE: "border-slate-200 bg-slate-100 text-slate-600"
};

export function StatusPill({ status }: { status: BookingStatus | "AVAILABLE" | "UNAVAILABLE" }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}
