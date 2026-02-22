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
  obContact: string; // Unique ID for OB
  route: string;
  visitedShops: number;
  productiveShops: number; // Global productive shops
  totalShops: number; // Total shops in route
  categoryProductiveShops: Record<string, number>; // Brand-wise productive shops
  items: Record<string, OrderItem>;
  targets: Record<string, number>;
}

export interface OBAssignment {
  id?: number;
  name: string;
  contact: string; // Unique ID
  town: string;
  distributor: string;
  routes: string[];
  tsm?: string;
  totalShops?: number;
  targets?: Record<string, number>;
}

export const OB_ASSIGNMENTS: OBAssignment[] = [
  // Peshawar - TSM: Muhammad Shoaib
  { name: "Muhammad Bilal", contact: "P-01", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Route 1"], tsm: "Muhammad Shoaib", totalShops: 45 },
  { name: "Khizar Hayat", contact: "P-02", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Route 1"], tsm: "Muhammad Shoaib", totalShops: 40 },
  { name: "Adil Khan", contact: "P-03", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Route 1"], tsm: "Muhammad Shoaib", totalShops: 50 },
  { name: "Baidar Khan", contact: "P-04", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Route 1"], tsm: "Muhammad Shoaib", totalShops: 42 },
  { name: "Muhammad Usman", contact: "P-05", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Route 1"], tsm: "Muhammad Shoaib", totalShops: 48 },
  { name: "Ghulam Rasool", contact: "P-06", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Route 1"], tsm: "Muhammad Shoaib", totalShops: 44 },
  { name: "Khalid Awan", contact: "P-07", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Route 1"], tsm: "Muhammad Shoaib", totalShops: 46 },

  // Haripur - TSM: Muhammad Yousaf
  { name: "Shahid", contact: "H-01", town: "Haripur", distributor: "Haripur Dist", routes: ["Route 1"], tsm: "Muhammad Yousaf", totalShops: 35 },
  { name: "Shahrukh", contact: "H-02", town: "Haripur", distributor: "Haripur Dist", routes: ["Route 1"], tsm: "Muhammad Yousaf", totalShops: 38 },

  // Taxila - TSM: Muhammad Yousaf
  { name: "Bilal", contact: "T-01", town: "Taxila", distributor: "Taxila Dist", routes: ["Route 1"], tsm: "Muhammad Yousaf", totalShops: 40 },
  { name: "Muneeb", contact: "T-02", town: "Taxila", distributor: "Taxila Dist", routes: ["Route 1"], tsm: "Muhammad Yousaf", totalShops: 42 },

  // Kohat - TSM: Noman Paracha
  { name: "Kashif", contact: "K-01", town: "Kohat", distributor: "Kohat Dist", routes: ["Route 1"], tsm: "Noman Paracha", totalShops: 55 },

  // Hangu - TSM: Noman Paracha
  { name: "Bilal", contact: "HG-01", town: "Hangu", distributor: "Hangu Dist", routes: ["Route 1"], tsm: "Noman Paracha", totalShops: 50 },

  // Attock - TSM: Noman Paracha
  { name: "Usama", contact: "A-01", town: "Attock", distributor: "Attock Dist", routes: ["Route 1"], tsm: "Noman Paracha", totalShops: 45 },

  // Charsadda - TSM: Waheed Jamal
  { name: "Babar", contact: "C-01", town: "Charsadda", distributor: "Charsadda Dist", routes: ["Route 1"], tsm: "Waheed Jamal", totalShops: 48 },

  // Mardan - TSM: Muhammad Zeeshan
  { name: "Muhammad Amir", contact: "M-01", town: "Mardan", distributor: "Mardan Dist", routes: ["Route 1"], tsm: "Muhammad Zeeshan", totalShops: 52 },

  // DI Khan & Bannu - TSM: Ikramullah
  { name: "Zakaullah", contact: "DI-01", town: "DI Khan", distributor: "DI Khan Dist", routes: ["Route 1"], tsm: "Ikramullah", totalShops: 48 },
  { name: "Muntazir", contact: "DI-02", town: "DI Khan", distributor: "DI Khan Dist", routes: ["Route 1"], tsm: "Ikramullah", totalShops: 45 },
  { name: "OB Bannu", contact: "BAN-01", town: "Bannu", distributor: "Bannu Dist", routes: ["Route 1"], tsm: "Ikramullah", totalShops: 40 },

  // Muzaffarabad & Mansehra - TSM: Qaisar Yousaf
  { name: "Ghulam Hussain", contact: "MUZ-01", town: "Muzaffarabad", distributor: "Muz Dist", routes: ["Route 1"], tsm: "Qaisar Yousaf", totalShops: 40 },
  { name: "Hashim", contact: "MAN-01", town: "Mansehra", distributor: "Man Dist", routes: ["Route 1"], tsm: "Qaisar Yousaf", totalShops: 40 }
];

export const CATEGORIES = [
  "Kite Glow",
  "Burq Action",
  "Vero",
  "DWB",
  "Match"
];

export const SKUS: SKU[] = [
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

  // DWB
  { id: "dwb-reg", name: "Regular", category: "DWB", unitsPerCarton: 48, unitsPerDozen: 12 },
  { id: "dwb-large", name: "Large", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12 },
  { id: "dwb-long", name: "Long Bar", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12 },
  { id: "dwb-super", name: "Super Bar", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12 },
  { id: "dwb-new", name: "New DWB", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12 },

  // Match
  { id: "m-large", name: "Large", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12 },
  { id: "m-classic", name: "Classic", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12 },
  { id: "m-regular", name: "Regular", category: "Match", unitsPerCarton: 20, unitsPerDozen: 12 },
  { id: "m-slim", name: "Slim", category: "Match", unitsPerCarton: 20, unitsPerDozen: 12 },
];
