import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  // 🟢 FIX: Await the cookies() promise before using it
  const cookieStore = await cookies();
  const sid = cookieStore.get("session_id")?.value;

  if (sid) {
    try {
      await prisma.session.delete({ where: { id: sid } });
    } catch (e) {
      // Ignore error if session already deleted
    }
  }

  const response = NextResponse.json({ success: true });
  
  // Delete the cookie from the browser
  response.cookies.delete("session_id");

  return response;
}
