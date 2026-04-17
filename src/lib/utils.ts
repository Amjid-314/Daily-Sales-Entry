import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getPSTDate = () => {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }); // YYYY-MM-DD
};

export const getPSTTimestamp = () => {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });
};

export const getWorkingDays = (year: number, month: number, holidaysStr: string, dayLimit?: number, offDayStr: string = 'Sunday') => {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const limit = dayLimit || totalDays;
  const holidays = (holidaysStr || '').split(',').map(h => h.trim()).filter(h => h);
  
  const offDayNum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(offDayStr);
  const actualOffDay = offDayNum !== -1 ? offDayNum : 0; // Default to Sunday

  let workingDays = 0;
  for (let d = 1; d <= limit; d++) {
    const date = new Date(year, month, d);
    const dateStr = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
    const isOffDay = date.getDay() === actualOffDay;
    const isHoliday = holidays.includes(dateStr);
    if (!isOffDay && !isHoliday) workingDays++;
  }
  return workingDays;
};

export const calculateOrderAge = (orderDate: string) => {
  if (!orderDate) return 0;
  const start = new Date(orderDate);
  const end = new Date();
  let days = 0;
  let current = new Date(start);
  // Normalize current to start of day
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    if (current.getDay() !== 0) { // 0 is Sunday
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  return days > 0 ? days - 1 : 0; // -1 because current day shouldn't count as a full day "passed" if we just ordered
};

export const calculateTonnage = (items: Record<string, number>, SKUS: any[]) => {
  return Object.entries(items).reduce((total, [skuId, qty]) => {
    const sku = SKUS.find(s => s.id === skuId);
    if (!sku) return total;
    if (sku.category !== 'DWB' && !['Kite Glow', 'Burq Action', 'Vero'].includes(sku.category)) return total;
    const weightPerCtnKg = (sku.weight_gm_per_pack * (sku.unitsPerCarton || 0)) / 1000;
    return total + (qty * weightPerCtnKg) / 1000; // Tons
  }, 0);
};

export const calculateGross = (items: Record<string, number>, SKUS: any[]) => {
  return Object.entries(items).reduce((total, [skuId, qty]) => {
    const sku = SKUS.find(s => s.id === skuId);
    if (!sku || sku.category !== 'Match') return total;
    return total + (qty * (sku.grossPerCarton || 0));
  }, 0);
};

export const isTSMEntry = (obName: string, tsmName: string) => {
  if (!obName || !tsmName) return false;
  const obNameClean = obName.replace(/^\*TSM\s*-\s*/i, '').trim().toLowerCase();
  const tsmNameClean = tsmName.trim().toLowerCase();
  return obNameClean === tsmNameClean || obNameClean.includes(tsmNameClean) || tsmNameClean.includes(obNameClean);
};

export const calculateTotalBags = (order: any, SKUS: any[]) => {
  const items = order.items || order.order_data;
  if (!items) return 0;
  return Object.keys(items).reduce((sum, skuId) => {
    const sku = SKUS.find(s => s.id === skuId);
    if (!sku) return sum;
    const item = items[skuId];
    const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
    return sum + (packs / sku.unitsPerCarton);
  }, 0);
};

export const normalizeRole = (role: string): any => {
  const r = (role || '').trim().toUpperCase();
  if (r === 'SUPER ADMIN') return 'Super Admin';
  if (r === 'ADMIN') return 'Admin';
  if (r === 'DIRECTOR') return 'Director';
  if (r === 'NSM' || r === 'NATIONAL SALES MANAGER') return 'NSM';
  if (r === 'RSM' || r === 'REGIONAL SALES MANAGER') return 'RSM';
  if (r === 'SC' || r === 'SALES CONTROLLER' || r === 'SALES COORDINATOR') return 'SC';
  if (r === 'TSM' || r === 'TERRITORY SALES MANAGER') return 'TSM';
  if (r === 'TSM ENTRY' || r === 'TSM_ENTRY') return 'TSM Entry';
  if (r === 'ASM' || r === 'AREA SALES MANAGER') return 'ASM';
  if (r === 'OB' || r === 'ORDER BOOKER') return 'OB';
  return role;
};

export const sortDataByAchievement = (data: any[], direction: 'asc' | 'desc' = 'asc') => {
  return [...data].sort((a, b) => {
    const aPerc = Number(a.percentage || 0);
    const bPerc = Number(b.percentage || 0);
    const aAch = Number(a.achievement || 0);
    const bAch = Number(b.achievement || 0);

    if (aPerc !== bPerc) {
      return direction === 'asc' ? aPerc - bPerc : bPerc - aPerc;
    }
    return direction === 'asc' ? aAch - bAch : bAch - aAch;
  });
};
