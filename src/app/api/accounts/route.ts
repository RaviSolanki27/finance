import { NextResponse } from "next/server";
import * as z from "zod";

import { prisma } from "@/lib/prisma";
import {
  badRequest,
  requireUserId,
  serverError,
  unauthorized,
} from "@/lib/server/auth";

const createAccountSchema = z.object({
  name: z.string().trim().min(2).max(60),
  type: z.enum(["CASH", "BANK", "WALLET", "CREDIT", "CREDIT_CARD"]),
  initialBalance: z.number().min(0),
  currency: z.string().trim().length(3),
  color: z.string().trim().max(32).optional(),
  icon: z.string().trim().max(64).optional(),
});

export async function GET(request: Request) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const [accounts, groupedTotals] = await Promise.all([
      prisma.account.findMany({
        where: { userId, isArchived: false },
        orderBy: [{ type: "asc" }, { createdAt: "desc" }],
      }),
      prisma.account.groupBy({
        by: ["type"],
        where: { userId, isArchived: false },
        _sum: { balance: true },
        _count: { _all: true },
      }),
    ]);

    const totalBalance = accounts.reduce((sum, item) => sum + item.balance, 0);

    return NextResponse.json({
      accounts,
      totalBalance,
      groupedTotals,
    });
  } catch (error) {
    console.error("accounts:get", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const body = await request.json();
    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const { name, type, initialBalance, currency, color, icon } = parsed.data;

    const account = await prisma.account.create({
      data: {
        userId,
        name,
        type,
        initialBalance,
        balance: initialBalance,
        currency: currency.toUpperCase(),
        color: color || null,
        icon: icon || null,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("accounts:create", error);
    return serverError();
  }
}
