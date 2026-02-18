import { NextResponse } from "next/server";
import * as z from "zod";

import { prisma } from "@/lib/prisma";
import { buildEmiSchedule } from "@/lib/server/finance";
import {
  badRequest,
  requireUserId,
  serverError,
  unauthorized,
} from "@/lib/server/auth";

const createLoanSchema = z.object({
  name: z.string().trim().min(2).max(120),
  principal: z.number().positive(),
  interestRate: z.number().min(0).max(100),
  tenureMonths: z.number().int().min(1).max(600),
  startDate: z.coerce.date(),
  accountId: z.string().uuid(),
});

export async function GET(request: Request) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const items = await prisma.loan.findMany({
      where: { userId },
      include: {
        account: true,
        emiSchedules: {
          orderBy: { dueDate: "asc" },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("loans:list", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const body = await request.json();
    const parsed = createLoanSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const data = parsed.data;
    const { emiAmount, rows } = buildEmiSchedule(
      data.principal,
      data.interestRate,
      data.tenureMonths,
      data.startDate,
    );

    const loan = await prisma.$transaction(async (tx) => {
      const created = await tx.loan.create({
        data: {
          userId,
          accountId: data.accountId,
          name: data.name,
          principal: data.principal,
          remainingPrincipal: data.principal,
          interestRate: data.interestRate,
          tenureMonths: data.tenureMonths,
          emiAmount,
          startDate: data.startDate,
        },
      });

      await tx.emiSchedule.createMany({
        data: rows.map((item) => ({
          loanId: created.id,
          dueDate: item.dueDate,
          amount: item.amount,
          principalComponent: item.principalComponent,
          interestComponent: item.interestComponent,
        })),
      });

      return created;
    });

    return NextResponse.json({ loan }, { status: 201 });
  } catch (error) {
    console.error("loans:create", error);
    return serverError();
  }
}
