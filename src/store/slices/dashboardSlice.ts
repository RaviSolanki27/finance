"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

type DashboardState = {
  loading: boolean;
  error: string | null;
  data: {
    kpis: {
      totalBalance: number;
      monthlyIncome: number;
      monthlyExpenses: number;
      monthlySavings: number;
      savingsRate: number;
      savingsDeltaPct: number;
      netWorth: number;
    };
    charts: {
      accountDistribution: Array<{ type: string; value: number }>;
      expenseByCategory: Array<{ category: string; value: number }>;
      incomeVsExpense: Array<{ type: string; value: number }>;
      monthlyTrend: Array<{ month: string; income: number; expense: number }>;
    };
    loans: Array<{
      id: string;
      name: string;
      principal: number;
      remainingPrincipal: number;
      paidInterest: number;
      emiAmount: number;
      progressPct: number;
    }>;
    upcomingRecurring: Array<{
      id: string;
      name: string;
      amount: number;
      nextRunAt: string;
      frequency: string;
    }>;
  } | null;
};

const initialState: DashboardState = {
  loading: false,
  error: null,
  data: null,
};

export const fetchDashboard = createAsyncThunk("dashboard/fetch", async () => {
  const response = await fetch("/api/dashboard/summary");
  if (!response.ok) throw new Error("Failed to fetch dashboard");
  return response.json();
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch dashboard";
      });
  },
});

export default dashboardSlice.reducer;
