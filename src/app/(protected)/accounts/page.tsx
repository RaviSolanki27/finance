"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";

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

const validationSchema = yup.object({
  name: yup.string().trim().min(2).max(60).required("Name is required"),
  type: yup
    .mixed<"CASH" | "BANK" | "WALLET" | "CREDIT_CARD">()
    .oneOf(["CASH", "BANK", "WALLET", "CREDIT_CARD"])
    .required("Type is required"),
  initialBalance: yup.number().min(0).required("Initial balance is required"),
  currency: yup.string().trim().length(3).required("Currency is required"),
  color: yup.string().trim().max(32).optional(),
  icon: yup.string().trim().max(64).optional(),
});

export default function AccountsPage() {
  const dispatch = useAppDispatch();
  const { accounts, groupedTotals, totalBalance } = useAppSelector((state) => state.accounts);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const formik = useFormik({
    initialValues: {
      name: "",
      type: "BANK" as "CASH" | "BANK" | "WALLET" | "CREDIT_CARD",
      initialBalance: 0,
      currency: "USD",
      color: "#0f172a",
      icon: "wallet",
    },
    validationSchema,
    onSubmit: async (values, helpers) => {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        helpers.setStatus("Failed to create account");
        return;
      }
      helpers.resetForm();
      setOpen(false);
      dispatch(fetchAccounts());
    },
  });

  const grouped = useMemo(
    () =>
      groupedTotals.map((item) => ({
        type: item.type,
        value: item._sum.balance || 0,
        count: item._count._all,
      })),
    [groupedTotals],
  );

  return (
    <section className="space-y-4">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {totalBalance.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {accounts.length} active accounts
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Totals By Account Type</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>Add Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Account</DialogTitle>
                  <DialogDescription>
                    Add cash, bank, credit card, or wallet account.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={formik.handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" value={formik.values.name} onChange={formik.handleChange} />
                  </div>
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
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK">Bank</SelectItem>
                        <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                        <SelectItem value="WALLET">Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="initialBalance">Initial Balance</Label>
                      <Input id="initialBalance" name="initialBalance" type="number" value={formik.values.initialBalance} onChange={formik.handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Input id="currency" name="currency" maxLength={3} value={formik.values.currency} onChange={formik.handleChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Input id="color" name="color" value={formik.values.color} onChange={formik.handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="icon">Icon</Label>
                      <Input id="icon" name="icon" value={formik.values.icon} onChange={formik.handleChange} />
                    </div>
                  </div>
                  {formik.status ? (
                    <p className="text-sm text-rose-500">{formik.status}</p>
                  ) : null}
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {grouped.map((item) => (
              <div key={item.type} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{item.type}</p>
                <p className="font-semibold">
                  {item.value.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">{item.count} accounts</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="rounded-lg border p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block size-3 rounded-full"
                  style={{ backgroundColor: account.color || "#64748b" }}
                />
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{account.type}</p>
                </div>
              </div>
              <p className="font-semibold">
                {account.balance.toLocaleString("en-US", {
                  style: "currency",
                  currency: account.currency || "USD",
                })}
              </p>
            </div>
          ))}
          {!accounts.length ? (
            <p className="text-sm text-muted-foreground">No accounts found.</p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
