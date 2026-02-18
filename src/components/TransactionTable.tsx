"use client";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type TransactionRow = {
  id: string;
  date: string;
  description: string;
  category: string | null;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  account?: { name?: string } | null;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);

const typeIcon: Record<TransactionRow["type"], ReactNode> = {
  INCOME: <ArrowUpRight className="size-4" />,
  EXPENSE: <ArrowDownLeft className="size-4" />,
  TRANSFER: <ArrowLeftRight className="size-4" />,
};

export function TransactionTable({
  rows,
  emptyLabel = "No transactions found.",
}: {
  rows: TransactionRow[];
  emptyLabel?: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell>{item.category || "UNCATEGORIZED"}</TableCell>
                <TableCell>{item.account?.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1">
                    {typeIcon[item.type]}
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    item.type === "INCOME"
                      ? "text-emerald-600"
                      : item.type === "EXPENSE"
                        ? "text-rose-600"
                        : ""
                  }`}
                >
                  {item.type === "EXPENSE" ? "-" : ""}
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
