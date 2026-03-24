"use client";

import { FunnelChart } from "@/components/funnel-chart";
import { FieldFrictionTable } from "@/components/field-friction-table";
import { RecentSessions } from "@/components/recent-sessions";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FunnelsPage() {
  const [funnelData, setFunnelData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/funnels")
      .then((r) => r.json())
      .then((d) => setFunnelData(d))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Funnel Builder</h2>
        <p className="text-muted-foreground">
          Visualize step-by-step user progression and identify where they abandon.
        </p>
      </div>

      {/* Step Stats */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {funnelData.map((step: { stepId: string; name: string; visitors: number; dropOffRate: number }) => (
            <div
              key={step.stepId}
              className="rounded-xl border bg-card p-5 space-y-1"
            >
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {step.name}
              </p>
              <p className="text-2xl font-bold">
                {step.visitors.toLocaleString()}
              </p>
              <p
                className={`text-sm font-medium ${
                  step.dropOffRate > 30
                    ? "text-red-500"
                    : step.dropOffRate > 15
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`}
              >
                {step.dropOffRate > 0
                  ? `−${step.dropOffRate}% drop-off`
                  : "✓ Completed"}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {loading ? (
          <Skeleton className="lg:col-span-2 h-[400px]" />
        ) : (
          <FunnelChart data={funnelData} />
        )}

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Cohort Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "Android Users", value: "2.1× more drop-offs", color: "bg-red-500" },
              { label: "Slow Networks", value: "68% OTP failures", color: "bg-orange-500" },
              { label: "iOS Safari", value: "+12% friction on Step 2", color: "bg-amber-500" },
              { label: "South Asia Geo", value: "Highest volume", color: "bg-emerald-500" },
            ].map((c) => (
              <div key={c.label} className="flex items-start gap-3 text-sm">
                <div className={`size-2 rounded-full mt-1.5 shrink-0 ${c.color}`} />
                <div>
                  <p className="font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FieldFrictionTable />
      <RecentSessions />
    </div>
  );
}
