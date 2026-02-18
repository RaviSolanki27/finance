import { NextResponse } from "next/server";
import * as z from "zod";

import { prisma } from "@/lib/prisma";
import { badRequest, notFound, requireUserId, serverError, unauthorized } from "@/lib/server/auth";

const updateSchema = z.object({
  category: z.string().trim().min(2).max(60).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  currentValue: z.number().optional(),
  currency: z.string().trim().length(3).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  valuationDate: z.coerce.date().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { entryId } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());

    const existing = await prisma.netWorthEntry.findFirst({
      where: { id: entryId, userId },
      select: { id: true },
    });
    if (!existing) return notFound("Entry not found");

    const item = await prisma.netWorthEntry.update({
      where: { id: entryId },
      data: {
        ...parsed.data,
        currency: parsed.data.currency?.toUpperCase(),
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    console.error("net-worth:update", error);
    return serverError();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { entryId } = await params;
    const existing = await prisma.netWorthEntry.findFirst({
      where: { id: entryId, userId },
      select: { id: true },
    });
    if (!existing) return notFound("Entry not found");

    await prisma.netWorthEntry.delete({ where: { id: entryId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("net-worth:delete", error);
    return serverError();
  }
}
