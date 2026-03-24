"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, MousePointerClick, WifiOff, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .catch((err) => console.error("Failed to fetch sessions:", err))
      .finally(() => setLoading(false));
  }, []);

  const getDropIcon = (type: string) => {
    if (type.includes("Friction")) return MousePointerClick;
    if (type.includes("Idle")) return Clock;
    return AlertCircle;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Dropped Sessions</CardTitle>
        <CardDescription>
          Sampled sessions tagged with behavioral and technical signals from live events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : sessions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>Last Step</TableHead>
                <TableHead>Drop Type</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Device</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => {
                const Icon = getDropIcon(s.dropType);
                return (
                  <TableRow key={s.id} className="hover:bg-muted/50 cursor-pointer">
                    <TableCell className="font-mono text-xs">{s.id}</TableCell>
                    <TableCell className="text-sm">{s.lastStep}</TableCell>
                    <TableCell>
                      <Badge
                        variant={s.severity === "critical" ? "destructive" : "secondary"}
                        className={`gap-1 ${s.severity === "high" ? "border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" : ""}`}
                      >
                        <Icon className="size-3" />
                        {s.dropType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {s.signal}
                    </TableCell>
                    <TableCell className="text-xs">{s.device}</TableCell>
                    <TableCell className="text-xs text-muted-foreground text-right">
                      {new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground md:text-sm">
            No recent drops detected.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
