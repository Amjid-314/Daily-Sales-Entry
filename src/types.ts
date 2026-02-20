export interface SKU {
  id: string;
  name: string;
  category: string;
  unitsPerCarton: number;
  unitsPerDozen: number;
}

export interface OrderItem {
  skuId: string;
  ctn: number;
  dzn: number;
  pks: number;
}

export interface OrderState {
  date: string;
  tsm: string;
  town: string;
  distributor: string;
  orderBooker: string;
  route: string;
  visitedShops: number;
  productiveShops: number; // Global productive shops
  categoryProductiveShops: Record<string, number>; // Brand-wise productive shops
  items: Record<string, OrderItem>;
  targets: Record<string, number>;
}

export interface OBAssignment {
  name: string;
  town: string;
  distributor: string;
  routes: string[];
}

export const OB_ASSIGNMENTS: OBAssignment[] = [
  {
    name: "Ali Khan",
    town: "Central City",
    distributor: "A1 Traders",
    routes: ["Route A1", "Route A2", "Route A3"]
  },
  {
    name: "Zubair Ahmed",
    town: "East Side",
    distributor: "East Distributors",
    routes: ["East Main", "East Sub", "Industrial Area"]
  },
  {
    name: "Sajid Mehmood",
    town: "West End",
    distributor: "West Star",
    routes: ["West 1", "West 2", "Market Area"]
  }
];

export const CATEGORIES = [
  "Match",
  "Dishwash Bar",
  "Kite Glow",
  "Burq Action",
  "Vero"
];

export const SKUS: SKU[] = [
  // Match
  { id: "m-large", name: "Large", category: "Match", unitsPerCarton: 20, unitsPerDozen: 12 },
  { id: "m-classic", name: "Classic", category: "Match", unitsPerCarton: 20, unitsPerDozen: 12 },
  { id: "m-regular", name: "Regular", category: "Match", unitsPerCarton: 120, unitsPerDozen: 12 },
  { id: "m-slim", name: "Slim", category: "Match", unitsPerCarton: 120, unitsPerDozen: 12 },
  
  // DWB
  { id: "dwb-reg", name: "Regular", category: "Dishwash Bar", unitsPerCarton: 48, unitsPerDozen: 12 },
  { id: "dwb-large", name: "Large", category: "Dishwash Bar", unitsPerCarton: 36, unitsPerDozen: 12 },
  { id: "dwb-long", name: "Long Bar", category: "Dishwash Bar", unitsPerCarton: 36, unitsPerDozen: 12 },
  { id: "dwb-super", name: "Super Bar", category: "Dishwash Bar", unitsPerCarton: 36, unitsPerDozen: 12 },
  { id: "dwb-new", name: "New DWB", category: "Dishwash Bar", unitsPerCarton: 36, unitsPerDozen: 12 },

  // Kite Glow
  { id: "kg-10", name: "Rs 10", category: "Kite Glow", unitsPerCarton: 144, unitsPerDozen: 12 },
  { id: "kg-20", name: "Rs 20", category: "Kite Glow", unitsPerCarton: 96, unitsPerDozen: 12 },
  { id: "kg-50", name: "Rs 50", category: "Kite Glow", unitsPerCarton: 48, unitsPerDozen: 12 },
  { id: "kg-99", name: "Rs 99", category: "Kite Glow", unitsPerCarton: 24, unitsPerDozen: 12 },
  { id: "kg-05kg", name: "0.5kg", category: "Kite Glow", unitsPerCarton: 24, unitsPerDozen: 0 },
  { id: "kg-1kg", name: "1kg", category: "Kite Glow", unitsPerCarton: 12, unitsPerDozen: 0 },
  { id: "kg-2kg", name: "2kg", category: "Kite Glow", unitsPerCarton: 6, unitsPerDozen: 0 },

  // Burq Action
  { id: "ba-10", name: "Rs 10", category: "Burq Action", unitsPerCarton: 204, unitsPerDozen: 12 },
  { id: "ba-20", name: "Rs 20", category: "Burq Action", unitsPerCarton: 96, unitsPerDozen: 12 },
  { id: "ba-50", name: "Rs 50", category: "Burq Action", unitsPerCarton: 48, unitsPerDozen: 12 },
  { id: "ba-99", name: "Rs 99", category: "Burq Action", unitsPerCarton: 24, unitsPerDozen: 12 },
  { id: "ba-1kg", name: "1kg", category: "Burq Action", unitsPerCarton: 12, unitsPerDozen: 0 },
  { id: "ba-23kg", name: "2.3kg", category: "Burq Action", unitsPerCarton: 6, unitsPerDozen: 0 },

  // Vero
  { id: "v-5kg", name: "5kg", category: "Vero", unitsPerCarton: 4, unitsPerDozen: 0 },
  { id: "v-20kg", name: "20kg", category: "Vero", unitsPerCarton: 1, unitsPerDozen: 0 },
];
