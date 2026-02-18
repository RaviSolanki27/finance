import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const unauthorized = (message = "Unauthorized") =>
  NextResponse.json({ message }, { status: 401 });

export const badRequest = (message: string, errors?: unknown) =>
  NextResponse.json({ message, errors }, { status: 400 });

export const notFound = (message: string) =>
  NextResponse.json({ message }, { status: 404 });

export const serverError = (message = "Internal server error") =>
  NextResponse.json({ message }, { status: 500 });

export function requireUserId(request: Request | NextRequest): string | null {
  const userId = request.headers.get("x-user-id");
  if (!userId) return null;
  return userId;
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limitRaw = Number(searchParams.get("limit") || 20);
  const limit = Math.min(100, Math.max(1, limitRaw));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function parseSort(
  searchParams: URLSearchParams,
  allowed: readonly string[],
  defaultField = "date",
  defaultOrder: "asc" | "desc" = "desc",
) {
  const field = searchParams.get("sortBy") || defaultField;
  const order = (searchParams.get("sortOrder") || defaultOrder).toLowerCase();
  const sortBy = allowed.includes(field) ? field : defaultField;
  const sortOrder: "asc" | "desc" = order === "asc" ? "asc" : "desc";
  return { sortBy, sortOrder };
}
