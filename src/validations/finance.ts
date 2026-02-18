import * as yup from "yup";

export const accountSchema = yup.object({
  name: yup.string().trim().min(2).max(60).required(),
  type: yup
    .mixed<"CASH" | "BANK" | "WALLET" | "CREDIT" | "CREDIT_CARD">()
    .oneOf(["CASH", "BANK", "WALLET", "CREDIT", "CREDIT_CARD"])
    .required(),
  initialBalance: yup.number().min(0).required(),
  currency: yup.string().trim().length(3).required(),
  color: yup.string().trim().max(32).optional(),
  icon: yup.string().trim().max(64).optional(),
});

export const transactionSchema = yup.object({
  type: yup
    .mixed<"INCOME" | "EXPENSE" | "TRANSFER">()
    .oneOf(["INCOME", "EXPENSE", "TRANSFER"])
    .required(),
  amount: yup.number().moreThan(0).required(),
  description: yup.string().trim().min(2).max(255).required(),
  category: yup.string().trim().max(64).optional(),
  date: yup.date().required(),
  accountId: yup.string().uuid().required(),
  destinationAccountId: yup.string().uuid().nullable().optional(),
  paymentMethodId: yup.string().uuid().nullable().optional(),
  tags: yup.array(yup.string().trim().min(1).max(32)).max(10).default([]),
});

export const recurringSchema = yup.object({
  name: yup.string().trim().min(2).max(120).required(),
  description: yup.string().trim().max(255).optional(),
  amount: yup.number().moreThan(0).required(),
  type: yup
    .mixed<"INCOME" | "EXPENSE" | "TRANSFER">()
    .oneOf(["INCOME", "EXPENSE", "TRANSFER"])
    .required(),
  category: yup.string().trim().max(64).optional(),
  frequency: yup
    .mixed<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">()
    .oneOf(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
    .required(),
  startDate: yup.date().required(),
  endDate: yup.date().nullable().optional(),
  accountId: yup.string().uuid().required(),
  destinationAccountId: yup.string().uuid().nullable().optional(),
});

export const loanSchema = yup.object({
  name: yup.string().trim().min(2).max(120).required(),
  principal: yup.number().moreThan(0).required(),
  interestRate: yup.number().min(0).max(100).required(),
  tenureMonths: yup.number().integer().min(1).max(600).required(),
  startDate: yup.date().required(),
  accountId: yup.string().uuid().required(),
});

export const netWorthEntrySchema = yup.object({
  type: yup.mixed<"ASSET" | "DEBT">().oneOf(["ASSET", "DEBT"]).required(),
  category: yup.string().trim().min(2).max(60).required(),
  name: yup.string().trim().min(2).max(120).required(),
  currentValue: yup.number().required(),
  currency: yup.string().trim().length(3).required(),
  notes: yup.string().trim().max(500).optional(),
  valuationDate: yup.date().required(),
});
