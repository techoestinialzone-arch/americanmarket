import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs"; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Validation
    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create the user
    const user = await prisma.user.create({
      data: { 
        email, 
        // 👇 FIXED: This must match your schema.prisma field name
        passwordHash: hashedPassword, 
        balance: 0.00 // Optional: Explicitly set initial balance
      },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });

  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}