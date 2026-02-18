import { NextResponse } from "next/server";
import * as z from "zod";

import { prisma } from "@/lib/prisma";
import {
  deleteTransactionAtomic,
  updateTransactionAtomic,
} from "@/lib/server/finance";
import {
  badRequest,
  notFound,
  requireUserId,
  serverError,
  unauthorized,
} from "@/lib/server/auth";

const updateSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive(),
  description: z.string().trim().min(2).max(255),
  category: z.string().trim().max(64).optional(),
  date: z.coerce.date(),
  accountId: z.string().uuid(),
  destinationAccountId: z.string().uuid().optional().nullable(),
  paymentMethodId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(32)).max(10).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { transactionId } = await params;
    const item = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: {
        account: true,
        sourceAccount: true,
        destinationAccount: true,
        tags: { include: { tag: true } },
      },
    });
    if (!item) return notFound("Transaction not found");
    return NextResponse.json({ item });
  } catch (error) {
    console.error("transactions:detail", error);
    return serverError();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { transactionId } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }
    const items = await updateTransactionAtomic({
      transactionId,
      userId,
      ...parsed.data,
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("transactions:update", error);
    return badRequest(error instanceof Error ? error.message : "Failed to update transaction");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { transactionId } = await params;
    await deleteTransactionAtomic(userId, transactionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("transactions:delete", error);
    return badRequest(error instanceof Error ? error.message : "Failed to delete transaction");
  }
}
