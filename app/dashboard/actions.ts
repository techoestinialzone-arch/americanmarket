"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import crypto from "crypto"; // 🟢 Added for decryption

// ────────────────────────────────────────────────
// 🔐 DECRYPTION UTILITIES
// ────────────────────────────────────────────────
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ""; 

async function decryptData(text: string) {
  try {
    if (!text || !text.includes(':')) return text;
    
    // Security check: Key must be exactly 32 chars for AES-256
    if (ENCRYPTION_KEY.length !== 32) {
      console.error("Decryption failed: ENCRYPTION_KEY must be 32 characters.");
      return "CONFIG_ERROR";
    }

    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error("Decryption failed:", e);
    return "DECRYPTION_ERROR";
  }
}

// ────────────────────────────────────────────────
// 1. INPUT VALIDATION
// ────────────────────────────────────────────────

const inventorySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  filters: z.object({
    search: z.string().trim().optional().or(z.literal("")),
    brand: z.string().trim().optional(),
    country: z.string().trim().optional(),
    vbv: z.enum(["vbv", "non-vbv"]).optional(),
    type: z.enum(["credit", "debit"]).optional(),
  }).optional(),
  sort: z.object({
    key: z.enum(["price", "balance", "country", "brand"]),
    direction: z.enum(["asc", "desc"]),
  }).optional(),
});

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

// ────────────────────────────────────────────────
// 2. FETCH INVENTORY (MARKETPLACE)
// ────────────────────────────────────────────────
export async function fetchSecureInventory(input: any) {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, data: [], error: "Unauthorized" };

  const parseResult = inventorySchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, data: [], error: "Invalid request data" };
  }
  
  const { page, pageSize, filters, sort } = parseResult.data;
  
  const whereClause: Prisma.CardWhereInput = { status: "live" }; 
  
  if (filters?.brand) whereClause.brand = filters.brand;
  if (filters?.country) whereClause.country = filters.country;
  if (filters?.vbv) whereClause.vbv = filters.vbv;
  if (filters?.type) whereClause.type = filters.type;
  
  if (filters?.search) {
    whereClause.OR = [
      { bin: { contains: filters.search } },
    ];
  }

  const orderBy: Prisma.CardOrderByWithRelationInput = sort 
    ? { [sort.key]: sort.direction } 
    : { price: 'asc' };

  try {
    const [cards, totalItems] = await Promise.all([
        prisma.card.findMany({
            where: whereClause,
            take: pageSize,
            skip: (page - 1) * pageSize,
            orderBy,
        }),
        prisma.card.count({ where: whereClause })
    ]);

    const sanitizedCards = cards.map(card => ({
        id: card.id,
        brand: card.brand,
        bin: card.bin.substring(0, 6),
        last4: "****", 
        country: card.country,
        type: card.type,
        vbv: card.vbv,
        balance: 0, 
        price: card.price,
        currency: card.currency,
        status: card.status,
    }));

    return {
        success: true,
        data: sanitizedCards,
        pagination: {
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            currentPage: page,
            pageSize
        }
    };
  } catch (error) {
    console.error("Inventory Fetch Error:", error);
    return { success: false, data: [], error: "System busy" };
  }
}

// ────────────────────────────────────────────────
// 3. BUY CARD ACTION
// ────────────────────────────────────────────────
export async function buyCardAction(cardId: string) {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const lastOrder = await prisma.order.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
    });

    if (lastOrder) {
        const timeSinceLastOrder = new Date().getTime() - lastOrder.createdAt.getTime();
        if (timeSinceLastOrder < 2000) return { success: false, error: "Please wait..." };
    }

    const result = await prisma.$transaction(async (tx) => {
        const card = await tx.card.findUnique({ where: { id: cardId } });
        if (!card) throw new Error("Card not found");
        
        const freshUser = await tx.user.findUnique({ where: { id: user.id } });
        if (!freshUser || freshUser.balance < card.price) {
            throw new Error("Insufficient Funds");
        }

        const updateResult = await tx.card.updateMany({
            where: { id: cardId, status: "live" },
            data: { 
                status: "sold", 
                soldToUserId: user.id 
            }
        });
        
        if (updateResult.count === 0) throw new Error("Card unavailable");

        await tx.card.update({
             where: { id: cardId },
             data: { soldToUserId: user.id }
        });

        const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: { balance: { decrement: card.price } }
        });

        await tx.order.create({
            data: {
                userId: user.id,
                cardId: card.id,
                amount: card.price,
                status: "completed"
            }
        });

        return { newBalance: updatedUser.balance };
    });

    revalidatePath("/dashboard");
    return { success: true, newBalance: result.newBalance };

  } catch (err: any) {
    const msg = err.message || "Transaction failed";
    if (msg.includes("Insufficient") || msg.includes("sold")) return { success: false, error: msg };
    return { success: false, error: "System error" };
  }
}

// ────────────────────────────────────────────────
// 4. LOGOUT & DEPOSIT
// ────────────────────────────────────────────────
export async function logoutAction() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  
  if (sessionId) {
    try {
        await prisma.session.delete({ where: { id: sessionId } });
    } catch(e) {}
  }
  
  cookieStore.delete("session_id");
  redirect("/login");
}

export async function submitDepositProof(formData: FormData) {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const amount = parseFloat(formData.get("amount") as string);
  const screenshot = formData.get("screenshot") as string; 

  if (isNaN(amount) || amount <= 0) return { success: false, error: "Invalid amount" };
  if (!screenshot) return { success: false, error: "Proof required" };

  try {
    await prisma.deposit.create({
      data: {
        userId: user.id,
        amount: amount,
        status: "PENDING",
        txHash: "Manual_Proof_Upload", 
      }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to submit deposit." };
  }
}

// ────────────────────────────────────────────────
// 5. FETCH USER CARDS (NOW WITH DECRYPTION)
// ────────────────────────────────────────────────
export async function fetchUserCards() {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, data: [] };

  try {
    const cards = await prisma.card.findMany({
      where: { 
        soldToUserId: user.id, 
        status: "sold" 
      },
      orderBy: { createdAt: "desc" }
    });

    // 🟢 Decrypt the data using the helper function
    const decryptedCards = await Promise.all(cards.map(async (card) => {
        return {
            ...card,
            // Decrypting sensitive fields before sending to the client
            fullPan: card.fullPan ? await decryptData(card.fullPan) : "N/A",
            cvv: card.cvv ? await decryptData(card.cvv) : "N/A",
        };
    }));

    return { success: true, data: decryptedCards };
  } catch (error) {
    console.error("Fetch User Cards Error:", error);
    return { success: false, data: [] };
  }
}
