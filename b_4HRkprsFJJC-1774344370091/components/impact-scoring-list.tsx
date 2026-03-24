"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Zap } from "lucide-react";

interface Insight {
  id: string;
  reason: string;
  description: string;
  impactScore: number;
  potentialLift: string;
  status: string;
  effort: string;
  category: string;
}

export function ImpactScoringList({ data }: { data: Insight[] }) {
  const getStatusColor = (status: string): "destructive" | "secondary" | "outline" | "default" => {
    if (status === "critical") return "destructive";
    return "secondary";
  };

  const getStatusClassName = (status: string) => {
    if (status === "high")
      return "border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
    return "";
  };

  const getEffortColor = (effort: string) => {
    if (effort === "low") return "text-emerald-500";
    if (effort === "medium") return "text-amber-500";
    return "text-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-5 text-amber-500" />
          Impact Prioritization Engine
        </CardTitle>
        <CardDescription>
          Issues ranked by: (Drop-off Rate × Traffic × Fix Confidence) / Effort
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((insight, index) => (
          <div
            key={insight.id}
            className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
          >
            <div className="text-2xl font-black text-muted-foreground/40 w-6 shrink-0 text-center leading-none pt-1">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{insight.reason}</p>
                <Badge
                  variant={getStatusColor(insight.status)}
                  className={getStatusClassName(insight.status)}
                >
                  {insight.status}
                </Badge>
                <Badge variant="outline">{insight.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Impact Score</span>
                <Progress value={insight.impactScore * 10} className="h-1.5 flex-1" />
                <span className="text-xs font-bold tabular-nums">{insight.impactScore}/10</span>
              </div>
            </div>
            <div className="shrink-0 text-right space-y-1">
              <div className="text-lg font-bold text-emerald-500">
                {insight.potentialLift}
              </div>
              <div className={`text-xs font-medium capitalize ${getEffortColor(insight.effort)}`}>
                {insight.effort} effort
              </div>
              <button className="flex items-center gap-1 text-xs text-primary mt-2">
                Fix now <ArrowRight className="size-3" />
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
