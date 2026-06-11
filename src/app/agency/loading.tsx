import { Skeleton } from "@/components/ui/skeleton";

export default function AgencyLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy aria-label="Carregando">
      <div>
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-2 h-3 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[86px]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
