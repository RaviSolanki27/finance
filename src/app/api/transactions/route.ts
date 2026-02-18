import { NextResponse } from "next/server";
import * as z from "zod";

import { prisma } from "@/lib/prisma";
import {
  createTransactionAtomic,
} from "@/lib/server/finance";
import {
  badRequest,
  parsePagination,
  parseSort,
  requireUserId,
  serverError,
  unauthorized,
} from "@/lib/server/auth";

const transactionTypeSchema = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);

const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive(),
  description: z.string().trim().min(2).max(255),
  category: z.string().trim().max(64).optional(),
  date: z.coerce.date().optional(),
  accountId: z.string().uuid(),
  destinationAccountId: z.string().uuid().optional().nullable(),
  paymentMethodId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(32)).max(10).optional(),
});

export async function GET(request: Request) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const { skip, limit, page } = parsePagination(searchParams);
    const { sortBy, sortOrder } = parseSort(
      searchParams,
      ["date", "amount", "createdAt"],
      "date",
      "desc",
    );
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const category = searchParams.get("category");
    const accountId = searchParams.get("accountId");
    const typeRaw = searchParams.get("type");
    const typeParsed = typeRaw ? transactionTypeSchema.safeParse(typeRaw) : null;

    const where = {
      userId,
      ...(category ? { category } : {}),
      ...(accountId ? { accountId } : {}),
      ...(typeParsed?.success ? { type: typeParsed.data } : {}),
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: true,
          sourceAccount: true,
          destinationAccount: true,
          tags: { include: { tag: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("transactions:list", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const body = await request.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }
    const result = await createTransactionAtomic({
      userId,
      ...parsed.data,
      date: parsed.data.date ?? new Date(),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("transactions:create", error);
    return badRequest(error instanceof Error ? error.message : "Failed to create transaction");
  }
}
