"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color?: string | null;
};

type AccountsState = {
  loading: boolean;
  error: string | null;
  accounts: Account[];
  totalBalance: number;
  groupedTotals: Array<{ type: string; _sum: { balance: number | null }; _count: { _all: number } }>;
};

const initialState: AccountsState = {
  loading: false,
  error: null,
  accounts: [],
  totalBalance: 0,
  groupedTotals: [],
};

export const fetchAccounts = createAsyncThunk("accounts/fetch", async () => {
  const response = await fetch("/api/accounts");
  if (!response.ok) throw new Error("Failed to fetch accounts");
  return response.json();
});

const accountsSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload.accounts ?? [];
        state.totalBalance = action.payload.totalBalance ?? 0;
        state.groupedTotals = action.payload.groupedTotals ?? [];
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch accounts";
      });
  },
});

export default accountsSlice.reducer;
