import { Skeleton } from './DesignSystem';

export function ExperienceCardSkeleton() {
  return (
    <div className="bg-surface-raised rounded-2xl overflow-hidden shadow-xs">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-end pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PlanCardSkeleton() {
  return (
    <div className="bg-surface-raised rounded-xl border border-border p-4 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function ExplorePageSkeleton() {
  return (
    <div className="px-5 pt-4 pb-28">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-4">
        <ExperienceCardSkeleton />
        <ExperienceCardSkeleton />
        <ExperienceCardSkeleton />
      </div>
    </div>
  );
}

export function MyPlansPageSkeleton() {
  return (
    <div className="px-5 pt-4 pb-28">
      <div className="mb-6">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <PlanCardSkeleton />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <PlanCardSkeleton />
        </div>
      </div>
    </div>
  );
}
