"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Bell, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) => setAlerts(Array.isArray(d) ? d : []))
      .catch((err) => console.error("Failed to fetch alerts:", err))
      .finally(() => setLoading(false));
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="size-5 text-destructive" />;
      case "high":
        return <TriangleAlert className="size-5 text-amber-500" />;
      case "medium":
        return <Info className="size-5 text-blue-500" />;
      default:
        return <Bell className="size-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <Badge variant="destructive" className="animate-pulse">
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="size-3" /> Resolved
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h2>
        <p className="text-muted-foreground">
          Real-time monitoring of conversion anomalies and technical friction.
        </p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : alerts.length > 0 ? (
          alerts.map((alert) => (
            <Card key={alert.id} className={alert.status === "resolved" ? "opacity-70" : ""}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                  <div>
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {alert.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  {getStatusBadge(alert.status)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{alert.type}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-primary cursor-pointer hover:underline font-medium">
                    View Detail & Diagnostics
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-muted/30">
            <Bell className="size-12 text-muted-foreground mb-4 opacity-20" />
            <p className="text-lg font-medium">No alerts detected</p>
            <p className="text-sm text-muted-foreground">Systems are running within normal parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
