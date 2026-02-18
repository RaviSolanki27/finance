import { NextResponse } from "next/server";
import * as z from "zod";

import { prisma } from "@/lib/prisma";
import {
  badRequest,
  notFound,
  requireUserId,
  serverError,
  unauthorized,
} from "@/lib/server/auth";

const updateAccountSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  type: z.enum(["CASH", "BANK", "WALLET", "CREDIT", "CREDIT_CARD"]).optional(),
  currency: z.string().trim().length(3).optional(),
  color: z.string().trim().max(32).nullable().optional(),
  icon: z.string().trim().max(64).nullable().optional(),
  isArchived: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { accountId } = await params;
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) return notFound("Account not found");
    return NextResponse.json({ account });
  } catch (error) {
    console.error("accounts:detail", error);
    return serverError();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { accountId } = await params;
    const body = await request.json();
    const parsed = updateAccountSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const existing = await prisma.account.findFirst({
      where: { id: accountId, userId },
      select: { id: true },
    });
    if (!existing) return notFound("Account not found");

    const account = await prisma.account.update({
      where: { id: accountId },
      data: {
        ...parsed.data,
        currency: parsed.data.currency?.toUpperCase(),
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error("accounts:update", error);
    return serverError();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { accountId } = await params;
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
      select: { id: true },
    });
    if (!account) return notFound("Account not found");

    const [transactionCount, recurringCount, loanCount] = await Promise.all([
      prisma.transaction.count({ where: { userId, accountId } }),
      prisma.recurringTransaction.count({
        where: {
          userId,
          OR: [{ accountId }, { destinationAccountId: accountId }],
          status: "ACTIVE",
        },
      }),
      prisma.loan.count({ where: { userId, accountId, status: "ACTIVE" } }),
    ]);

    if (transactionCount > 0 || recurringCount > 0 || loanCount > 0) {
      return badRequest(
        "Account cannot be deleted because it is referenced by transactions, recurring items, or active loans.",
      );
    }

    await prisma.account.delete({ where: { id: accountId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("accounts:delete", error);
    return serverError();
  }
}
