"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Filter, Globe, Smartphone, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // In a real app, we'd have a /api/users endpoint. 
    // For this MVP, we derive it from /api/sessions which we already built.
    Promise.all([
      fetch("/api/sessions").then(res => res.json()),
      fetch("/api/summary").then(res => res.json())
    ]).then(([sessions, summary]) => {
      setUsers(Array.isArray(sessions) ? sessions : []);
      setStats(summary);
    }).catch(err => console.error("Users page fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Explorer</h2>
          <p className="text-muted-foreground">
            Analyze individual sessions and identify behavioral cohorts.
          </p>
        </div>
        <Button className="gap-2">
          <Filter className="size-4" /> Export Cohorts
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.active_now ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Mobile Sessions</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.mobile_pct ?? 0}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Desktop Sessions</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.desktop_pct ?? 0}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_sessions ?? 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by email, ID or cohort..." />
          </div>
          <Button variant="outline">Filters</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Step</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead className="text-right">Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">{user.displayId ?? user.id.substring(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.severity === "critical" ? "destructive" : "secondary"}
                          className={user.severity === "critical" ? "" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400"}
                        >
                          {user.dropType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{user.lastStep}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1.5 uppercase text-[10px] font-bold">
                          {user.device.toLowerCase().includes("mobile") ? (
                            <Smartphone className="size-3" />
                          ) : (
                            <Monitor className="size-3" />
                          )}
                          {user.device}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(user.time).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
