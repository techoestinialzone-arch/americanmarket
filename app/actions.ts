"use server";

// ────────────────────────────────────────────────
// 1. SECURE DATABASE (Server-Side Only)
// ────────────────────────────────────────────────

export type CardCategory = "visa" | "mastercard" | "american-express" | "discover" | "diners-club" | "jcb" | "maestro" | "unionpay";
export type VBVStatus = "vbv" | "non-vbv";
export type CardType = "credit" | "debit";

export type Card = {
  id: string;
  bin: string;
  brand: CardCategory;
  country: string;
  balance: number;
  price: number;
  currency: string;
  status: "live" | "dead" | "sold";
  vbv: VBVStatus;
  type: CardType;
};

// Hidden from client. Expanded data to test pagination.
const DATABASE: Card[] = [
  { id: "c1", bin: "457173", brand: "visa", country: "United States", balance: 120, price: 25.0, currency: "USD", status: "live", vbv: "vbv", type: "credit" },
  { id: "c2", bin: "516824", brand: "mastercard", country: "United Kingdom", balance: 60, price: 18.5, currency: "USD", status: "live", vbv: "non-vbv", type: "debit" },
  { id: "c3", bin: "378282", brand: "american-express", country: "United Arab Emirates", balance: 200, price: 40.0, currency: "USD", status: "live", vbv: "vbv", type: "credit" },
  { id: "c4", bin: "601111", brand: "discover", country: "Germany", balance: 35, price: 12.0, currency: "USD", status: "dead", vbv: "non-vbv", type: "debit" },
  { id: "c5", bin: "305693", brand: "diners-club", country: "United States", balance: 90, price: 22.0, currency: "USD", status: "sold", vbv: "vbv", type: "credit" },
  { id: "c6", bin: "352800", brand: "jcb", country: "Japan", balance: 150, price: 32.0, currency: "USD", status: "live", vbv: "non-vbv", type: "credit" },
  { id: "c7", bin: "675964", brand: "maestro", country: "Spain", balance: 45, price: 14.5, currency: "USD", status: "live", vbv: "vbv", type: "debit" },
  { id: "c8", bin: "622155", brand: "unionpay", country: "China", balance: 180, price: 38.0, currency: "USD", status: "live", vbv: "non-vbv", type: "debit" },
  { id: "c9", bin: "374245", brand: "american-express", country: "Canada", balance: 75, price: 19.9, currency: "USD", status: "dead", vbv: "vbv", type: "credit" },
  { id: "c10", bin: "414720", brand: "visa", country: "United States", balance: 300, price: 55.0, currency: "USD", status: "live", vbv: "non-vbv", type: "credit" },
  { id: "c11", bin: "455673", brand: "visa", country: "Australia", balance: 85, price: 21.0, currency: "USD", status: "live", vbv: "non-vbv", type: "debit" },
  { id: "c12", bin: "541275", brand: "mastercard", country: "Brazil", balance: 140, price: 29.5, currency: "USD", status: "live", vbv: "vbv", type: "credit" },
  { id: "c13", bin: "491673", brand: "visa", country: "France", balance: 220, price: 45.0, currency: "USD", status: "live", vbv: "vbv", type: "credit" },
  { id: "c14", bin: "528911", brand: "mastercard", country: "Italy", balance: 110, price: 22.0, currency: "USD", status: "live", vbv: "non-vbv", type: "debit" },
  { id: "c15", bin: "371282", brand: "american-express", country: "Mexico", balance: 500, price: 80.0, currency: "USD", status: "live", vbv: "vbv", type: "credit" },
];

// ────────────────────────────────────────────────
// 2. PUBLIC SECURE ACTION
// ────────────────────────────────────────────────

type Filters = {
  search: string;
  brand: string;
  country: string;
  vbv: string;
  type: string;
  balance: string;
};

type SortConfig = {
  key: keyof Card;
  direction: "asc" | "desc";
};

type FetchParams = {
  page: number;
  pageSize: number;
  filters: Filters;
  sort: SortConfig;
};

export async function fetchSecureInventory({ page = 1, pageSize = 5, filters, sort }: FetchParams) {
  // Simulate Network Delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 1. FILTERING
  let result = DATABASE.filter((card) => {
    const q = filters.search.trim().toLowerCase();
    
    // Search Filter
    if (q && !card.bin.toLowerCase().includes(q) && !card.country.toLowerCase().includes(q)) return false;
    
    // Dropdown Filters
    if (filters.brand && card.brand !== filters.brand) return false;
    if (filters.country && !card.country.toLowerCase().includes(filters.country.trim().toLowerCase())) return false;
    if (filters.vbv && card.vbv !== filters.vbv) return false;
    if (filters.type && card.type !== filters.type) return false;

    // Balance Filter (Numeric check)
    const balanceInput = parseFloat(filters.balance);
    if (!isNaN(balanceInput) && card.balance < balanceInput) return false;

    return true;
  });

  // 2. SORTING
  result = [...result].sort((a: any, b: any) => {
    const aValue = a[sort.key];
    const bValue = b[sort.key];

    if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
    return 0;
  });

  // 3. PAGINATION
  const totalItems = result.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = result.slice(startIndex, endIndex);

  return {
    success: true,
    data: paginatedData,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems
    }
  };
}