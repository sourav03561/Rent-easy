import type { BookingStatus } from "../types/api";

const styles: Record<BookingStatus | "AVAILABLE" | "UNAVAILABLE", string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-leaf/25 bg-mint text-leaf",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-500",
  COMPLETED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  AVAILABLE: "border-leaf/25 bg-mint text-leaf",
  UNAVAILABLE: "border-slate-200 bg-slate-50 text-slate-500"
};

export function StatusPill({ status }: { status: BookingStatus | "AVAILABLE" | "UNAVAILABLE" }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-extrabold ${styles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}
