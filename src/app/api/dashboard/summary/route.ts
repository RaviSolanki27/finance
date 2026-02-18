import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUserId, serverError, unauthorized } from "@/lib/server/auth";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function GET(request: Request) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const prevEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const [
      accounts,
      monthTx,
      prevTx,
      accountDistribution,
      expenseByCategory,
      recurringUpcoming,
      loans,
      netWorthEntries,
      incomeVsExpense,
      lastSixMonthsTx,
    ] = await Promise.all([
      prisma.account.findMany({
        where: { userId, isArchived: false },
        select: { id: true, name: true, type: true, balance: true, currency: true },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        select: { type: true, amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: prevStart, lte: prevEnd } },
        select: { type: true, amount: true },
      }),
      prisma.account.groupBy({
        by: ["type"],
        where: { userId, isArchived: false },
        _sum: { balance: true },
      }),
      prisma.transaction.groupBy({
        by: ["category"],
        where: {
          userId,
          type: "EXPENSE",
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.recurringTransaction.findMany({
        where: {
          userId,
          status: "ACTIVE",
          nextRunAt: { gte: now },
        },
        orderBy: { nextRunAt: "asc" },
        take: 8,
      }),
      prisma.loan.findMany({
        where: { userId, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          principal: true,
          remainingPrincipal: true,
          paidInterest: true,
          emiAmount: true,
          tenureMonths: true,
        },
      }),
      prisma.netWorthEntry.findMany({
        where: { userId },
        select: { type: true, currentValue: true },
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            lte: monthEnd,
          },
        },
        select: { date: true, type: true, amount: true },
      }),
    ]);

    const totals = monthTx.reduce(
      (acc, item) => {
        if (item.type === "INCOME") acc.income += item.amount;
        if (item.type === "EXPENSE") acc.expense += item.amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );
    const prevTotals = prevTx.reduce(
      (acc, item) => {
        if (item.type === "INCOME") acc.income += item.amount;
        if (item.type === "EXPENSE") acc.expense += item.amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const savings = totals.income - totals.expense;
    const savingsRate = totals.income > 0 ? (savings / totals.income) * 100 : 0;
    const totalAssets = netWorthEntries
      .filter((item) => item.type === "ASSET")
      .reduce((sum, item) => sum + item.currentValue, 0);
    const totalDebts = netWorthEntries
      .filter((item) => item.type === "DEBT")
      .reduce((sum, item) => sum + item.currentValue, 0);

    const previousSavings = prevTotals.income - prevTotals.expense;
    const savingsDeltaPct =
      Math.abs(previousSavings) > 0
        ? ((savings - previousSavings) / Math.abs(previousSavings)) * 100
        : 0;

    const monthlyTrendMap = new Map<string, { month: string; income: number; expense: number }>();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyTrendMap.set(key, {
        month: d.toLocaleString("en-US", { month: "short" }),
        income: 0,
        expense: 0,
      });
    }

    for (const row of lastSixMonthsTx) {
      const key = `${row.date.getFullYear()}-${row.date.getMonth() + 1}`;
      const bucket = monthlyTrendMap.get(key);
      if (!bucket) continue;
      if (row.type === "INCOME") bucket.income += row.amount;
      if (row.type === "EXPENSE") bucket.expense += row.amount;
    }

    return NextResponse.json({
      kpis: {
        totalBalance,
        monthlyIncome: totals.income,
        monthlyExpenses: totals.expense,
        monthlySavings: savings,
        savingsRate,
        savingsDeltaPct,
        netWorth: totalAssets - totalDebts,
      },
      charts: {
        accountDistribution: accountDistribution.map((item) => ({
          type: item.type,
          value: item._sum.balance || 0,
        })),
        expenseByCategory: expenseByCategory.map((item) => ({
          category: item.category || "UNCATEGORIZED",
          value: item._sum.amount || 0,
        })),
        incomeVsExpense: incomeVsExpense.map((item) => ({
          type: item.type,
          value: item._sum.amount || 0,
        })),
        monthlyTrend: Array.from(monthlyTrendMap.values()),
      },
      loans: loans.map((loan) => ({
        ...loan,
        progressPct:
          loan.principal > 0
            ? ((loan.principal - loan.remainingPrincipal) / loan.principal) * 100
            : 0,
      })),
      upcomingRecurring: recurringUpcoming,
    });
  } catch (error) {
    console.error("dashboard:summary", error);
    return serverError();
  }
}
