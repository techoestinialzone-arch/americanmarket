import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db"; 
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  // 1. Verify Session
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    redirect("/login");
  }

  // 2. Fetch User Data
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    redirect("/login");
  }

  // 3. Render Client Component with Real Data
  return (
    <DashboardClient 
      initialBalance={session.user.balance || 0} 
    />
  );
}