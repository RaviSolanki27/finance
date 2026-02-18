import { randomUUID } from "crypto";

import type { Prisma } from "@/lib/prisma";
import { prisma } from "@/lib/prisma";

type TxClient = Prisma.TransactionClient;

export type CreateTransactionInput = {
  userId: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  category?: string | null;
  date?: Date;
  accountId: string;
  destinationAccountId?: string | null;
  paymentMethodId?: string | null;
  tags?: string[];
  recurringTransactionId?: string | null;
  isRecurringGenerated?: boolean;
};

export type UpdateTransactionInput = {
  transactionId: string;
  userId: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  category?: string | null;
  date: Date;
  accountId: string;
  destinationAccountId?: string | null;
  paymentMethodId?: string | null;
  tags?: string[];
};

const uniqueTags = (tags: string[] = []) =>
  [...new Set(tags.map((item) => item.trim()).filter(Boolean))];

async function assertAccount(tx: TxClient, userId: string, accountId: string) {
  const account = await tx.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  });
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }
}

async function updateAccountBalance(
  tx: TxClient,
  accountId: string,
  delta: number,
) {
  await tx.account.update({
    where: { id: accountId },
    data: { balance: { increment: delta } },
  });
}

async function connectTags(
  tx: TxClient,
  transactionId: string,
  userId: string,
  tags: string[] = [],
) {
  const resolvedTags = uniqueTags(tags);
  if (!resolvedTags.length) return;
  for (const name of resolvedTags) {
    const tag = await tx.transactionTag.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name },
      update: {},
      select: { id: true },
    });

    await tx.transactionTagOnTransaction.upsert({
      where: { transactionId_tagId: { transactionId, tagId: tag.id } },
      create: { transactionId, tagId: tag.id },
      update: {},
    });
  }
}

async function createIncomeOrExpense(
  tx: TxClient,
  input: CreateTransactionInput,
) {
  const signedDelta = input.type === "INCOME" ? input.amount : -input.amount;

  await updateAccountBalance(tx, input.accountId, signedDelta);

  const transaction = await tx.transaction.create({
    data: {
      userId: input.userId,
      type: input.type,
      amount: input.amount,
      description: input.description,
      category: input.category || null,
      date: input.date ?? new Date(),
      accountId: input.accountId,
      paymentMethodId: input.paymentMethodId || null,
      recurringTransactionId: input.recurringTransactionId || null,
      isRecurringGenerated: Boolean(input.isRecurringGenerated),
    },
  });

  await connectTags(tx, transaction.id, input.userId, input.tags);

  return { created: [transaction], transferGroupId: null as string | null };
}

async function createTransfer(tx: TxClient, input: CreateTransactionInput) {
  if (!input.destinationAccountId) {
    throw new Error("Destination account is required for transfers");
  }
  if (input.destinationAccountId === input.accountId) {
    throw new Error("Source and destination account must be different");
  }

  await updateAccountBalance(tx, input.accountId, -input.amount);
  await updateAccountBalance(tx, input.destinationAccountId, input.amount);

  const transferGroupId = randomUUID();
  const occurredAt = input.date ?? new Date();

  const debit = await tx.transaction.create({
    data: {
      userId: input.userId,
      type: "TRANSFER",
      amount: input.amount,
      description: input.description,
      category: input.category || "TRANSFER",
      date: occurredAt,
      accountId: input.accountId,
      sourceAccountId: input.accountId,
      destinationAccountId: input.destinationAccountId,
      transferId: "DEBIT",
      transferGroupId,
      paymentMethodId: input.paymentMethodId || null,
      recurringTransactionId: input.recurringTransactionId || null,
      isRecurringGenerated: Boolean(input.isRecurringGenerated),
    },
  });

  const credit = await tx.transaction.create({
    data: {
      userId: input.userId,
      type: "TRANSFER",
      amount: input.amount,
      description: input.description,
      category: input.category || "TRANSFER",
      date: occurredAt,
      accountId: input.destinationAccountId,
      sourceAccountId: input.accountId,
      destinationAccountId: input.destinationAccountId,
      transferId: "CREDIT",
      transferGroupId,
      paymentMethodId: input.paymentMethodId || null,
      recurringTransactionId: input.recurringTransactionId || null,
      isRecurringGenerated: Boolean(input.isRecurringGenerated),
    },
  });

  await connectTags(tx, debit.id, input.userId, input.tags);
  await connectTags(tx, credit.id, input.userId, input.tags);

  return { created: [debit, credit], transferGroupId };
}

async function reverseTransactionEffects(
  tx: TxClient,
  transaction: {
    id: string;
    type: string;
    amount: number;
    accountId: string;
    transferId: string | null;
    transferGroupId: string | null;
    userId: string;
  },
) {
  if (transaction.type === "INCOME") {
    await updateAccountBalance(tx, transaction.accountId, -transaction.amount);
    return;
  }
  if (transaction.type === "EXPENSE") {
    await updateAccountBalance(tx, transaction.accountId, transaction.amount);
    return;
  }
  if (transaction.type === "TRANSFER") {
    if (transaction.transferGroupId) {
      const transferRows = await tx.transaction.findMany({
        where: { transferGroupId: transaction.transferGroupId, userId: transaction.userId },
        select: {
          id: true,
          accountId: true,
          amount: true,
          transferId: true,
        },
      });

      for (const row of transferRows) {
        const delta = row.transferId === "DEBIT" ? row.amount : -row.amount;
        await updateAccountBalance(tx, row.accountId, delta);
      }
      await tx.transactionTagOnTransaction.deleteMany({
        where: { transactionId: { in: transferRows.map((item) => item.id) } },
      });
      await tx.transaction.deleteMany({
        where: { id: { in: transferRows.map((item) => item.id) } },
      });
      return;
    }
    const fallbackDelta = transaction.transferId === "DEBIT" ? transaction.amount : -transaction.amount;
    await updateAccountBalance(tx, transaction.accountId, fallbackDelta);
  }
  await tx.transactionTagOnTransaction.deleteMany({
    where: { transactionId: transaction.id },
  });
  await tx.transaction.delete({ where: { id: transaction.id } });
}

export async function createTransactionAtomic(input: CreateTransactionInput) {
  if (input.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  return prisma.$transaction(async (tx) => {
    await assertAccount(tx, input.userId, input.accountId);
    if (input.destinationAccountId) {
      await assertAccount(tx, input.userId, input.destinationAccountId);
    }

    if (input.type === "TRANSFER") {
      return createTransfer(tx, input);
    }
    return createIncomeOrExpense(tx, input);
  });
}

export async function deleteTransactionAtomic(
  userId: string,
  transactionId: string,
) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findFirst({
      where: { id: transactionId, userId },
      select: {
        id: true,
        userId: true,
        type: true,
        amount: true,
        accountId: true,
        transferId: true,
        transferGroupId: true,
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await reverseTransactionEffects(tx, transaction);
  });
}

export async function updateTransactionAtomic(input: UpdateTransactionInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findFirst({
      where: { id: input.transactionId, userId: input.userId },
      select: {
        id: true,
        userId: true,
        type: true,
        amount: true,
        accountId: true,
        transferId: true,
        transferGroupId: true,
      },
    });

    if (!existing) {
      throw new Error("Transaction not found");
    }

    await reverseTransactionEffects(tx, existing);

    await assertAccount(tx, input.userId, input.accountId);
    if (input.destinationAccountId) {
      await assertAccount(tx, input.userId, input.destinationAccountId);
    }

    if (input.type === "TRANSFER") {
      const transferGroupId = existing.transferGroupId || randomUUID();
      await updateAccountBalance(tx, input.accountId, -input.amount);
      await updateAccountBalance(tx, input.destinationAccountId!, input.amount);

      const debit = await tx.transaction.create({
        data: {
          userId: input.userId,
          type: "TRANSFER",
          amount: input.amount,
          description: input.description,
          category: input.category || "TRANSFER",
          date: input.date,
          accountId: input.accountId,
          sourceAccountId: input.accountId,
          destinationAccountId: input.destinationAccountId!,
          transferId: "DEBIT",
          transferGroupId,
          paymentMethodId: input.paymentMethodId || null,
        },
      });
      const credit = await tx.transaction.create({
        data: {
          userId: input.userId,
          type: "TRANSFER",
          amount: input.amount,
          description: input.description,
          category: input.category || "TRANSFER",
          date: input.date,
          accountId: input.destinationAccountId!,
          sourceAccountId: input.accountId,
          destinationAccountId: input.destinationAccountId!,
          transferId: "CREDIT",
          transferGroupId,
          paymentMethodId: input.paymentMethodId || null,
        },
      });
      await connectTags(tx, debit.id, input.userId, input.tags);
      await connectTags(tx, credit.id, input.userId, input.tags);
      return [debit, credit];
    }

    const delta = input.type === "INCOME" ? input.amount : -input.amount;
    await updateAccountBalance(tx, input.accountId, delta);

    const transaction = await tx.transaction.create({
      data: {
        userId: input.userId,
        type: input.type,
        amount: input.amount,
        description: input.description,
        category: input.category || null,
        date: input.date,
        accountId: input.accountId,
        paymentMethodId: input.paymentMethodId || null,
      },
    });
    await connectTags(tx, transaction.id, input.userId, input.tags);
    return [transaction];
  });
}

export function getNextRunDate(
  current: Date,
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
) {
  const next = new Date(current);
  if (frequency === "DAILY") next.setDate(next.getDate() + 1);
  if (frequency === "WEEKLY") next.setDate(next.getDate() + 7);
  if (frequency === "MONTHLY") next.setMonth(next.getMonth() + 1);
  if (frequency === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  return next;
}

export function buildEmiSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startDate: Date,
) {
  const monthlyRate = annualRate / 12 / 100;
  const emiAmount =
    monthlyRate === 0
      ? principal / tenureMonths
      : (principal * monthlyRate * (1 + monthlyRate) ** tenureMonths) /
        ((1 + monthlyRate) ** tenureMonths - 1);

  const rows: Array<{
    dueDate: Date;
    amount: number;
    principalComponent: number;
    interestComponent: number;
  }> = [];

  let remaining = principal;
  for (let i = 0; i < tenureMonths; i += 1) {
    const interest = remaining * monthlyRate;
    const principalPart = Math.min(remaining, emiAmount - interest);
    remaining -= principalPart;
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    rows.push({
      dueDate,
      amount: Number(emiAmount.toFixed(2)),
      principalComponent: Number(principalPart.toFixed(2)),
      interestComponent: Number(interest.toFixed(2)),
    });
  }

  return { emiAmount: Number(emiAmount.toFixed(2)), rows };
}
