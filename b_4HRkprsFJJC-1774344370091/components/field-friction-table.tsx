import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

export function FieldFrictionTable() {
  const { data: frictionData, isLoading } = useQuery({
    queryKey: ["friction"],
    queryFn: async () => {
      const response = await apiClient.get("/friction");
      return response.data.map((item: any) => {
        const errorRate = (item.errors / (item.visitors || 1)) * 100;
        let status = "Normal";
        if (errorRate > 50) status = "Critical";
        else if (errorRate > 20) status = "High";
        else if (errorRate > 5) status = "Medium";

        return {
          field: item.field,
          step: item.step,
          errors: item.errors,
          abandonment: `${Math.round(errorRate)}%`,
          status: status,
        };
      });
    },
    refetchInterval: 30000,
  });

  if (isLoading || !frictionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Field-Level Friction Heatmap</CardTitle>
          <Skeleton className="h-4 w-[250px] mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Field-Level Friction Heatmap</CardTitle>
        <CardDescription>
          Identify specific fields causing validation errors and abandonment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field ID</TableHead>
              <TableHead>Step</TableHead>
              <TableHead className="text-right">Validation Errors</TableHead>
              <TableHead className="text-right">Abandonment Rate</TableHead>
              <TableHead>Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {frictionData.map((item) => (
              <TableRow key={item.field}>
                <TableCell className="font-medium font-mono text-xs">{item.field}</TableCell>
                <TableCell>{item.step}</TableCell>
                <TableCell className="text-right">{item.errors}</TableCell>
                <TableCell className="text-right">{item.abandonment}</TableCell>
                <TableCell>
                  <Badge
                    variant={item.status === "Critical" ? "destructive" : "secondary"}
                    className={
                      item.status === "Critical" ? "" :
                        item.status === "High" ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400" :
                          item.status === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400" :
                            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400"
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
