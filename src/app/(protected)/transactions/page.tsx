"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { DataTableDemo } from "@/components/TransactionTable";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  title: z
    .string()
    .min(3, "Name must be at least 3 characters.")
    .max(150, "Name must be at most 150 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(100, "Description must be at most 100 characters."),
  type: z.string().nonempty("Please select a transaction type."),
  category: z.string().nonempty("Please select a transaction category."),
  account: z.string().nonempty("Please select an account."),
  method: z.string().nonempty("Please select a payment method."),
  date: z.date({ error: "Please select a date" }),
  amount: z
    .string()
    .regex(/^\d+$/, "Amount must be a valid number.")
    .refine((val) => Number(val) >= 1, {
      message: "Amount must be at least 1.",
    })
    .refine((val) => Number(val) <= 100000, {
      message: "Amount must be less than 100000.",
    }),
  time: z
    .string()
    .nonempty("Please select a time.")
    .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Invalid time format"),
});

const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDefaultValues = (): z.infer<typeof formSchema> => ({
  title: "",
  description: "",
  type: "",
  amount: "",
  category: "",
  account: "",
  method: "",
  date: new Date(),
  time: getCurrentTime(),
});

const Transactions = () => {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const resetForm = () => {
    form.reset(getDefaultValues());
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    toast("You submitted the following values:", {
      description: (
        <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
      position: "bottom-right",
      classNames: {
        content: "flex flex-col gap-2",
      },
      style: {
        "--border-radius": "calc(var(--radius)  + 4px)",
      } as React.CSSProperties,
    });
  };

  return (
    <div>
      <Dialog
        open={dialogOpen}
        onOpenChange={(isOpen) => {
          setDialogOpen(isOpen);
          if (!isOpen) resetForm();
        }}
      >
        <DialogTrigger asChild>
          <Button>
            <PlusCircle />
            Add new
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adding a new transaction</DialogTitle>
          </DialogHeader>
          <DialogDescription>Please fill in the form below</DialogDescription>
          <form
            id="form-rhf-demo"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FieldGroup className="grid grid-cols-2 gap-4">
              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-amount">Amount</FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-amount"
                      aria-invalid={fieldState.invalid}
                      placeholder="eg. 10000"
                      autoComplete="off"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="type"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-type">Transaction type</FieldLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="form-rhf-demo-type">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-title">Name</FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-title"
                      aria-invalid={fieldState.invalid}
                      placeholder="Name or short description (eg. House rent)"
                      autoComplete="off"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-description">Description</FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-description"
                      aria-invalid={fieldState.invalid}
                      placeholder="Add transaction details"
                      autoComplete="off"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="category"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-category">Category</FieldLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="form-rhf-demo-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shopping">Shopping</SelectItem>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="bills">Bills</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <Controller
                name="account"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-account">Account</FieldLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="form-rhf-demo-account">
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hdfc">HDFC bank</SelectItem>
                        <SelectItem value="icici">ICICI bank</SelectItem>
                        <SelectItem value="bob">Bank of Baroda</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="method"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-method">Payment method</FieldLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="form-rhf-demo-method">
                        <SelectValue placeholder="Select a method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="debit_card">Debit Card</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <Controller
                name="date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Date</FieldLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {field.value ? field.value.toDateString() : "Pick a date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="time"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-time">Time</FieldLabel>
                    <Input
                      {...field}
                      type="time"
                      id="form-rhf-demo-time"
                      step="60"
                      aria-invalid={fieldState.invalid}
                      className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
          <DialogFooter className="mt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="form-rhf-demo">
              Add new transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DataTableDemo />
    </div>
  );
};

export default Transactions;
