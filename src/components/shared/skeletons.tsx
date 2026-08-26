import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("rounded bg-slate-200 animate-pulse", className)} />
  );
}

export function TableSkeleton({
  rows = 6,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="flex gap-4 px-4 h-12 items-center bg-slate-50 border-b border-slate-200">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex gap-4 px-4 py-3.5 items-center border-b border-slate-100 last:border-0"
        >
          {Array.from({ length: cols }).map((_, col) => (
            <Bone
              key={col}
              className={cn("h-4 flex-1", col === 0 && "max-w-[28%]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-200 bg-white p-5 space-y-3"
        >
          <Bone className="h-3 w-24" />
          <Bone className="h-8 w-16" />
          <Bone className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function DispatchSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Bone className="h-8 w-56" />
        <Bone className="h-4 w-80" />
      </div>
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div className="grid grid-cols-4 gap-3 min-w-[880px]">
            {Array.from({ length: 4 }).map((_, col) => (
              <div
                key={col}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3 min-h-[420px]"
              >
                <Bone className="h-5 w-28" />
                {Array.from({ length: 3 }).map((_, card) => (
                  <div
                    key={card}
                    className="rounded-lg border border-slate-200 bg-white p-3 space-y-2"
                  >
                    <Bone className="h-5 w-16" />
                    <Bone className="h-3 w-full" />
                    <Bone className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="w-full xl:w-72 shrink-0 space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <Bone className="h-4 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Bone className="h-8 w-8 rounded-full" />
                <Bone className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="grid grid-cols-7 border-b border-slate-200">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="p-2 border-r last:border-r-0 border-slate-100">
            <Bone className="h-3 w-8 mx-auto" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="h-24 p-2 border-r border-b border-slate-100 last:border-r-0 space-y-1.5"
          >
            <Bone className="h-3 w-6" />
            {i % 4 === 0 && <Bone className="h-5 w-full" />}
            {i % 5 === 0 && <Bone className="h-5 w-3/4" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BillingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="border border-slate-200 rounded-lg p-4 flex items-center gap-4"
        >
          <Bone className="h-5 w-5" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-40" />
            <Bone className="h-3 w-24" />
          </div>
          <Bone className="h-4 w-20 hidden sm:block" />
          <Bone className="h-4 w-20 hidden sm:block" />
          <Bone className="h-4 w-20 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}
