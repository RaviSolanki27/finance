import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createTransactionAtomic, getNextRunDate } from "@/lib/server/finance";
import { requireUserId, serverError, unauthorized } from "@/lib/server/auth";

export async function POST(request: Request) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const now = new Date();
    const dueItems = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        status: "ACTIVE",
        nextRunAt: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { nextRunAt: "asc" },
    });

    let generated = 0;

    for (const item of dueItems) {
      const windowStart = new Date(item.nextRunAt);
      const windowEnd = new Date(getNextRunDate(item.nextRunAt, item.frequency));

      const duplicate = await prisma.transaction.findFirst({
        where: {
          userId,
          recurringTransactionId: item.id,
          date: { gte: windowStart, lt: windowEnd },
        },
        select: { id: true },
      });
      if (duplicate) {
        await prisma.recurringTransaction.update({
          where: { id: item.id },
          data: {
            lastGeneratedAt: now,
            nextRunAt: getNextRunDate(item.nextRunAt, item.frequency),
          },
        });
        continue;
      }

      await createTransactionAtomic({
        userId,
        type: item.type as "INCOME" | "EXPENSE" | "TRANSFER",
        amount: item.amount,
        description: item.name,
        category: item.category || undefined,
        date: item.nextRunAt,
        accountId: item.accountId,
        destinationAccountId: item.destinationAccountId || undefined,
        recurringTransactionId: item.id,
        isRecurringGenerated: true,
      });

      await prisma.recurringTransaction.update({
        where: { id: item.id },
        data: {
          lastGeneratedAt: now,
          nextRunAt: getNextRunDate(item.nextRunAt, item.frequency),
          ...(item.endDate && item.endDate <= now ? { status: "ENDED" } : {}),
        },
      });
      generated += 1;
    }

    return NextResponse.json({ generated, scanned: dueItems.length });
  } catch (error) {
    console.error("recurring:generate", error);
    return serverError();
  }
}
