"use client";

import { useEffect } from "react";

import ChartBarMultiple from "@/components/BarChart";
import ChartRadialStacked from "@/components/Chart";
import StatsCard from "@/components/StatsCard";
import { TransactionTable } from "@/components/TransactionTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDashboard } from "@/store/slices/dashboardSlice";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const dashboard = useAppSelector((state) => state.dashboard.data);
  const transactions = useAppSelector((state) => state.transactions.items);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  if (!dashboard) {
    return <div className="text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
        <StatsCard title="Total Balance" amount={dashboard.kpis.totalBalance} percentage={dashboard.kpis.savingsDeltaPct} redirect="/accounts" />
        <StatsCard title="Monthly Income" amount={dashboard.kpis.monthlyIncome} percentage={0} redirect="/transactions" />
        <StatsCard title="Monthly Expense" amount={dashboard.kpis.monthlyExpenses} percentage={0} redirect="/transactions" />
        <StatsCard title="Savings Rate" amount={dashboard.kpis.monthlySavings} percentage={dashboard.kpis.savingsRate} matrixLabel="of income saved" redirect="/dashboard" />
        <StatsCard title="Net Worth" amount={dashboard.kpis.netWorth} percentage={0} redirect="/dashboard" />
      </div>

      <div className="grid gap-4 grid-cols-1 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <ChartBarMultiple data={dashboard.charts.monthlyTrend || []} />
        </div>
        <div className="xl:col-span-4">
          <ChartRadialStacked data={dashboard.charts.accountDistribution || []} />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 xl:grid-cols-12">
        <Card className="xl:col-span-8 py-4 px-6">
          <CardHeader className="px-0">
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <TransactionTable rows={transactions} />
          </CardContent>
        </Card>
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Loan Widgets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.loans.length ? (
              dashboard.loans.map((loan) => (
                <div key={loan.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{loan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {loan.progressPct.toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Remaining: {loan.remainingPrincipal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    EMI: {loan.emiAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No active loans</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Recurring Payments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboard.upcomingRecurring.length ? (
            dashboard.upcomingRecurring.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.nextRunAt).toLocaleDateString()} - {item.frequency}
                  </p>
                </div>
                <p className="font-semibold">
                  {item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming recurring items.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
