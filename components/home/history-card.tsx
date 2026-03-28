type HistoryCardProps = {
  title: string;
  time: string;
  ingredientsCount: number;
  dateLabel: string;
};

export function HistoryCard({
  dateLabel,
  ingredientsCount,
  time,
  title,
}: HistoryCardProps) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_42px_rgba(45,49,66,0.05)]">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F7F9FB] text-[#2D3142]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.8">
            <rect x="5" y="5" width="14" height="14" rx="3" />
            <path d="M9 10h6" />
            <path d="M9 14h4" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#FF6B35]">
            <span>{time}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">{ingredientsCount} ingredientes</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">{dateLabel}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-base font-semibold leading-5 text-[#2D3142]">
            {title}
          </p>
        </div>
      </div>
    </article>
  );
}