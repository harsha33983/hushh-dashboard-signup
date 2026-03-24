"use client";

import { ImpactScoringList } from "@/components/impact-scoring-list";
import { RecentSessions } from "@/components/recent-sessions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export default function InsightsPage() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: async () => {
      const response = await apiClient.get("/insights");
      return response.data;
    },
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Insights Engine
          </h2>
          <p className="text-muted-foreground">
            AI-classified drop-off reasons ranked by potential revenue impact.
          </p>
        </div>
        <Badge
          variant="outline"
          className="gap-2 text-xs border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/30"
        >
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
          </span>
          AI Engine Active
        </Badge>
      </div>

      {/* Headline Insight */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 flex items-start gap-4">
        <div className="text-4xl">🎯</div>
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Top Recommendation
          </p>
          <p className="text-xl font-bold tracking-tight">
            Fixing OTP delay on Step 3 could recover{" "}
            <span className="text-primary">+8% conversion</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            68% of Step 3 failures are caused by OTP response times exceeding
            5s — predominantly affecting Android users on 3G networks. A CDN
            or caching fix would resolve this in under a sprint.
          </p>
        </div>
      </div>

      {isLoading || !insights ? (
        <Skeleton className="h-[400px] rounded-xl" />
      ) : (
        <ImpactScoringList data={insights} />
      )}

      <RecentSessions />
    </div>
  );
}
