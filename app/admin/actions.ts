"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ────────────────────────────────────────────────
// 🔐 ENCRYPTION UTILITIES (AES-256-CBC)
// ────────────────────────────────────────────────

// Ensure you have ENCRYPTION_KEY in your .env file (must be 32 chars)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default_insecure_key_change_me_now"; 
const IV_LENGTH = 16; // For AES, this is always 16 bytes

function encrypt(text: string) {
  // Prevent encrypting if key is weak in production
  if (process.env.NODE_ENV === 'production' && ENCRYPTION_KEY.length !== 32) {
    throw new Error("Invalid ENCRYPTION_KEY length. Must be 32 bytes.");
  }
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Exported so other parts of your app can decrypt when needed
export async function decrypt(text: string) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// ────────────────────────────────────────────────
// 🔒 MIDDLEWARE: Verify Admin Status & Session
// ────────────────────────────────────────────────
async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  if (!sessionId) throw new Error("Unauthorized");

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  // 1. Check if session exists
  if (!session) {
    throw new Error("Unauthorized: Session not found");
  }

  // 2. 🟢 CRITICAL SECURITY FIX: Check if session is expired
  if (session.expiresAt < new Date()) {
    // Clean up dead session
    await prisma.session.delete({ where: { id: sessionId } }); 
    throw new Error("Unauthorized: Session expired");
  }

  // 3. Check Admin Role
  if (session.user.role !== "ADMIN") {
    throw new Error("Access Denied: Admins Only");
  }

  return session.user;
}

// ────────────────────────────────────────────────
// 📊 DASHBOARD STATS
// ────────────────────────────────────────────────
export async function getAdminStats() {
  await requireAdmin();
  
  const [totalUsers, pendingDeposits, totalRevenueResult, liveInventory] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.deposit.count({ where: { status: "PENDING" } }),
    prisma.deposit.aggregate({ 
      where: { status: "COMPLETED" },
      _sum: { amount: true } 
    }),
    prisma.card.count({ where: { status: "live" } }),
  ]);

  return {
    totalUsers,
    pendingDeposits,
    totalRevenue: totalRevenueResult._sum.amount || 0,
    liveInventory
  };
}

// ────────────────────────────────────────────────
// 💰 DEPOSIT MANAGEMENT
// ────────────────────────────────────────────────
export async function getPendingDeposits() {
  await requireAdmin();
  return await prisma.deposit.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { email: true } } }, 
    orderBy: { createdAt: "desc" },
  });
}

export async function approveDeposit(depositId: string) {
  await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      const deposit = await tx.deposit.findUnique({ where: { id: depositId } });
      if (!deposit || deposit.status !== "PENDING") throw new Error("Invalid deposit");

      await tx.deposit.update({
        where: { id: depositId },
        data: { status: "COMPLETED" },
      });

      await tx.user.update({
        where: { id: deposit.userId },
        data: { balance: { increment: deposit.amount } },
      });
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to approve deposit" };
  }
}

// ────────────────────────────────────────────────
// 💳 INVENTORY MANAGEMENT
// ────────────────────────────────────────────────

// 🟢 VALIDATION SCHEMA (Includes American Express)
const cardSchema = z.object({
  pan: z.string().min(13).max(19),
  exp: z.string(),
  cvv: z.string(),
  // Explicitly validate supported networks
  brand: z.enum([
    "visa", 
    "mastercard", 
    "american-express", 
    "discover", 
    "diners-club", 
    "jcb", 
    "maestro", 
    "unionpay"
  ]),
  type: z.string(),
  country: z.string().length(2),
  balance: z.coerce.number(),
  price: z.coerce.number(),
});

// 2. Add Card (Encrypted)
export async function addCardInventory(formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = cardSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { pan, cvv, ...data } = parsed.data;

  try {
    // 🔒 Encrypt sensitive data before saving
    const encryptedPan = encrypt(pan);
    const encryptedCvv = encrypt(cvv);

    await prisma.card.create({
      data: {
        ...data,
        bin: pan.substring(0, 6),
        last4: pan.slice(-4),
        fullPan: encryptedPan, // Stored as 'iv:ciphertext'
        cvv: encryptedCvv,     // Stored as 'iv:ciphertext'
        status: "live",
        vbv: "non-vbv"
      }
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Add Card Error:", error);
    return { success: false, error: "Database Error: Could not add card." };
  }
}

// 3. Get Inventory List
export async function getInventoryList() {
  await requireAdmin();
  return await prisma.card.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      bin: true,
      last4: true,
      brand: true,
      country: true,
      balance: true,
      price: true,
      status: true,
      createdAt: true
      // Note: We deliberately do NOT select fullPan or cvv here for safety
    }
  });
}

// 4. Delete Card
export async function deleteCard(cardId: string) {
  await requireAdmin();
  try {
    await prisma.card.delete({ where: { id: cardId } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete card" };
  }
}

// 5. Update Card
export async function updateCard(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const price = parseFloat(formData.get("price") as string);
  const balance = parseFloat(formData.get("balance") as string);
  const status = formData.get("status") as string;

  if (!id) return { success: false, error: "Missing ID" };

  try {
    await prisma.card.update({
      where: { id },
      data: {
        price,
        balance,
        status
      }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update card" };
  }
}

// ────────────────────────────────────────────────
// 👥 USER MANAGEMENT
// ────────────────────────────────────────────────
export async function getUsers() {
  await requireAdmin();
  return await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      balance: true
    },
    take: 100
  });
}

// ────────────────────────────────────────────────
// 📜 TRANSACTION HISTORY
// ────────────────────────────────────────────────
export async function getTransactionHistory() {
  await requireAdmin();
  
  const [recentDeposits, recentSales] = await Promise.all([
    prisma.deposit.findMany({
      where: { status: "COMPLETED" },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.order.findMany({ 
      include: { 
        user: { select: { email: true } },
        card: { select: { bin: true, brand: true, last4: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
  ]);

  return { recentDeposits, recentSales };
}

// ────────────────────────────────────────────────
// 🔐 AUTH & SETTINGS
// ────────────────────────────────────────────────
export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Check if user exists and is ADMIN
    if (!user || user.role !== "ADMIN") {
      // Fake delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500)); 
      return { success: false, error: "Access Denied" };
    }

    // 🔒 SECURE: Verify password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      return { success: false, error: "Invalid Credentials" };
    }

    const session = await prisma.session.create({
      data: { userId: user.id, expiresAt: new Date(Date.now() + 86400000) } // 24 hours
    });

    const cookieStore = await cookies();
    cookieStore.set("session_id", session.id, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      path: "/",
      sameSite: "strict"
    });

    return { success: true };
  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, error: "Login Failed" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (sessionId) {
    // 🗑️ Delete from Database (Revoke Access immediately)
    await prisma.session.deleteMany({
      where: { id: sessionId }
    });
  }

  // 🗑️ Delete Cookie
  cookieStore.delete("session_id");

  revalidatePath("/");
  return { success: true };
}

export async function changeAdminPassword(newPass: string) {
  const admin = await requireAdmin();
  
  if (newPass.length < 8) {
    return { success: false, error: "Password too short (min 8 chars)" };
  }

  try {
    // 🔒 SECURE: Hash new password before saving
    const hashedPassword = await bcrypt.hash(newPass, 12);

    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: hashedPassword } 
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: "Update failed" };
  }
}