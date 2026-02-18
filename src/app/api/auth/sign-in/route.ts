import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import * as z from "zod";

import { generateToken, setAuthToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

const signInSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = signInSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid request body.", errors: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsedBody.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !(await compare(password, user.password))) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await generateToken({
      userId: user.id,
      email: user.email,
    });

    await setAuthToken(token);

    return NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
