import { NextResponse } from "next/server";
import * as z from "zod";

import { prisma } from "@/lib/prisma";
import { badRequest, requireUserId, serverError, unauthorized } from "@/lib/server/auth";

const schema = z.object({
  type: z.enum(["ASSET", "DEBT"]),
  category: z.string().trim().min(2).max(60),
  name: z.string().trim().min(2).max(120),
  currentValue: z.number(),
  currency: z.string().trim().length(3),
  notes: z.string().trim().max(500).optional(),
  valuationDate: z.coerce.date().optional(),
});

export async function GET(request: Request) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const entries = await prisma.netWorthEntry.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    const totals = entries.reduce(
      (acc, item) => {
        if (item.type === "ASSET") acc.assets += item.currentValue;
        if (item.type === "DEBT") acc.debts += item.currentValue;
        return acc;
      },
      { assets: 0, debts: 0 },
    );
    return NextResponse.json({
      entries,
      totals: {
        ...totals,
        netWorth: totals.assets - totals.debts,
      },
    });
  } catch (error) {
    console.error("net-worth:list", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());

    const item = await prisma.netWorthEntry.create({
      data: {
        userId,
        ...parsed.data,
        currency: parsed.data.currency.toUpperCase(),
        valuationDate: parsed.data.valuationDate ?? new Date(),
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("net-worth:create", error);
    return serverError();
  }
}
