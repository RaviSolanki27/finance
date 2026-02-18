import { NextResponse } from "next/server";
import * as z from "zod";

import { prisma } from "@/lib/prisma";
import { badRequest, requireUserId, unauthorized } from "@/lib/server/auth";

const schema = z.object({
  paymentDate: z.coerce.date().optional(),
  description: z.string().trim().max(255).optional(),
  category: z.string().trim().max(64).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ loanId: string; emiId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { loanId, emiId } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());

    const paymentDate = parsed.data.paymentDate ?? new Date();

    const result = await prisma.$transaction(async (tx) => {
      const emi = await tx.emiSchedule.findFirst({
        where: { id: emiId, loanId, loan: { userId } },
        include: { loan: true },
      });
      if (!emi) throw new Error("EMI schedule not found");
      if (emi.status === "PAID") throw new Error("EMI already paid");

      await tx.account.update({
        where: { id: emi.loan.accountId },
        data: { balance: { decrement: emi.amount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: "EXPENSE",
          amount: emi.amount,
          description:
            parsed.data.description || `EMI Payment - ${emi.loan.name}`,
          category: parsed.data.category || "LOAN_EMI",
          date: paymentDate,
          accountId: emi.loan.accountId,
        },
      });

      await tx.emiSchedule.update({
        where: { id: emi.id },
        data: {
          status: "PAID",
          paidAt: paymentDate,
          transactionId: transaction.id,
        },
      });

      const updatedLoan = await tx.loan.update({
        where: { id: emi.loan.id },
        data: {
          paidPrincipal: { increment: emi.principalComponent },
          paidInterest: { increment: emi.interestComponent },
          remainingPrincipal: {
            decrement: emi.principalComponent,
          },
        },
      });

      if (updatedLoan.remainingPrincipal <= 0.01) {
        await tx.loan.update({
          where: { id: emi.loan.id },
          data: { status: "CLOSED", remainingPrincipal: 0 },
        });
      }

      return { emiId: emi.id, transactionId: transaction.id };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("loans:pay-emi", error);
    return badRequest(error instanceof Error ? error.message : "Failed to pay EMI");
  }
}
