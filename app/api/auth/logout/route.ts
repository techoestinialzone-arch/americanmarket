import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST() {
  const sid = cookies().get("session_id")?.value;

  if (sid) {
    await prisma.session.delete({ where: { id: sid } }).catch(() => {});
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session_id", "", { path: "/", maxAge: 0 });
  return res;
}
