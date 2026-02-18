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

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(255).nullable().optional(),
  amount: z.number().positive().optional(),
  category: z.string().trim().max(64).nullable().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ENDED"]).optional(),
  endDate: z.coerce.date().nullable().optional(),
  destinationAccountId: z.string().uuid().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ recurringId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { recurringId } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const existing = await prisma.recurringTransaction.findFirst({
      where: { id: recurringId, userId },
      select: { id: true },
    });
    if (!existing) return notFound("Recurring transaction not found");

    const item = await prisma.recurringTransaction.update({
      where: { id: recurringId },
      data: parsed.data,
    });
    return NextResponse.json({ item });
  } catch (error) {
    console.error("recurring:update", error);
    return serverError();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ recurringId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { recurringId } = await params;
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id: recurringId, userId },
      select: { id: true },
    });
    if (!existing) return notFound("Recurring transaction not found");

    await prisma.recurringTransaction.update({
      where: { id: recurringId },
      data: { status: "ENDED", endDate: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("recurring:delete", error);
    return serverError();
  }
}
