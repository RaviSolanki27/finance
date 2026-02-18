import { NextResponse } from "next/server";
import * as z from "zod";

import { prisma } from "@/lib/prisma";
import { buildEmiSchedule } from "@/lib/server/finance";
import { badRequest, requireUserId, unauthorized } from "@/lib/server/auth";

const schema = z.object({
  amount: z.number().positive(),
  date: z.coerce.date().optional(),
  description: z.string().trim().max(255).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ loanId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { loanId } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());

    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findFirst({
        where: { id: loanId, userId },
      });
      if (!loan) throw new Error("Loan not found");
      if (loan.status !== "ACTIVE") throw new Error("Loan is not active");
      if (parsed.data.amount > loan.remainingPrincipal) {
        throw new Error("Prepayment cannot exceed remaining principal");
      }

      const date = parsed.data.date ?? new Date();

      await tx.account.update({
        where: { id: loan.accountId },
        data: { balance: { decrement: parsed.data.amount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: "EXPENSE",
          amount: parsed.data.amount,
          description:
            parsed.data.description || `Loan prepayment - ${loan.name}`,
          category: "LOAN_PREPAYMENT",
          date,
          accountId: loan.accountId,
        },
      });

      await tx.loanPrepayment.create({
        data: {
          loanId: loan.id,
          amount: parsed.data.amount,
          date,
          transactionId: transaction.id,
        },
      });

      const updatedLoan = await tx.loan.update({
        where: { id: loan.id },
        data: {
          remainingPrincipal: { decrement: parsed.data.amount },
          paidPrincipal: { increment: parsed.data.amount },
          ...(loan.remainingPrincipal - parsed.data.amount <= 0.01
            ? { status: "CLOSED" }
            : {}),
        },
      });

      if (updatedLoan.status === "ACTIVE") {
        const pendingSchedules = await tx.emiSchedule.findMany({
          where: { loanId: loan.id, status: "PENDING" },
          orderBy: { dueDate: "asc" },
        });

        if (pendingSchedules.length > 0) {
          const nextStartDate = pendingSchedules[0].dueDate;
          const rebuilt = buildEmiSchedule(
            updatedLoan.remainingPrincipal,
            updatedLoan.interestRate,
            pendingSchedules.length,
            nextStartDate,
          );

          for (let i = 0; i < pendingSchedules.length; i += 1) {
            await tx.emiSchedule.update({
              where: { id: pendingSchedules[i].id },
              data: {
                amount: rebuilt.rows[i].amount,
                principalComponent: rebuilt.rows[i].principalComponent,
                interestComponent: rebuilt.rows[i].interestComponent,
              },
            });
          }

          await tx.loan.update({
            where: { id: updatedLoan.id },
            data: { emiAmount: rebuilt.emiAmount },
          });
        }
      }

      return {
        loanId: updatedLoan.id,
        transactionId: transaction.id,
        remainingPrincipal: updatedLoan.remainingPrincipal,
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("loans:prepay", error);
    return badRequest(
      error instanceof Error ? error.message : "Failed to process prepayment",
    );
  }
}
