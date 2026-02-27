import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET() {
  // ✅ Added 'await' here to fix the Promise error
  const cookieStore = await cookies();
  const sid = cookieStore.get("session_id")?.value;

  if (!sid) return NextResponse.json({ user: null }, { status: 200 });

  const session = await prisma.session.findUnique({
    where: { id: sid },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: { id: session.user.id, email: session.user.email },
  });
}
