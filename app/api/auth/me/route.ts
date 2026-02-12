import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  // 🟢 FIX: Await the cookies() promise
  const cookieStore = await cookies();
  const sid = cookieStore.get("session_id")?.value;

  if (!sid) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const session = await prisma.session.findUnique({
    where: { id: sid },
    include: { user: { select: { id: true, email: true, role: true, balance: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user: session.user }, { status: 200 });
}
