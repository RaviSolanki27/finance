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

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const SignIn = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signInSchema>) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "Unable to sign in.");
      }

      toast.success("Signed in successfully");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access your finance dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="sign-in-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="sign-in-email"
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
                    <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="sign-in-password"
                      type="password"
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter your password"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" form="sign-in-form" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/sign-up" className="font-medium text-foreground underline">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignIn;
