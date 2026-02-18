import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  parsePagination,
  parseSort,
  requireUserId,
  serverError,
  unauthorized,
} from "@/lib/server/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const userId = requireUserId(request);
  if (!userId) return unauthorized();

  try {
    const { accountId } = await params;
    const { searchParams } = new URL(request.url);
    const { skip, limit, page } = parsePagination(searchParams);
    const { sortBy, sortOrder } = parseSort(
      searchParams,
      ["date", "amount", "createdAt"],
      "date",
      "desc",
    );

    const where = { userId, accountId };
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
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
    console.error("accounts:history", error);
    return serverError();
  }
}
