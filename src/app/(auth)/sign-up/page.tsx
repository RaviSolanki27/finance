"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters.").max(60),
    email: z.string().email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(100, "Password must be at most 100 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const SignUp = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "Unable to sign up.");
      }

      toast.success("Account created successfully");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign up.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Start managing your money in one place.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="sign-up-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sign-up-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="sign-up-name"
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Your name"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="sign-up-email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="you@example.com"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="sign-up-password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Create a password"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sign-up-confirm-password">
                      Confirm password
                    </FieldLabel>
                    <Input
                      {...field}
                      id="sign-up-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Repeat password"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" form="sign-up-form" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-foreground underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUp;
