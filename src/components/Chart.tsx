"use client";

import {
  Cell,
  Pie,
  PieChart,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "Account distribution pie chart";

const chartConfig = {
  value: {
    label: "Balance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

export default function ChartRadialStacked({
  data,
}: {
  data: Array<{ type: string; value: number }>;
}) {
  const total = data.reduce((sum, row) => sum + row.value, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Account Distribution</CardTitle>
        <CardDescription>By account type</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-62.5 h-[300px]"
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="type"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.type} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <div className="pb-5 text-center text-sm text-muted-foreground">
        Total: {total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
      </div>
    </Card>
  );
}
