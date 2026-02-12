import { Product } from "./types";

export const MOCK_PRODUCTS: Product[] = [
  { id: "p1", bin: "457173", country: "US", region: "California", balance: 120, price: 25, currency: "USD", stockStatus: "available" },
  { id: "p2", bin: "516824", country: "UK", region: "London", balance: 60, price: 18, currency: "USD", stockStatus: "available" },
  { id: "p3", bin: "402400", country: "AE", region: "Dubai", balance: 200, price: 40, currency: "USD", stockStatus: "available" },
  { id: "p4", bin: "379251", country: "DE", region: "Berlin", balance: 35, price: 12, currency: "USD", stockStatus: "sold" },
];
