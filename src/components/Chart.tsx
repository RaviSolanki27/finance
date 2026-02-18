"use client";

import {
  Label,
  Legend,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A radial chart with stacked sections";

const chartData = [
  { month: "january", income: 3000, expense: 1800, savings: 1200 },
];

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-1)",
  },
  expense: {
    label: "Expense",
    color: "var(--chart-2)",
  },
  savings: {
    label: "Savings",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export default function ChartRadialStacked() {
  const totalAmount =
    chartData[0].income + chartData[0].expense + chartData[0].savings;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Radial Chart - Income vs Expense</CardTitle>
        <CardDescription>January 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-62.5 h-[300px]"
        >
          <RadialBarChart data={chartData} innerRadius={80} outerRadius={130} height={300}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {totalAmount.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground"
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>

            {/* Income */}
            <RadialBar
              dataKey="income"
              stackId="a"
              cornerRadius={15}
              fill={chartConfig.income.color}
              className="stroke-transparent stroke-2"
            />

            {/* Expense */}
            <RadialBar
              dataKey="expense"
              stackId="a"
              cornerRadius={15}
              fill={chartConfig.expense.color}
              className="stroke-transparent stroke-2"
            />

            {/* Savings */}
            <RadialBar
              dataKey="savings"
              stackId="a"
              cornerRadius={15}
              fill={chartConfig.savings.color}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
      </CardContent>
      {/* <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing income, expense, and savings for January
        </div>
      </CardFooter> */}
    </Card>
  );
}
