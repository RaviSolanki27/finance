"use client";

import { configureStore } from "@reduxjs/toolkit";

import accountsReducer from "@/store/slices/accountsSlice";
import dashboardReducer from "@/store/slices/dashboardSlice";
import transactionsReducer from "@/store/slices/transactionsSlice";

export const store = configureStore({
  reducer: {
    accounts: accountsReducer,
    transactions: transactionsReducer,
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
