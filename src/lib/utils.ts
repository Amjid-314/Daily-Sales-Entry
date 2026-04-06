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

export const getWorkingDays = (year: number, month: number, holidaysStr: string, dayLimit?: number) => {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const limit = dayLimit || totalDays;
  const holidays = (holidaysStr || '').split(',').map(h => h.trim()).filter(h => h);
  
  let workingDays = 0;
  for (let d = 1; d <= limit; d++) {
    const date = new Date(year, month, d);
    const dateStr = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
    const isSunday = date.getDay() === 0;
    const isHoliday = holidays.includes(dateStr);
    if (!isSunday && !isHoliday) workingDays++;
  }
  return workingDays;
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
