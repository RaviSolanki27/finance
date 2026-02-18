"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string | null;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  account?: { name: string } | null;
};

type TransactionsState = {
  loading: boolean;
  error: string | null;
  items: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const initialState: TransactionsState = {
  loading: false,
  error: null,
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
};

export const fetchTransactions = createAsyncThunk(
  "transactions/fetch",
  async (queryString?: string) => {
    const qs = queryString || "page=1&limit=20&sortBy=date&sortOrder=desc";
    const response = await fetch(`/api/transactions?${qs}`);
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return response.json();
  },
);

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items ?? [];
        state.pagination = action.payload.pagination ?? state.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch transactions";
      });
  },
});

export default transactionsSlice.reducer;
