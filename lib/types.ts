export type Product = {
  id: string;
  bin: string;
  country: string;
  region: string;
  balance: number;
  price: number;
  currency?: string; // e.g. "USD"
  stockStatus?: "available" | "sold" | "reserved";
};

export type Filters = {
  q: string;
  country: string;
  region: string;
  minPrice: string;
  maxPrice: string;
};

export type Invoice = {
  btcAddress: string;
  btcAmount: string;
  expiresInMinutes: number;
  status: "unpaid" | "confirming" | "paid" | "expired";
};
