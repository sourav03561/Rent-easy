import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body: string;
};

export function EmptyState({ icon: Icon, title, body }: EmptyStateProps) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <Icon className="mb-3 h-9 w-9 text-leaf" aria-hidden="true" />
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">{body}</p>
    </div>
  );
}
