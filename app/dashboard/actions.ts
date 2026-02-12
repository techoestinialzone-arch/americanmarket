"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client"; // 👈 Added this import

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
// 2. FETCH INVENTORY
// ────────────────────────────────────────────────
export async function fetchSecureInventory(input: any) {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, data: [], error: "Unauthorized" };

  const parseResult = inventorySchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, data: [], error: "Invalid request data" };
  }
  
  const { page, pageSize, filters, sort } = parseResult.data;
  
  // 1. Filter: Only show LIVE cards
  const whereClause: Prisma.CardWhereInput = { status: "live" }; 
  
  // 2. Dynamic Filters
  if (filters?.brand) whereClause.brand = filters.brand;
  if (filters?.country) whereClause.country = filters.country;
  if (filters?.vbv) whereClause.vbv = filters.vbv;
  if (filters?.type) whereClause.type = filters.type;
  
  // 3. Search
  if (filters?.search) {
    whereClause.OR = [
      { bin: { contains: filters.search } },
    ];
  }

  // 🟢 FIX: Explicitly type the orderBy object for Prisma
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

    // 4. Map Data
    const sanitizedCards = cards.map(card => ({
        id: card.id,
        brand: card.brand,
        bin: card.bin.substring(0, 6),
        last4: "****", 
        country: card.country,
        type: card.type,
        vbv: card.vbv,
        balance: 0, // Hidden until bought
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
    // Rate Limiting
    const lastOrder = await prisma.order.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
    });

    if (lastOrder) {
        const timeSinceLastOrder = new Date().getTime() - lastOrder.createdAt.getTime();
        // Return structured error
        if (timeSinceLastOrder < 2000) return { success: false, error: "Please wait..." };
    }

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
        const card = await tx.card.findUnique({ where: { id: cardId } });
        if (!card) throw new Error("Card not found");
        
        const freshUser = await tx.user.findUnique({ where: { id: user.id } });
        if (!freshUser || freshUser.balance < card.price) {
            throw new Error("Insufficient Funds");
        }

        // Use updateMany to safely claim the card atomically
        const updateResult = await tx.card.updateMany({
            where: { id: cardId, status: "live" },
            data: { 
                status: "sold", 
                // @ts-ignore - Prisma types sometimes struggle with updateMany relations
                soldToUserId: user.id 
            }
        });
        
        // If count is 0, someone else bought it milliseconds ago
        if (updateResult.count === 0) throw new Error("Card unavailable");

        // Now link it properly via ID since we own it (Redundant but safe for relations)
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
// 5. FETCH USER CARDS
// ────────────────────────────────────────────────
export async function fetchUserCards() {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, data: [] };

  try {
    const cards = await prisma.card.findMany({
      where: { 
        soldToUserId: user.id, // Only cards bought by this user
        status: "sold" 
      },
      orderBy: { createdAt: "desc" }
    });

    // Return FULL details (Unmasked) since the user owns them
    return { success: true, data: cards };
  } catch (error) {
    return { success: false, data: [] };
  }
}
