export interface SKU {
  id: string;
  name: string;
  category: string;
  unitsPerCarton: number;
  unitsPerDozen: number;
  pricePerCarton?: number;
  weight_kg?: number; // Weight per Bag/Ctn in Kg
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
  zone?: string;
  region?: string;
  nsm?: string;
  rsm?: string;
  director?: string;
  visitedShops: number;
  productiveShops: number; // Global productive shops
  totalShops: number; // Total shops in route
  categoryProductiveShops: Record<string, number>; // Brand-wise productive shops
  items: Record<string, OrderItem>;
  targets: Record<string, number>;
  visitType: 'A' | 'V' | 'RR' | 'Absent';
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface OBAssignment {
  id?: number;
  name: string;
  contact: string; // Unique ID
  town: string;
  distributor: string;
  routes: string[];
  tsm?: string;
  zone?: string;
  region?: string;
  nsm?: string;
  rsm?: string;
  director?: string;
  total_shops?: number;
  targets?: Record<string, number>;
}

export const OB_ASSIGNMENTS: OBAssignment[] = [
  // Peshawar - TSM: Muhammad Shoaib
  { name: "Muhammad Bilal", contact: "P-01", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Shoaib", total_shops: 50 },
  { name: "Khizar Hayat", contact: "P-02", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Shoaib", total_shops: 50 },
  { name: "Adil Khan", contact: "P-03", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Shoaib", total_shops: 50 },
  { name: "Baidar Khan", contact: "P-04", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Shoaib", total_shops: 50 },
  { name: "Muhammad Usman", contact: "P-05", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Shoaib", total_shops: 50 },
  { name: "Ghulam Rasool", contact: "P-06", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Shoaib", total_shops: 50 },
  { name: "Khalid Awan", contact: "P-07", town: "Peshawar", distributor: "Peshawar Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Shoaib", total_shops: 50 },

  // Haripur - TSM: Muhammad Yousaf
  { name: "Shahid", contact: "H-01", town: "Haripur", distributor: "Haripur Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Yousaf", total_shops: 50 },
  { name: "Shahrukh", contact: "H-02", town: "Haripur", distributor: "Haripur Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Yousaf", total_shops: 50 },

  // Taxila - TSM: Muhammad Yousaf
  { name: "Bilal", contact: "T-01", town: "Taxila", distributor: "Taxila Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Yousaf", total_shops: 50 },
  { name: "Muneeb", contact: "T-02", town: "Taxila", distributor: "Taxila Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Yousaf", total_shops: 50 },

  // Kohat - TSM: Noman Paracha
  { name: "Kashif", contact: "K-01", town: "Kohat", distributor: "Kohat Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Noman Paracha", total_shops: 50 },

  // Hangu - TSM: Noman Paracha
  { name: "Bilal", contact: "HG-01", town: "Hangu", distributor: "Hangu Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Noman Paracha", total_shops: 50 },

  // Attock - TSM: Noman Paracha
  { name: "Usama", contact: "A-01", town: "Attock", distributor: "Attock Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Noman Paracha", total_shops: 50 },

  // Charsadda - TSM: Waheed Jamal
  { name: "Babar", contact: "C-01", town: "Charsadda", distributor: "Charsadda Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Waheed Jamal", total_shops: 50 },

  // Mardan - TSM: Muhammad Zeeshan
  { name: "Muhammad Amir", contact: "M-01", town: "Mardan", distributor: "Mardan Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Zeeshan", total_shops: 50 },
  { name: "Farhan Zeb", contact: "NOW-01", town: "Nowshera", distributor: "Nowshera Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Muhammad Zeeshan", total_shops: 50 },

  // DI Khan & Bannu - TSM: Ikramullah
  { name: "Zakaullah", contact: "DI-01", town: "DI Khan", distributor: "DI Khan Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Ikramullah", total_shops: 50 },
  { name: "Muntazir", contact: "DI-02", town: "DI Khan", distributor: "DI Khan Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Ikramullah", total_shops: 50 },
  { name: "OB Bannu", contact: "BAN-01", town: "Bannu", distributor: "Bannu Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Ikramullah", total_shops: 50 },

  // Muzaffarabad & Mansehra - TSM: Qaisar Yousaf
  { name: "Ghulam Hussain", contact: "MUZ-01", town: "Muzaffarabad", distributor: "Muz Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Qaisar Yousaf", total_shops: 50 },
  { name: "Hashim", contact: "MAN-01", town: "Mansehra", distributor: "Man Dist", routes: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tsm: "Qaisar Yousaf", total_shops: 50 }
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
  { id: "kg-10", name: "Kite Rs 10", category: "Kite Glow", unitsPerCarton: 144, unitsPerDozen: 12, pricePerCarton: 1440, weight_kg: 10 },
  { id: "kg-20", name: "Kite Rs 20", category: "Kite Glow", unitsPerCarton: 96, unitsPerDozen: 12, pricePerCarton: 1920, weight_kg: 10 },
  { id: "kg-50", name: "Kite Rs 50", category: "Kite Glow", unitsPerCarton: 48, unitsPerDozen: 12, pricePerCarton: 2400, weight_kg: 10 },
  { id: "kg-99", name: "Kite Rs 99", category: "Kite Glow", unitsPerCarton: 24, unitsPerDozen: 12, pricePerCarton: 2376, weight_kg: 10 },
  { id: "kg-05kg", name: "Kite 0.5kg", category: "Kite Glow", unitsPerCarton: 24, unitsPerDozen: 0, pricePerCarton: 3600, weight_kg: 12 },
  { id: "kg-1kg", name: "Kite 1kg", category: "Kite Glow", unitsPerCarton: 12, unitsPerDozen: 0, pricePerCarton: 3600, weight_kg: 12 },
  { id: "kg-2kg", name: "Kite 2kg", category: "Kite Glow", unitsPerCarton: 6, unitsPerDozen: 0, pricePerCarton: 3600, weight_kg: 12 },

  // Burq Action
  { id: "ba-10", name: "Burq Rs 10", category: "Burq Action", unitsPerCarton: 204, unitsPerDozen: 12, pricePerCarton: 2040, weight_kg: 10 },
  { id: "ba-20", name: "Burq Rs 20", category: "Burq Action", unitsPerCarton: 96, unitsPerDozen: 12, pricePerCarton: 1920, weight_kg: 10 },
  { id: "ba-50", name: "Burq Rs 50", category: "Burq Action", unitsPerCarton: 48, unitsPerDozen: 12, pricePerCarton: 2400, weight_kg: 10 },
  { id: "ba-99", name: "Burq Rs 99", category: "Burq Action", unitsPerCarton: 24, unitsPerDozen: 12, pricePerCarton: 2376, weight_kg: 10 },
  { id: "ba-1kg", name: "Burq 1kg", category: "Burq Action", unitsPerCarton: 12, unitsPerDozen: 0, pricePerCarton: 3600, weight_kg: 12 },
  { id: "ba-23kg", name: "Burq 2.3kg", category: "Burq Action", unitsPerCarton: 6, unitsPerDozen: 0, pricePerCarton: 3600, weight_kg: 13.8 },

  // Vero
  { id: "v-5kg", name: "Vero 5kg", category: "Vero", unitsPerCarton: 4, unitsPerDozen: 0, pricePerCarton: 4000, weight_kg: 20 },
  { id: "v-20kg", name: "Vero 20kg", category: "Vero", unitsPerCarton: 1, unitsPerDozen: 0, pricePerCarton: 16000, weight_kg: 20 },

  // DWB
  { id: "dwb-reg", name: "Regular", category: "DWB", unitsPerCarton: 48, unitsPerDozen: 12, pricePerCarton: 4800, weight_kg: 10 },
  { id: "dwb-large", name: "Large", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, pricePerCarton: 5400, weight_kg: 10 },
  { id: "dwb-long", name: "Long Bar", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, pricePerCarton: 5400, weight_kg: 10 },
  { id: "dwb-super", name: "Super Bar", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, pricePerCarton: 5400, weight_kg: 10 },
  { id: "dwb-new", name: "New DWB", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, pricePerCarton: 5400, weight_kg: 10 },

  // Match
  { id: "m-large", name: "Large", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000, weight_kg: 5 },
  { id: "m-classic", name: "Classic", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000, weight_kg: 5 },
  { id: "m-regular", name: "Regular", category: "Match", unitsPerCarton: 20, unitsPerDozen: 12, pricePerCarton: 2000, weight_kg: 5 },
  { id: "m-slim", name: "Slim", category: "Match", unitsPerCarton: 20, unitsPerDozen: 12, pricePerCarton: 2000, weight_kg: 5 },
];
