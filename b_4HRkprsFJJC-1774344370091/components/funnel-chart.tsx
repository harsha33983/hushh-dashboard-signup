"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface FunnelData {
  stepId: string;
  name: string;
  visitors: number;
  conversions: number;
  dropOffRate: number;
  avgTime: string;
}

export function FunnelChart({ data }: { data: FunnelData[] }) {
  // Calculate width for funnel effect if needed, but a simple bar chart is often clearer for drop-off
  const displayData = data.map((item) => ({
    name: item.name,
    visitors: item.visitors,
    dropOff: `${item.dropOffRate}%`,
  }));

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Signup Funnel Performance</CardTitle>
        <CardDescription>
          Visitor progression and drop-off rates per step
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="visitors" fill="var(--color-visitors)" radius={[0, 4, 4, 0]}>
                <LabelList
                  dataKey="dropOff"
                  position="right"
                  offset={10}
                  className="fill-foreground font-medium text-xs"
                  formatter={(value: string) => value === "0%" ? "" : `-${value}`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
