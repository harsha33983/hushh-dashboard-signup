"use client";

import { SummaryCards } from "@/components/summary-cards";
import { FunnelChart } from "@/components/funnel-chart";
import { FieldFrictionTable } from "@/components/field-friction-table";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: funnelData, isLoading } = useQuery({
    queryKey: ["funnel"],
    queryFn: async () => {
      const response = await apiClient.get("/funnels");
      return response.data.map((s: any) => ({
        stepId: s.stepId,
        name: s.name,
        visitors: s.visitors,
        dropOffRate: s.dropOffRate,
      }));
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Track real-time signup conversions and identify friction points.
        </p>
      </div>

      <SummaryCards />

      <div className="grid gap-8 lg:grid-cols-3">
        {isLoading || !funnelData ? (
          <div className="lg:col-span-2 h-[400px]">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        ) : (
          <FunnelChart data={funnelData} />
        )}
        
        <div className="space-y-4">
          <div className="rounded-xl border bg-primary/5 p-6 border-primary/20">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              🚀 Top Opportunity
            </h3>
            <p className="text-sm mt-2 text-muted-foreground">
              Fixing <strong>Phone OTP delay</strong> in Step 3 could increase overall conversion by <strong>+8%</strong>.
            </p>
            <button className="mt-4 w-full bg-primary text-primary-foreground text-sm font-medium h-9 rounded-md">
              View Insights
            </button>
          </div>
          
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">Recent Alerts</h3>
            <div className="mt-4 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="size-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium">Apex Error Spike</p>
                    <p className="text-xs text-muted-foreground">Step 2 API failing for Android users.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <FieldFrictionTable />
    </div>
  );
}
