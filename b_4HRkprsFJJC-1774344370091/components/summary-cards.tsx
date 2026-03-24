"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

export function SummaryCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["summary"],
    queryFn: async () => {
      const response = await apiClient.get("/summary");
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Signup Completion Rate",
      value: `${data.completion_rate}%`,
      trend: "+2.5%",
      trendUp: true,
      icon: Activity,
    },
    {
      title: "Total Sessions",
      value: data.total_sessions.toLocaleString(),
      trend: "+12%",
      trendUp: true,
      icon: Users,
    },
    {
      title: "Avg. Time to Complete",
      value: `${data.avg_duration_minutes.toFixed(1)}m`,
      trend: "-14s",
      trendUp: false,
      icon: Clock,
    },
    {
      title: "Active Alerts",
      value: data.active_alerts.toString(),
      trend: "0",
      trendUp: true,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {card.trendUp ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={card.trendUp ? "text-emerald-500" : "text-red-500"}>
                {card.trend}
              </span>{" "}
              from last week
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
