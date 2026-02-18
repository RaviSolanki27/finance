import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import * as z from "zod";

import { generateToken, setAuthToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().min(2, "Name must be at least 2 characters.").max(60).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = signUpSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid request body.", errors: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const email = parsedBody.data.email.toLowerCase().trim();
    const password = parsedBody.data.password;
    const name = parsedBody.data.name?.trim() || null;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const token = await generateToken({
      userId: user.id,
      email: user.email,
    });

    await setAuthToken(token);

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
