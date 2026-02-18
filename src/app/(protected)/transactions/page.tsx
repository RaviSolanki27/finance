"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";

import { TransactionTable } from "@/components/TransactionTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAccounts } from "@/store/slices/accountsSlice";
import { fetchTransactions } from "@/store/slices/transactionsSlice";

const schema = yup.object({
  type: yup
    .mixed<"INCOME" | "EXPENSE" | "TRANSFER">()
    .oneOf(["INCOME", "EXPENSE", "TRANSFER"])
    .required(),
  amount: yup.number().moreThan(0).required(),
  description: yup.string().trim().min(2).max(255).required(),
  category: yup.string().trim().max(64).optional(),
  date: yup.date().required(),
  accountId: yup.string().uuid().required(),
  destinationAccountId: yup.string().uuid().nullable().optional(),
});

export default function TransactionsPage() {
  const dispatch = useAppDispatch();
  const { items, pagination } = useAppSelector((state) => state.transactions);
  const { accounts } = useAppSelector((state) => state.accounts);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({
    accountId: "",
    category: "",
    type: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "date",
    sortOrder: "desc",
    page: 1,
    limit: 20,
  });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchTransactions(query));
  }, [dispatch, query]);

  const formik = useFormik({
    initialValues: {
      type: "EXPENSE" as "INCOME" | "EXPENSE" | "TRANSFER",
      amount: 0,
      description: "",
      category: "",
      date: new Date().toISOString().slice(0, 10),
      accountId: "",
      destinationAccountId: "",
    },
    validationSchema: schema,
    onSubmit: async (values, helpers) => {
      const payload = {
        ...values,
        amount: Number(values.amount),
        date: new Date(values.date).toISOString(),
        destinationAccountId:
          values.type === "TRANSFER" ? values.destinationAccountId || null : null,
      };
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        helpers.setStatus("Failed to create transaction");
        return;
      }
      helpers.resetForm();
      setOpen(false);
      dispatch(fetchTransactions(query));
      dispatch(fetchAccounts());
    },
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Category"
          className="w-[180px]"
          value={filters.category}
          onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value, page: 1 }))}
        />
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value, page: 1 }))}
          className="w-[180px]"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value, page: 1 }))}
          className="w-[180px]"
        />
        <Select
          value={filters.type || "ALL"}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, type: value === "ALL" ? "" : value, page: 1 }))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="TRANSFER">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.accountId || "ALL"}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, accountId: value === "ALL" ? "" : value, page: 1 }))
          }
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Accounts</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto">Add Transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Transaction</DialogTitle>
              <DialogDescription>
                Income, expense, and transfer entries are handled atomically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formik.values.type}
                    onValueChange={(value) => formik.setFieldValue("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOME">Income</SelectItem>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" name="amount" type="number" value={formik.values.amount} onChange={formik.handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" value={formik.values.description} onChange={formik.handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" value={formik.values.category} onChange={formik.handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" value={formik.values.date} onChange={formik.handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Account</Label>
                <Select
                  value={formik.values.accountId}
                  onValueChange={(value) => formik.setFieldValue("accountId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formik.values.type === "TRANSFER" ? (
                <div className="space-y-2">
                  <Label>Destination Account</Label>
                  <Select
                    value={formik.values.destinationAccountId}
                    onValueChange={(value) => formik.setFieldValue("destinationAccountId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((acc) => acc.id !== formik.values.accountId)
                        .map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {formik.status ? <p className="text-sm text-rose-500">{formik.status}</p> : null}
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <TransactionTable rows={items} />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.min(pagination.totalPages || 1, prev.page + 1),
                }))
              }
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
