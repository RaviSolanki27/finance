import { NextResponse } from "next/server";
import * as z from "zod";

import { prisma } from "@/lib/prisma";
import { getNextRunDate } from "@/lib/server/finance";
import {
  badRequest,
  requireUserId,
  serverError,
  unauthorized,
} from "@/lib/server/auth";

const recurringSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(255).optional(),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  category: z.string().trim().max(64).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  accountId: z.string().uuid(),
  destinationAccountId: z.string().uuid().optional().nullable(),
});

export async function GET(request: Request) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const items = await prisma.recurringTransaction.findMany({
      where: { userId },
      include: {
        account: true,
        destinationAccount: true,
      },
      orderBy: [{ status: "asc" }, { nextRunAt: "asc" }],
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("recurring:list", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const body = await request.json();
    const parsed = recurringSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }
    const data = parsed.data;

    if (data.type === "TRANSFER" && !data.destinationAccountId) {
      return badRequest("destinationAccountId is required for transfer recurring transactions");
    }

    const nextRunAt = data.startDate > new Date()
      ? data.startDate
      : getNextRunDate(data.startDate, data.frequency);

    const item = await prisma.recurringTransaction.create({
      data: {
        userId,
        name: data.name,
        description: data.description || null,
        amount: data.amount,
        type: data.type,
        category: data.category || null,
        frequency: data.frequency,
        startDate: data.startDate,
        endDate: data.endDate || null,
        nextRunAt,
        accountId: data.accountId,
        destinationAccountId: data.destinationAccountId || null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("recurring:create", error);
    return serverError();
  }
}
