import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { AIChatBot } from './components/AIChatBot';
import { 
  Save, 
  Send, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  History,
  ArrowLeft,
  Download,
  AlertTriangle,
  RefreshCw,
  LayoutDashboard,
  ClipboardList,
  Settings,
  Plus,
  ShieldCheck,
  Trash,
  Search,
  Lock,
  Waves,
  Store,
  EyeOff,
  Upload,
  Link2,
  ExternalLink,
  Cloud,
  Share2,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Package,
  ChevronRight,
  Filter,
  ArrowDownRight,
  Mail,
  Key,
  User
} from 'lucide-react';
import { SKUS, CATEGORIES, OrderState, OrderItem, SKU, OBAssignment } from './types';

const STORAGE_KEY = 'ob_order_draft';
const LOGO_STORAGE_KEY = 'app_logo_base64';

const getPSTDate = () => {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }); // YYYY-MM-DD
};

const getPSTTimestamp = () => {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });
};

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const getWorkingDays = (year: number, month: number, holidaysStr: string, dayLimit?: number) => {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const limit = dayLimit || totalDays;
  const holidays = holidaysStr.split(',').map(h => h.trim()).filter(h => h);
  
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

const TSMDashboard = ({ stats, hierarchy, isSyncing, onRefresh, userName, holidays }: { stats: any[], hierarchy: any[], isSyncing?: boolean, onRefresh?: () => void, userName?: string | null, holidays: string }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const currentMonthStats = useMemo(() => {
    return stats.filter(s => s.date.startsWith(selectedMonth));
  }, [stats, selectedMonth]);

  const totalTarget = useMemo(() => {
    return hierarchy.reduce((sum, h) => sum + (parseFloat(h.target_ctn) || 0), 0);
  }, [hierarchy]);

  const totalCartonsSold = useMemo(() => {
    return currentMonthStats.reduce((sum, s) => sum + (parseFloat(s.cartons) || 0), 0);
  }, [currentMonthStats]);

  const achievementPercentage = totalTarget > 0 ? (totalCartonsSold / totalTarget) * 100 : 0;

  const workingDaysSoFar = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const today = new Date();
    const actualEndDate = endDate > today ? today : endDate;
    
    let workingDays = 0;
    const holidayList = (holidays || '').split(',').map(d => d.trim());

    for (let d = new Date(startDate); d <= actualEndDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const isSunday = d.getDay() === 0;
      const isHoliday = holidayList.includes(dateStr);
      if (!isSunday && !isHoliday) workingDays++;
    }
    return workingDays || 1;
  }, [selectedMonth, holidays]);

  const obPerformance = useMemo(() => {
    return hierarchy.map(h => {
      const obStats = currentMonthStats.filter(s => s.ob_contact === h.ob_id);
      const cartonsSold = obStats.reduce((sum, s) => sum + (parseFloat(s.cartons) || 0), 0);
      const target = parseFloat(h.target_ctn) || 0;
      const achievement = target > 0 ? (cartonsSold / target) * 100 : 0;
      
      const uniqueDays = new Set(obStats.map(s => s.date)).size;
      const submissionConsistency = (uniqueDays / workingDaysSoFar) * 100;

      const routeStats = obStats.reduce((acc, s) => {
        const route = s.route_name || 'Unknown';
        if (!acc[route]) acc[route] = 0;
        acc[route] += (parseFloat(s.cartons) || 0);
        return acc;
      }, {} as Record<string, number>);

      const weakRoutes = Object.entries(routeStats)
        .filter(([_, cartons]: [string, number]) => cartons < 10)
        .map(([route]) => route);

      return {
        ...h,
        cartonsSold,
        target,
        achievement,
        submissionConsistency,
        weakRoutes
      };
    }).sort((a, b) => b.achievement - a.achievement);
  }, [hierarchy, currentMonthStats, workingDaysSoFar]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-seablue uppercase tracking-widest">TSM Dashboard</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Overview for {userName}</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-seablue text-slate-600 font-bold"
          />
          {onRefresh && (
            <button 
              onClick={onRefresh}
              disabled={isSyncing}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cartons Sold</h3>
            <Package className="w-5 h-5 text-seablue" />
          </div>
          <p className="text-3xl font-black text-slate-800">{totalCartonsSold.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Target</h3>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-800">{totalTarget.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Achievement</h3>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-800">{achievementPercentage.toFixed(1)}%</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
            <div 
              className={`h-2 rounded-full ${achievementPercentage >= 100 ? 'bg-emerald-500' : achievementPercentage >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(achievementPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xs font-black text-seablue uppercase tracking-widest">OB Performance & Consistency</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3">OB Name</th>
                <th className="px-4 py-3">Town</th>
                <th className="px-4 py-3 text-right">Target</th>
                <th className="px-4 py-3 text-right">Sold</th>
                <th className="px-4 py-3 text-right">Achievement</th>
                <th className="px-4 py-3 text-right">Consistency</th>
                <th className="px-4 py-3">Weak Routes (&lt;10 Ctn)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {obPerformance.map((ob, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-700 text-xs">{ob.ob_name || ob.ob_id}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-bold">{ob.town_name || '-'}</td>
                  <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">{ob.target.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 font-mono text-xs">{ob.cartonsSold.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-widest ${
                      ob.achievement >= 100 ? 'bg-emerald-100 text-emerald-800' : 
                      ob.achievement >= 80 ? 'bg-amber-100 text-amber-800' : 
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {ob.achievement.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-xs font-bold ${ob.submissionConsistency < 70 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {ob.submissionConsistency.toFixed(0)}%
                      </span>
                      {ob.submissionConsistency < 70 && (
                        <AlertTriangle className="w-4 h-4 text-rose-500" title="Low submission consistency" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {ob.weakRoutes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ob.weakRoutes.slice(0, 2).map((route: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                            {route}
                          </span>
                        ))}
                        {ob.weakRoutes.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold border border-slate-200">
                            +{ob.weakRoutes.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {obPerformance.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                    No OBs found for your purview.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const NationalDashboard = ({ stats, hierarchy, categories, skus, isSyncing, onRefresh, userRole, userRegion, userName, userContact, timeGone, holidays }: { stats: any[], hierarchy: any[], categories: string[], skus: any[], isSyncing?: boolean, onRefresh?: () => void, userRole: any, userRegion?: string | null, userName?: string | null, userContact?: string | null, timeGone: number, holidays: string }) => {
  const [filterLevel, setFilterLevel] = useState<'National' | 'Region' | 'RSM' | 'SC' | 'TSM' | 'Town' | 'Distributor' | 'OB' | 'Route'>(() => {
    if (userRole === 'Admin' || userRole === 'Super Admin' || userRole === 'Director' || userRole === 'NSM') return 'National';
    if (userRole === 'RSM' || userRole === 'SC') return 'Region';
    if (userRole === 'TSM' || userRole === 'ASM') return 'ASM/TSM' as any;
    return 'National';
  });
  const [filterValue, setFilterValue] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const visibleFilterLevels = useMemo(() => {
    if (userRole === 'Admin' || userRole === 'Super Admin' || userRole === 'Director' || userRole === 'NSM') {
      return ['National', 'Region', 'RSM', 'SC', 'ASM/TSM', 'Town', 'Distributor', 'OB', 'Route'];
    } else if (userRole === 'RSM' || userRole === 'SC') {
      return ['Region', 'RSM', 'SC', 'ASM/TSM', 'Town', 'Distributor', 'OB', 'Route'];
    } else if ((userRole === 'TSM' || userRole === 'ASM')) {
      return ['ASM/TSM', 'OB', 'Route'];
    } else {
      return ['OB', 'Route'];
    }
  }, [userRole]);

  useEffect(() => {
    if (!visibleFilterLevels.includes(filterLevel)) {
      setFilterLevel(visibleFilterLevels[0] as any);
    }
  }, [visibleFilterLevels]);

  const brands = ["Kite Glow", "Vero", "Burq Action"];

  const processedStats = useMemo(() => {
    let baseStats = stats;
    
    // Role-based data filtering
    if (userRole === 'Director' && userName) {
      const normalizedName = userName.trim().toLowerCase();
      baseStats = stats.filter(s => {
        const h = hierarchy.find(h => h.ob_id === s.ob_contact);
        return (h?.director_sales || '').trim().toLowerCase() === normalizedName;
      });
    } else if (userRole === 'NSM' && userName) {
      const normalizedName = userName.trim().toLowerCase();
      baseStats = stats.filter(s => {
        const h = hierarchy.find(h => h.ob_id === s.ob_contact);
        return (h?.nsm_name || '').trim().toLowerCase() === normalizedName;
      });
    } else if ((userRole === 'RSM' || userRole === 'SC') && (userName || userRegion)) {
      const normalizedName = (userName || '').trim().toLowerCase();
      const normalizedRegion = (userRegion || '').trim().toLowerCase();
      baseStats = stats.filter(s => {
        const h = hierarchy.find(h => h.ob_id === s.ob_contact);
        const region = (h?.territory_region || s.region || '').trim().toLowerCase();
        const rsmName = (h?.rsm_name || '').trim().toLowerCase();
        const scName = (h?.sc_name || '').trim().toLowerCase();
        return (normalizedName && (rsmName === normalizedName || scName === normalizedName)) || (normalizedRegion && region === normalizedRegion);
      });
    } else if ((userRole === 'TSM' || userRole === 'ASM') && userName) {
      const normalizedName = userName.trim().toLowerCase();
      baseStats = stats.filter(s => {
        const h = hierarchy.find(h => h.ob_id === s.ob_contact);
        const tsm = (h?.asm_tsm_name || s.tsm || '').trim().toLowerCase();
        return tsm === normalizedName;
      });
    } else if (userRole === 'OB' && userContact) {
      baseStats = stats.filter(s => s.ob_contact === userContact);
    }

    return baseStats.map(s => {
      const h = hierarchy.find(h => h.ob_id === s.ob_contact);
      const orderData = typeof s.order_data === 'string' ? JSON.parse(s.order_data) : s.order_data;
      
      let totalBags = 0;
      let brandSales: Record<string, number> = {};
      let totalWeightKg = 0;
      
      skus.forEach(sku => {
        const item = (orderData || {})[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
        const packs = (Number(item.ctn || 0) * Number(sku.unitsPerCarton || 0)) + (Number(item.dzn || 0) * Number(sku.unitsPerDozen || 0)) + Number(item.pks || 0);
        const ctns = Number(sku.unitsPerCarton || 0) > 0 ? packs / Number(sku.unitsPerCarton) : 0;
        
        totalBags += ctns;
        brandSales[sku.category] = (brandSales[sku.category] || 0) + ctns;
        
        totalWeightKg += (packs * (Number(sku.weight_gm_per_pack) || 0)) / 1000;
      });

      const visitEfficiency = s.visited_shops > 0 ? s.productive_shops / s.visited_shops : 0;
      const isFakeVisit = s.visited_shops >= 50 && s.productive_shops <= 20;

      return {
        ...s,
        region: h?.territory_region || s.region || 'Unassigned',
        tsm: h?.asm_tsm_name || s.tsm || 'Unassigned',
        rsm: h?.rsm_name || 'Unassigned',
        sc: h?.sc_name || 'Unassigned',
        town: h?.town_name || s.town || 'Unassigned',
        distributor: h?.distributor_name || s.distributor || 'Unassigned',
        ob_name: h?.ob_name || s.order_booker || 'Unassigned',
        month: s.date.slice(0, 7),
        totalBags,
        brandSales,
        totalWeightKg,
        visitEfficiency,
        isFakeVisit
      };
    });
  }, [stats, hierarchy, skus, userRole, userRegion, userName, userContact]);

  const filteredStats = useMemo(() => {
    let result = processedStats;
    if (filterLevel !== 'National') {
      result = result.filter(s => {
        if (filterLevel === 'Region') return s.region === filterValue;
        if (filterLevel === 'RSM') return s.rsm === filterValue;
        if (filterLevel === 'SC') return s.sc === filterValue;
        if (filterLevel === 'ASM/TSM') return s.tsm === filterValue;
        if (filterLevel === 'Town') return s.town === filterValue;
        if (filterLevel === 'Distributor') return s.distributor === filterValue;
        if (filterLevel === 'OB') return s.ob_name === filterValue;
        if (filterLevel === 'Route') return s.route === filterValue;
        return true;
      });
    }
    return result;
  }, [processedStats, filterLevel, filterValue]);

  const monthStats = useMemo(() => {
    return filteredStats.filter(s => s.month === selectedMonth);
  }, [filteredStats, selectedMonth]);

  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {
      Region: Array.from(new Set(processedStats.map(s => s.region))).filter(Boolean).sort() as string[],
      RSM: Array.from(new Set(processedStats.map(s => s.rsm))).filter(Boolean).sort() as string[],
      SC: Array.from(new Set(processedStats.map(s => s.sc))).filter(Boolean).sort() as string[],
      'ASM/TSM': Array.from(new Set(processedStats.map(s => s.tsm))).filter(Boolean).sort() as string[],
      Town: Array.from(new Set(processedStats.map(s => s.town))).filter(Boolean).sort() as string[],
      Distributor: Array.from(new Set(processedStats.map(s => s.distributor))).filter(Boolean).sort() as string[],
      OB: Array.from(new Set(processedStats.map(s => s.ob_name))).filter(Boolean).sort() as string[],
      Route: Array.from(new Set(processedStats.map(s => s.route))).filter(Boolean).sort() as string[],
    };
    return options;
  }, [processedStats]);

  const obPerformance = useMemo(() => {
    const obs: Record<string, any> = {};
    monthStats.forEach(s => {
      if (!obs[s.ob_contact]) {
        obs[s.ob_contact] = { 
          name: s.ob_name, 
          town: s.town, 
          tsm: s.tsm, 
          distributor: s.distributor,
          totalSales: 0,
          totalWeight: 0,
          visited: 0,
          productive: 0,
          entries: 0,
          brandSales: { "Kite Glow": 0, "Vero": 0, "Burq Action": 0 }
        };
      }
      obs[s.ob_contact].totalSales += s.totalBags;
      obs[s.ob_contact].totalWeight += s.totalWeightKg;
      obs[s.ob_contact].visited += s.visited_shops;
      obs[s.ob_contact].productive += s.productive_shops;
      obs[s.ob_contact].entries += 1;
      CATEGORIES.forEach(b => {
        if (!obs[s.ob_contact].brandSales[b]) obs[s.ob_contact].brandSales[b] = 0;
        obs[s.ob_contact].brandSales[b] += (s.brandSales[b] || 0);
      });
    });

    return Object.values(obs).map(ob => {
      const workingDays = 25; // Default
      const consistencyScore = (ob.entries / workingDays) * 100;
      
      // OB Productivity Score
      // Weights: Sales 50%, Visit Coverage 30%, Productive Ratio 20%
      // Sales Performance = (Actual / Target) - simplified to (Actual / Avg) for now if target missing
      const salesPerf = Math.min(100, (ob.totalSales / 100) * 100); // Dummy target 100
      const visitCoverage = Math.min(100, (ob.visited / (ob.entries * 50)) * 100); // 50 shops per day
      const productiveRatio = ob.visited > 0 ? (ob.productive / ob.visited) * 100 : 0;
      
      const productivityScore = (0.5 * salesPerf) + (0.3 * visitCoverage) + (0.2 * productiveRatio);

      let scoreLabel = 'Weak';
      if (productivityScore >= 90) scoreLabel = 'Excellent';
      else if (productivityScore >= 70) scoreLabel = 'Good';
      else if (productivityScore >= 50) scoreLabel = 'Average';

      let category: 'A' | 'B' | 'C' | 'D' = 'D';
      if (ob.totalSales >= 300) category = 'A';
      else if (ob.totalSales >= 200) category = 'B';
      else if (ob.totalSales >= 100) category = 'C';

      return {
        ...ob,
        consistencyScore,
        productivityScore,
        scoreLabel,
        isIrregular: consistencyScore < 70,
        category
      };
    });
  }, [monthStats]);

  const routeWeakness = useMemo(() => {
    const routes: Record<string, any[]> = {};
    filteredStats.forEach(s => {
      const key = `${s.ob_contact}-${s.route}`;
      if (!routes[key]) routes[key] = [];
      routes[key].push(s);
    });

    const weakRoutes: any[] = [];
    Object.entries(routes).forEach(([key, entries]) => {
      const sorted = entries.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
      if (sorted.length < 2) return;

      const latest = sorted[0];
      const previous = sorted[1];

      const salesDeclining = latest.totalBags < previous.totalBags;
      const productiveDeclining = latest.productive_shops < previous.productive_shops;
      const lowCoverage = latest.visited_shops < 40;

      if (salesDeclining || productiveDeclining || lowCoverage) {
        weakRoutes.push({
          ob: latest.ob_name,
          route: latest.route,
          latestSales: latest.totalBags,
          prevSales: previous.totalBags,
          latestProd: latest.productive_shops,
          prevProd: previous.productive_shops,
          coverage: latest.visited_shops,
          reasons: [
            salesDeclining && 'Declining Sales',
            productiveDeclining && 'Lower Productivity',
            lowCoverage && 'Low Coverage'
          ].filter(Boolean)
        });
      }
    });

    return weakRoutes.sort((a, b) => a.latestSales - b.latestSales).slice(0, 10);
  }, [filteredStats]);

  const summary = useMemo(() => {
    const totalSales = monthStats.reduce((sum, s) => sum + s.totalBags, 0);
    const uniqueOBs = new Set(monthStats.map(s => s.ob_contact)).size;
    const uniqueTSMs = new Set(monthStats.map(s => s.tsm)).size;
    
    const totalOBSalary = uniqueOBs * 50000;
    const totalTSMSalary = uniqueTSMs * 70000;
    const totalSalaryCost = totalOBSalary + totalTSMSalary;
    const costPerBag = totalSales > 0 ? totalSalaryCost / totalSales : 0;

    const brandTotals: Record<string, number> = {};
    CATEGORIES.forEach(b => {
      brandTotals[b] = monthStats.reduce((sum, s) => sum + (s.brandSales[b] || 0), 0);
    });

    const totalTonnage = monthStats.reduce((sum, s) => sum + (s.totalWeightKg || 0), 0) / 1000;

    return { totalSales, uniqueOBs, uniqueTSMs, totalSalaryCost, costPerBag, brandTotals, totalTonnage };
  }, [monthStats]);

  const categoryStats = useMemo(() => {
    const cats = { A: { count: 0, sales: 0 }, B: { count: 0, sales: 0 }, C: { count: 0, sales: 0 }, D: { count: 0, sales: 0 } };
    obPerformance.forEach(ob => {
      const cat = ob.category as keyof typeof cats;
      cats[cat].count++;
      cats[cat].sales += ob.totalSales;
    });
    return Object.entries(cats).map(([cat, data]) => ({
      category: cat,
      count: data.count,
      totalSales: data.sales,
      avgSales: data.count > 0 ? data.sales / data.count : 0
    }));
  }, [obPerformance]);

  const trendData = useMemo(() => {
    const months: Record<string, any> = {};
    filteredStats.forEach(s => {
      if (!months[s.month]) {
        months[s.month] = { month: s.month, totalSales: 0, obCount: new Set(), tsmCount: new Set() };
        brands.forEach(b => months[s.month][b] = 0);
      }
      months[s.month].totalSales += s.totalBags;
      months[s.month].obCount.add(s.ob_contact);
      months[s.month].tsmCount.add(s.tsm);
      brands.forEach(b => months[s.month][b] += (s.brandSales[b] || 0));
    });

    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).map(m => {
      const totalSalary = (m.obCount.size * 50000) + (m.tsmCount.size * 70000);
      return {
        ...m,
        costPerBag: m.totalSales > 0 ? totalSalary / m.totalSales : 0,
        totalSalary
      };
    });
  }, [filteredStats]);

  const worstOBs = useMemo(() => {
    return [...obPerformance].sort((a, b) => a.totalSales - b.totalSales).slice(0, 5);
  }, [obPerformance]);

  const worstByBrand = useMemo(() => {
    const brandWorst: Record<string, any[]> = {};
    CATEGORIES.forEach(cat => {
      brandWorst[cat] = [...obPerformance]
        .sort((a, b) => (a.brandSales[cat] || 0) - (b.brandSales[cat] || 0))
        .slice(0, 50)
        .map(ob => ({
          name: ob.name,
          town: ob.town,
          tsm: ob.tsm,
          region: ob.region,
          sales: ob.brandSales[cat] || 0
        }));
    });
    return brandWorst;
  }, [obPerformance]);

  const tsmPerformance = useMemo(() => {
    const tsms: Record<string, any> = {};
    const obStatsByTsm: Record<string, Set<string>> = {};
    
    monthStats.forEach(s => {
      if (!s.tsm) return;
      if (!tsms[s.tsm]) {
        tsms[s.tsm] = {
          name: s.tsm,
          totalSales: 0,
          totalTarget: 0,
          activeOBs: 0,
          totalOBAchievement: 0
        };
        obStatsByTsm[s.tsm] = new Set();
      }
      tsms[s.tsm].totalSales += s.totalBags;
      obStatsByTsm[s.tsm].add(s.ob_contact);
    });

    // Calculate active OBs and average achievement
    Object.keys(tsms).forEach(tsm => {
      const activeOBs = obStatsByTsm[tsm].size;
      tsms[tsm].activeOBs = activeOBs;
      
      // Find OBs for this TSM in obAnalysis to get their achievements
      const tsmOBs = obAnalysis.filter(ob => ob.tsm === tsm);
      let totalAchievement = 0;
      let validOBs = 0;
      
      tsmOBs.forEach(ob => {
        if (ob.target > 0) {
          totalAchievement += (ob.totalSales / ob.target) * 100;
          validOBs++;
        }
      });
      
      tsms[tsm].averageOBAchievement = validOBs > 0 ? totalAchievement / validOBs : 0;
    });

    return Object.values(tsms).sort((a, b) => b.totalSales - a.totalSales);
  }, [monthStats, obAnalysis]);

  const categoryWiseSales = useMemo(() => {
    const groups: Record<string, any> = {};
    
    monthStats.forEach(s => {
      const key = filterLevel === 'National' ? 'National' : 
                  filterLevel === 'Region' ? s.region :
                  filterLevel === 'TSM' ? s.tsm :
                  filterLevel === 'Town' ? s.town : 'Other';
      
      if (!groups[key]) {
        groups[key] = { name: key, obCount: new Set(), totalSales: 0, brandSales: {} };
        CATEGORIES.forEach(cat => groups[key].brandSales[cat] = 0);
      }
      
      groups[key].obCount.add(s.ob_contact);
      groups[key].totalSales += s.totalBags;
      CATEGORIES.forEach(cat => {
        groups[key].brandSales[cat] += (s.brandSales[cat] || 0);
      });
    });

    return Object.values(groups).map(g => ({
      ...g,
      obCount: g.obCount.size,
      avgSales: g.obCount.size > 0 ? g.totalSales / g.obCount.size : 0
    }));
  }, [monthStats, filterLevel]);

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-seablue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-seablue uppercase tracking-tight">SalesPulse Intelligence</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">National Performance & Field Analytics</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                const headers = ['Date', 'Month', 'Director', 'NSM', 'RSM', 'SC', 'ASM/TSM', 'Town', 'Distributor', 'OB Name', 'OB ID', 'Route', 'Total Shops', 'Visited Shops', 'Productive Shops', 'Visit Type', ...CATEGORIES, 'Total Bags'];
                const rows = monthStats.map(s => {
                  const h = hierarchy.find(h => h.ob_id === s.ob_contact);
                  return [
                    s.date, s.month, h?.director_sales || '', h?.nsm_name || '', h?.rsm_name || '', h?.sc_name || '', s.tsm, s.town, s.distributor, s.ob_name, s.ob_contact, s.route,
                    s.total_shops, s.visited_shops, s.productive_shops, s.visit_type,
                    ...CATEGORIES.map(cat => s.brandSales[cat] || 0),
                    s.totalBags.toFixed(2)
                  ];
                });
                const csv = Papa.unparse([headers, ...rows]);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Sales_Report_${selectedMonth}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
            <button 
              onClick={onRefresh}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-seablue text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-seablue/90 transition-all shadow-lg shadow-seablue/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-clean text-[10px] font-black uppercase py-2 px-3 bg-slate-50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Level:</span>
            <select 
              value={filterLevel} 
              onChange={(e) => { setFilterLevel(e.target.value as any); setFilterValue(''); }}
              className="bg-transparent text-[10px] font-black text-seablue uppercase focus:outline-none"
            >
              <option value="National">National</option>
              <option value="Region">Region</option>
              <option value="TSM">TSM</option>
                    <option value="ASM">ASM</option>
              <option value="Town">Town</option>
              <option value="Distributor">Distributor</option>
              <option value="OB">OB</option>
              <option value="Route">Route</option>
            </select>
          </div>
          {filterLevel !== 'National' && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select:</span>
              <select 
                value={filterValue} 
                onChange={(e) => setFilterValue(e.target.value)}
                className="bg-transparent text-[10px] font-black text-seablue uppercase focus:outline-none max-w-[150px]"
              >
                <option value="">All {filterLevel}s</option>
                {(filterOptions[filterLevel as keyof typeof filterOptions] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-seablue transition-all duration-1000" 
                style={{ width: `${timeGone || 0}%` }}
              />
            </div>
            <span className="text-[9px] font-black text-seablue uppercase tracking-widest">
              Month Progress: {Math.round(timeGone || 0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="card-clean p-5 bg-seablue text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Package className="w-24 h-24" />
            </div>
            <div className="text-[10px] uppercase font-black text-white/60 tracking-widest mb-1">MTD Volume</div>
            <div className="text-4xl font-black">{summary.totalSales.toFixed(0)}</div>
            <div className="text-[9px] font-bold text-white/80 mt-2 uppercase tracking-tighter">
              {summary.totalTonnage.toFixed(1)} Tons Distributed
            </div>
          </div>
          <div className="card-clean p-5 bg-emerald-600 text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-24 h-24" />
            </div>
            <div className="text-[10px] uppercase font-black text-white/60 tracking-widest mb-1">Active OBs</div>
            <div className="text-4xl font-black">{summary.uniqueOBs}</div>
            <div className="text-[9px] font-bold text-white/80 mt-2 uppercase tracking-tighter">
              Across {summary.uniqueTSMs} TSM Teams
            </div>
          </div>
        </div>
        
        <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Productivity</div>
            <div className="text-3xl font-black text-slate-700">
              {(() => {
                const visited = monthStats.reduce((sum, s) => sum + s.visited_shops, 0);
                const productive = monthStats.reduce((sum, s) => sum + s.productive_shops, 0);
                return visited > 0 ? ((productive / visited) * 100).toFixed(0) : 0;
              })()}%
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
              <span>Efficiency Gap</span>
              <span>{Math.max(0, 80 - Number((() => {
                const visited = monthStats.reduce((sum, s) => sum + s.visited_shops, 0);
                const productive = monthStats.reduce((sum, s) => sum + s.productive_shops, 0);
                return visited > 0 ? (productive / visited) * 100 : 0;
              })())).toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (monthStats.reduce((sum, s) => sum + s.productive_shops, 0) / Math.max(1, monthStats.reduce((sum, s) => sum + s.visited_shops, 0))) * 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Cost Factor</div>
            <div className="text-3xl font-black text-indigo-600">Rs.{summary.costPerBag.toFixed(0)}</div>
          </div>
          <div className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
            Per Bag Distribution Cost
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean p-6 bg-white border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Category Contribution</h3>
            <Package className="w-4 h-4 text-slate-300" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(summary.brandTotals).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {Object.entries(summary.brandTotals).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-clean p-6 bg-white border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Top 10 TSM Performance</h3>
            <TrendingUp className="w-4 h-4 text-slate-300" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryWiseSales.filter(g => g.name !== 'National').sort((a, b) => b.totalSales - a.totalSales).slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="totalSales" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TSM Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-black text-seablue uppercase tracking-widest">TSM Performance Overview</h2>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3">TSM Name</th>
                <th className="px-4 py-3 text-right">Active OBs</th>
                <th className="px-4 py-3 text-right">Total Sales (Ctns)</th>
                <th className="px-4 py-3 text-right">Avg OB Achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tsmPerformance.map((tsm, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-700 text-xs">{tsm.name}</td>
                  <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">{tsm.activeOBs}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 font-mono text-xs">{tsm.totalSales.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-widest ${
                      tsm.averageOBAchievement >= 100 ? 'bg-emerald-100 text-emerald-700' :
                      tsm.averageOBAchievement >= 80 ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {tsm.averageOBAchievement.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {tsmPerformance.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                    No TSM data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Alerts Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-clean p-4 bg-white border-l-4 border-rose-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Alerts</h3>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {obPerformance.filter(ob => ob.isIrregular).map(ob => (
              <div key={ob.name} className="flex items-center justify-between p-2 bg-rose-50 rounded-lg">
                <span className="text-[10px] font-bold text-rose-700">{ob.name}</span>
                <span className="text-[8px] font-black bg-rose-200 text-rose-800 px-2 py-0.5 rounded uppercase">Irregular</span>
              </div>
            ))}
            {monthStats.filter(s => s.isFakeVisit).map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                <span className="text-[10px] font-bold text-orange-700">{s.ob_name}</span>
                <span className="text-[8px] font-black bg-orange-200 text-orange-800 px-2 py-0.5 rounded uppercase">Fake Visit?</span>
              </div>
            ))}
            {obPerformance.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">No critical alerts</p>}
          </div>
        </div>

        <div className="card-clean p-4 bg-white border-l-4 border-seablue">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Performers</h3>
            <TrendingUp className="w-4 h-4 text-seablue" />
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {[...obPerformance].sort((a, b) => b.productivityScore - a.productivityScore).slice(0, 5).map(ob => (
              <div key={ob.name} className="flex items-center justify-between p-2 bg-sky-50 rounded-lg">
                <span className="text-[10px] font-bold text-sky-700">{ob.name}</span>
                <span className="text-[8px] font-black bg-sky-200 text-sky-800 px-2 py-0.5 rounded uppercase">{ob.scoreLabel}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-clean p-4 bg-white border-l-4 border-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Strength Map</h3>
            <Package className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {Array.from(new Set(monthStats.map(s => s.town))).map(town => {
              const townStats = monthStats.filter(s => s.town === town);
              const brandTotals = brands.map(b => ({ brand: b, total: townStats.reduce((sum, s) => sum + (s.brandSales[b] || 0), 0) }));
              const topBrand = brandTotals.sort((a, b) => b.total - a.total)[0];
              return (
                <div key={town} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                  <span className="text-[10px] font-bold text-emerald-700">{town}</span>
                  <span className="text-[8px] font-black bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded uppercase">{topBrand.brand}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card-clean p-4 bg-white border-l-4 border-seablue">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Package className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Total Sales (Bags)</p>
          </div>
          <h2 className="text-xl font-black text-seablue">{summary.totalSales.toFixed(0)}</h2>
        </div>
        <div className="card-clean p-4 bg-white border-l-4 border-emerald-500">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <TrendingUp className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Total Tonnage (T)</p>
          </div>
          <h2 className="text-xl font-black text-emerald-600">{summary.totalTonnage.toFixed(2)}</h2>
        </div>
        <div className="card-clean p-4 bg-white border-l-4 border-emerald-500">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Users className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Total OB</p>
          </div>
          <h2 className="text-xl font-black text-emerald-600">{summary.uniqueOBs}</h2>
        </div>
        <div className="card-clean p-4 bg-white border-l-4 border-orange-500">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Users className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Total TSM</p>
          </div>
          <h2 className="text-xl font-black text-orange-600">{summary.uniqueTSMs}</h2>
        </div>
        <div className="card-clean p-4 bg-white border-l-4 border-purple-500">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <TrendingUp className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Avg Sales / OB</p>
          </div>
          <h2 className="text-xl font-black text-purple-600">{summary.uniqueOBs > 0 ? (summary.totalSales / summary.uniqueOBs).toFixed(1) : 0}</h2>
        </div>
        <div className="card-clean p-4 bg-white border-l-4 border-rose-500">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <DollarSign className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Cost Per Bag</p>
          </div>
          <h2 className="text-xl font-black text-rose-600">Rs. {summary.costPerBag.toFixed(1)}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean p-6 bg-white space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Monthly Sales Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                <YAxis fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                <Tooltip />
                <Area type="monotone" dataKey="totalSales" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-clean p-6 bg-white space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Category Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="category"
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#10b981', '#0ea5e9', '#f59e0b', '#ef4444'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card-clean bg-white overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Category Wise OB Sales ({filterLevel})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">{filterLevel}</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-center">OBs</th>
                  {CATEGORIES.map(cat => (
                    <th key={cat} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">{cat}</th>
                  ))}
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Total</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Avg/OB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categoryWiseSales.map(row => (
                  <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-slate-700">{row.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 text-center">{row.obCount}</td>
                    {CATEGORIES.map(cat => (
                      <td key={cat} className="px-6 py-4 text-xs font-bold text-slate-600 text-right">
                        {(row.brandSales[cat] || 0).toFixed(1)}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-xs font-black text-seablue text-right">{row.totalSales.toFixed(1)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-600 text-right">{row.avgSales.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-black">
                <tr>
                  <td className="px-6 py-4 text-xs uppercase tracking-widest text-slate-400">Total</td>
                  <td className="px-6 py-4 text-xs text-center text-slate-600">
                    {categoryWiseSales.reduce((sum, r) => sum + r.obCount, 0)}
                  </td>
                  {CATEGORIES.map(cat => (
                    <td key={cat} className="px-6 py-4 text-xs text-right text-slate-600">
                      {categoryWiseSales.reduce((sum, r) => sum + (r.brandSales[cat] || 0), 0).toFixed(1)}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-xs text-right text-seablue">
                    {categoryWiseSales.reduce((sum, r) => sum + r.totalSales, 0).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-xs text-right text-emerald-600">
                    {(categoryWiseSales.reduce((sum, r) => sum + r.totalSales, 0) / Math.max(1, categoryWiseSales.reduce((sum, r) => sum + r.obCount, 0))).toFixed(1)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean bg-white overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Worst Performing OB (Bottom 50)</h3>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">OB Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Town / TSM</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...obPerformance].sort((a, b) => a.totalSales - b.totalSales).slice(0, 50).map((ob, idx) => (
                  <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">
                      <span className="text-slate-300 mr-2">{idx + 1}.</span>
                      {ob.name}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-slate-500">{ob.town}</p>
                      <p className="text-[8px] text-slate-400 uppercase tracking-widest">{ob.tsm}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-rose-600 text-right">{ob.totalSales.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-clean bg-white overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Worst OB by Brand (Bottom 50 per Brand)</h3>
          </div>
          <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto">
            {CATEGORIES.map(cat => (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <h4 className="text-[10px] font-black text-seablue uppercase tracking-widest">{cat}</h4>
                  <span className="text-[8px] font-black text-slate-400 uppercase">Bottom 50</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {worstByBrand[cat]?.map((ob, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg hover:bg-rose-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{idx + 1}. {ob.name}</p>
                        <p className="text-[8px] text-slate-400 truncate">{ob.town} | {ob.tsm}</p>
                      </div>
                      <span className="font-black text-rose-600 ml-2 text-[10px]">{ob.sales.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean bg-white overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Route Weakness Detection</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">OB / Route</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Sales Trend</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {routeWeakness.map((rw, idx) => (
                  <tr key={idx} className="hover:bg-rose-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">{rw.ob}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{rw.route}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-600">{rw.latestSales.toFixed(1)}</span>
                        <ArrowDownRight className="w-3 h-3 text-rose-500" />
                        <span className="text-[10px] text-slate-400 font-bold">vs {rw.prevSales.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {rw.reasons.map((r: string) => (
                          <span key={r} className="text-[8px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">{r}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-clean bg-white p-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Daily Sales Heatmap (MTD)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthStats.reduce((acc: any[], s) => {
                const existing = acc.find(a => a.date === s.date);
                if (existing) existing.sales += s.totalBags;
                else acc.push({ date: s.date.split('-')[2], sales: s.totalBags });
                return acc;
              }, []).sort((a, b) => a.date.localeCompare(b.date))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: '900', color: '#1e293b', fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Bar dataKey="sales" fill="#0066cc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {filterLevel === 'OB' && filterValue && (
        <div className="card-clean p-6 bg-white space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">OB Monthly Sales Trend: {filterValue}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                <YAxis fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Kite Glow" stroke="#0ea5e9" strokeWidth={2} />
                <Line type="monotone" dataKey="Vero" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Burq Action" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="totalSales" stroke="#0f172a" strokeWidth={3} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const UserProfileView = ({ user, onUpdate, apiFetch }: { user: any, onUpdate: (data: any) => void, apiFetch: any }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    contact: user?.contact || '',
    region: user?.region || '',
    town: user?.town || '',
    email: user?.email || '',
    username: user?.username || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          contact: formData.contact,
          region: formData.region,
          town: formData.town
        })
      });
      if (res.ok) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        onUpdate({ ...user, ...formData });
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      setMessage({ text: 'Failed to update profile', type: 'error' });
    } finally {
      setIsUpdating(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen pb-40">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-black text-seablue uppercase tracking-tight">User Profile</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">View and update your personal information</p>
      </div>

      <form onSubmit={handleSubmit} className="card-clean bg-white p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-clean w-full"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Number</label>
            <input 
              type="text" 
              value={formData.contact} 
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="input-clean w-full"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Region</label>
            <input 
              type="text" 
              value={formData.region} 
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="input-clean w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Town</label>
            <input 
              type="text" 
              value={formData.town} 
              onChange={(e) => setFormData({ ...formData, town: e.target.value })}
              className="input-clean w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email (Read-only)</label>
            <input 
              type="email" 
              value={formData.email} 
              className="input-clean w-full bg-slate-50"
              readOnly
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username (Read-only)</label>
            <input 
              type="text" 
              value={formData.username} 
              className="input-clean w-full bg-slate-50"
              readOnly
            />
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-xs font-bold uppercase tracking-widest ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {message.text}
          </div>
        )}

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isUpdating}
            className="btn-seablue w-full py-3 flex items-center justify-center gap-2"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
            Update Profile
          </button>
        </div>
      </form>
    </div>
  );
};

const MainNav = ({ view, setView, role, onLogout }: { view: string, setView: (v: any) => void, role: string | null, onLogout: () => void }) => {
  const tabs = [
    { id: 'entry', label: 'Entry', icon: ClipboardList, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'SC', 'RSM', 'NSM', 'Director'] },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
    { id: 'stats', label: 'Stats', icon: Waves, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'] },
    { id: 'reports', label: 'Reports', icon: ClipboardList, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'] },
    { id: 'history', label: 'History', icon: History, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
    { id: 'stocks', label: 'Stocks', icon: Store, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'] },
    { id: 'profile', label: 'Profile', icon: User, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
    { id: 'admin', label: 'Admin', icon: Settings, roles: ['Super Admin', 'Admin'] },
  ];

  const visibleTabs = tabs.filter(tab => !role || tab.roles.includes(role));

  return (
    <nav className="bg-white border-b border-slate-100 px-4 h-14 flex justify-around items-center sticky top-0 z-40 shadow-sm overflow-x-auto no-scrollbar gap-2">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setView(tab.id as any)}
          className={`relative py-2 px-1 flex flex-col items-center gap-1 transition-all min-w-[56px] ${
            view === tab.id ? 'text-seablue' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <tab.icon className={`w-5 h-5 transition-transform ${view === tab.id ? 'scale-110' : ''}`} />
          <span className={`text-[9px] font-black uppercase tracking-tight ${view === tab.id ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
          {view === tab.id && (
            <motion.div 
              layoutId="nav-indicator" 
              className="absolute -bottom-[1px] h-0.5 w-full bg-seablue rounded-full" 
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      ))}
      <button 
        onClick={onLogout} 
        className="py-2 px-1 flex flex-col items-center gap-1 text-slate-400 hover:text-rose-500 transition-all min-w-[56px]"
      >
        <EyeOff className="w-5 h-5" />
        <span className="text-[9px] font-black uppercase tracking-tight opacity-60">Logout</span>
      </button>
    </nav>
  );
};

const StatsView = ({ history, obAssignments, tsmList, appConfig, getPSTDate, SKUS, CATEGORIES, userRole, userName, userRegion, userContact }: any) => {
  const currentMonth = getPSTDate().slice(0, 7);
  const today = getPSTDate();
  const dayOfMonth = parseInt(today.split('-')[2]);

  const filteredOBs = useMemo(() => {
    if (userRole === 'Admin' || userRole === 'Super Admin') {
      return obAssignments;
    }
    if (userRole === 'Director') {
      return obAssignments.filter((ob: any) => (ob.director || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    }
    if (userRole === 'NSM') {
      return obAssignments.filter((ob: any) => (ob.nsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    }
    if (userRole === 'RSM' || userRole === 'SC') {
      return obAssignments.filter((ob: any) => (ob.region || '').trim().toLowerCase() === (userRegion || '').trim().toLowerCase() || (ob.rsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase() || (ob.sc || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    }
    if ((userRole === 'TSM' || userRole === 'ASM')) {
      return obAssignments.filter((ob: any) => (ob.tsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    }
    if (userRole === 'OB') {
      return obAssignments.filter((ob: any) => (ob.contact || '').trim() === (userContact || '').trim());
    }
    return [];
  }, [obAssignments, userRole, userRegion, userName, userContact]);

  const filteredTSMList = useMemo(() => {
    if (userRole === 'Admin' || userRole === 'Super Admin') {
      return tsmList;
    }
    if (userRole === 'Director') {
      return tsmList.filter((tsm: string) => obAssignments.some((ob: any) => (ob.tsm || '').trim().toLowerCase() === tsm.toLowerCase() && (ob.director || '').trim().toLowerCase() === (userName || '').trim().toLowerCase()));
    }
    if (userRole === 'NSM') {
      return tsmList.filter((tsm: string) => obAssignments.some((ob: any) => (ob.tsm || '').trim().toLowerCase() === tsm.toLowerCase() && (ob.nsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase()));
    }
    if (userRole === 'RSM' || userRole === 'SC') {
      return tsmList.filter((tsm: string) => obAssignments.some((ob: any) => (ob.tsm || '').trim().toLowerCase() === tsm.toLowerCase() && ((ob.region || '').trim().toLowerCase() === (userRegion || '').trim().toLowerCase() || (ob.rsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase() || (ob.sc || '').trim().toLowerCase() === (userName || '').trim().toLowerCase())));
    }
    if ((userRole === 'TSM' || userRole === 'ASM')) {
      return tsmList.filter((tsm: string) => tsm.toLowerCase() === (userName || '').trim().toLowerCase());
    }
    return [];
  }, [tsmList, obAssignments, userRole, userRegion, userName]);

  const calculateWorkingDaysTillDate = () => {
    const now = new Date(today);
    return getWorkingDays(now.getFullYear(), now.getMonth(), appConfig.holidays || '', dayOfMonth);
  };

  const workingDaysTillDate = calculateWorkingDaysTillDate();
  const totalWorkingDays = parseInt(appConfig.total_working_days || '25');

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen pb-40">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50"
      >
        <h1 className="text-2xl font-black text-seablue uppercase tracking-tight leading-none">Operational Stats</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Submission Status & Activity Tracking</p>
      </motion.div>

      {/* OB Submission Status Report */}
      <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">OB Submission Status</h3>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Working Days</span>
              <span className="text-xs font-black text-seablue">{workingDaysTillDate}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Target</span>
              <span className="text-xs font-black text-slate-600">{totalWorkingDays}</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4">OB Name</th>
                <th className="px-6 py-4">TSM</th>
                <th className="px-6 py-4 text-center">Entries</th>
                <th className="px-6 py-4 text-center">Missing</th>
                <th className="px-6 py-4">Last Entry</th>
                <th className="px-6 py-4 text-right">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOBs.map((ob: any, idx: number) => {
                const obStats = history.filter((h: any) => h.ob_contact === ob.contact && h.date.startsWith(currentMonth));
                const uniqueEntryDays = new Set(obStats.map((h: any) => h.date)).size;
                const missing = Math.max(0, workingDaysTillDate - uniqueEntryDays);
                const lastEntry = obStats.sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
                const efficiency = workingDaysTillDate > 0 ? (uniqueEntryDays / workingDaysTillDate) * 100 : 0;
                
                return (
                  <tr key={ob.contact || `ob-${idx}`} className="group hover:bg-slate-50/80 transition-all duration-200">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-700 group-hover:text-seablue transition-colors">{ob.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{ob.town}</p>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{ob.tsm}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{uniqueEntryDays}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg ${missing > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                        {missing}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 font-mono">{lastEntry?.date || 'Never'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm ${efficiency < 80 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                          {efficiency.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* TSM Activity Report */}
      <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
          <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
            <Waves className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">TSM Activity Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4">TSM Name</th>
                <th className="px-6 py-4 text-center">Active OBs</th>
                <th className="px-6 py-4 text-center">Total Sales</th>
                <th className="px-6 py-4 text-center">Avg Productivity</th>
                <th className="px-6 py-4 text-right">Activity Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTSMList.map((tsm: string, idx: number) => {
                const tsmOBs = obAssignments.filter((ob: any) => ob.tsm === tsm);
                const tsmOrders = history.filter((h: any) => h.tsm === tsm && h.date.startsWith(currentMonth));
                const activeOBs = new Set(tsmOrders.map((h: any) => h.ob_contact)).size;
                const totalSales = tsmOrders.reduce((sum: number, h: any) => {
                  const data = h.order_data || {};
                  return sum + SKUS.reduce((s: number, sku: any) => {
                    const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                    const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
                    return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                  }, 0);
                }, 0);
                const avgProd = tsmOrders.length > 0 ? tsmOrders.reduce((sum: number, h: any) => sum + (h.visited_shops > 0 ? (h.productive_shops / h.visited_shops) * 100 : 0), 0) / tsmOrders.length : 0;
                const score = (activeOBs / Math.max(1, tsmOBs.length) * 40) + (avgProd * 0.6);
                
                return (
                  <tr key={tsm || `tsm-${idx}`} className="group hover:bg-slate-50/80 transition-all duration-200">
                    <td className="px-6 py-4 text-xs font-black text-slate-700 group-hover:text-seablue transition-colors">{tsm}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{activeOBs}/{tsmOBs.length}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-black text-seablue font-mono">{totalSales.toFixed(1)}</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-emerald-600 bg-emerald-50/50">{avgProd.toFixed(0)}%</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${score > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {score.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const ReportsView = ({ history, obAssignments, tsmList, appConfig, getPSTDate, SKUS, CATEGORIES, userRole, userName, userRegion, userContact }: any) => {
  const currentMonth = getPSTDate().slice(0, 7);
  const today = getPSTDate();
  const dayOfMonth = parseInt(today.split('-')[2]);
  const [selectedAnalysisRoute, setSelectedAnalysisRoute] = useState('');
  const [selectedAnalysisOB, setSelectedAnalysisOB] = useState('');
  const [matrixView, setMatrixView] = useState('Total');

  const filteredOBs = useMemo(() => {
    if (userRole === 'Admin' || userRole === 'Super Admin') {
      return obAssignments;
    }
    if (userRole === 'Director') {
      return obAssignments.filter((ob: any) => (ob.director || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    }
    if (userRole === 'NSM') {
      return obAssignments.filter((ob: any) => (ob.nsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    }
    if (userRole === 'RSM' || userRole === 'SC') {
      return obAssignments.filter((ob: any) => (ob.region || '').trim().toLowerCase() === (userRegion || '').trim().toLowerCase() || (ob.rsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase() || (ob.sc || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    }
    if ((userRole === 'TSM' || userRole === 'ASM')) {
      return obAssignments.filter((ob: any) => (ob.tsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    }
    if (userRole === 'OB') {
      return obAssignments.filter((ob: any) => (ob.contact || '').trim() === (userContact || '').trim());
    }
    return [];
  }, [obAssignments, userRole, userRegion, userName, userContact]);
  
  const routeAnalysisData = useMemo(() => {
    if (!selectedAnalysisOB || !selectedAnalysisRoute) return null;
    const obOrders = history.filter((h: any) => h.ob_contact === selectedAnalysisOB && h.route === selectedAnalysisRoute);
    const last6 = obOrders.sort((a: any, b: any) => b.date.localeCompare(a.date)).slice(0, 6);
    
    return last6.map((h: any) => {
      const data = h.order_data || {};
      const brandSales: Record<string, number> = {};
      CATEGORIES.forEach((cat: string) => {
        brandSales[cat] = SKUS.filter((s: any) => s.category === cat).reduce((sum: number, sku: any) => {
          const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
          return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
        }, 0);
      });
      return {
        date: h.date,
        visited: h.visited_shops,
        productive: h.productive_shops,
        brandSales
      };
    });
  }, [history, selectedAnalysisOB, selectedAnalysisRoute, CATEGORIES, SKUS]);

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen pb-40">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50"
      >
        <h1 className="text-2xl font-black text-seablue uppercase tracking-tight leading-none">Performance Reports</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Detailed Analysis & Sales Matrix</p>
      </motion.div>

      {/* OB Date-wise Sales Matrix (MTD) */}
      <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">OB Date-wise Sales Matrix (MTD)</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase">View:</span>
            <select 
              className="input-clean text-[10px] py-1 px-2 rounded-lg"
              value={matrixView}
              onChange={(e) => setMatrixView(e.target.value)}
            >
              <option value="Total">Total Bags/Ctns</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left min-w-[1200px] border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-4 py-3 sticky left-0 bg-slate-50/90 backdrop-blur-sm z-10 border-r border-slate-100">OB Name</th>
                {Array.from({ length: dayOfMonth }, (_, i) => i + 1).map(day => (
                  <th key={day} className="px-2 py-3 text-center border-r border-slate-100/50">{day}</th>
                ))}
                <th className="px-4 py-3 text-right bg-slate-50/90 backdrop-blur-sm sticky right-0 z-10 border-l border-slate-100">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOBs.map((ob: any, idx: number) => {
                const obStats = history.filter((h: any) => h.ob_contact === ob.contact && h.date.startsWith(currentMonth));
                let total = 0;
                return (
                  <tr key={ob.contact || `ob-matrix-${idx}`} className="group hover:bg-slate-50/80 transition-all">
                    <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10 text-[10px] font-black text-slate-700 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{ob.name}</td>
                    {Array.from({ length: dayOfMonth }, (_, i) => i + 1).map((day, dIdx) => {
                      const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
                      const dayOrders = obStats.filter((h: any) => h.date === dateStr);
                      const daySales = dayOrders.reduce((sum, h) => {
                        const data = h.order_data || {};
                        if (matrixView === 'Total') {
                          return sum + SKUS.reduce((s, sku) => {
                            const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                            const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                            return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                          }, 0);
                        } else {
                          return sum + SKUS.filter(s => s.category === matrixView).reduce((s, sku) => {
                            const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                            const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                            return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                          }, 0);
                        }
                      }, 0);
                      total += daySales;
                      return (
                        <td key={`${ob.contact}-${day}-${dIdx}`} className={`px-2 py-3 text-center text-[10px] border-r border-slate-100/30 font-mono ${daySales > 0 ? 'font-black text-seablue' : 'text-slate-200'}`}>
                          {daySales > 0 ? daySales.toFixed(1) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right text-[10px] font-black text-emerald-600 sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-100 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">{total.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-slate-50/30 border-t border-slate-50">
          <p className="text-[8px] text-slate-400 italic font-medium uppercase tracking-wider">
            * Matrix shows {matrixView === 'Total' ? 'total bags/cartons' : matrixView + ' sales'} per day for the current month. Scroll horizontally to see all dates.
          </p>
        </div>
      </section>

      {/* Brand Target vs Achievement (MTD) */}
      <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
          <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Brand Target vs Achievement (MTD)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4">Brand Name</th>
                <th className="px-6 py-4 text-center">Target</th>
                <th className="px-6 py-4 text-center">Achievement</th>
                <th className="px-6 py-4 text-right">Ach %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {CATEGORIES.map(cat => {
                const catTarget = obAssignments.reduce((sum: number, ob: any) => sum + (ob.targets?.[cat] || 0), 0);
                const catAch = history.filter((h: any) => h.date.startsWith(currentMonth)).reduce((sum: number, h: any) => {
                  const data = h.order_data || {};
                  return sum + SKUS.filter((s: any) => s.category === cat).reduce((s: number, sku: any) => {
                    const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                    const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
                    return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                  }, 0);
                }, 0);
                const percent = catTarget > 0 ? (catAch / catTarget) * 100 : 0;
                return (
                  <tr key={cat} className="group hover:bg-slate-50/80 transition-all">
                    <td className="px-6 py-4 text-xs font-black text-slate-700 group-hover:text-seablue transition-colors">{cat}</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500 font-mono">{catTarget.toFixed(1)}</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-seablue font-mono">{catAch.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full shadow-sm ${percent > 80 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {percent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Route Analysis Section */}
      <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Route Analysis (Last 6 Visits)</h3>
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedAnalysisOB} 
              onChange={e => {
                setSelectedAnalysisOB(e.target.value);
                setSelectedAnalysisRoute('');
              }}
              className="input-clean py-1.5 text-[10px] min-w-[140px] rounded-xl"
            >
              <option value="">Select OB</option>
              {filteredOBs.map((ob: any) => <option key={ob.contact} value={ob.contact}>{ob.name}</option>)}
            </select>
            <select 
              value={selectedAnalysisRoute} 
              onChange={e => setSelectedAnalysisRoute(e.target.value)}
              disabled={!selectedAnalysisOB}
              className="input-clean py-1.5 text-[10px] min-w-[140px] rounded-xl"
            >
              <option value="">Select Route</option>
              {selectedAnalysisOB && Array.from(new Set(history.filter((h: any) => h.ob_contact === selectedAnalysisOB).map((h: any) => h.route))).map(r => <option key={r as string} value={r as string}>{r as string}</option>)}
            </select>
          </div>
        </div>
        {routeAnalysisData ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Visited</th>
                  <th className="px-6 py-4 text-center">Productive</th>
                  {CATEGORIES.map(cat => <th key={cat} className="px-6 py-4 text-center">{cat}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {routeAnalysisData.map((h: any) => (
                  <tr key={h.date} className="group hover:bg-slate-50/80 transition-all">
                    <td className="px-6 py-4 text-xs font-black text-slate-700 font-mono">{h.date}</td>
                    <td className="px-6 py-4 text-center text-xs text-slate-500 font-bold">{h.visited}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{h.productive}</span>
                    </td>
                    {CATEGORIES.map(cat => (
                      <td key={cat} className="px-6 py-4 text-center text-xs font-mono text-seablue font-black">{h.brandSales[cat].toFixed(1)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select an OB and Route to see analysis</p>
          </div>
        )}
      </section>

      {/* Route-to-Route Analysis (MTD) */}
      <section className="card-clean bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm font-black text-seablue uppercase tracking-widest">Route-to-Route Analysis (MTD)</h3>
          <div className="flex gap-2">
            <select 
              value={selectedAnalysisOB} 
              onChange={e => setSelectedAnalysisOB(e.target.value)}
              className="input-clean py-1 text-[10px] min-w-[150px]"
            >
              <option value="">All OBs</option>
              {filteredOBs.map((ob: any) => <option key={ob.contact} value={ob.contact}>{ob.name}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-3">Route Name</th>
                <th className="px-6 py-3">OB Name</th>
                <th className="px-6 py-3 text-center">T/V/P</th>
                {CATEGORIES.map(cat => <th key={cat} className="px-6 py-3 text-center">{cat}</th>)}
                <th className="px-6 py-3 text-right">Total Ach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOBs.filter((ob: any) => !selectedAnalysisOB || ob.contact === selectedAnalysisOB).flatMap((ob: any) => {
                const obOrders = history.filter((h: any) => h.ob_contact === ob.contact && h.date.startsWith(currentMonth));
                const routes = Array.from(new Set([...(ob.routes || []), ...obOrders.map((h: any) => h.route)])).filter(Boolean);
                
                return routes.map(route => {
                  const routeOrders = obOrders.filter((h: any) => h.route === route);
                  const t = routeOrders.reduce((sum, h) => sum + (h.total_shops || 0), 0);
                  const v = routeOrders.reduce((sum, h) => sum + (h.visited_shops || 0), 0);
                  const p = routeOrders.reduce((sum, h) => sum + (h.productive_shops || 0), 0);
                  
                  const brandSales: Record<string, number> = {};
                  CATEGORIES.forEach(cat => {
                    brandSales[cat] = routeOrders.reduce((sum, h) => {
                      const data = h.order_data || {};
                      return sum + SKUS.filter(s => s.category === cat).reduce((s, sku) => {
                        const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                        const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
                        return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                      }, 0);
                    }, 0);
                  });

                  const totalAch = Object.values(brandSales).reduce((a, b) => a + b, 0);

                  return (
                    <tr key={`${ob.contact}-${route}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{route}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{ob.name}</td>
                      <td className="px-6 py-4 text-center text-[10px] font-mono text-slate-600">{t}/{v}/{p}</td>
                      {CATEGORIES.map(cat => (
                        <td key={cat} className="px-6 py-4 text-center text-xs font-mono text-slate-500">{brandSales[cat].toFixed(1)}</td>
                      ))}
                      <td className="px-6 py-4 text-right text-xs font-black text-seablue">{totalAch.toFixed(1)}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};


const Login = ({ onLogin }: { onLogin: (token: string, user: any) => void }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-100"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-seablue rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-seablue/20 rotate-3">
            <Waves className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">SalesPulse</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Enterprise Sales Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username or ID</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-seablue transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-seablue/20 focus:border-seablue outline-none transition-all text-sm font-bold"
                placeholder="Enter your username or ID"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-seablue hover:bg-seablue-light disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-lg shadow-seablue/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
            Authorized Personnel Only • v2.5.0
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'entry' | 'history' | 'dashboard' | 'admin' | 'stocks' | 'national' | 'reports' | 'profile'>('entry');
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('auth_token');
    return (saved === 'null' || !saved) ? null : saved;
  });
  const [user, setUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('user_data');
    try { return saved ? JSON.parse(saved) : null; } catch(e) { return null; }
  });
  const normalizeRole = (role: string): any => {
    const r = (role || '').trim().toUpperCase();
    if (r === 'SUPER ADMIN') return 'Super Admin';
    if (r === 'ADMIN') return 'Admin';
    if (r === 'DIRECTOR') return 'Director';
    if (r === 'NSM') return 'NSM';
    if (r === 'RSM') return 'RSM';
    if (r === 'SC') return 'SC';
    if (r === 'TSM') return 'TSM';
    if (r === 'ASM') return 'ASM';
    if (r === 'OB') return 'OB';
    return role;
  };

  const [userRole, setUserRole] = useState<'Super Admin' | 'Admin' | 'TSM' | 'ASM' | 'OB' | 'Director' | 'NSM' | 'RSM' | 'SC' | null>(() => normalizeRole(user?.role));
  const [userName, setUserName] = useState<string | null>(() => user?.name || null);
  const [userContact, setUserContact] = useState<string | null>(() => user?.contact || null);
  const [userEmail, setUserEmail] = useState<string | null>(() => user?.email || null);
  const [userRegion, setUserRegion] = useState<string | null>(() => user?.region || null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [matrixView, setMatrixView] = useState<string>('Total');

  const handleLogin = (token: string, userData: any) => {
    const role = normalizeRole(userData.role);
    setToken(token);
    setUser(userData);
    setUserRole(role);
    setUserName(userData.name);
    setUserContact(userData.contact);
    setUserEmail(userData.email);
    setUserRegion(userData.region);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    
    if ((role === 'TSM' || role === 'ASM')) {
      setSelectedTSM(userData.name);
      setSelectedStockTSM(userData.name);
    }

    if (['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'].includes(role)) {
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUser(null);
    setUserRole(null);
    setUserName(null);
    setUserContact(null);
    setUserEmail(null);
    setUserRegion(null);
    window.location.href = '/';
  };

  const apiFetch = async (url: string, options: any = {}) => {
    const currentToken = token || localStorage.getItem('auth_token');
    if (!currentToken || currentToken === 'null') {
      throw new Error("No authentication token found");
    }
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json'
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      console.warn(`apiFetch: 401 on ${url}. Logging out.`);
      const errorMsg = "Session expired. Please login again.";
      setMessage({ text: errorMsg, type: 'error' });
      handleLogout();
      setTimeout(() => setMessage(null), 5000);
      throw new Error(errorMsg);
    }
    if (response.status === 403) {
      console.warn(`apiFetch: 403 on ${url}. Access denied.`);
      const errorMsg = "Access denied. You don't have permission for this action.";
      setMessage({ text: errorMsg, type: 'error' });
      setTimeout(() => setMessage(null), 5000);
      throw new Error(errorMsg);
    }
    return response;
  };
  const [history, setHistory] = useState<any[]>([]);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [nationalStats, setNationalStats] = useState<any[]>([]);
  const [isLoadingNational, setIsLoadingNational] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({ 
    ob: '', 
    tsm: '', 
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [obAssignments, setObAssignments] = useState<OBAssignment[]>([]);
  const [obSearch, setObSearch] = useState('');
  const [appConfig, setAppConfig] = useState<Record<string, string>>({ total_working_days: '25' });
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [selectedEntryRegion, setSelectedEntryRegion] = useState<string>('');
  const [selectedTSM, setSelectedTSM] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('user_data');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return (parsed.role === 'TSM' || parsed.role === 'ASM') ? parsed.name || '' : '';
      }
    } catch (e) {}
    return '';
  });
  const [selectedAdminTSM, setSelectedAdminTSM] = useState<string>('');
  const [targetMonth, setTargetMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [distributors, setDistributors] = useState<any[]>([]);
  const [mtdAchievement, setMtdAchievement] = useState<Record<string, number>>({});
  const [appLogo, setAppLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOGO_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  });
  const [selectedOBForTargets, setSelectedOBForTargets] = useState<string | null>(null);
  const [obTargetsEdit, setObTargetsEdit] = useState<Record<string, number>>({});
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; spreadsheetId: string | null; method?: string }>({ connected: false, spreadsheetId: null });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleConfigLocked, setIsGoogleConfigLocked] = useState(true);
  const [dailyStatus, setDailyStatus] = useState<any[]>([]);
  const [isLoadingDailyStatus, setIsLoadingDailyStatus] = useState(false);

  const [order, setOrder] = useState<OrderState>(() => {
    const defaultState: OrderState = {
      date: getPSTDate(),
      tsm: '',
      town: '',
      distributor: '',
      orderBooker: '',
      obContact: '',
      route: '',
      zone: '',
      region: '',
      nsm: '',
      rsm: '',
      sc: '',
      director: '',
      totalShops: 50,
      visitedShops: 0,
      productiveShops: 0,
      categoryProductiveShops: {},
      items: {},
      targets: {},
      visitType: 'A'
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          items: parsed.items || {},
          targets: parsed.targets || {},
          categoryProductiveShops: parsed.categoryProductiveShops || {},
          visitType: parsed.visitType || (parsed.isAbsent ? 'Absent' : (parsed.withTSM ? 'RR' : 'A'))
        };
      }
    } catch (e) {
      console.error("Error loading from localStorage", e);
    }
    return defaultState;
  });

  const calculateAchievement = (orderData: any) => {
    const ach: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      ach[cat] = SKUS
        .filter(sku => sku.category === cat)
        .reduce((sum, sku) => {
          const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const packs = (Number(item.ctn || 0) * Number(sku.unitsPerCarton)) + (Number(item.dzn || 0) * Number(sku.unitsPerDozen)) + Number(item.pks || 0);
          return sum + (Number(sku.unitsPerCarton) > 0 ? packs / Number(sku.unitsPerCarton) : 0);
        }, 0);
    });
    return ach;
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<any | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void; onCancel: () => void } | null>(null);
  const [stockOrders, setStockOrders] = useState<Record<string, Record<string, { ctn: number }>>>({});
  const [selectedStockTSM, setSelectedStockTSM] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('user_data');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return (parsed.role === 'TSM' || parsed.role === 'ASM') ? parsed.name || '' : '';
      }
    } catch (e) {}
    return '';
  });
  const [selectedStockRegion, setSelectedStockRegion] = useState<string>('');
  const [selectedStockTown, setSelectedStockTown] = useState<string>('');
  const [isSubmittingStocks, setIsSubmittingStocks] = useState(false);
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);

  // Move Stocks hooks to top level
  const allDistributors = useMemo(() => {
    const combined = [
      ...distributors.map(d => ({ town: d.town, distributor: d.name, tsm: d.tsm, region: d.region })),
      ...obAssignments.map(ob => ({ town: ob.town, distributor: ob.distributor, tsm: ob.tsm, region: ob.region }))
    ];
    return combined.filter((v, i, a) => a.findIndex(t => t.distributor === v.distributor) === i);
  }, [distributors, obAssignments]);

  const filteredDistributors = useMemo(() => {
    return allDistributors.filter(d => {
      const matchTSM = !selectedStockTSM || d.tsm === selectedStockTSM;
      const matchRegion = !selectedStockRegion || d.region === selectedStockRegion;
      const matchTown = !selectedStockTown || d.town === selectedStockTown;
      return matchTSM && matchRegion && matchTown;
    });
  }, [allDistributors, selectedStockTSM, selectedStockRegion, selectedStockTown]);

  const stockRegions = useMemo(() => Array.from(new Set(allDistributors.map(d => d.region).filter(Boolean))).sort(), [allDistributors]);
  const stockTowns = useMemo(() => Array.from(new Set(allDistributors.map(d => d.town).filter(Boolean))).sort(), [allDistributors]);
  const stockTsms = useMemo(() => Array.from(new Set(allDistributors.map(d => d.tsm).filter(Boolean))).sort(), [allDistributors]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const focusableIds = useMemo(() => {
    const ids: string[] = [];
    SKUS.forEach(sku => {
      ids.push(`${sku.id}-ctn`);
      if (sku.unitsPerDozen > 0) ids.push(`${sku.id}-dzn`);
      ids.push(`${sku.id}-pks`);
    });
    return ids;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch (e) {
      console.error("Error saving to localStorage", e);
    }
  }, [order]);

  const handleInputChange = (skuId: string, field: keyof OrderItem, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(numValue)) return;

    setOrder(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [skuId]: {
          ...(prev.items[skuId] || { skuId, ctn: 0, dzn: 0, pks: 0 }),
          [field]: numValue
        }
      }
    }));
  };

  const checkDuplicate = async (date: string, obContact: string) => {
    try {
      const res = await apiFetch(`/api/check-duplicate?date=${date}&ob_contact=${obContact}`);
      const data = await res.json();
      return data.exists;
    } catch (e) {
      return false;
    }
  };

  const fetchDailyStatus = async (date: string) => {
    setIsLoadingDailyStatus(true);
    try {
      const res = await apiFetch(`/api/daily-status?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setDailyStatus(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDailyStatus(false);
    }
  };

  const handleMetaChange = async (field: keyof Omit<OrderState, 'items' | 'targets' | 'categoryProductiveShops'>, value: string | number) => {
    if (field === 'obContact') {
      const assignment = filteredOBs.find(a => a.contact === value);
      if (assignment) {
        const isDuplicate = await checkDuplicate(order.date, String(value));
        if (isDuplicate) {
          setMessage({ text: "Entry already exists for this OB today!", type: 'error' });
          setOrder(prev => ({ ...prev, obContact: '', orderBooker: '', route: '', town: '', distributor: '', totalShops: 50, items: {}, productiveShops: 0, categoryProductiveShops: {}, zone: '', region: '', nsm: '', rsm: '', sc: '', director: '' }));
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        // Filter distributors for this town
        const townDists = distributors.filter(d => d.town === assignment.town);
        let autoDist = assignment.distributor;
        
        // If town has distributors in the independent list, use those
        if (townDists.length === 1) {
          autoDist = townDists[0].name;
        } else if (townDists.length > 1) {
          // If multiple, and the assignment distributor is one of them, keep it.
          // Otherwise, let the user select.
          const found = townDists.find(d => d.name === assignment.distributor);
          if (found) {
            autoDist = found.name;
          } else {
            autoDist = '';
          }
        }

        setOrder(prev => ({
          ...prev,
          obContact: String(value),
          orderBooker: assignment.name,
          town: assignment.town,
          distributor: autoDist,
          tsm: assignment.tsm || '',
          zone: assignment.zone || '',
          region: assignment.region || '',
          nsm: assignment.nsm || '',
          rsm: assignment.rsm || '',
          sc: assignment.sc || '',
          director: assignment.director || '',
          route: assignment.routes?.[0] || '',
          totalShops: assignment.total_shops || 50,
          targets: {},
          items: {},
          categoryProductiveShops: {},
          visitType: 'A'
        }));
        fetchTargetsForOB(String(value));
      } else {
        setOrder(prev => ({ ...prev, obContact: '', orderBooker: '', route: '', town: '', distributor: '', totalShops: 50, items: {}, productiveShops: 0, categoryProductiveShops: {}, zone: '', region: '', nsm: '', rsm: '', sc: '', director: '' }));
      }
    } else if (field === 'town') {
      const townDists = distributors.filter(d => d.town === value);
      let autoDist = '';
      if (townDists.length === 1) {
        autoDist = townDists[0].name;
      }
      setOrder(prev => ({ ...prev, town: String(value), distributor: autoDist }));
    } else {
      setOrder(prev => ({ ...prev, [field]: value }));
      if (field === 'date' && order.obContact) {
        const isDuplicate = await checkDuplicate(String(value), order.obContact);
        if (isDuplicate) {
          setMessage({ text: "Entry already exists for this OB on this date!", type: 'error' });
          setOrder(prev => ({ ...prev, obContact: '', orderBooker: '', route: '', town: '', distributor: '', totalShops: 50, items: {}, productiveShops: 0, categoryProductiveShops: {} }));
          setTimeout(() => setMessage(null), 3000);
        }
      }
    }
  };

  useEffect(() => {
    if (!token || token === 'null') return;
    if (order.obContact) {
      fetchTargetsForOB(order.obContact);
      fetchMTDForOB(order.obContact, order.date);
    }
  }, [order.obContact, order.date, token]);

  const handleTargetChange = async (category: string, value: number) => {
    setOrder(prev => ({
      ...prev,
      targets: { ...prev.targets, [category]: value }
    }));
    
    // Persist to database if OB is selected
    if (order.obContact) {
      try {
        await apiFetch('/api/admin/targets', {
          method: 'POST',
          body: JSON.stringify({
            obContact: order.obContact,
            brandName: category,
            targetCtn: value,
            month: new Date().toISOString().slice(0, 7)
          })
        });
      } catch (err) {
        console.error("Failed to save target:", err);
      }
    }
  };

  const calculateTotalPacks = (skuId: string) => {
    const item = order.items[skuId];
    if (!item) return 0;
    const sku = SKUS.find(s => s.id === skuId);
    if (!sku) return 0;
    return (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
  };

  const calculateTotalCartons = (skuId: string) => {
    const packs = calculateTotalPacks(skuId);
    const sku = SKUS.find(s => s.id === skuId);
    if (!sku || sku.unitsPerCarton === 0) return 0;
    return packs / sku.unitsPerCarton;
  };

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      totals[cat] = SKUS
        .filter(sku => sku.category === cat)
        .reduce((sum, sku) => sum + calculateTotalCartons(sku.id), 0);
    });
    return totals;
  }, [order.items]);

  const handleKeyDown = (e: React.KeyboardEvent, currentId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentIndex = focusableIds.indexOf(currentId);
      if (currentIndex > -1 && currentIndex < focusableIds.length - 1) {
        const nextId = focusableIds[currentIndex + 1];
        const nextInput = inputRefs.current[nextId];
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    }
  };

  const syncOfflineOrders = async () => {
    if (!navigator.onLine) return;
    try {
      const draftsStr = localStorage.getItem('offline_orders');
      if (!draftsStr) return;
      const drafts = JSON.parse(draftsStr);
      if (!Array.isArray(drafts) || drafts.length === 0) return;

      let successCount = 0;
      const remainingDrafts = [];

      for (const draft of drafts) {
        try {
          const response = await apiFetch('/api/submit', {
            method: 'POST',
            body: JSON.stringify({ data: draft })
          });
          if (response.ok) {
            successCount++;
          } else {
            remainingDrafts.push(draft);
          }
        } catch (e) {
          remainingDrafts.push(draft);
        }
      }

      if (successCount > 0) {
        localStorage.setItem('offline_orders', JSON.stringify(remainingDrafts));
        setMessage({ text: `Successfully synced ${successCount} offline order(s).`, type: 'success' });
        setTimeout(() => setMessage(null), 5000);
        syncGoogle();
        fetchHistory(true);
      }
    } catch (e) {
      console.error("Error syncing offline orders", e);
    }
  };

  useEffect(() => {
    window.addEventListener('online', syncOfflineOrders);
    if (navigator.onLine) {
      syncOfflineOrders();
    }
    return () => {
      window.removeEventListener('online', syncOfflineOrders);
    };
  }, []);

  const saveDraft = () => {
    try {
      const drafts = JSON.parse(localStorage.getItem('offline_orders') || '[]');
      drafts.push(order);
      localStorage.setItem('offline_orders', JSON.stringify(drafts));
      setMessage({ text: 'Saved as draft locally. Will sync when online.', type: 'success' });
      setOrder({
        date: getPSTDate(),
        tsm: '', town: '', distributor: '', orderBooker: '', obContact: '', route: '',
        zone: '', region: '', nsm: '', rsm: '', sc: '', director: '',
        totalShops: 50, visitedShops: 0, productiveShops: 0, categoryProductiveShops: {}, items: {}, targets: {},
        visitType: 'A'
      });
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      setMessage({ text: 'Error saving draft', type: 'error' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const submitOrder = () => {
    if (!order.route) {
      setMessage({ text: 'Select a route', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    const totalPacks = (Object.values(categoryTotals) as number[]).reduce((a, b) => a + b, 0);
    if (order.visitType !== 'Absent' && totalPacks === 0) {
      setMessage({ text: 'Order is empty', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setIsConfirming(true);
  };

  const confirmSubmit = async () => {
    // Validation: Brand-wise productive shops must be entered if sales > 0
    if (order.visitType !== 'Absent') {
      const invalidCategories = CATEGORIES.filter(cat => {
        const catTotal = categoryTotals[cat];
        const catProd = order.categoryProductiveShops[cat] || 0;
        return catTotal > 0 && catProd <= 0;
      });

      if (invalidCategories.length > 0) {
        setMessage({ 
          text: `MANDATORY: Enter productive shops for brands with sales: ${invalidCategories.join(', ')}`, 
          type: 'error' 
        });
        setTimeout(() => setMessage(null), 5000);
        setIsConfirming(false);
        return;
      }
    }

    setIsConfirming(false);
    setIsSubmitting(true);
    
    // Final duplicate check before actual submission
    if (navigator.onLine) {
      const isDuplicate = await checkDuplicate(order.date, order.obContact);
      if (isDuplicate) {
        setMessage({ text: 'An entry already exists for this Order Booker on this date.', type: 'error' });
        setIsSubmitting(false);
        setTimeout(() => setMessage(null), 5000);
        return;
      }
    }

    let currentLoc = location;
    if ("geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        currentLoc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setLocation(currentLoc);
      } catch (e) {}
    }

    if (!navigator.onLine) {
       const drafts = JSON.parse(localStorage.getItem('offline_orders') || '[]');
       drafts.push({ 
         ...order,
         latitude: currentLoc?.latitude,
         longitude: currentLoc?.longitude,
         accuracy: currentLoc?.accuracy
       });
       localStorage.setItem('offline_orders', JSON.stringify(drafts));
       setMessage({ text: 'Offline. Saved as draft. Will sync when online.', type: 'success' });
       setOrder({
         date: getPSTDate(),
         tsm: '', town: '', distributor: '', orderBooker: '', obContact: '', route: '',
         zone: '', region: '', nsm: '', rsm: '', sc: '', director: '',
         totalShops: 50, visitedShops: 0, productiveShops: 0, categoryProductiveShops: {}, items: {}, targets: {},
         visitType: 'A'
       });
       localStorage.removeItem(STORAGE_KEY);
       setIsSubmitting(false);
       setTimeout(() => setMessage(null), 3000);
       return;
    }

    try {
      const response = await apiFetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify({ 
          data: { 
            ...order,
            latitude: currentLoc?.latitude,
            longitude: currentLoc?.longitude,
            accuracy: currentLoc?.accuracy
          } 
        })
      });
      if (response.ok) {
        setLastSubmittedOrder({ ...order, order_booker: order.orderBooker });
        setMessage({ text: 'Submitted!', type: 'success' });
        // Auto-sync to Google Sheets
        syncGoogle();
        fetchHistory(true);
        if (order.obContact) {
          fetchMTDForOB(order.obContact, order.date);
        }
        setOrder({
          date: getPSTDate(),
          tsm: '', town: '', distributor: '', orderBooker: '', obContact: '', route: '',
          zone: '', region: '', nsm: '', rsm: '', sc: '', director: '',
          totalShops: 50, visitedShops: 0, productiveShops: 0, categoryProductiveShops: {}, items: {}, targets: {},
          visitType: 'A'
        });
        localStorage.removeItem(STORAGE_KEY);
      } else throw new Error('Failed to submit');
    } catch (err) {
      setMessage({ text: 'Error submitting', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const fetchHistory = async (ignoreFilters = false) => {
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (!ignoreFilters) {
        if (historyFilters.ob) params.append('ob', historyFilters.ob);
        if (historyFilters.tsm) params.append('tsm', historyFilters.tsm);
        if (historyFilters.from) params.append('from', historyFilters.from);
        if (historyFilters.to) params.append('to', historyFilters.to);
      }

      const response = await apiFetch(`/api/orders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setHistory(data.map((h: any) => ({
            ...h,
            category_productive_data: typeof h.category_productive_data === 'string' ? JSON.parse(h.category_productive_data) : (h.category_productive_data || {}),
            order_data: typeof h.order_data === 'string' ? JSON.parse(h.order_data) : (h.order_data || {})
          })).sort((a: any, b: any) => {
            // Sort by OB Name then Date
            if (a.order_booker < b.order_booker) return -1;
            if (a.order_booker > b.order_booker) return 1;
            if (a.date < b.date) return 1;
            if (a.date > b.date) return -1;
            return 0;
          }));
          setLastUpdated(new Date().toLocaleTimeString());
        } else {
          console.error("Expected array from /api/orders, got:", data);
          setHistory([]);
        }
      } else {
        const errData = await response.json();
        console.error("History fetch failed:", errData);
        setMessage({ text: 'Failed to load history', type: 'error' });
      }
    } catch (err) { console.error(err); }
    finally { setIsLoadingHistory(false); }
  };


  const calculateTimeGone = () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
    const totalWorkingDays = getWorkingDays(year, month, appConfig.holidays || '');
    const workingDaysPassed = getWorkingDays(year, month, appConfig.holidays || '', today);
    
    return {
      percentage: totalWorkingDays > 0 ? (workingDaysPassed / totalWorkingDays) * 100 : 0,
      passed: workingDaysPassed,
      total: totalWorkingDays
    };
  };

  const getTimeGone = () => calculateTimeGone().percentage;

  const updateConfig = async (key: string, value: string) => {
    let sanitizedValue = value;
    if (key === 'google_spreadsheet_id') {
      sanitizedValue = value.trim().replace(/^\/+|\/+$/g, '');
    }
    
    // Add confirmation if clearing sensitive fields
    if (['google_spreadsheet_id', 'google_service_account_email', 'google_private_key'].includes(key) && !sanitizedValue && appConfig[key]) {
      setConfirmModal({
        message: `Are you sure you want to REMOVE the ${key.replace(/_/g, ' ')}? This will break Google Sheets sync.`,
        onConfirm: async () => {
          setConfirmModal(null);
          setAppConfig(prev => ({ ...prev, [key]: sanitizedValue }));
          try {
            const res = await apiFetch('/api/admin/config', {
              method: 'POST',
              body: JSON.stringify({ key, value: sanitizedValue })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.config) {
                setAppConfig(data.config);
              }
            }
          } catch (err) {
            console.error(err);
          }
        },
        onCancel: () => setConfirmModal(null)
      });
      return;
    }

    setAppConfig(prev => ({ ...prev, [key]: sanitizedValue }));
    try {
      const res = await apiFetch('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify({ key, value: sanitizedValue })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config && key === 'google_private_key' && sanitizedValue.trim().startsWith('{')) {
          setAppConfig(data.config);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userRole === 'OB' && userContact && obAssignments.length > 0) {
      const assignment = obAssignments.find(a => a.contact === userContact);
      if (assignment && !order.obContact) {
        handleMetaChange('obContact', userContact);
      }
    }
  }, [userRole, userContact, obAssignments, order.obContact]);

  const syncEverything = async () => {
    setIsSyncingGlobal(true);
    try {
      const res = await apiFetch('/api/admin/master-sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      
      setMessage({ text: data.message, type: 'success' });
      setAppConfig(prev => ({ ...prev, last_sync_at: data.last_sync_at }));
      fetchAdminData();
      fetchHistory(true);
      fetchNationalData(); // Refresh national data after sync
    } catch (err: any) {
      setMessage({ text: 'Sync Error: ' + err.message, type: 'error' });
    } finally {
      setIsSyncingGlobal(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  useEffect(() => {
    if (!token || token === 'null') return;
    // Auto-sync on mount if config is available - FOR ALL USERS as requested
    if (appConfig.google_spreadsheet_id && !isSyncingGlobal) {
      syncEverything();
    }
  }, [appConfig.google_spreadsheet_id, token]);

  // Periodic refresh for NSM/RSM/SC/Director every 30 minutes
  useEffect(() => {
    if (!token || token === 'null') return;
    const role = (userRole || '').toUpperCase();
    if (!['NSM', 'RSM', 'SC', 'DIRECTOR', 'ADMIN', 'SUPER ADMIN'].includes(role)) return;

    // Removed auto-refresh per user request
  }, [token, userRole, appConfig.google_spreadsheet_id]);

  // Expose to window for NationalDashboard
  useEffect(() => {
    (window as any).handleMasterSync = syncEverything;
    return () => { delete (window as any).handleMasterSync; };
  }, [syncEverything]);

  useEffect(() => {
    if (!token || token === 'null') return;
    if (view === 'national' || view === 'dashboard' || view === 'reports') {
      fetchNationalData();
    }
  }, [view, token]);

  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'OB', name: '', contact: '', region: '', town: '' });

  const fetchUsers = async () => {
    if (!token || token === 'null') return;
    setIsLoadingUsers(true);
    try {
      const res = await apiFetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
    finally { setIsLoadingUsers(false); }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.name) {
      setMessage({ text: "Username and Name are required", type: 'error' });
      return;
    }
    setIsRegisteringUser(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setMessage({ text: "User registered successfully", type: 'success' });
        setNewUser({ username: '', password: '', role: 'OB', name: '', contact: '', region: '', town: '' });
        fetchUsers();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsRegisteringUser(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ text: "User deleted", type: 'success' });
        fetchUsers();
      }
    } catch (err) { console.error(err); }
    finally { setTimeout(() => setMessage(null), 3000); }
  };

  const autoGenerateUsersFromTeam = async () => {
    if (!window.confirm("This will create login accounts for all OBs and TSMs who don't have one. Default password will be '123456'. Continue?")) return;
    
    setIsLoadingAdmin(true);
    let count = 0;
    try {
      // 1. Get all unique TSMs
      const tsms = Array.from(new Set(obAssignments.map(ob => ob.tsm).filter(Boolean))) as string[];
      
      // 2. Combine with OBs
      const teamToRegister = [
        ...tsms.map(name => ({ name, contact: `TSM-${name.replace(/\s+/g, '-')}`, role: 'TSM', town: '', region: '' })),
        ...obAssignments.map(ob => ({ name: ob.name, contact: ob.contact, role: 'OB', town: ob.town, region: ob.region }))
      ];

      for (const member of teamToRegister) {
        // Check if user already exists (by contact or username)
        const exists = users.some(u => u.contact === member.contact || u.username === member.contact);
        if (!exists) {
          await apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              username: member.contact, // Use contact ID as username
              password: 'abc123', // Default password
              role: member.role,
              name: member.name,
              contact: member.contact,
              region: member.region || '',
              town: member.town || ''
            })
          });
          count++;
        }
      }
      setMessage({ text: `Successfully created ${count} user accounts!`, type: 'success' });
      fetchUsers();
    } catch (err) {
      setMessage({ text: "Failed to auto-generate users", type: 'error' });
    } finally {
      setIsLoadingAdmin(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const fetchAdminData = async () => {
    setIsLoadingAdmin(true);
    try {
      const normalizedRole = (userRole || '').toUpperCase();
      const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'SUPER ADMIN';
      const isStaff = ['ADMIN', 'SUPER ADMIN', 'TSM', 'ASM', 'RSM', 'NSM', 'DIRECTOR', 'SC', 'OB'].includes(normalizedRole);
      
      const requests = [
        apiFetch('/api/stocks'),
      ];

      if (isStaff) {
        requests.push(apiFetch('/api/admin/obs'));
        requests.push(apiFetch('/api/admin/distributors'));
        requests.push(apiFetch('/api/admin/config'));
        requests.push(apiFetch('/api/admin/hierarchy'));
      }
      
      if (isAdmin) {
        requests.push(apiFetch('/api/google/status'));
      }

      const results = await Promise.all(requests);
      
      // Map results back to states
      let nextIdx = 0;
      if (results[nextIdx]?.ok) setStockHistory(await results[nextIdx].json());
      nextIdx++;
      
      if (isStaff) {
        if (results[nextIdx]?.ok) setObAssignments(await results[nextIdx].json());
        nextIdx++;
        if (results[nextIdx]?.ok) setDistributors(await results[nextIdx].json());
        nextIdx++;
        if (results[nextIdx]?.ok) setAppConfig(await results[nextIdx].json());
        nextIdx++;
        if (results[nextIdx]?.ok) setHierarchy(await results[nextIdx].json());
        nextIdx++;
      }
      
      if (isAdmin) {
        if (results[nextIdx]?.ok) setGoogleStatus(await results[nextIdx].json());
        nextIdx++;
      }
    } catch (err) { console.error(err); }
    finally { setIsLoadingAdmin(false); }
  };

  const fetchNationalData = async () => {
    setIsLoadingNational(true);
    try {
      const res = await apiFetch(`/api/national/stats`);
      if (res.ok) {
        const data = await res.json();
        setNationalStats(data.stats || []);
        setHierarchy(data.hierarchy || []);
      }
    } catch (err) {
      console.error("Failed to fetch national data", err);
    } finally {
      setIsLoadingNational(false);
    }
  };

  const fetchTargetsForOB = async (contact: string) => {
    try {
      const currentMonth = getPSTDate().slice(0, 7);
      const res = await apiFetch(`/api/admin/targets/${contact}?month=${currentMonth}`);
      if (res.ok) {
        const targets = await res.json();
        const targetMap: Record<string, number> = {};
        targets.forEach((t: any) => { targetMap[t.brand_name] = t.target_ctn; });
        setOrder(prev => ({ ...prev, targets: targetMap }));
      }
    } catch (err) { console.error("Target Fetch Error:", err); }
  };

  const fetchMTDForOB = async (contact: string, date?: string) => {
    try {
      // Use the provided date or the current order date, fallback to today in PST
      const targetDate = date || order.date || getPSTDate();
      const monthStr = targetDate.slice(0, 7); // YYYY-MM
      
      // Fetch only relevant orders for this OB and month
      const res = await apiFetch(`/api/orders?ob_contact=${contact}&from=${monthStr}-01&to=${monthStr}-31`);
      if (res.ok) {
        const obOrders = await res.json();
        
        const mtd: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          mtd[cat] = obOrders.reduce((sum: number, o: any) => {
            const orderData = typeof o.order_data === 'string' ? JSON.parse(o.order_data) : (o.order_data || {});
            const catTotal = SKUS
              .filter(sku => sku.category === cat)
              .reduce((s, sku) => {
                const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                const ctn = Number(item.ctn || 0);
                const dzn = Number(item.dzn || 0);
                const pks = Number(item.pks || 0);
                const packs = (ctn * sku.unitsPerCarton) + (dzn * sku.unitsPerDozen) + pks;
                return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
              }, 0);
            return sum + catTotal;
          }, 0);
        });
        setMtdAchievement(mtd);
      }
    } catch (err) { console.error("MTD Fetch Error:", err); }
  };

  const fetchTargetsForOBEdit = async (contact: string, month?: string) => {
    try {
      const m = month || targetMonth || getPSTDate().slice(0, 7);
      const res = await apiFetch(`/api/admin/targets/${contact}?month=${m}`);
      if (res.ok) {
        const targets = await res.json();
        const targetMap: Record<string, number> = {};
        targets.forEach((t: any) => { targetMap[t.brand_name] = t.target_ctn; });
        setObTargetsEdit(targetMap);
      }
    } catch (err) { console.error("Target Edit Fetch Error:", err); }
  };

  const handleTargetUpdate = async (obContact: string, brandName: string, value: string) => {
    const targetCtn = parseFloat(value) || 0;
    setObTargetsEdit(prev => ({ ...prev, [brandName]: targetCtn }));
    try {
      await apiFetch('/api/admin/targets', {
        method: 'POST',
        body: JSON.stringify({ obContact, brandName, targetCtn, month: targetMonth })
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!token || token === 'null') return;
    const normalizedRole = (userRole || '').toUpperCase();
    if (['ADMIN', 'SUPER ADMIN', 'TSM', 'ASM', 'RSM', 'NSM', 'DIRECTOR', 'SC', 'OB'].includes(normalizedRole)) {
      fetchAdminData();
      if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER ADMIN') {
        fetchUsers();
      }
    }
    fetchHistory();
  }, [view, userRole, token]);

  useEffect(() => {
    if (!token || token === 'null') return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        fetchAdminData();
        setMessage({ text: 'Google Sheets Connected!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [token]);

  const connectGoogle = async () => {
    try {
      const res = await apiFetch('/api/auth/google/url');
      const { url } = await res.json();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (err) {
      setMessage({ text: 'Failed to connect Google', type: 'error' });
    }
  };

  const syncGoogle = async () => {
    setIsSyncing(true);
    try {
      const res = await apiFetch('/api/admin/master-sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Synced to Google Sheets!', type: 'success' });
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err: any) {
      setMessage({ text: 'Sync failed: ' + err.message, type: 'error' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDistributorBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage({ text: 'Parsing CSV...', type: 'info' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      error: (err) => {
        setMessage({ text: 'CSV Parse Error: ' + err.message, type: 'error' });
        setTimeout(() => setMessage(null), 3000);
      },
      complete: async (results) => {
        if (results.errors.length > 0) {
          setMessage({ text: 'CSV has errors. Check format.', type: 'error' });
          console.error("PapaParse Errors:", results.errors);
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        const dists = results.data.map((row: any) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          });

          const getVal = (possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              const normalizedKey = key.toLowerCase();
              if (normalizedRow[normalizedKey] !== undefined) return normalizedRow[normalizedKey];
            }
            return null;
          };

          return {
            name: getVal(['Name', 'name', 'Distributor', 'distributor', 'distributor name']),
            town: getVal(['Town', 'town', 'town name']),
            tsm: getVal(['TSM', 'tsm', 'asm', 'asm/tsm', 'asm / tsm']),
            zone: getVal(['Zone', 'zone']),
            region: getVal(['Region', 'region', 'territory', 'territory/region'])
          };
        }).filter((item: any) => item.name);

        if (dists.length === 0) {
          setMessage({ text: 'No valid records found in CSV', type: 'error' });
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        const clearExisting = window.confirm("Do you want to REPLACE the entire distributor list with this new file? (Click Cancel to just ADD/UPDATE without deleting others)");

        setMessage({ text: `Uploading ${dists.length} records...`, type: 'info' });

        try {
          const res = await apiFetch('/api/admin/distributors/bulk-upload', {
            method: 'POST',
            body: JSON.stringify({ distributors: dists, clearExisting })
          });
          const data = await res.json();
          if (res.ok) {
            setMessage({ text: `Successfully uploaded ${dists.length} distributors!`, type: 'success' });
            fetchAdminData();
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        } catch (err: any) {
          setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
        } finally {
          setTimeout(() => setMessage(null), 3000);
          if (e.target) e.target.value = '';
        }
      }
    });
  };

  const handleHierarchyBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage({ text: 'Parsing Hierarchy CSV...', type: 'info' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      error: (err) => {
        setMessage({ text: 'CSV Parse Error: ' + err.message, type: 'error' });
        setTimeout(() => setMessage(null), 3000);
      },
      complete: async (results) => {
        if (results.errors.length > 0) {
          setMessage({ text: 'CSV has errors. Check format.', type: 'error' });
          console.error("PapaParse Errors:", results.errors);
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        const hierarchyData = results.data.map((row: any) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          });

          const getVal = (possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              const normalizedKey = key.toLowerCase();
              if (normalizedRow[normalizedKey] !== undefined) return normalizedRow[normalizedKey];
            }
            return null;
          };

          return {
            director_sales: getVal(['Director Sales', 'director_sales', 'director']),
            nsm_name: getVal(['NSM Name', 'nsm_name', 'nsm']),
            rsm_name: getVal(['RSM Name', 'rsm_name', 'rsm']),
            sc_name: getVal(['SC Name', 'sc_name', 'sc']),
            asm_tsm_name: getVal(['ASM / TSM Name', 'asm/tsm name', 'asm_tsm_name', 'asm', 'tsm', 'asm/tsm']),
            town_name: getVal(['Town Name', 'town_name', 'town']),
            distributor_name: getVal(['Distributor Name', 'distributor_name', 'distributor']),
            distributor_code: getVal(['Distributor Code', 'distributor_code', 'code']),
            ob_name: getVal(['Order Booker Name', 'ob name', 'ob_name', 'ob']),
            ob_id: getVal(['Order Booker ID', 'ob id', 'ob_id', 'id', 'contact']),
            territory_region: getVal(['Territory / Region', 'territory/region', 'territory_region', 'territory', 'region']),
            target_ctn: parseFloat(getVal(['Target', 'target_ctn', 'target']) || '0')
          };
        }).filter((item: any) => item.ob_id && item.ob_name);

        if (hierarchyData.length === 0) {
          setMessage({ text: 'No valid records found in CSV', type: 'error' });
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        const clearExisting = window.confirm("Do you want to REPLACE the entire hierarchy with this new file?");

        setMessage({ text: `Uploading ${hierarchyData.length} hierarchy records...`, type: 'info' });

        try {
          const res = await apiFetch('/api/admin/hierarchy/bulk-upload', {
            method: 'POST',
            body: JSON.stringify({ hierarchy: hierarchyData, clearExisting })
          });
          const data = await res.json();
          if (res.ok) {
            setMessage({ text: `Successfully uploaded ${hierarchyData.length} records!`, type: 'success' });
            fetchAdminData();
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        } catch (err: any) {
          setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
        } finally {
          if (e.target) e.target.value = '';
          setTimeout(() => setMessage(null), 3000);
        }
      }
    });
  };

  const handleTargetBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const rows = results.data as any[];
          const targets: any[] = [];
          
          rows.forEach(row => {
            const contact = row['ID'] || row['id'] || row['Contact'] || row['contact'];
            if (!contact) return;
            
            CATEGORIES.forEach(cat => {
              const targetVal = row[cat] || row[`${cat} Target`] || row[cat.toLowerCase()] || row[`${cat.toLowerCase()}_target`];
              if (targetVal !== undefined && targetVal !== '') {
                targets.push({
                  ob_contact: String(contact),
                  brand_name: cat,
                  target_ctn: parseFloat(targetVal) || 0
                });
              }
            });
          });
          
          if (targets.length === 0) {
            setMessage({ text: 'No valid targets found in CSV', type: 'error' });
            return;
          }
          
          setMessage({ text: `Uploading ${targets.length} targets for ${targetMonth}...`, type: 'info' });
          try {
            const res = await apiFetch('/api/admin/targets/bulk', {
              method: 'POST',
              body: JSON.stringify({ targets, month: targetMonth })
            });
            if (res.ok) {
              setMessage({ text: `Successfully uploaded ${targets.length} targets!`, type: 'success' });
              fetchAdminData();
            } else {
              const data = await res.json();
              throw new Error(data.error || 'Upload failed');
            }
          } catch (err: any) {
            setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
          }
          if (e.target) e.target.value = '';
        }
      });
    }
  };

  const [manualTSMName, setManualTSMName] = useState('');

  const registerTSMsAsOBs = async (manualName?: string) => {
    let tsmToRegister: string[] = [];
    
    if (manualName) {
      tsmToRegister = [manualName];
    } else {
      const uniqueTSMs = Array.from(new Set(obAssignments.map(ob => ob.tsm).filter(Boolean))) as string[];
      if (uniqueTSMs.length === 0) {
        setMessage({ text: "No TSMs found in assignments", type: 'error' });
        return;
      }
      // Filter out TSMs that are already registered as OBs
      tsmToRegister = uniqueTSMs.filter(tsm => {
        const contact = `TSM-${tsm.replace(/\s+/g, '-')}`;
        return !obAssignments.some(ob => ob.contact === contact);
      });
    }

    if (tsmToRegister.length === 0) {
      setMessage({ text: "All TSMs are already registered as Order Bookers", type: 'success' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (!manualName && !window.confirm(`Register ${tsmToRegister.length} new TSMs as Order Bookers so they can enter their own reports?`)) return;

    setIsLoadingAdmin(true);
    try {
      for (const tsm of tsmToRegister) {
        const contact = `TSM-${(tsm as string).replace(/\s+/g, '-')}`;
        // Find a sample assignment for this TSM to get town/distributor
        const sample = obAssignments.find(ob => ob.tsm === tsm);
        await apiFetch('/api/admin/obs', {
          method: 'POST',
          body: JSON.stringify({
            name: `${tsm} (TSM)`,
            contact: contact,
            town: sample?.town || 'General',
            distributor: sample?.distributor || 'General',
            tsm: tsm,
            total_shops: 50,
            routes: ["TSM Route"]
          })
        });
      }
      setMessage({ text: manualName ? `${manualName} registered successfully` : "TSMs registered as OBs successfully", type: 'success' });
      setManualTSMName('');
      fetchAdminData();
    } catch (err) {
      setMessage({ text: "Failed to register TSMs", type: 'error' });
    } finally {
      setIsLoadingAdmin(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage({ text: 'Parsing CSV...', type: 'info' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      error: (err) => {
        setMessage({ text: 'CSV Parse Error: ' + err.message, type: 'error' });
        setTimeout(() => setMessage(null), 3000);
      },
      complete: async (results) => {
        if (results.errors.length > 0) {
          setMessage({ text: 'CSV has errors. Check format.', type: 'error' });
          console.error("PapaParse Errors:", results.errors);
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        const team = results.data.map((row: any) => {
          // Normalize keys to lowercase and trimmed
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          });

          const getVal = (possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              const normalizedKey = key.toLowerCase();
              if (normalizedRow[normalizedKey] !== undefined) return normalizedRow[normalizedKey];
            }
            return null;
          };

          return {
            name: getVal(['OB Name', 'Name', 'name', 'ob name', 'ob_name']),
            contact: getVal(['OB ID', 'ID', 'id', 'Contact', 'contact', 'ob id', 'ob_id']),
            town: getVal(['Town', 'town', 'town name']),
            distributor: getVal(['Distributor', 'distributor', 'distributor name']),
            tsm: getVal(['TSM', 'tsm', 'asm', 'asm/tsm', 'asm / tsm']),
            zone: getVal(['Zone', 'zone']),
            region: getVal(['Region', 'region', 'territory', 'territory/region']),
            nsm: getVal(['NSM', 'nsm', 'nsm name']),
            rsm: getVal(['RSM', 'rsm', 'rsm name']),
            sc: getVal(['SC', 'sc', 'sc name']),
            director: getVal(['Director', 'director', 'director sales']),
            total_shops: parseInt(getVal(['Total Shops', 'total_shops', 'shops']) || '50') || 50,
            routes: getVal(['Routes', 'routes']) ? getVal(['Routes', 'routes']).split(",").map((r: string) => r.trim()).filter((r: string) => r) : [],
            targets: {
              "Kite Glow": parseFloat(getVal(['Kite Glow Target', 'kite_glow_target', 'kite glow', 'kite target'])) || 0,
              "Burq Action": parseFloat(getVal(['Burq Action Target', 'burq_action_target', 'burq action', 'burq target'])) || 0,
              "Vero": parseFloat(getVal(['Vero Target', 'vero_target', 'vero', 'vero target'])) || 0,
              "DWB": parseFloat(getVal(['DWB Target', 'dwb_target', 'dwb', 'dwb target'])) || 0,
              "Match": parseFloat(getVal(['Match Target', 'match_target', 'match', 'match target'])) || 0
            }
          };
        }).filter((item: any) => (item.name && item.contact) || item.distributor);

        if (team.length === 0) {
          setMessage({ text: 'No valid records found in CSV', type: 'error' });
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        const clearExisting = window.confirm("Do you want to REPLACE the entire team list with this new file? (Click Cancel to just ADD/UPDATE without deleting others)");

        setMessage({ text: `Uploading ${team.length} records...`, type: 'info' });

        try {
          const res = await apiFetch('/api/admin/bulk-upload', {
            method: 'POST',
            body: JSON.stringify({ team, clearExisting })
          });
          const data = await res.json();
          if (res.ok) {
            setMessage({ text: `Successfully uploaded ${team.length} team members!`, type: 'success' });
            fetchAdminData();
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        } catch (err: any) {
          setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
        } finally {
          setTimeout(() => setMessage(null), 3000);
          // Reset file input
          e.target.value = '';
        }
      }
    });
  };


  const timeGone = calculateTimeGone();

  const tsmList = useMemo(() => {
    const tsms = new Set<string>(['Muhammad Shoaib', 'Waheed Jamal', 'Ikramullah', 'Muhammad Zeeshan', 'Noman Paracha', 'Muhammad Yousaf', 'Qaisar Yousaf']);
    obAssignments.forEach(ob => { if (ob.tsm) tsms.add(ob.tsm.trim()); });
    distributors.forEach(d => { if (d.tsm) tsms.add(d.tsm.trim()); });
    
    const allTsms = Array.from(tsms).sort();
    
    if (userRole === 'Admin' || userRole === 'Super Admin') {
      return allTsms;
    }
    if (userRole === 'Director') {
      return allTsms.filter(tsm => obAssignments.some(ob => (ob.tsm || '').trim().toLowerCase() === tsm.toLowerCase() && (ob.director || '').trim().toLowerCase() === (userName || '').trim().toLowerCase()));
    }
    if (userRole === 'NSM') {
      return allTsms.filter(tsm => obAssignments.some(ob => (ob.tsm || '').trim().toLowerCase() === tsm.toLowerCase() && (ob.nsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase()));
    }
    if (userRole === 'RSM' || userRole === 'SC') {
      return allTsms.filter(tsm => obAssignments.some(ob => (ob.tsm || '').trim().toLowerCase() === tsm.toLowerCase() && ((ob.region || '').trim().toLowerCase() === (userRegion || '').trim().toLowerCase() || (ob.rsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase() || (ob.sc || '').trim().toLowerCase() === (userName || '').trim().toLowerCase())));
    }
    if ((userRole === 'TSM' || userRole === 'ASM')) {
      const trimmedName = (userName || '').trim().toLowerCase();
      return allTsms.filter(tsm => {
        const tsmLower = tsm.toLowerCase();
        return tsmLower === trimmedName || tsmLower.includes(trimmedName) || trimmedName.includes(tsmLower);
      });
    }
    return [];
  }, [obAssignments, distributors, userRole, userRegion, userName]);

  const entryRegions = useMemo(() => {
    const regions = new Set<string>();
    obAssignments.forEach(ob => { if (ob.region) regions.add(ob.region.trim()); });
    distributors.forEach(d => { if (d.region) regions.add(d.region.trim()); });
    return Array.from(regions).sort();
  }, [obAssignments, distributors]);

  const filteredEntryTSMList = useMemo(() => {
    if (!selectedEntryRegion) return tsmList;
    const tsmsInRegion = new Set<string>();
    obAssignments.forEach(ob => { if (ob.region === selectedEntryRegion && ob.tsm) tsmsInRegion.add(ob.tsm.trim()); });
    distributors.forEach(d => { if (d.region === selectedEntryRegion && d.tsm) tsmsInRegion.add(d.tsm.trim()); });
    return tsmList.filter(tsm => tsmsInRegion.has(tsm));
  }, [tsmList, selectedEntryRegion, obAssignments, distributors]);

  const filteredOBs = useMemo(() => {
    let obs = [...obAssignments];
    
    if (userRole === 'Director') {
      obs = obs.filter(ob => (ob.director || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    } else if (userRole === 'NSM') {
      obs = obs.filter(ob => (ob.nsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    } else if (userRole === 'RSM' || userRole === 'SC') {
      obs = obs.filter(ob => (ob.region || '').trim().toLowerCase() === (userRegion || '').trim().toLowerCase() || (ob.rsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase() || (ob.sc || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    } else if ((userRole === 'TSM' || userRole === 'ASM')) {
      const trimmedName = (userName || '').trim().toLowerCase();
      obs = obs.filter(ob => {
        const tsmName = (ob.tsm || '').trim().toLowerCase();
        return tsmName === trimmedName || tsmName.includes(trimmedName) || trimmedName.includes(tsmName);
      });
    } else if (userRole === 'OB') {
      obs = obs.filter(ob => (ob.contact || '').trim() === (userContact || '').trim());
    }

    if (selectedTSM) {
      const trimmedSelected = selectedTSM.trim().toLowerCase();
      obs = obs.filter(ob => {
        const tsmName = (ob.tsm || '').trim().toLowerCase();
        return tsmName === trimmedSelected || tsmName.includes(trimmedSelected) || trimmedSelected.includes(tsmName);
      });
      // Add TSM themselves as an option
      obs.unshift({
        name: `*TSM - ${selectedTSM}`,
        contact: `TSM-${selectedTSM.replace(/\s+/g, '-')}`,
        town: distributors.find(d => (d.tsm || '').trim().toLowerCase() === selectedTSM.trim().toLowerCase())?.town || '',
        distributor: distributors.find(d => (d.tsm || '').trim().toLowerCase() === selectedTSM.trim().toLowerCase())?.name || '',
        routes: ['TSM Route'],
        tsm: selectedTSM,
        total_shops: 50
      });
    }
    return obs;
  }, [obAssignments, selectedTSM, distributors, userRole, userRegion, userName, userContact]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, any[]> = {};
    history.forEach(h => {
      const ob = h.order_booker || 'Unknown';
      if (!groups[ob]) groups[ob] = [];
      groups[ob].push(h);
    });
    return Object.keys(groups).sort().map(ob => ({
      obName: ob,
      entries: groups[ob].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }));
  }, [history]);

  const resetDatabase = async () => {
    if (window.confirm("WARNING: This will delete ALL history (submitted orders and drafts). Continue?")) {
      try {
        const res = await apiFetch('/api/admin/reset', { method: 'POST' });
        if (res.ok) {
          setMessage({ text: 'History Cleared', type: 'success' });
          fetchHistory();
        }
      } catch (e) { setMessage({ text: 'Reset Failed', type: 'error' }); }
      finally { setTimeout(() => setMessage(null), 3000); }
    }
  };

  const reseedTeam = async () => {
    if (window.confirm("This will replace all current OB assignments with the new team structure. Continue?")) {
      try {
        const res = await apiFetch('/api/admin/reseed', { method: 'POST' });
        if (res.ok) {
          setMessage({ text: 'Team Re-seeded!', type: 'success' });
          fetchAdminData();
        }
      } catch (e) { setMessage({ text: 'Reseed Failed', type: 'error' }); }
      finally { setTimeout(() => setMessage(null), 3000); }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAppLogo(base64String);
        try {
          localStorage.setItem(LOGO_STORAGE_KEY, base64String);
        } catch (e) {
          console.error("Error saving logo to localStorage", e);
        }
        setMessage({ text: 'Logo Updated!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  

  if (!token || token === 'null') {
    return <Login onLogin={handleLogin} />;
  }

  if (view === 'dashboard') {
    try {
      if (isLoadingHistory || isLoadingAdmin) {
        return (
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-seablue animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Dashboard...</p>
                <button onClick={() => { fetchHistory(true); fetchAdminData(); }} className="text-[10px] font-bold text-seablue underline">Retry</button>
              </div>
            </div>
          </div>
        );
      }

      // If management role, show NationalDashboard (Management Dashboard)
      if (['SUPER ADMIN', 'ADMIN', 'RSM', 'NSM', 'DIRECTOR', 'SC', 'TSM', 'ASM', 'ASM'].includes((userRole || '').toUpperCase())) {
        return (
          <div className="min-h-screen bg-slate-50 pb-40">
            <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
            {isLoadingNational ? (
              <div className="flex-1 flex items-center justify-center min-h-[80vh]">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-seablue animate-spin" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Dashboard...</p>
                </div>
              </div>
            ) : (
              (userRole === 'TSM' || userRole === 'ASM') ? (
                <TSMDashboard
                  stats={nationalStats}
                  hierarchy={hierarchy}
                  isSyncing={isSyncingGlobal}
                  onRefresh={syncEverything}
                  userName={userName}
                  holidays={appConfig.holidays || ''}
                />
              ) : (
                <NationalDashboard 
                  stats={nationalStats} 
                  hierarchy={hierarchy} 
                  categories={CATEGORIES} 
                  skus={SKUS}
                  isSyncing={isSyncingGlobal}
                  onRefresh={syncEverything}
                  userRole={userRole}
                  userRegion={userRegion}
                  userName={userName}
                  userContact={userContact}
                  timeGone={timeGone.percentage}
                  holidays={appConfig.holidays || ''}
                />
              )
            )}
          </div>
        );
      }

      const today = new Date().toISOString().split('T')[0];
      const currentMonth = today.slice(0, 7);
      
      // Role-based data filtering for TSM/OB
      const filteredHistory = history.filter(h => {
        if ((userRole === 'TSM' || userRole === 'ASM')) return h.tsm === userName;
        if (userRole === 'OB') return h.ob_contact === userContact;
        return false;
      });

      const filteredOBAssignments = obAssignments.filter(ob => {
        if ((userRole === 'TSM' || userRole === 'ASM')) return ob.tsm === userName;
        if (userRole === 'OB') return ob.contact === userContact;
        return false;
      });

      const todayOrders = filteredHistory.filter(h => h.date && typeof h.date === 'string' && h.date === today);
      const mtdOrders = filteredHistory.filter(h => h.date && typeof h.date === 'string' && h.date.startsWith(currentMonth));
      
      const calculateCatTotals = (orders: any[]) => {
        const totals: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          totals[cat] = orders.reduce((sum, h) => {
            const items = h.order_data || {};
            const catAch = SKUS
              .filter(sku => sku.category === cat)
              .reduce((s, sku) => {
                const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
              }, 0);
            return sum + catAch;
          }, 0);
        });
        return totals;
      };

      const globalToday = calculateCatTotals(todayOrders);
      const globalMtd = calculateCatTotals(mtdOrders);
      const globalTargets = (() => {
        const totals: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          totals[cat] = filteredOBAssignments.reduce((sum, ob) => sum + (ob.targets?.[cat] || 0), 0);
        });
        return totals;
      })();

      const chartData = CATEGORIES.map(cat => ({
        name: cat,
        Target: globalTargets[cat] || 0,
        Achievement: globalToday[cat] || 0,
        MTD: globalMtd[cat] || 0,
        AchPercent: globalTargets[cat] > 0 ? ((globalMtd[cat] / globalTargets[cat]) * 100).toFixed(1) : 0
      }));

      // TSM Sales Analysis
      const tsmAnalysis = tsmList.map(tsmName => {
        const tsmOrders = mtdOrders.filter(h => h.tsm === tsmName);
        const totals: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          totals[cat] = tsmOrders.reduce((sum, h) => {
            const items = h.order_data || {};
            const catAch = SKUS
              .filter(sku => sku.category === cat)
              .reduce((s, sku) => {
                const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
              }, 0);
            return sum + catAch;
          }, 0);
        });
        
        const totalAch = Object.values(totals).reduce((a: number, b: number) => a + b, 0);
        const tsmOBs = obAssignments.filter(ob => ob.tsm === tsmName);
        const totalTarget = tsmOBs.reduce((sum, ob) => {
          return sum + Object.values(ob.targets || {}).reduce((a: number, b: number) => a + b, 0);
        }, 0);

        return {
          name: tsmName,
          totals,
          totalAch,
          target: totalTarget,
          obCount: tsmOBs.length,
          avgSalesPerOB: tsmOBs.length > 0 ? totalAch / tsmOBs.length : 0
        };
      }).sort((a, b) => b.totalAch - a.totalAch);

      // OB Sales Analysis
      const obAnalysis = filteredOBAssignments.map(ob => {
        const obOrders = mtdOrders.filter(h => h.ob_contact === ob.contact);
        const totals: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          totals[cat] = obOrders.reduce((sum, h) => {
            const items = h.order_data || {};
            const catAch = SKUS
              .filter(sku => sku.category === cat)
              .reduce((s, sku) => {
                const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
              }, 0);
            return sum + catAch;
          }, 0);
        });
        
        const totalVisited = obOrders.reduce((sum, h) => sum + (h.visited_shops || 0), 0);
        const totalProductive = obOrders.reduce((sum, h) => sum + (h.productive_shops || 0), 0);
        const totalShops = obOrders.length * 50;

        const lastEntry = obOrders.length > 0 ? obOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : '-';
        const entryDays = obOrders.length;
        const totalWorkingDays = timeGone.passed;
        const consistencyScore = totalWorkingDays > 0 ? (entryDays / totalWorkingDays) * 100 : 0;

        return {
          name: ob.name,
          contact: ob.contact,
          totals,
          totalAch: Object.values(totals).reduce((a: number, b: number) => a + b, 0),
          target: Object.values(ob.targets || {}).reduce((a: number, b: number) => a + b, 0),
          shops: { t: totalShops, v: totalVisited, p: totalProductive },
          lastEntry,
          entryDays,
          consistencyScore
        };
      }).sort((a, b) => b.totalAch - a.totalAch);

      // Route Sales Analysis
      const routeAnalysis = mtdOrders.reduce((acc: any[], h) => {
        if ((userRole === 'TSM' || userRole === 'ASM') && h.tsm !== userName) return acc;
        if (userRole === 'OB' && h.ob_contact !== userContact) return acc;
        const route = h.route || 'Unknown';
        let routeData = acc.find(r => r.name === route);
        if (!routeData) {
          routeData = { name: route, obName: h.order_booker, ach: 0, shops: { t: 0, v: 0, p: 0 } };
          acc.push(routeData);
        }
        const items = h.order_data || {};
        const orderAch = SKUS.reduce((sum, sku) => {
          const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
          return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
        }, 0);
        routeData.ach += orderAch;
        routeData.shops.t += (h.total_shops || 0);
        routeData.shops.v += (h.visited_shops || 0);
        routeData.shops.p += (h.productive_shops || 0);
        const productiveRatio = routeData.shops.v > 0 ? (routeData.shops.p / routeData.shops.v) * 100 : 0;
        const visitCoverage = routeData.shops.t > 0 ? (routeData.shops.v / routeData.shops.t) * 100 : 0;
        const salesPerf = Math.min(100, (routeData.ach / 10) * 100); // Dummy target 10
        
        const score = (0.5 * salesPerf) + (0.3 * visitCoverage) + (0.2 * productiveRatio);
        let scoreLabel = 'Weak';
        if (score >= 90) scoreLabel = 'Excellent';
        else if (score >= 70) scoreLabel = 'Good';
        else if (score >= 50) scoreLabel = 'Average';
        
        routeData.score = score;
        routeData.scoreLabel = scoreLabel;

        return acc;
      }, []).sort((a, b) => b.ach - a.ach);

      const routeWeakness = Array.from(new Set(mtdOrders.map(o => o.route))).map(routeName => {
        const routeOrders = mtdOrders.filter(o => o.route === routeName).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
        const sales = routeOrders.map(o => {
          const items = o.order_data || {};
          return SKUS.reduce((sum, sku) => {
            const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
            const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
            return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
          }, 0);
        });
        
        const recent = sales.slice(0, 4).reduce((a, b) => a + b, 0);
        const older = sales.slice(4, 8).reduce((a, b) => a + b, 0);
        const isDeclining = sales.length >= 4 && recent < older;
        
        return {
          name: routeName,
          obName: routeOrders[0]?.order_booker,
          sales,
          isDeclining,
          recentAch: recent
        };
      }).filter(r => r.isDeclining).sort((a, b) => a.recentAch - b.recentAch);

      const obRanking = [...obAnalysis].sort((a, b) => b.totalAch - a.totalAch);
      const bottom10OBs = [...obRanking].reverse().slice(0, 10);
      const underperformingRoutes = routeAnalysis.filter(r => r.shops.v > 0 && (r.shops.p / r.shops.v) < 0.6);
      const weakBrands = CATEGORIES.filter(cat => {
        const ach = globalMtd[cat] || 0;
        const tgt = globalTargets[cat] || 0;
        return tgt > 0 && (ach / tgt) < (timeGone.percentage / 100) * 0.7;
      });

      const zeroVisitRoutes = routeAnalysis.filter(r => r.shops.t > 0 && r.shops.v === 0).sort((a, b) => b.shops.t - a.shops.t);
      const highVisitLowSales = routeAnalysis.filter(r => r.shops.v > 10 && r.ach < 2);
      const highProdLowSales = routeAnalysis.filter(r => r.shops.p > 5 && r.ach < 1);

    return (
      <div className="min-h-screen bg-slate-50 pb-10">
        <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
        <header className="bg-white border-b border-slate-200 p-4 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-seablue leading-tight">Dashboard</h1>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black bg-seablue/10 text-seablue px-1.5 py-0.5 rounded uppercase tracking-widest">{userRole}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{userName}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { fetchHistory(true); fetchAdminData(); }}
                className="p-2 hover:bg-slate-100 rounded-full text-seablue transition-colors"
                title="Refresh Stats"
              >
                <RefreshCw className={`w-5 h-5 ${(isLoadingHistory || isLoadingAdmin) ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => {
                  const summary = `*Global Sales Dashboard - ${today}*\n` +
                    `------------------\n` +
                    chartData.map(d => `*${d.name}:*\n  Ach: ${d.Achievement.toFixed(2)}\n  MTD: ${d.MTD.toFixed(2)}\n  Tgt: ${d.Target.toFixed(2)}`).join('\n') +
                    `\n------------------\n` +
                    `*Total Today:* ${(Object.values(globalToday) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(2)}\n` +
                    `*Total MTD:* ${(Object.values(globalMtd) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(2)}\n` +
                    `*Total Target:* ${(Object.values(globalTargets) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(2)}`;
                  
                  const encodedMsg = encodeURIComponent(summary);
                  window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
                }}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                title="Share Global Summary"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {history.length === 0 ? (
            <div className="card-clean p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-700">No Sales Data Yet</h3>
                <p className="text-sm text-slate-400">Submit some reports to see your performance stats here.</p>
              </div>
              <button onClick={() => setView('entry')} className="btn-seablue px-6 py-2">Go to Entry</button>
            </div>
          ) : (
            <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card-clean p-4 bg-seablue text-white shadow-blue-200 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-white/60">Today Sales</div>
              <div className="text-2xl font-black">{(Object.values(globalToday) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(1)}</div>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="text-[7px] font-bold text-white/80 uppercase">
                    {cat}: {globalToday[cat].toFixed(1)}
                  </div>
                ))}
              </div>
            </div>
            <div className="card-clean p-4 bg-emerald-600 text-white shadow-emerald-200 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-white/60">MTD Sales</div>
              <div className="text-2xl font-black">{(Object.values(globalMtd) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(1)}</div>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="text-[7px] font-bold text-white/80 uppercase">
                    {cat}: {globalMtd[cat].toFixed(1)}
                  </div>
                ))}
              </div>
            </div>
            <div className="card-clean p-4 bg-white border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400">Time Gone</div>
              <div className="text-2xl font-black text-amber-500">{timeGone.percentage.toFixed(0)}%</div>
              <div className="text-[8px] font-bold mt-1 text-slate-400 uppercase">{timeGone.passed}/{timeGone.total} Working Days</div>
            </div>
            <div className="card-clean p-4 bg-white border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400">Overall Ach %</div>
              <div className="text-2xl font-black text-emerald-600">
                {(() => {
                  const ach = (Object.values(globalMtd) as number[]).reduce((a: number, b: number) => a + b, 0);
                  const tgt = filteredOBAssignments.reduce((sum, ob) => sum + Object.values(ob.targets || {}).reduce((a: number, b: number) => a + b, 0), 0);
                  return tgt > 0 ? ((ach / tgt) * 100).toFixed(0) : 0;
                })()}%
              </div>
              <div className="text-[8px] font-bold mt-1 text-slate-400 uppercase">vs {(userRole === 'Admin' || userRole === 'Super Admin') ? 'National' : 'My Team'} Target</div>
            </div>
          </div>

          {/* Route Weakness Detection - TOP in Stats */}
          <div className="card-clean p-4">
            <h3 className="text-sm font-bold mb-4 text-rose-600 uppercase tracking-widest">Route Weakness Detection (Declining Trend - Last 8 Visits)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase">
                    <th className="py-2">Route</th>
                    <th className="py-2">OB Name</th>
                    <th className="py-2 text-center">Last 8 Sales</th>
                    <th className="py-2 text-right">Recent Ach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {routeWeakness.map(route => (
                    <tr key={route.name} className="hover:bg-rose-50/50">
                      <td className="py-2 font-bold text-slate-700">{route.name}</td>
                      <td className="py-2 text-slate-500">{route.obName}</td>
                      <td className="py-2 text-center">
                        <div className="flex justify-center gap-1">
                          {route.sales.map((s, i) => (
                            <div key={i} className={`w-2 h-4 rounded-sm ${s > 0 ? 'bg-rose-400' : 'bg-slate-200'}`} title={`Sale: ${s.toFixed(1)}`}></div>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 text-right font-black text-rose-600">{route.recentAch.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-clean p-4 md:col-span-2 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-seablue uppercase tracking-widest">{(userRole === 'Admin' || userRole === 'Super Admin') ? 'National' : 'My Team'} OB Performance (MTD)</h3>
                <span className="text-[10px] font-bold bg-seablue/10 text-seablue px-2 py-0.5 rounded-full">{obAnalysis.length} OBs</span>
              </div>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase sticky left-0 bg-slate-50 z-10">OB Name</th>
                      <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase">Town</th>
                      {CATEGORIES.map(cat => (
                        <th key={cat} className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase text-center border-l border-slate-100">
                          <div className="text-seablue">{cat}</div>
                          <div className="flex justify-between gap-2 mt-1 px-1">
                            <span>Tgt</span>
                            <span>Ach</span>
                            <span>%</span>
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase text-right border-l border-slate-100">Total %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {obAnalysis.map(ob => {
                      const assignment = filteredOBAssignments.find(a => a.contact === ob.contact);
                      return (
                        <tr key={ob.contact} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-2 text-[10px] font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{ob.name}</td>
                          <td className="px-3 py-2 text-[9px] text-slate-500 font-medium">{assignment?.town}</td>
                          {CATEGORIES.map(cat => {
                            const tgt = assignment?.targets?.[cat] || 0;
                            const ach = ob.totals[cat] || 0;
                            const perc = tgt > 0 ? (ach / tgt) * 100 : 0;
                            return (
                              <td key={cat} className="px-1 py-2 text-[9px] font-bold text-center border-l border-slate-100">
                                <div className="flex justify-between gap-2 px-1">
                                  <span className="text-slate-400">{tgt.toFixed(1)}</span>
                                  <span className="text-slate-700">{ach.toFixed(1)}</span>
                                  <span className={perc >= timeGone.percentage ? 'text-emerald-600' : 'text-amber-600'}>{perc.toFixed(0)}%</span>
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-[10px] font-black text-right border-l border-slate-100">
                            <span className={ob.target > 0 && (ob.totalAch / ob.target * 100) >= timeGone.percentage ? 'text-emerald-600' : 'text-amber-600'}>
                              {ob.target > 0 ? ((ob.totalAch / ob.target) * 100).toFixed(0) : 0}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-clean p-4">
              <h3 className="text-sm font-bold mb-4 text-seablue uppercase tracking-widest">{(userRole === 'Admin' || userRole === 'Super Admin') ? 'National' : 'My Team'} OB Submission Status</h3>
              <div className="space-y-3">
                {filteredOBAssignments.map(ob => {
                  const obOrders = mtdOrders.filter(o => o.ob_contact === ob.contact);
                  const lastOrder = [...obOrders].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
                  const totalWorkingDays = Number(appConfig.total_working_days || 25);
                  const entryDays = new Set(obOrders.map(o => o.date)).size;
                  const isLate = lastOrder ? (new Date().getTime() - new Date(lastOrder.date).getTime()) > (2 * 24 * 60 * 60 * 1000) : true;

                  return (
                    <div key={ob.contact} className={`flex justify-between items-center p-2 rounded-lg border ${isLate ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div>
                        <div className="text-[10px] font-bold text-slate-700">{ob.name}</div>
                        <div className="text-[8px] text-slate-400">Last: {lastOrder?.date || 'No Entry'} • {lastOrder?.route || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[10px] font-black ${entryDays >= timeGone.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {entryDays} / {totalWorkingDays} Days
                        </div>
                        <div className="text-[7px] text-slate-400 uppercase font-bold">
                          {isLate ? 'Missing > 2 Days' : 'Active'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Brand Target vs Achievement (MTD) - Added here as requested */}
          <div className="card-clean p-4">
            <h3 className="text-sm font-bold mb-4 text-seablue uppercase tracking-widest">Brand Target vs Achievement (MTD)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase">
                    <th className="py-2">Brand Name</th>
                    <th className="py-2 text-right">Target (Ctn)</th>
                    <th className="py-2 text-right">Ach (Ctn)</th>
                    <th className="py-2 text-right">Ach %</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {chartData.map(d => (
                    <tr key={d.name} className="hover:bg-slate-50">
                      <td className="py-2 font-bold text-slate-700">{d.name}</td>
                      <td className="py-2 text-right font-mono">{d.Target.toFixed(1)}</td>
                      <td className="py-2 text-right font-mono font-bold text-seablue">{d.MTD.toFixed(1)}</td>
                      <td className={`py-2 text-right font-black ${Number(d.AchPercent) >= timeGone.percentage ? 'text-emerald-600' : 'text-amber-600'}`}>{d.AchPercent}%</td>
                      <td className="py-2 text-right">
                        <span className={`px-1.5 py-0.5 rounded-full font-bold text-[8px] uppercase ${Number(d.AchPercent) >= timeGone.percentage ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {Number(d.AchPercent) >= timeGone.percentage ? 'On Track' : 'Behind'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-clean p-4">
              <h3 className="text-sm font-bold mb-4 text-seablue uppercase">Brand Wise Achievement Chart</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    <Bar dataKey="Target" name="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="MTD" name="MTD Ach" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-clean p-4">
              <h3 className="text-sm font-bold mb-4 text-seablue uppercase">Brand Performance %</h3>
              <div className="space-y-4">
                {chartData.map(d => (
                  <div key={d.name} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-600">{d.name}</span>
                      <span className={Number(d.AchPercent) >= timeGone.percentage ? 'text-emerald-600' : 'text-amber-600'}>
                        {d.AchPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${Number(d.AchPercent) >= timeGone.percentage ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(Number(d.AchPercent), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TSM Activity Report - Added here as requested */}
          <div className="card-clean p-4">
            <h3 className="text-sm font-bold mb-4 text-seablue uppercase tracking-widest">TSM Activity Report</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase">
                    <th className="py-2">TSM Name</th>
                    <th className="py-2 text-center">Total OBs</th>
                    <th className="py-2 text-center">Active OBs</th>
                    <th className="py-2 text-center">T/V/P</th>
                    <th className="py-2 text-right">Achievement</th>
                    <th className="py-2 text-right">Target</th>
                    <th className="py-2 text-right">Ach %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tsmList.map(tsm => {
                    const tsmOBs = obAssignments.filter(ob => ob.tsm === tsm);
                    const tsmOrders = mtdOrders.filter(o => tsmOBs.some(ob => ob.contact === o.ob_contact));
                    const activeOBs = new Set(tsmOrders.map(o => o.ob_contact)).size;
                    const totalVisited = tsmOrders.reduce((sum, o) => sum + (o.visited_shops || 0), 0);
                    const totalProductive = tsmOrders.reduce((sum, o) => sum + (o.productive_shops || 0), 0);
                    const totalShops = tsmOrders.length * 50;
                    const tsmAch = tsmOrders.reduce((sum, o) => {
                      const orderData = typeof o.order_data === 'string' ? JSON.parse(o.order_data) : (o.order_data || {});
                      const ach = calculateAchievement(orderData);
                      return sum + Object.values(ach).reduce((a: number, b: number) => a + b, 0);
                    }, 0);
                    const tsmTarget = tsmOBs.reduce((sum, ob) => sum + Object.values(ob.targets || {}).reduce((a: number, b: number) => a + b, 0), 0);
                    const achPerc = tsmTarget > 0 ? (tsmAch / tsmTarget) * 100 : 0;

                    return (
                      <tr key={tsm} className="hover:bg-slate-50">
                        <td className="py-2 font-bold text-slate-700">{tsm}</td>
                        <td className="py-2 text-center">{tsmOBs.length}</td>
                        <td className="py-2 text-center">{activeOBs}</td>
                        <td className="py-2 text-center text-slate-500">{totalShops}/{totalVisited}/{totalProductive}</td>
                        <td className="py-2 text-right font-mono font-bold text-seablue">{tsmAch.toFixed(1)}</td>
                        <td className="py-2 text-right font-mono text-slate-400">{tsmTarget.toFixed(1)}</td>
                        <td className={`py-2 text-right font-black ${achPerc >= timeGone.percentage ? 'text-emerald-600' : 'text-amber-600'}`}>{achPerc.toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-clean p-4">
            <h3 className="text-sm font-bold mb-4 text-seablue uppercase tracking-widest">Route-to-Route Analysis (MTD)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase">
                    <th className="py-2">Route Name</th>
                    <th className="py-2">OB Name</th>
                    <th className="py-2 text-center">T/V/P</th>
                    {CATEGORIES.map(cat => <th key={cat} className="py-2 text-center">{cat}</th>)}
                    <th className="py-2 text-right">Achievement</th>
                    <th className="py-2 text-right">Efficiency</th>
                    <th className="py-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {routeAnalysis.map(route => (
                    <tr key={route.name} className="hover:bg-slate-50">
                      <td className="py-2 font-bold text-slate-700">{route.name}</td>
                      <td className="py-2 text-slate-500">{route.obName}</td>
                      <td className="py-2 text-center text-slate-500">{route.shops.t}/{route.shops.v}/{route.shops.p}</td>
                      {CATEGORIES.map(cat => (
                        <td key={cat} className="py-2 text-center font-mono">{route.totals[cat].toFixed(1)}</td>
                      ))}
                      <td className="py-2 text-right font-mono font-bold text-seablue">{route.ach.toFixed(1)}</td>
                      <td className="py-2 text-right">
                        <span className={`px-1.5 py-0.5 rounded-full font-bold ${route.shops.v > 0 && (route.shops.p / route.shops.v) > 0.7 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {route.shops.v > 0 ? ((route.shops.p / route.shops.v) * 100).toFixed(0) : 0}%
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <span className={`px-1.5 py-0.5 rounded-full font-bold text-[8px] uppercase ${
                          route.scoreLabel === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                          route.scoreLabel === 'Good' ? 'bg-blue-100 text-blue-700' :
                          route.scoreLabel === 'Average' ? 'bg-orange-100 text-orange-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {route.scoreLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {routeAnalysis.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">No route data available for this month</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-clean p-4 md:col-span-2">
              <h3 className="text-sm font-bold mb-4 text-seablue uppercase tracking-widest">OB Ranking (Brand Wise)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase">
                      <th className="py-2">OB Name</th>
                      {CATEGORIES.map(cat => <th key={cat} className="py-2 text-center">{cat}</th>)}
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {obRanking.slice(0, 50).map((ob, idx) => (
                      <tr key={ob.contact} className="hover:bg-slate-50">
                        <td className="py-2 font-bold text-slate-700">
                          <span className="text-slate-300 mr-1">{idx + 1}.</span>
                          {ob.name} <span className="text-[8px] text-slate-400">({ob.contact})</span>
                        </td>
                        {CATEGORIES.map(cat => (
                          <td key={cat} className="py-2 text-center font-mono">{ob.totals[cat].toFixed(1)}</td>
                        ))}
                        <td className="py-2 text-right font-black text-seablue">{ob.totalAch.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-clean p-4 md:col-span-2">
              <h3 className="text-sm font-bold mb-4 text-rose-600 uppercase">Bottom 50 OBs (Risk Analysis)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase">
                      <th className="py-2">OB Name</th>
                      <th className="py-2">TSM</th>
                      <th className="py-2 text-right">Ach %</th>
                      <th className="py-2 text-right">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...obRanking].reverse().slice(0, 50).map((ob, idx) => {
                      const assignment = obAssignments.find(a => a.contact === ob.contact);
                      const achPerc = ob.target > 0 ? (ob.totalAch / ob.target) * 100 : 0;
                      return (
                        <tr key={ob.contact} className="hover:bg-rose-50/30">
                          <td className="py-2 font-bold text-slate-700">
                            <span className="text-slate-300 mr-1">{obRanking.length - idx}.</span>
                            {ob.name} <span className="text-[8px] text-slate-400">({ob.contact})</span>
                          </td>
                          <td className="py-2 text-slate-500">{assignment?.tsm}</td>
                          <td className={`py-2 text-right font-bold ${achPerc < timeGone.percentage ? 'text-rose-600' : 'text-amber-600'}`}>
                            {achPerc.toFixed(0)}%
                          </td>
                          <td className="py-2 text-right font-black text-rose-600">{ob.totalAch.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-clean p-4 md:col-span-2">
              <h3 className="text-sm font-bold mb-4 text-rose-600 uppercase">Critical Alerts (Routes)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {zeroVisitRoutes.slice(0, 4).map(route => (
                  <div key={route.name} className="p-3 border border-red-100 bg-red-50/30 rounded-xl space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] font-black text-slate-700 uppercase">{route.name}</div>
                      <div className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[7px] font-bold uppercase">Zero Visits</div>
                    </div>
                    <div className="text-[9px] text-slate-500">Total Shops: <span className="font-bold">{route.shops.t}</span></div>
                  </div>
                ))}
                {highVisitLowSales.slice(0, 4).map(route => (
                  <div key={route.name} className="p-3 border border-amber-100 bg-amber-50/30 rounded-xl space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] font-black text-slate-700 uppercase">{route.name}</div>
                      <div className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[7px] font-bold uppercase">High Visit Low Sale</div>
                    </div>
                    <div className="text-[9px] text-slate-500">Visits: <span className="font-bold">{route.shops.v}</span> | Ach: <span className="font-bold">{route.ach.toFixed(1)}</span></div>
                  </div>
                ))}
                {highProdLowSales.slice(0, 4).map(route => (
                  <div key={route.name} className="p-3 border border-orange-100 bg-orange-50/30 rounded-xl space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] font-black text-slate-700 uppercase">{route.name}</div>
                      <div className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[7px] font-bold uppercase">High Prod Low Sale</div>
                    </div>
                    <div className="text-[9px] text-slate-500">Prod: <span className="font-bold">{route.shops.p}</span> | Ach: <span className="font-bold">{route.ach.toFixed(1)}</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-clean p-4 md:col-span-2">
              <h3 className="text-sm font-bold mb-4 text-amber-600 uppercase">Low Sales Routes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {underperformingRoutes.slice(0, 6).map(route => (
                  <div key={route.name} className="p-3 border border-amber-100 bg-amber-50/30 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-black text-slate-700 uppercase">{route.name}</div>
                      <div className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-bold uppercase">Low Sales</div>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Achievement:</span>
                      <span className="font-bold text-amber-700">{route.ach.toFixed(1)} Ctns</span>
                    </div>
                    <div className="w-full bg-amber-100 h-1 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (route.ach / 10) * 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reports Section Merged into Stats */}
          {(userRole === 'Admin' || userRole === 'Super Admin' || userRole === 'RSM' || userRole === 'NSM' || userRole === 'Director' || userRole === 'SC') && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-3 px-4">
                <div className="h-px flex-1 bg-slate-200"></div>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Intelligence Reports</h2>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>
              
              <ReportsView 
                history={history} 
                obAssignments={obAssignments} 
                tsmList={tsmList} 
                appConfig={appConfig} 
                getPSTDate={() => new Date().toISOString().split('T')[0]} 
                SKUS={SKUS} 
                CATEGORIES={CATEGORIES} 
                userRole={userRole} 
                userName={userName} 
                userRegion={userRegion}
                userContact={userContact}
              />
            </div>
          )}

          {/* Admin Quick Actions */}
          {(userRole === 'Admin' || userRole === 'Super Admin') && (
            <div className="mt-12 p-6 bg-slate-900 rounded-3xl text-white shadow-2xl shadow-slate-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Admin Quick Actions</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Manage Data Sync & Configuration</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => setView('admin')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    Google Sheets Config
                  </button>
                  <button 
                    onClick={syncEverything}
                    disabled={isSyncingGlobal || !appConfig.google_spreadsheet_id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSyncingGlobal ? 'bg-emerald-500/50 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'}`}
                  >
                    <Cloud className={`w-4 h-4 ${isSyncingGlobal ? 'animate-spin' : ''}`} />
                    {isSyncingGlobal ? 'Syncing...' : 'Master Sync Now'}
                  </button>
                </div>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Spreadsheet ID</div>
                  <div className="text-[10px] font-mono text-slate-300 truncate">{appConfig.google_spreadsheet_id || 'Not Configured'}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Service Account</div>
                  <div className="text-[10px] font-mono text-slate-300 truncate">{appConfig.google_service_account_email || 'Not Configured'}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Last Master Sync</div>
                  <div className="text-[10px] font-mono text-emerald-400">{appConfig.last_sync_at || 'Never'}</div>
                </div>
              </div>
            </div>
          )}

          </>
          )}
        </main>
      </div>
    );
    } catch (err) {
      console.error("Dashboard Error:", err);
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="card-clean p-8 max-w-md text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
              <h2 className="text-xl font-black text-seablue uppercase">Stats Error</h2>
              <p className="text-sm text-slate-500">There was an error processing the sales data. This usually happens if some entries have malformed data.</p>
              <button onClick={() => { fetchHistory(true); fetchAdminData(); }} className="btn-seablue w-full py-3">Retry Loading</button>
            </div>
          </div>
        </div>
      );
    }
  }

  if (view === 'stats') {
    return (
      <div className="min-h-screen bg-slate-50 pb-40">
        <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
        {isLoadingNational ? (
          <div className="flex-1 flex items-center justify-center min-h-[80vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-seablue animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Stats...</p>
            </div>
          </div>
        ) : (
          <StatsView 
            history={nationalStats} 
            obAssignments={hierarchy} 
            tsmList={tsmList} 
            appConfig={appConfig} 
            getPSTDate={() => new Date().toISOString().split('T')[0]} 
            SKUS={SKUS} 
            CATEGORIES={CATEGORIES} 
            userRole={userRole}
            userName={userName}
            userRegion={userRegion}
            userContact={userContact}
          />
        )}
      </div>
    );
  }

  if (view === 'reports') {
    return (
      <div className="min-h-screen bg-slate-50 pb-40">
        <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
        {isLoadingNational ? (
          <div className="flex-1 flex items-center justify-center min-h-[80vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-seablue animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Reports...</p>
            </div>
          </div>
        ) : (
          <ReportsView 
            history={nationalStats} 
            obAssignments={obAssignments} 
            tsmList={tsmList} 
            appConfig={appConfig} 
            getPSTDate={() => new Date().toISOString().split('T')[0]} 
            SKUS={SKUS} 
            CATEGORIES={CATEGORIES} 
            userRole={userRole} 
            userName={userName} 
            userRegion={userRegion}
            userContact={userContact}
          />
        )}
      </div>
    );
  }

  if (view === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="card-clean p-6 max-w-sm w-full bg-white shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Admin Access</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authentication Required</p>
                </div>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                if (fd.get('password') === 'Admin@1234') {
                  setIsAdminAuthenticated(true);
                } else {
                  alert('Incorrect password');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-seablue/20 focus:border-seablue outline-none transition-all"
                    placeholder="Enter admin password"
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-seablue w-full py-3">Unlock Admin Panel</button>
              </form>
            </div>
          </div>
        </div>
      );
    }

    if (isLoadingAdmin) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-seablue animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Admin...</p>
              <button onClick={fetchAdminData} className="text-[10px] font-bold text-seablue underline">Retry</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 pb-10">
        <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
        <header className="bg-white border-b border-slate-200 p-4 shadow-sm">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white">
                <Settings className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold text-seablue">Admin Panel</h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={syncEverything} 
                disabled={isSyncingGlobal || !appConfig.google_spreadsheet_id}
                className="p-2 hover:bg-slate-100 rounded-full text-seablue relative" 
                title="Master Sync & Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncingGlobal || isLoadingAdmin || isLoadingHistory ? 'animate-spin' : ''}`} />
                {isSyncingGlobal && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-clean p-4 space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</h3>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Database:</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Google Sheets:</span>
                <span className={`text-[10px] font-bold uppercase ${googleStatus.connected ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {googleStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Retention:</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Never Delete data</span>
              </div>
            </div>
            <div className="card-clean p-4 space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Summary</h3>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Total Records:</span>
                <span className="text-sm font-black text-seablue">{history.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Last Sync:</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{lastUpdated || 'Never'}</span>
              </div>
            </div>
            <div className="card-clean p-4 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Sheets Sync</h3>
                <button 
                  onClick={() => setIsGoogleConfigLocked(!isGoogleConfigLocked)}
                  className={`p-1 rounded-md transition-colors ${isGoogleConfigLocked ? 'text-slate-400 hover:text-seablue' : 'text-seablue bg-seablue/10'}`}
                  title={isGoogleConfigLocked ? "Unlock Settings" : "Lock Settings"}
                >
                  {isGoogleConfigLocked ? <Lock className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5 animate-pulse" />}
                </button>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${googleStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {googleStatus.connected ? `Connected (${googleStatus.method || 'OAuth2'})` : 'Not Connected'}
                  </span>
                </div>
              </div>
              
              <div className={`space-y-3 transition-all duration-300 ${isGoogleConfigLocked ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase flex justify-between">
                    Spreadsheet ID
                    {isGoogleConfigLocked && <span className="text-[7px] text-amber-500 font-black">LOCKED</span>}
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter ID"
                    value={appConfig.google_spreadsheet_id || ''} 
                    onChange={(e) => updateConfig('google_spreadsheet_id', e.target.value)}
                    className="input-clean w-full text-[10px]"
                    disabled={isGoogleConfigLocked}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase">Service Account Email</label>
                  <input 
                    type="text" 
                    placeholder="email@project.iam.gserviceaccount.com"
                    value={appConfig.google_service_account_email || ''} 
                    onChange={(e) => updateConfig('google_service_account_email', e.target.value)}
                    className="input-clean w-full text-[10px]"
                    disabled={isGoogleConfigLocked}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase flex justify-between items-center">
                    <span>Private Key (JSON)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] lowercase italic">Paste the entire private_key from your JSON file</span>
                      {appConfig.google_private_key && (
                        <button 
                          onClick={() => {
                            const blob = new Blob([JSON.stringify({
                              client_email: appConfig.google_service_account_email || '',
                              private_key: appConfig.google_private_key
                            }, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'salespulse-service-account.json';
                            a.click();
                          }}
                          className="text-[9px] font-bold text-seablue hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Download
                        </button>
                      )}
                    </div>
                  </label>
                  <textarea 
                    placeholder="-----BEGIN PRIVATE KEY-----..."
                    value={appConfig.google_private_key || ''} 
                    onChange={(e) => updateConfig('google_private_key', e.target.value)}
                    className="input-clean w-full text-[10px] h-32 resize-none font-mono"
                    disabled={isGoogleConfigLocked}
                  />
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button 
                  onClick={async () => {
                    setIsSyncing(true);
                    setMessage({ text: 'Testing connection...', type: 'info' });
                    try {
                      const res = await apiFetch('/api/admin/test-google');
                      const data = await res.json();
                      if (res.ok) {
                        setMessage({ text: `Connected successfully! Sheet: ${data.title}`, type: 'success' });
                        fetchAdminData(); // Refresh status to enable sync buttons
                      } else {
                        throw new Error(data.error || 'Connection failed');
                      }
                    } catch (err: any) {
                      setMessage({ text: 'Connection failed: ' + err.message, type: 'error' });
                    } finally {
                      setIsSyncing(false);
                      setTimeout(() => setMessage(null), 3000);
                    }
                  }}
                  disabled={isSyncing}
                  className="btn-clean bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] flex items-center justify-center gap-2"
                >
                  {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                  Test Connection
                </button>
              </div>
            </div>
            <div className="card-clean p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Holidays</h3>
                <div className="text-[8px] text-slate-400 italic">Comma separated dates (YYYY-MM-DD)</div>
              </div>
              <textarea 
                placeholder="e.g. 2026-03-20, 2026-03-21"
                value={appConfig.holidays || ''} 
                onChange={(e) => updateConfig('holidays', e.target.value)}
                className="input-clean w-full h-20 text-[10px] font-mono"
              />
            </div>



            <div className="card-clean p-4 space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Bulk Upload (Single CSV)</h3>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      const headers = ['Director', 'NSM', 'RSM', 'SC', 'ASM/TSM', 'Town', 'Distributor', 'OB Name', 'OB ID', 'Zone', 'Region', 'Total Shops', 'Routes', 'Kite Glow Target', 'Burq Action Target', 'Vero Target', 'DWB Target', 'Match Target'];
                      const csvContent = headers.join(",") + "\n" + 
                        "Director Name,NSM Name,RSM Name,SC Name,TSM Name,Town Name,Distributor Name,OB Name,03001234567,Zone Name,Region Name,50,\"Route 1, Route 2\",10,10,10,10,10";
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'SalesPulse_Bulk_Template.csv';
                      a.click();
                    }}
                    className="text-[9px] font-bold text-seablue hover:underline flex items-center justify-center gap-1 border border-seablue/20 py-1.5 rounded"
                  >
                    <Download className="w-3 h-3" /> Template
                  </button>
                  <label className="btn-seablue w-full text-[9px] flex items-center justify-center gap-2 cursor-pointer py-1.5">
                    <Upload className="w-3 h-3" />
                    Upload CSV
                    <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
                  </label>
                </div>
                <p className="text-[8px] text-slate-400 uppercase font-bold text-center">
                  One sheet for Team, Hierarchy, Targets & Distributors
                </p>
              </div>
            </div>
            <div className="card-clean p-6 bg-white space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Cloud Synchronization</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Two-Way Google Sheets Sync</p>
                </div>
              </div>

              <button 
                onClick={syncEverything}
                disabled={isSyncingGlobal || !appConfig.google_spreadsheet_id}
                className="btn-seablue py-6 flex flex-col items-center justify-center gap-2 group relative overflow-hidden w-full"
              >
                <div className="flex items-center gap-3 z-10">
                  <RefreshCw className={`w-8 h-8 ${isSyncingGlobal ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                  <div className="text-left">
                    <div className="text-lg font-black uppercase tracking-tight">Master Sync Now</div>
                    <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Pushes Sales & Stocks | Pulls Team & Targets</div>
                  </div>
                </div>
                {isSyncingGlobal && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-1 bg-white/30"
                  />
                )}
              </button>

              {appConfig.last_sync_at && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Successful Sync</div>
                  <div className="text-xs font-bold text-emerald-600">{appConfig.last_sync_at}</div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center gap-1">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-1">
                    <Upload className="w-3 h-3" />
                  </div>
                  <div className="text-[9px] font-black uppercase text-slate-600">Push Data</div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">Sales, Stocks & Summaries</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center gap-1">
                  <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-1">
                    <Download className="w-3 h-3" />
                  </div>
                  <div className="text-[9px] font-black uppercase text-slate-600">Pull Team</div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">Hierarchy & Targets</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center gap-1">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-1">
                    <History className="w-3 h-3" />
                  </div>
                  <div className="text-[9px] font-black uppercase text-slate-600">Sync History</div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">Import missing records</p>
                </div>
              </div>
            </div>

            <div className="card-clean p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">App Logo</div>
                <label className="btn-seablue text-xs cursor-pointer flex items-center gap-2">
                  <Upload className="w-3 h-3" />
                  Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
              {appLogo && (
                <div className="w-12 h-12 rounded-lg border border-slate-100 overflow-hidden flex items-center justify-center bg-white">
                  <img src={appLogo} alt="App Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          <section className="card-clean overflow-hidden">
            <div className="bg-slate-800 text-white px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <h2 className="text-sm font-bold uppercase tracking-widest">User Management (Login Accounts)</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={autoGenerateUsersFromTeam}
                  className="text-[9px] font-black bg-emerald-500/20 px-2 py-1 rounded hover:bg-emerald-500/40 text-emerald-100 uppercase tracking-widest flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-Generate from Team
                </button>
                <button onClick={fetchUsers} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <RefreshCw className={`w-3 h-3 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <form onSubmit={handleRegisterUser} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input type="text" placeholder="Username" value={newUser.username || ''} onChange={e => setNewUser({...newUser, username: e.target.value})} className="input-clean text-[10px]" required />
                <input type="text" placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="input-clean text-[10px]" required />
                <input type="text" placeholder="Contact/ID" value={newUser.contact} onChange={e => setNewUser({...newUser, contact: e.target.value})} className="input-clean text-[10px]" />
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="input-clean text-[10px]">
                    <option value="OB">OB</option>
                    <option value="TSM">TSM</option>
                    <option value="ASM">ASM</option>
                    <option value="RSM">RSM</option>
                    <option value="NSM">NSM</option>
                    <option value="Director">Director</option>
                    <option value="SC">Sales Coordinator</option>
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                <input type="text" placeholder="Region" value={newUser.region} onChange={e => setNewUser({...newUser, region: e.target.value})} className="input-clean text-[10px]" />
                <button type="submit" disabled={isRegisteringUser} className="btn-seablue text-[10px] py-1">
                  {isRegisteringUser ? '...' : '+ Register'}
                </button>
              </form>

              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase">
                      <th className="py-2">Name / Username</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Contact/ID</th>
                      <th className="py-2">Region / Town</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-2">
                          <div className="font-bold text-slate-700">{u.name}</div>
                          <div className="text-[8px] text-slate-400">@{u.username}</div>
                        </td>
                        <td className="py-2">
                          <span className={`px-1.5 py-0.5 rounded-full font-bold text-[8px] uppercase ${
                            u.role === 'Super Admin' ? 'bg-indigo-100 text-indigo-700' :
                            u.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                            (u.role === 'TSM' || u.role === 'ASM') ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2 text-slate-500">{u.contact}</td>
                        <td className="py-2 text-slate-500">
                          {u.region}{u.town ? ` / ${u.town}` : ''}
                        </td>
                        <td className="py-2 text-right space-x-1">
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                            disabled={u.username === 'admin' || u.username === 'amjid.admin'} // Protect default admins
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="card-clean overflow-hidden">
            <div className="bg-seablue text-white px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Stock Reports History</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    window.open('/api/stocks/export', '_blank');
                  }}
                  className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded hover:bg-white/30 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
                <button onClick={fetchAdminData} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <RefreshCw className={`w-3 h-3 ${isLoadingAdmin ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase">
                      <th className="py-2">Date</th>
                      <th className="py-2">TSM</th>
                      <th className="py-2">Town</th>
                      <th className="py-2">Distributor</th>
                      <th className="py-2 text-right">Total Stock (Ctn)</th>
                      <th className="py-2 text-right">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stockHistory.map(report => {
                      const stockData = typeof report.stock_data === 'string' ? JSON.parse(report.stock_data) : (report.stock_data || {});
                      const totalCtn = Object.values(stockData).reduce((sum: number, item: any) => sum + (Number(item.ctn) || 0), 0) as number;
                      return (
                        <tr key={report.id} className="hover:bg-slate-50">
                          <td className="py-2 font-bold text-slate-700">{report.date}</td>
                          <td className="py-2 text-slate-500">{report.tsm}</td>
                          <td className="py-2 text-slate-500">{report.town}</td>
                          <td className="py-2 text-slate-500 font-bold">{report.distributor}</td>
                          <td className="py-2 text-right font-black text-seablue">{totalCtn.toFixed(1)}</td>
                          <td className="py-2 text-right text-slate-400">{report.submitted_at}</td>
                        </tr>
                      );
                    })}
                    {stockHistory.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">No stock reports found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="card-clean overflow-hidden">
            <div className="bg-slate-800 text-white px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Daily Submission Status</h2>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]} 
                  onChange={(e) => fetchDailyStatus(e.target.value)}
                  className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 focus:outline-none"
                />
                <button onClick={() => fetchDailyStatus(new Date().toISOString().split('T')[0])} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <RefreshCw className={`w-3 h-3 ${isLoadingDailyStatus ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Team</div>
                  <div className="text-xl font-black text-slate-700">{dailyStatus.length}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Submitted</div>
                  <div className="text-xl font-black text-emerald-600">{dailyStatus.filter(s => s.submitted && s.visit_type !== 'Absent').length}</div>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="text-[8px] font-black text-red-400 uppercase tracking-widest">Absent</div>
                  <div className="text-xl font-black text-red-600">{dailyStatus.filter(s => s.visit_type === 'Absent').length}</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Pending</div>
                  <div className="text-xl font-black text-amber-600">{dailyStatus.filter(s => !s.submitted).length}</div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase">
                      <th className="py-2">OB Name</th>
                      <th className="py-2">TSM</th>
                      <th className="py-2 text-center">Status</th>
                      <th className="py-2 text-center">Visit Type</th>
                      <th className="py-2 text-right">Last Entry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dailyStatus.map(ob => (
                      <tr key={ob.contact} className="hover:bg-slate-50">
                        <td className="py-2">
                          <div className="font-bold text-slate-700">{ob.name}</div>
                          <div className="text-[8px] text-slate-400">{ob.contact}</div>
                        </td>
                        <td className="py-2 text-slate-500">{ob.tsm}</td>
                        <td className="py-2 text-center">
                          {ob.submitted ? (
                            ob.visit_type === 'Absent' ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-bold text-[8px] uppercase">Absent</span>
                            ) : ob.visit_type === 'RR' ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-seablue/10 text-seablue font-bold text-[8px] uppercase">Route Riding</span>
                            ) : ob.visit_type === 'V' ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[8px] uppercase">Van Sales</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-600 font-bold text-[8px] uppercase">Alone</span>
                            )
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 font-bold text-[8px] uppercase">Pending</span>
                          )}
                        </td>
                        <td className="py-2 text-center">
                          {ob.submitted && ob.visit_type !== 'Absent' ? (
                            <span className="font-bold text-slate-600">{ob.visit_type}</span>
                          ) : '-'}
                        </td>
                        <td className="py-2 text-right font-mono text-slate-400">
                          {ob.submitted_at ? new Date(ob.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="card-clean overflow-hidden">
            <div className="bg-emerald-600 text-white px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold uppercase tracking-widest">Distributors (Independent)</h2>
                <select 
                  value={selectedAdminTSM} 
                  onChange={(e) => setSelectedAdminTSM(e.target.value)}
                  className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 focus:outline-none"
                >
                  <option value="" className="text-slate-900">All TSMs</option>
                  {tsmList.map(tsm => (
                    <option key={tsm} value={tsm} className="text-slate-900">{tsm}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={async () => {
                    if (confirm("Are you sure you want to DELETE ALL distributors? This cannot be undone.")) {
                      await apiFetch('/api/admin/distributors/clear', { method: 'POST' });
                      fetchAdminData();
                    }
                  }}
                  className="text-[9px] font-black bg-red-500/20 px-2 py-1 rounded hover:bg-red-500/40 text-red-100 uppercase tracking-widest"
                >
                  Clear All
                </button>
                <button onClick={async () => { 
                  const name = prompt("Distributor Name:"); 
                  const town = prompt("Town:"); 
                  const tsm = prompt("TSM:"); 
                  const zone = prompt("Zone (Optional):");
                  const region = prompt("Region (Optional):");
                  if (name && town) { 
                    await apiFetch('/api/admin/distributors', { 
                      method: 'POST', 
                      body: JSON.stringify({ name, town, tsm, zone, region }) 
                    }); 
                    fetchAdminData(); 
                  } 
                }} className="text-xs font-bold bg-white/20 px-2 py-1 rounded hover:bg-white/30">+ Add</button>
              </div>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {distributors
                .filter(dist => !selectedAdminTSM || dist.tsm === selectedAdminTSM)
                .map(dist => (
                <div key={dist.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Distributor Name</label>
                      <input type="text" defaultValue={dist.name} onBlur={async (e) => { await apiFetch('/api/admin/distributors', { method: 'POST', body: JSON.stringify({ ...dist, name: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Town</label>
                      <input type="text" defaultValue={dist.town} onBlur={async (e) => { await apiFetch('/api/admin/distributors', { method: 'POST', body: JSON.stringify({ ...dist, town: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">TSM</label>
                      <select 
                        defaultValue={dist.tsm} 
                        onChange={async (e) => { await apiFetch('/api/admin/distributors', { method: 'POST', body: JSON.stringify({ ...dist, tsm: e.target.value }) }); fetchAdminData(); }} 
                        className="input-clean w-full text-[10px] py-1"
                      >
                        <option value="">Select TSM</option>
                        {tsmList.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Zone</label>
                      <input type="text" defaultValue={dist.zone} onBlur={async (e) => { await apiFetch('/api/admin/distributors', { method: 'POST', body: JSON.stringify({ ...dist, zone: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Region</label>
                      <input type="text" defaultValue={dist.region} onBlur={async (e) => { await apiFetch('/api/admin/distributors', { method: 'POST', body: JSON.stringify({ ...dist, region: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                  </div>
                  <button onClick={async () => { if (confirm("Delete?")) { await apiFetch(`/api/admin/distributors/${dist.id}`, { method: 'DELETE' }); fetchAdminData(); } }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash className="w-4 h-4" /></button>
                </div>
              ))}
              {distributors.length === 0 && <div className="p-8 text-center text-slate-400 text-xs italic">No independent distributors added yet. They will appear in the Stocks Report.</div>}
            </div>
          </section>

          <section className="card-clean overflow-hidden">
            <div className="bg-seablue text-white px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold uppercase tracking-widest">OB Assignments</h2>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-white/60 uppercase tracking-widest">Filter:</label>
                  <select 
                    value={selectedAdminTSM} 
                    onChange={(e) => setSelectedAdminTSM(e.target.value)}
                    className="bg-white/10 border border-white/20 text-white text-[10px] font-bold px-2 py-1 rounded outline-none focus:bg-white/20"
                  >
                    <option value="" className="text-slate-900">All TSMs</option>
                    {tsmList.map(tsm => (
                      <option key={tsm} value={tsm} className="text-slate-900">{tsm}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={async () => { 
                const name = prompt("Name:"); 
                const contact = prompt("ID:"); 
                const zone = prompt("Zone (Optional):");
                const region = prompt("Region (Optional):");
                if (name && contact) { 
                  await apiFetch('/api/admin/obs', { 
                    method: 'POST', 
                    body: JSON.stringify({ name, contact, town: '', distributor: '', routes: [], zone, region }) 
                  }); 
                  fetchAdminData(); 
                } 
              }} className="text-xs font-bold bg-white/20 px-2 py-1 rounded hover:bg-white/30">+ Add</button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {obAssignments
                .filter(ob => !selectedAdminTSM || ob.tsm === selectedAdminTSM)
                .map(ob => (
                <div key={ob.id} className="p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Name</label>
                      <input type="text" defaultValue={ob.name} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, name: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">ID/Contact</label>
                      <input type="text" defaultValue={ob.contact} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, contact: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Town</label>
                      <input type="text" defaultValue={ob.town} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, town: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Distributor</label>
                      <input type="text" defaultValue={ob.distributor} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, distributor: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">TSM</label>
                      <select 
                        defaultValue={ob.tsm} 
                        onChange={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, tsm: e.target.value }) }); fetchAdminData(); }} 
                        className="input-clean w-full text-[10px] py-1"
                      >
                        <option value="">Select TSM</option>
                        {tsmList.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Zone</label>
                      <input type="text" defaultValue={ob.zone} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, zone: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Region</label>
                      <input type="text" defaultValue={ob.region} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, region: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Total Shops in Route</label>
                      <input type="number" defaultValue={ob.total_shops || 50} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, total_shops: parseInt(e.target.value) || 50 }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Routes (comma separated)</label>
                      <input type="text" defaultValue={ob.routes.join(", ")} onBlur={async (e) => { 
                        const routes = e.target.value.split(",").map(r => r.trim()).filter(r => r); 
                        const updatedOb = { ...ob, routes };
                        setObAssignments(prev => prev.map(a => a.contact === ob.contact ? updatedOb : a));
                        await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify(updatedOb) }); 
                      }} className="input-clean w-full" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <button 
                      onClick={() => {
                        if (selectedOBForTargets === ob.contact) {
                          setSelectedOBForTargets(null);
                        } else {
                          setSelectedOBForTargets(ob.contact);
                          fetchTargetsForOBEdit(ob.contact);
                        }
                      }} 
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors ${selectedOBForTargets === ob.contact ? 'bg-seablue text-white border-seablue' : 'bg-white text-seablue border-seablue/20 hover:bg-seablue/5'}`}
                    >
                      {selectedOBForTargets === ob.contact ? 'Close Targets' : 'Manage Brand Targets'}
                    </button>
                    <button onClick={async () => { if (confirm("Delete?")) { await apiFetch(`/api/admin/obs/delete/${ob.id}`, { method: 'DELETE' }); fetchAdminData(); } }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash className="w-4 h-4" /></button>
                  </div>

                  {selectedOBForTargets === ob.contact && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-seablue uppercase tracking-widest">Brand Targets for {ob.name} (Ctn)</h4>
                        <div className="flex items-center gap-2">
                          <label className="text-[8px] font-bold text-slate-400 uppercase">Month:</label>
                          <input 
                            type="month" 
                            value={targetMonth} 
                            onChange={(e) => {
                              setTargetMonth(e.target.value);
                              fetchTargetsForOBEdit(ob.contact, e.target.value);
                            }}
                            className="input-clean text-[10px] py-0.5 px-2"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {CATEGORIES.map(cat => (
                          <div key={cat} className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase">{cat}</label>
                            <input 
                              type="number" 
                              value={obTargetsEdit[cat] || ''} 
                              onChange={(e) => handleTargetUpdate(ob.contact, cat, e.target.value)} 
                              className="input-clean w-full bg-white" 
                              placeholder="0.00"
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="card-clean overflow-hidden">
            <div className="bg-emerald-600 text-white px-4 py-2 flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-widest">National Sales Hierarchy</h2>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded hover:bg-white/30 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Upload Hierarchy CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleHierarchyBulkUpload} />
                </label>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-2 font-bold uppercase text-slate-400">NSM</th>
                    <th className="p-2 font-bold uppercase text-slate-400">RSM</th>
                    <th className="p-2 font-bold uppercase text-slate-400">TSM</th>
                    <th className="p-2 font-bold uppercase text-slate-400">Town</th>
                    <th className="p-2 font-bold uppercase text-slate-400">Distributor</th>
                    <th className="p-2 font-bold uppercase text-slate-400">OB Name</th>
                    <th className="p-2 font-bold uppercase text-slate-400">OB ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hierarchy.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2">{row.nsm_name}</td>
                      <td className="p-2">{row.rsm_name}</td>
                      <td className="p-2">{row.asm_tsm_name}</td>
                      <td className="p-2">{row.town_name}</td>
                      <td className="p-2">{row.distributor_name}</td>
                      <td className="p-2 font-bold">{row.ob_name}</td>
                      <td className="p-2 text-slate-400">{row.ob_id}</td>
                    </tr>
                  ))}
                  {hierarchy.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">No hierarchy data uploaded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
        <UserProfileView 
          user={user} 
          apiFetch={apiFetch}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem('user_data', JSON.stringify(updatedUser));
          }} 
        />
      </div>
    );
  }

  if (view === 'stocks') {
    const handleStockChange = (distributor: string, skuId: string, val: number) => {
      setStockOrders(prev => ({
        ...prev,
        [distributor]: {
          ...(prev[distributor] || {}),
          [skuId]: { ctn: val }
        }
      }));
    };

    const handleSubmitAllStocks = async () => {
      if (!selectedStockTSM) {
        setMessage({ text: 'Please select a TSM', type: 'error' });
        return;
      }
      setIsSubmittingStocks(true);
      try {
        const promises = Object.entries(stockOrders).map(([distributor, stocks]) => {
          const distInfo = filteredDistributors.find(d => d.distributor === distributor);
          return apiFetch('/api/stocks', {
            method: 'POST',
            body: JSON.stringify({
              date: new Date().toISOString().split('T')[0],
              tsm: selectedStockTSM,
              town: distInfo?.town || '',
              distributor: distributor,
              stocks: stocks
            })
          });
        });
        await Promise.all(promises);
        setMessage({ text: 'All Stock Reports Submitted!', type: 'success' });
        setStockOrders({});
        syncGoogle();
      } catch (e) {
        setMessage({ text: 'Error submitting stocks', type: 'error' });
      } finally {
        setIsSubmittingStocks(false);
        setTimeout(() => setMessage(null), 3000);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 pb-40">
        <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
        
        <div className="p-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-black text-seablue uppercase tracking-tight leading-none">Distributor Stocks</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Inventory Management & Reporting</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => {
                  const headers = ['Director', 'NSM', 'RSM', 'Region', 'TSM', 'Town', 'Distributor', ...SKUS.map(s => s.name)];
                  const rows = filteredDistributors.map(d => {
                    const stocks = stockOrders[d.distributor] || {};
                    const obInfo = obAssignments.find(ob => ob.distributor === d.distributor) || {} as any;
                    return [
                      obInfo.director || '', obInfo.nsm || '', obInfo.rsm || '', d.region || '', d.tsm, d.town, d.distributor,
                      ...SKUS.map(sku => stocks[sku.id]?.ctn || 0)
                    ];
                  });
                  const csv = Papa.unparse([headers, ...rows]);
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `Stock_Report_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="btn-seablue px-4 py-2 text-[10px] flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button 
                onClick={handleSubmitAllStocks}
                disabled={isSubmittingStocks || Object.keys(stockOrders).length === 0}
                className="btn-seablue px-4 py-2 text-[10px] flex items-center gap-2 shadow-lg shadow-seablue/20"
              >
                {isSubmittingStocks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Submit All
              </button>
            </div>
          </motion.div>
          <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
            <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 mr-auto">
                <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
                  <Store className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Inventory Matrix</h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select 
                  value={selectedStockRegion} 
                  onChange={e => setSelectedStockRegion(e.target.value)}
                  className="input-clean py-1.5 text-[10px] min-w-[120px] rounded-xl"
                >
                  <option value="">All Regions</option>
                  {stockRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select 
                  value={selectedStockTSM} 
                  onChange={e => setSelectedStockTSM(e.target.value)}
                  className="input-clean py-1.5 text-[10px] min-w-[120px] rounded-xl"
                >
                  <option value="">All TSMs</option>
                  {stockTsms.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select 
                  value={selectedStockTown} 
                  onChange={e => setSelectedStockTown(e.target.value)}
                  className="input-clean py-1.5 text-[10px] min-w-[120px] rounded-xl"
                >
                  <option value="">All Towns</option>
                  {stockTowns.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin max-h-[70vh]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-slate-50/90 backdrop-blur-sm text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4 sticky left-0 bg-slate-50/90 z-10 border-r border-slate-100">Distributor</th>
                    <th className="px-6 py-4 border-r border-slate-100/50">Town</th>
                    {SKUS.map(sku => (
                      <th key={sku.id} className="px-4 py-4 text-center min-w-[100px] border-r border-slate-100/50">{sku.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDistributors.map((dist, idx) => (
                    <tr key={`${dist.distributor}-${idx}`} className="group hover:bg-slate-50/80 transition-all">
                      <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <p className="text-xs font-black text-slate-700">{dist.distributor}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{dist.tsm}</p>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500 border-r border-slate-100/30">{dist.town}</td>
                      {SKUS.map(sku => (
                        <td key={sku.id} className="px-4 py-3 border-r border-slate-100/30">
                          <input 
                            type="number" 
                            min="0"
                            value={stockOrders[dist.distributor]?.[sku.id]?.ctn || ''}
                            onChange={(e) => handleStockChange(dist.distributor, sku.id, parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-50/50 border border-slate-100 rounded-lg px-2 py-1.5 text-xs font-black text-seablue text-center focus:bg-white focus:ring-2 focus:ring-seablue/20 outline-none transition-all"
                            placeholder="0"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-20">
                  <tr className="bg-slate-100 font-black text-seablue border-t-2 border-seablue/20">
                    <td className="px-6 py-3 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-[10px] uppercase tracking-widest">Total Stock (Ctns)</td>
                    <td className="px-6 py-3 border-r border-slate-200/30"></td>
                    {SKUS.map(sku => {
                      const total = filteredDistributors.reduce((sum, dist) => {
                        return sum + (stockOrders[dist.distributor]?.[sku.id]?.ctn || 0);
                      }, 0);
                      return (
                        <td key={sku.id} className="px-4 py-3 text-center text-xs border-r border-slate-200/30">
                          {total > 0 ? total : '-'}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      </div>
    );
  }
  if (view === 'history') {
    if (isLoadingHistory) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-seablue animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading History...</p>
              <button onClick={() => fetchHistory()} className="text-[10px] font-bold text-seablue underline">Retry</button>
            </div>
          </div>
        </div>
      );
    }

    const paginatedHistory = history.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);
    const totalPages = Math.ceil(history.length / itemsPerPage);

    return (
      <div className="min-h-screen bg-slate-50 pb-10">
        <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
        <header className="bg-white border-b border-slate-200 p-4 sticky top-12 z-20 shadow-sm">
          <div className="max-w-full mx-auto px-4 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-seablue">History</h1>
                  {lastUpdated && <p className="text-[8px] font-bold text-slate-400 uppercase">Last Sync: {lastUpdated}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => fetchHistory()}
                  className="p-2 hover:bg-slate-100 rounded-full text-seablue transition-colors"
                  title="Refresh History"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => {
                const headers = [
                  'Date', 'Month', 'Director', 'NSM', 'RSM', 'Region', 'TSM', 'Town', 'Distributor', 'OB Name', 'OB Contact', 'Route', 
                  'Total Shops', 'Visited Shops', 'Productive Shops',
                  ...SKUS.map(sku => `${sku.name} (${sku.category})`),
                  'Total Achievement'
                ];
                
                const rows = history.map(h => {
                  const items = h.order_data || {};
                  const obInfo = obAssignments.find(ob => ob.contact === h.ob_contact) || {} as any;
                  
                  const skuValues = SKUS.map(sku => {
                    const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                    const total = (item.ctn * sku.unitsPerCarton + item.dzn * sku.unitsPerDozen + item.pks) / (sku.unitsPerCarton || 1);
                    return total.toFixed(3);
                  });

                  const totalAch = skuValues.reduce((a, b) => a + parseFloat(b), 0);
                  const month = h.date ? h.date.slice(0, 7) : '';

                  return [
                    h.date, month, obInfo.director || '', obInfo.nsm || '', obInfo.rsm || '', obInfo.region || '', h.tsm, h.town, h.distributor, h.order_booker, h.ob_contact, h.route,
                    h.total_shops, h.visited_shops, h.productive_shops,
                    ...skuValues,
                    totalAch.toFixed(3)
                  ];
                });

                const csvContent = Papa.unparse([headers, ...rows]);
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const obPart = historyFilters.ob || 'AllOB';
                const tsmPart = historyFilters.tsm || 'AllTSM';
                const datePart = historyFilters.from || new Date().toISOString().split('T')[0];
                const fileName = `${obPart}+${tsmPart}+${datePart}.csv`.replace(/\s+/g, '_');
                
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'text/csv' })] })) {
                  navigator.share({
                    files: [new File([blob], fileName, { type: 'text/csv' })],
                    title: 'Sales History Export',
                    text: 'Complete Sales History Export'
                  }).catch(err => {
                    if (err.name !== 'AbortError') {
                      console.error('Share failed:', err);
                      // Fallback to download if share fails for other reasons
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = fileName;
                      a.click();
                    }
                  });
                } else {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName;
                  a.click();
                  setMessage({ text: 'History Exported! Share it via WhatsApp.', type: 'success' });
                  setTimeout(() => setMessage(null), 3000);
                }
              }} className="btn-seablue text-xs">Export Data</button>
            </div>
          </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <select 
                value={historyFilters.tsm} 
                onChange={(e) => {
                  const val = e.target.value;
                  setHistoryFilters(prev => ({ ...prev, tsm: val, ob: '' }));
                  // Auto-fetch on change
                  setTimeout(() => fetchHistory(), 0);
                }}
                className="input-clean text-xs py-1.5"
              >
                <option value="">All TSMs</option>
                {tsmList.map(tsm => <option key={tsm} value={tsm}>{tsm}</option>)}
              </select>
              <select 
                value={historyFilters.ob} 
                onChange={(e) => {
                  const val = e.target.value;
                  setHistoryFilters(prev => ({ ...prev, ob: val }));
                  setTimeout(() => fetchHistory(), 0);
                }}
                className="input-clean text-xs py-1.5"
              >
                <option value="">All OBs</option>
                {obAssignments
                  .filter(ob => !historyFilters.tsm || ob.tsm === historyFilters.tsm)
                  .map(ob => <option key={ob.contact} value={ob.name}>{ob.name}</option>)
                }
              </select>
              <input 
                type="date" 
                value={historyFilters.from} 
                onChange={(e) => {
                  const val = e.target.value;
                  setHistoryFilters(prev => ({ ...prev, from: val }));
                  setTimeout(() => fetchHistory(), 0);
                }}
                className="input-clean text-xs py-1.5"
              />
              <input 
                type="date" 
                value={historyFilters.to} 
                onChange={(e) => {
                  const val = e.target.value;
                  setHistoryFilters(prev => ({ ...prev, to: val }));
                  setTimeout(() => fetchHistory(), 0);
                }}
                className="input-clean text-xs py-1.5"
              />
            </div>
          </div>
        </header>

        <main className="max-w-[98%] mx-auto px-4 py-6 space-y-6">
          {history.length === 0 ? (
            <div className="card-clean p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <History className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-700">No History Found</h3>
                <p className="text-sm text-slate-400">Try adjusting your filters or refresh the data.</p>
              </div>
              <button onClick={() => { setHistoryFilters({ ob: '', tsm: '', from: '', to: '' }); fetchHistory(true); }} className="btn-seablue px-6 py-2">Clear Filters & Refresh</button>
            </div>
          ) : (
            <>
              <div className="card-clean p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h3 className="text-sm font-black text-seablue uppercase tracking-widest">OB Date-wise Sales Matrix (MTD)</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">View:</span>
                    <select 
                      className="input-clean text-[10px] py-1 px-2"
                      value={matrixView}
                      onChange={(e) => setMatrixView(e.target.value as any)}
                    >
                      <option value="Total">Total Bags/Ctns</option>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-[600px] px-4 sm:px-0">
                    <table className="w-full text-left border-collapse text-[9px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-1 py-2 font-black text-slate-400 uppercase sticky left-0 bg-slate-50 z-10 border-r border-slate-200 w-14 sm:w-24 truncate text-[6px] sm:text-[8px]">OB Name</th>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <th key={day} className="px-0.5 py-2 font-black text-slate-600 text-center border-r border-slate-100 min-w-[14px] sm:min-w-[24px] text-[5px] sm:text-[8px]">{day}</th>
                          ))}
                          <th className="px-1 py-2 font-black text-seablue text-right sticky right-0 bg-slate-50 z-10 border-l border-slate-200 w-8 sm:w-16 text-[6px] sm:text-[8px]">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {obAssignments.filter(ob => !historyFilters.tsm || ob.tsm === historyFilters.tsm).map(ob => {
                          const obOrders = history.filter(h => h.ob_contact === ob.contact && h.date.startsWith(new Date().toISOString().slice(0, 7)));
                          let obTotal = 0;
                          return (
                            <tr key={ob.contact} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-1 py-2 font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] truncate w-14 sm:w-24 text-[6px] sm:text-[8px]" title={ob.name}>{ob.name}</td>
                              {Array.from({ length: 31 }, (_, i) => {
                                const day = (i + 1).toString().padStart(2, '0');
                                const dateStr = `${new Date().toISOString().slice(0, 7)}-${day}`;
                                const dayOrder = obOrders.find(o => o.date === dateStr);
                                
                                let daySales = 0;
                                if (dayOrder) {
                                  const items = dayOrder.order_data || {};
                                  if (matrixView === 'Total') {
                                    daySales = SKUS.reduce((sum, sku) => {
                                      const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                                      const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                                      return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                                    }, 0);
                                  } else {
                                    daySales = SKUS.filter(s => s.category === matrixView).reduce((sum, sku) => {
                                      const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                                      const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                                      return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                                    }, 0);
                                  }
                                }
                                
                                obTotal += daySales;
                                return (
                                  <td key={day} className={`px-0.5 py-2 text-center border-r border-slate-100 text-[5px] sm:text-[8px] ${daySales > 0 ? 'bg-emerald-50 font-bold text-emerald-700' : 'text-slate-300'}`}>
                                    {daySales > 0 ? daySales.toFixed(1) : '-'}
                                  </td>
                                );
                              })}
                              <td className="px-1 py-2 font-black text-seablue text-right sticky right-0 bg-white z-10 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] w-8 sm:w-16 text-[6px] sm:text-[8px]">{obTotal.toFixed(1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-2 text-[8px] text-slate-400 italic">* Matrix shows {matrixView === 'Total' ? 'total bags/cartons' : matrixView + ' sales'} per day for the current month. Scroll horizontally to see all dates.</div>
              </div>

              <div className="space-y-4">
                {groupedHistory.map(group => (
                  <div key={group.obName} className="card-clean overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-xs font-black text-seablue uppercase tracking-widest">{group.obName}</h3>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{group.entries.length} Entries</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white text-[9px] uppercase font-black text-slate-400 border-b border-slate-100">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Route</th>
                            <th className="px-4 py-3 text-center">T/V/P</th>
                            {CATEGORIES.map(cat => <th key={cat} className="px-4 py-3 text-center">{cat}</th>)}
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {group.entries.map(h => {
                            const items = h.order_data || {};
                            const totals: Record<string, number> = {};
                            CATEGORIES.forEach(cat => {
                              totals[cat] = SKUS
                                .filter(sku => sku.category === cat)
                                .reduce((sum, sku) => {
                                  const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                                  const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
                                  return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                                }, 0);
                            });
                            const totalAch = Object.values(totals).reduce((a, b) => a + b, 0);

                            return (
                              <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-4 py-3 text-[10px] font-bold text-slate-700">{h.date}</td>
                                <td className="px-4 py-3 text-[10px] font-medium text-slate-600">{h.route}</td>
                                <td className="px-4 py-3 text-center text-[10px] text-slate-500">{h.total_shops}/{h.visited_shops}/{h.productive_shops}</td>
                                {CATEGORIES.map(cat => (
                                  <td key={cat} className="px-4 py-3 text-center font-mono text-[10px]">{totals[cat].toFixed(1)}</td>
                                ))}
                                <td className="px-4 py-3 text-right font-black text-seablue text-[10px]">{totalAch.toFixed(2)}</td>
                                <td className="px-4 py-3 text-center">
                                  <button 
                                    onClick={() => {
                                      const items = h.order_data || {};
                                      const skuDetails = SKUS.map(sku => {
                                        const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                                        const totalPacks = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                                        const totalCtns = sku.unitsPerCarton > 0 ? totalPacks / sku.unitsPerCarton : 0;
                                        if (totalCtns === 0) return null;
                                        const label = sku.category === 'Kite Glow' || sku.category === 'Burq Action' || sku.category === 'Vero' ? 'Bags' : 'Ctns';
                                        return `${sku.name}: ${totalCtns.toFixed(2)} ${label}`;
                                      }).filter(Boolean).join('\n');

                                      const currentMonth = h.date.slice(0, 7);
                                      const obMtdOrders = history.filter(o => o.ob_contact === h.ob_contact && o.date.startsWith(currentMonth));
                                      const mtdBrandSales = CATEGORIES.map(cat => {
                                        const catSkus = SKUS.filter(s => s.category === cat);
                                        const mtdTotal = obMtdOrders.reduce((sum, o) => {
                                          const hData = typeof o.order_data === 'string' ? JSON.parse(o.order_data) : o.order_data;
                                          const hCatTotal = catSkus.reduce((sSum, sku) => {
                                            const item = hData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                                            const packs = (Number(item.ctn || 0) * Number(sku.unitsPerCarton)) + (Number(item.dzn || 0) * Number(sku.unitsPerDozen)) + Number(item.pks || 0);
                                            return sSum + (Number(sku.unitsPerCarton) > 0 ? packs / Number(sku.unitsPerCarton) : 0);
                                          }, 0);
                                          return sum + hCatTotal;
                                        }, 0);
                                        return `${cat}: ${mtdTotal.toFixed(2)}`;
                                      }).join('\n');

                                      const totalAch = Object.values(totals).reduce((a, b) => a + b, 0);
                                      const mtdTotal = obMtdOrders.reduce((sum, o) => {
                                        const orderData = typeof o.order_data === 'string' ? JSON.parse(o.order_data) : (o.order_data || {});
                                        const ach = calculateAchievement(orderData);
                                        return sum + Object.values(ach).reduce((a, b) => a + b, 0);
                                      }, 0);

                                      const summary = `*Sales Summary*\n` +
                                        `*${h.date}*\n` +
                                        `*OB:* ${h.order_booker}\n` +
                                        `*Route:* ${h.route}\n` +
                                        `*Shops T/V/P:* ${h.total_shops}/${h.visited_shops}/${h.productive_shops}\n` +
                                        `------------------\n` +
                                        `*SKU Details:*\n${skuDetails}\n` +
                                        `------------------\n` +
                                        CATEGORIES.map(cat => {
                                          const label = cat === 'Kite Glow' || cat === 'Burq Action' || cat === 'Vero' ? 'Bags' : 'Ctns';
                                          return `*${cat}:* ${totals[cat].toFixed(2)} ${label}`;
                                        }).join('\n') +
                                        `\n------------------\n` +
                                        `*Total Achievement:* ${totalAch.toFixed(2)}\n\n` +
                                        `*MTD Sales Brand Wise:*\n${mtdBrandSales}\n` +
                                        `*Total MTD:* ${mtdTotal.toFixed(2)}`;
                                      const encodedMsg = encodeURIComponent(summary);
                                      window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
                                    }}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                  >
                                    <WhatsAppIcon />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  if (!token || token === 'null') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-40">
      <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white shadow-sm overflow-hidden">
                {appLogo ? (
                  <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Waves className="w-5 h-5" />
                )}
              </div>
              <div>
                <h1 className="text-sm font-black text-seablue uppercase tracking-tight leading-none">SalesPulse</h1>
                <div className="flex flex-col mt-1">
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    {lastUpdated ? `Updated: ${lastUpdated}` : 'Secondary Sales Intelligence'}
                  </p>
                  {userName && (
                    <p className="text-[7px] font-black text-indigo-600 uppercase tracking-widest leading-none mt-1">
                      Logged in as: {userName}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button 
                onClick={syncEverything}
                disabled={isSyncingGlobal || !appConfig.google_spreadsheet_id}
                className={`p-1.5 rounded-full transition-colors ${isSyncingGlobal ? 'text-emerald-500' : 'text-emerald-600 hover:bg-emerald-50'}`}
                title="Full Sync with Google Sheets"
              >
                <Cloud className={`w-4 h-4 ${isSyncingGlobal ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => { fetchAdminData(); fetchHistory(true); }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-seablue transition-colors"
                title="Refresh Local Data"
              >
                <RefreshCw className={`w-4 h-4 ${(isLoadingAdmin || isLoadingHistory) ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={saveDraft} 
                disabled={isSaving}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-black uppercase text-[9px] tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                <span className="hidden sm:inline">Save as Draft</span>
              </button>
              <button 
                onClick={submitOrder} 
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-seablue text-white rounded-lg font-black uppercase text-[9px] tracking-widest shadow-md shadow-blue-100 hover:bg-seablue-dark transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span className="hidden sm:inline">Submit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 py-3 space-y-3">
        {/* TSM Filter - Restricted by Role */}
        {userRole !== 'OB' && tsmList.length > 0 && (
          <div className="card-clean p-1.5 bg-seablue/5 border-seablue/10 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {['Super Admin', 'Admin', 'Director', 'NSM', 'RSM', 'SC'].includes(userRole || '') && (
                <div className="flex items-center gap-1 flex-1">
                  <label className="text-[7px] font-black text-seablue uppercase tracking-widest whitespace-nowrap">Region:</label>
                  <select 
                    value={selectedEntryRegion} 
                    onChange={(e) => {
                      setSelectedEntryRegion(e.target.value);
                      setSelectedTSM('');
                      setOrder(prev => ({ ...prev, obContact: '', orderBooker: '', route: '', town: '', distributor: '', totalShops: 50 }));
                    }} 
                    className="input-clean flex-1 min-w-[80px] text-[9px] py-0.5 px-1"
                  >
                    <option value="">All Regions</option>
                    {entryRegions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-1 flex-1">
                <label className="text-[7px] font-black text-seablue uppercase tracking-widest whitespace-nowrap">TSM:</label>
                <select 
                  value={selectedTSM} 
                  disabled={(userRole === 'TSM' || userRole === 'ASM')}
                  onChange={(e) => {
                    setSelectedTSM(e.target.value);
                    setOrder(prev => ({ ...prev, obContact: '', orderBooker: '', route: '', town: '', distributor: '', totalShops: 50 }));
                  }} 
                  className="input-clean flex-1 min-w-[80px] text-[9px] py-0.5 px-1"
                >
                  <option value="">All TSMs</option>
                  {filteredEntryTSMList.map(tsm => <option key={tsm} value={tsm}>{tsm}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Meta Info Section */}
        <div className="card-clean p-3 grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Date</label>
            <input type="date" value={order.date} onChange={(e) => handleMetaChange('date', e.target.value)} className="input-clean w-full text-[10px] py-1" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">OB</label>
            <select 
              value={order.obContact} 
              disabled={userRole === 'OB'}
              onChange={(e) => handleMetaChange('obContact', e.target.value)} 
              className="input-clean w-full text-[10px] py-1"
            >
              <option value="">Select OB</option>
              {filteredOBs.map(ob => (
                <option key={ob.contact} value={ob.contact}>
                  {ob.name} ({ob.contact})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Route</label>
            <select value={order.route} onChange={(e) => handleMetaChange('route', e.target.value)} className="input-clean w-full text-[10px] py-1" disabled={!order.obContact}>
              <option value="">Select Route</option>
              {Array.from(new Set(obAssignments.find(a => a.contact === order.obContact)?.routes || [])).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Shops</label>
            <input type="number" inputMode="numeric" autoComplete="off" value={order.totalShops || ''} onChange={(e) => handleMetaChange('totalShops', parseInt(e.target.value) || 0)} className="input-clean w-full bg-slate-50 text-[10px] py-1" disabled={order.visitType === 'Absent'} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Visited</label>
            <input type="number" inputMode="numeric" autoComplete="off" value={order.visitType === 'Absent' ? 0 : (order.visitedShops || '')} onChange={(e) => handleMetaChange('visitedShops', parseInt(e.target.value) || 0)} className="input-clean w-full text-[10px] py-1" disabled={order.visitType === 'Absent'} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Prod</label>
            <input type="number" inputMode="numeric" autoComplete="off" value={order.visitType === 'Absent' ? 0 : (order.productiveShops || '')} onChange={(e) => handleMetaChange('productiveShops', parseInt(e.target.value) || 0)} className={`input-clean w-full text-[10px] py-1 ${order.visitType !== 'Absent' && order.visitedShops > 0 && (order.productiveShops / order.visitedShops) < 0.7 ? 'border-red-300' : ''}`} disabled={order.visitType === 'Absent'} />
          </div>
          <div className="md:col-span-6 flex flex-wrap gap-4 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visit Type:</span>
              <div className="flex gap-2">
                {[
                  { id: 'A', label: 'Alone (A)', color: 'bg-slate-100 text-slate-600' },
                  { id: 'V', label: 'Van Sales (V)', color: 'bg-emerald-100 text-emerald-600', tsmOnly: true },
                  { id: 'RR', label: 'Route Riding (RR)', color: 'bg-seablue/10 text-seablue' },
                  { id: 'Absent', label: 'Absent', color: 'bg-red-100 text-red-600' }
                ].filter(type => !type.tsmOnly || (order.obContact && order.obContact.startsWith('TSM-'))).map(type => (
                  <button
                    key={type.id}
                    onClick={() => setOrder(prev => ({ 
                      ...prev, 
                      visitType: type.id as any,
                      visitedShops: type.id === 'Absent' ? 0 : prev.visitedShops,
                      productiveShops: type.id === 'Absent' ? 0 : prev.productiveShops,
                      categoryProductiveShops: type.id === 'Absent' ? {} : prev.categoryProductiveShops,
                      items: type.id === 'Absent' ? {} : prev.items
                    }))}
                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${order.visitType === type.id ? `${type.color} border-current shadow-sm` : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Never Visited Indicator */}
        {order.totalShops > 0 && !order.isAbsent && (
          <div className="flex justify-center">
            <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${Math.max(0, order.totalShops - order.visitedShops) > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              <EyeOff className="w-2 h-2" />
              Never Visited: <span className="text-[10px]">{Math.max(0, order.totalShops - order.visitedShops)}</span>
            </div>
          </div>
        )}

        {order.obContact && !order.isAbsent ? (
          <>
            <div className="card-clean p-1.5 flex flex-wrap items-center justify-center gap-1.5 md:gap-3 bg-slate-50/50">
              {CATEGORIES.map(cat => (
                <div key={cat} className="flex flex-col items-center bg-white border border-slate-200 rounded-md px-2 py-1 shadow-sm min-w-[80px]">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">{cat}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-seablue">{categoryTotals[cat].toFixed(2)}</span>
                    <span className="text-[8px] font-bold text-slate-400">/ {(order.targets[cat] || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Categories Section */}
            <div className="space-y-4">
              {CATEGORIES.map(category => (
                <section key={category} className="card-clean overflow-hidden">
              <div className="bg-seablue/5 px-4 py-2 flex justify-between items-center border-b border-slate-100">
                <h2 className="text-[11px] font-black text-seablue uppercase tracking-tighter w-20">{category}</h2>
                
                <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
                  {/* 2nd: Productive Shops */}
                  <div className={`flex flex-col items-center bg-white border rounded-lg px-1.5 py-0.5 shadow-sm min-w-[40px] transition-colors ${categoryTotals[category] > 0 && (order.categoryProductiveShops[category] || 0) <= 0 ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}>
                    <span className={`text-[6px] font-black uppercase tracking-tighter ${categoryTotals[category] > 0 && (order.categoryProductiveShops[category] || 0) <= 0 ? 'text-red-600' : 'text-slate-400'}`}>Prod</span>
                    <input 
                      type="number" 
                      inputMode="numeric" 
                      autoComplete="off" 
                      placeholder="0"
                      value={order.categoryProductiveShops[category] || ''} 
                      onChange={(e) => setOrder(prev => ({ ...prev, categoryProductiveShops: { ...prev.categoryProductiveShops, [category]: parseInt(e.target.value) || 0 } }))} 
                      className={`w-6 text-center text-[10px] font-bold focus:outline-none bg-transparent ${categoryTotals[category] > 0 && (order.categoryProductiveShops[category] || 0) <= 0 ? 'text-red-700' : 'text-seablue'}`} 
                    />
                  </div>

                  {/* 3rd: Today Sales */}
                  <div className="flex flex-col items-center bg-seablue rounded-lg px-2 py-0.5 shadow-sm border border-seablue/10 min-w-[50px]">
                    <span className="text-[6px] font-black text-white/80 uppercase tracking-tighter">Today</span>
                    <span className="text-[11px] font-black text-white leading-tight">{categoryTotals[category].toFixed(2)}</span>
                  </div>

                  {/* 4th: Target */}
                  <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 min-w-[50px]">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Target</span>
                    <input 
                      type="number" 
                      inputMode="decimal"
                      autoComplete="off"
                      value={order.targets[category] || ''} 
                      onChange={(e) => handleTargetChange(category, parseFloat(e.target.value) || 0)}
                      className="w-10 text-center text-[11px] font-bold text-slate-600 bg-transparent focus:outline-none"
                      placeholder="0"
                    />
                  </div>

                  {/* 5th: MTD Sales */}
                  <div className="flex flex-col items-center bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 min-w-[55px]">
                    <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter">MTD Ach</span>
                    <span className="text-[11px] font-bold text-emerald-700">{(mtdAchievement[category] || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400">
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-2 py-2 text-center w-20">Ctn</th>
                      {category !== "Match" && <th className="px-2 py-2 text-center w-20">Dzn</th>}
                      <th className="px-2 py-2 text-center w-20">Pks</th>
                      <th className="px-4 py-2 text-right w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {SKUS.filter(s => s.category === category).map(sku => {
                      const item = order.items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                      return (
                        <tr key={sku.id} className="hover:bg-slate-50/50">
                          <td className="px-2 py-1.5">
                            <div className="text-[10px] font-bold text-slate-700 leading-tight">{sku.name}</div>
                            <div className="text-[8px] text-slate-400 font-mono">{sku.unitsPerCarton}u</div>
                          </td>
                          <td className="px-1 py-1.5"><input ref={el => inputRefs.current[`${sku.id}-ctn`] = el} type="number" inputMode="numeric" autoComplete="off" value={item.ctn || ''} onChange={(e) => handleInputChange(sku.id, 'ctn', e.target.value)} onKeyDown={(e) => handleKeyDown(e, `${sku.id}-ctn`)} className="input-clean w-full py-1 text-center text-[10px]" /></td>
                          {category !== "Match" && (
                            <td className="px-1 py-1.5"><input ref={el => inputRefs.current[`${sku.id}-dzn`] = el} type="number" inputMode="numeric" autoComplete="off" disabled={sku.unitsPerDozen === 0} value={item.dzn || ''} onChange={(e) => handleInputChange(sku.id, 'dzn', e.target.value)} onKeyDown={(e) => handleKeyDown(e, `${sku.id}-dzn`)} className="input-clean w-full py-1 text-center text-[10px] disabled:opacity-30" /></td>
                          )}
                          <td className="px-1 py-1.5"><input ref={el => inputRefs.current[`${sku.id}-pks`] = el} type="number" inputMode="numeric" autoComplete="off" value={item.pks || ''} onChange={(e) => handleInputChange(sku.id, 'pks', e.target.value)} onKeyDown={(e) => handleKeyDown(e, `${sku.id}-pks`)} className="input-clean w-full py-1 text-center text-[10px]" /></td>
                          <td className="px-2 py-1.5 text-right font-mono text-[9px] font-bold text-seablue">{calculateTotalCartons(sku.id).toFixed(3)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </section>
            ))}
          </div>
        </>
      ) : (
          <div className="card-clean p-12 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <Store className="w-12 h-12 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">Select an Order Booker to start</p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {isConfirming && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-clean p-8 max-w-sm w-full text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><Send className="w-8 h-8" /></div>
              <h3 className="text-xl font-bold text-seablue">Confirm Submission</h3>
              <p className="text-xs text-slate-500">This will save the report to the <span className="font-bold text-seablue">Shared Team History</span> for everyone to see.</p>
              <p className="text-sm text-slate-700">Submit report for <span className="font-bold text-seablue">{order.route}</span>?</p>
              <div className="space-y-3">
                <button onClick={confirmSubmit} className="btn-seablue w-full py-3">Confirm</button>
                <button onClick={() => setIsConfirming(false)} className="w-full text-sm font-bold text-slate-400">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lastSubmittedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-clean p-8 max-w-sm w-full text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8" /></div>
              <h3 className="text-xl font-bold text-seablue">Report Submitted!</h3>
              <p className="text-sm text-slate-500">Sales report for <span className="font-bold text-seablue">{lastSubmittedOrder.route}</span> has been saved.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    const items = lastSubmittedOrder.items || {};
                    const totals: Record<string, number> = {};
                    CATEGORIES.forEach(cat => {
                      totals[cat] = SKUS
                        .filter(sku => sku.category === cat)
                        .reduce((sum, sku) => {
                          const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                          const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
                          return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                        }, 0);
                    });
                    
                    const totalAch = Object.values(totals).reduce((a, b) => a + b, 0);
                    
                    const skuDetails = SKUS.map(sku => {
                      const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                      if (item.ctn === 0 && item.dzn === 0 && item.pks === 0) return null;
                      
                      const totalPacks = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                      const totalBags = sku.unitsPerCarton > 0 ? totalPacks / sku.unitsPerCarton : 0;
                      const label = sku.category === 'Kite Glow' || sku.category === 'Burq Action' || sku.category === 'Vero' ? 'Bags' : 'Ctns';
                      
                      return `${sku.name}: ${totalBags.toFixed(2)} ${label}`;
                    }).filter(Boolean).join('\n');

                    const brandTotals = CATEGORIES.map(cat => {
                      const catSkus = SKUS.filter(s => s.category === cat);
                      const catTotal = catSkus.reduce((sum, sku) => {
                        const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                        const packs = (Number(item.ctn || 0) * Number(sku.unitsPerCarton)) + (Number(item.dzn || 0) * Number(sku.unitsPerDozen)) + Number(item.pks || 0);
                        return sum + (Number(sku.unitsPerCarton) > 0 ? packs / Number(sku.unitsPerCarton) : 0);
                      }, 0);
                      const label = cat === 'Kite Glow' || cat === 'Burq Action' || cat === 'Vero' ? 'Bags' : 'Ctns';
                      return `${cat}: ${catTotal.toFixed(2)} ${label}`;
                    }).join('\n');

                    // Calculate MTD for this OB
                    const currentMonth = lastSubmittedOrder.date.slice(0, 7);
                    const obHistory = history.filter(h => h.ob_contact === lastSubmittedOrder.ob_contact && h.date.startsWith(currentMonth));
                    
                    const mtdBrandSales = CATEGORIES.map(cat => {
                      const catSkus = SKUS.filter(s => s.category === cat);
                      const mtdTotal = obHistory.reduce((sum, h) => {
                        const hData = typeof h.order_data === 'string' ? JSON.parse(h.order_data) : h.order_data;
                        const hCatTotal = catSkus.reduce((sSum, sku) => {
                          const item = hData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                          const packs = (Number(item.ctn || 0) * Number(sku.unitsPerCarton)) + (Number(item.dzn || 0) * Number(sku.unitsPerDozen)) + Number(item.pks || 0);
                          return sSum + (Number(sku.unitsPerCarton) > 0 ? packs / Number(sku.unitsPerCarton) : 0);
                        }, 0);
                        return sum + hCatTotal;
                      }, 0);
                      return `${cat}: ${mtdTotal.toFixed(2)}`;
                    }).join('\n');

                    const summary = `Sales Summary\n` +
                      `${lastSubmittedOrder.date}\n` +
                      `OB: ${lastSubmittedOrder.order_booker || lastSubmittedOrder.orderBooker}\n` +
                      `Town Name: ${lastSubmittedOrder.town}\n` +
                      `Route: ${lastSubmittedOrder.route}\n` +
                      `Shops T/V/P: ${lastSubmittedOrder.total_shops || 50}/${lastSubmittedOrder.visited_shops}/${lastSubmittedOrder.productive_shops}\n` +
                      `------------------\n` +
                      `SKU Details:\n${skuDetails}\n` +
                      `------------------\n` +
                      `${brandTotals}\n` +
                      `------------------\n` +
                      `Total Achievement: ${totalAch.toFixed(2)}\n\n` +
                      `MTD Sales Brand Wise:\n${mtdBrandSales}`;
                    
                    const encodedMsg = encodeURIComponent(summary);
                    window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
                  }}
                  className="btn-seablue w-full py-3 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Share to WhatsApp
                </button>
                
                <button 
                  onClick={() => {
                    const items = lastSubmittedOrder.items || {};
                    const rows = [
                      ['SKU', 'Category', 'Ctn', 'Dzn', 'Pks', 'Total (Ctn/Bag)'],
                      ...SKUS.map(sku => {
                        const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                        const total = (item.ctn * sku.unitsPerCarton + item.dzn * sku.unitsPerDozen + item.pks) / (sku.unitsPerCarton || 1);
                        return [sku.name, sku.category, item.ctn, item.dzn, item.pks, total.toFixed(3)];
                      })
                    ];
                    
                    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `Sales_${lastSubmittedOrder.orderBooker}_${lastSubmittedOrder.date}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Download CSV
                </button>

                <button onClick={() => setLastSubmittedOrder(null)} className="w-full text-sm font-bold text-slate-400">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }} 
            animate={{ opacity: 1, y: 0, x: '-50%' }} 
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-32 left-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-[100] min-w-[280px] border border-white/10 ${message.type === 'success' ? 'bg-emerald-600 text-white' : message.type === 'error' ? 'bg-red-600 text-white' : 'bg-seablue text-white'}`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-bold uppercase tracking-widest">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card-clean p-6 max-w-sm w-full bg-white shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Confirm Action</h3>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button onClick={confirmModal.onCancel} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={confirmModal.onConfirm} className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AIChatBot />
    </div>
  );
}
