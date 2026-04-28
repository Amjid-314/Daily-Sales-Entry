import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ArrowLeft, 
  Target, 
  Users, 
  MapPin, 
  Store,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
  Package,
  LayoutDashboard,
  Activity
} from 'lucide-react';
import { CATEGORIES, SKUS, CATEGORY_COLORS, BRAND_GROUPS } from '../types';

interface MTDPerformanceProps {
  history: any[];
  hierarchy: any[];
  selectedMonth: string;
  userRole: string | null;
  userName: string | null;
  userRegion: string | null;
}

export const MTDPerformance: React.FC<MTDPerformanceProps> = ({
  history,
  hierarchy,
  selectedMonth,
  userRole,
  userName,
  userRegion
}) => {
  const initialLevel = useMemo(() => {
    if (!userRole || userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Director' || userRole === 'NSM') return 'National';
    if (userRole === 'RSM' || userRole === 'SC') return 'Region';
    if (userRole === 'TSM' || userRole === 'ASM') return 'TSM';
    return 'OB';
  }, [userRole]);

  const topLevelVal = useMemo(() => {
    if (initialLevel === 'National') return null;
    if (initialLevel === 'Region') return userRegion;
    return userName;
  }, [initialLevel, userRegion, userName]);

  const [drilldown, setDrilldown] = useState<{ level: string, value: string | null }[]>([]);

  const currentDrilldown = drilldown.length > 0 
    ? drilldown[drilldown.length - 1] 
    : { level: initialLevel, value: topLevelVal };

  // --- Date Logic ---
  const timeInfo = useMemo(() => {
    const today = new Date();
    const isCurrent = selectedMonth === today.toISOString().slice(0, 7);
    const yr = parseInt(selectedMonth.slice(0, 4));
    const mo = parseInt(selectedMonth.slice(5, 7));
    const lastDay = new Date(yr, mo, 0).getDate();
    const day = isCurrent ? today.getDate() : lastDay;
    return { isCurrent, yr, mo, lastDay, day };
  }, [selectedMonth]);

  const getWD = (offDay: string) => {
    const { yr, mo, lastDay, day } = timeInfo;
    let total = 0, gone = 0;
    const offIdx = offDay === 'Friday Off' ? 5 : 0; 
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(yr, mo - 1, d);
      if (date.getDay() !== offIdx) {
        total++;
        if (d <= day) gone++;
      }
    }
    return { total, gone, rem: total - gone, ratio: total > 0 ? gone / total : 0 };
  };

  // --- Processing ---
  const processed = useMemo(() => {
    const monthHist = history.filter(h => h.date.startsWith(selectedMonth));
    const obs: Record<string, any> = {};

    hierarchy.forEach(h => {
      const id = h.ob_id;
      if (!id) return;
      if (!obs[id]) {
        obs[id] = {
          id, name: h.ob_name, region: h.territory_region, tsm: h.asm_tsm_name, town: h.town_name, offDay: h.off_day_type,
          visited: 0, productive: 0, target: 0, ach: 0, brands: {}
        };
        CATEGORIES.forEach(cat => {
          const t = Number(h[`target_${cat.toLowerCase().replace(/\s+/g, '_')}`]) || 0;
          obs[id].brands[cat] = { target: t, ach: 0, productive: 0 };
          obs[id].target += t;
        });
      }
    });

    monthHist.forEach(e => {
      if (e.isTSMEntry) return;
      const ob = obs[e.ob_contact];
      if (!ob) return;
      ob.visited += Number(e.visited_shops || 0);
      ob.productive += Number(e.productive_shops || 0);
      const orders = typeof e.order_data === 'string' ? JSON.parse(e.order_data) : (e.order_data || {});
      const prods = typeof e.category_productive_data === 'string' ? JSON.parse(e.category_productive_data) : (e.category_productive_data || {});
      
      CATEGORIES.forEach(cat => {
        const catSkus = SKUS.filter(s => s.category === cat);
        const val = catSkus.reduce((s, sku) => {
          const it = orders[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const p = (Number(it.ctn || 0) * sku.unitsPerCarton) + (Number(it.dzn || 0) * sku.unitsPerDozen) + Number(it.pks || 0);
          return s + (sku.unitsPerCarton > 0 ? p / sku.unitsPerCarton : 0);
        }, 0);
        ob.brands[cat].ach += val;
        ob.brands[cat].productive += Number(prods[cat] || 0);
        ob.ach += val;
      });
    });
    return Object.values(obs);
  }, [history, hierarchy, selectedMonth]);

  const calcKPIs = (d: any) => {
    const wd = getWD(d.offDay || 'Sunday Off');
    const mtdT = d.target * wd.ratio;
    const achP = mtdT > 0 ? (d.ach / mtdT) * 100 : 0;
    const dailyAvg = wd.gone > 0 ? d.ach / wd.gone : 0;
    const expected = dailyAvg * wd.total;
    const rem = d.target - d.ach;
    
    return {
      ...d, wd, mtdT, achP, dailyAvg, expected, rem,
      gap: d.ach - mtdT,
      rpd: wd.rem > 0 ? rem / wd.rem : 0,
      behind: expected - d.ach,
      brandDetails: CATEGORIES.map(c => {
        const b = d.brands[c];
        const bMtdT = b.target * wd.ratio;
        return {
          name: c, target: b.target, mtdT: bMtdT, ach: b.ach, productive: b.productive,
          percent: bMtdT > 0 ? (b.ach / bMtdT) * 100 : 0,
          gap: b.ach - bMtdT,
          rpd: wd.rem > 0 ? (b.target - b.ach) / wd.rem : 0
        };
      })
    };
  };

  const aggregate = (lvl: string, f?: { k: string, v: string }) => {
    const filtered = f ? processed.filter(x => x[f.k] === f.v) : processed;
    const groups: Record<string, any> = {};
    filtered.forEach(ob => {
      const k = ob[lvl.toLowerCase()] || 'Unknown';
      if (!groups[k]) {
        groups[k] = { name: k, target: 0, ach: 0, visited: 0, productive: 0, brands: {}, offDay: ob.offDay };
        CATEGORIES.forEach(c => groups[k].brands[c] = { target: 0, ach: 0, productive: 0 });
      }
      groups[k].target += ob.target;
      groups[k].ach += ob.ach;
      groups[k].visited += ob.visited;
      groups[k].productive += ob.productive;
      CATEGORIES.forEach(c => {
        groups[k].brands[c].target += ob.brands[c].target;
        groups[k].brands[c].ach += ob.brands[c].ach;
        groups[k].brands[c].productive += ob.brands[c].productive;
      });
    });
    return Object.values(groups).map(g => calcKPIs(g)).sort((a, b) => a.achP - b.achP);
  };

  const ns = useMemo(() => {
    const base = processed.reduce((acc, ob) => {
      acc.target += ob.target; acc.ach += ob.ach; acc.visited += ob.visited; acc.productive += ob.productive;
      CATEGORIES.forEach(c => {
        acc.brands[c].target += ob.brands[c].target;
        acc.brands[c].ach += ob.brands[c].ach;
        acc.brands[c].productive += ob.brands[c].productive;
      });
      return acc;
    }, { target: 0, ach: 0, visited: 0, productive: 0, brands: CATEGORIES.reduce((a: any, c) => ({ ...a, [c]: { target: 0, ach: 0, productive: 0 } }), {}) });
    return calcKPIs({ ...base, name: 'National' });
  }, [processed]);

  const viewItems = useMemo(() => {
    let raw: any[] = [];
    if (currentDrilldown.level === 'National') raw = aggregate('Region');
    else if (currentDrilldown.level === 'Region') raw = aggregate('TSM', { k: 'region', v: currentDrilldown.value! });
    else if (currentDrilldown.level === 'TSM') raw = aggregate('Town', { k: 'tsm', v: currentDrilldown.value! });
    else if (currentDrilldown.level === 'Town') raw = processed.filter(x => x.town === currentDrilldown.value).map(x => calcKPIs(x)).sort((a, b) => a.achP - b.achP);
    
    // Flatten ViewItems with Brands
    const flattened: any[] = [];
    raw.forEach(item => {
       // TOTAL Row
       flattened.push({ ...item, brandName: 'TOTAL', isTotal: true });
       // Brand Rows
       const brandsToShow = ["Kite Glow", "Burq Action", "Vero", "Washing Powder", "DWB", "Match"];
       const wpBrands = BRAND_GROUPS["Washing Powder*"];

       item.brandDetails.forEach((b: any) => {
          if (["Kite Glow", "Burq Action", "Vero", "DWB", "Match"].includes(b.name)) {
            flattened.push({ ...item, brandName: b.name, ...b, isTotal: false });
          }
       });

       // WP TOTAL Row
       const wpBrandItems = item.brandDetails.filter((b: any) => wpBrands.includes(b.name));
       const wpTotal = {
         name: item.name,
         brandName: 'Total WP',
         target: wpBrandItems.reduce((s: number, b: any) => s + b.target, 0),
         mtdT: wpBrandItems.reduce((s: number, b: any) => s + b.mtdT, 0),
         ach: wpBrandItems.reduce((s: number, b: any) => s + b.ach, 0),
         productive: wpBrandItems.reduce((s: number, b: any) => s + b.productive, 0),
         isTotal: false
       };
       const wpPerc = wpTotal.mtdT > 0 ? (wpTotal.ach / wpTotal.mtdT) * 100 : 0;
       flattened.push({ ...wpTotal, percent: wpPerc, achP: wpPerc, gap: wpTotal.ach - wpTotal.mtdT });
    });

    return flattened;
  }, [currentDrilldown, processed]);

  const getColor = (perc: number) => {
    if (perc >= 90) return 'text-emerald-600 bg-emerald-50';
    if (perc >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sticky Header with KPIs */}
      <div className="sticky top-0 z-[60] bg-white border-b border-slate-100 shadow-sm p-4">
        <div className="max-w-[1900px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
             {drilldown.length > 0 && (
               <button onClick={() => setDrilldown(prev => prev.slice(0, -1))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
               </button>
             )}
             <div>
                <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">MTD Performance Matrix</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Level: {currentDrilldown.level} | {currentDrilldown.value || 'National'}</p>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div className="px-4 py-2 bg-slate-900 rounded-2xl text-white shadow-xl flex items-center gap-4">
                <div>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Target</p>
                  <p className="text-sm font-black">{Math.round(ns.target).toLocaleString()}</p>
                </div>
                <div className="w-px h-6 bg-white/10"></div>
                <div>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">MTD 🎯</p>
                  <p className="text-sm font-black text-indigo-400">{Math.round(ns.mtdT).toLocaleString()}</p>
                </div>
                <div className="w-px h-6 bg-white/10"></div>
                <div>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Ach</p>
                  <p className="text-sm font-black text-emerald-400">{Math.round(ns.ach).toLocaleString()}</p>
                </div>
                <div className="w-px h-6 bg-white/10"></div>
                <div>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Ach %</p>
                  <p className={`text-sm font-black ${ns.achP >= 90 ? 'text-emerald-400' : 'text-rose-400'}`}>{Math.round(ns.achP)}%</p>
                </div>
                <div className="w-px h-6 bg-white/10"></div>
                <div>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Gap</p>
                  <p className="text-sm font-black text-slate-300">{Math.round(ns.gap).toLocaleString()}</p>
                </div>
                <div className="w-px h-6 bg-white/10"></div>
                <div>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">RPD</p>
                  <p className="text-sm font-black text-indigo-300">{Math.round(ns.rpd).toLocaleString()}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-x-auto relative shadow-inner">
        <div className="min-w-full inline-block align-middle">
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="min-w-full text-left border-collapse table-auto">
              <thead className="bg-slate-50 sticky top-0 z-[55] shadow-sm">
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                  <th className="px-4 py-4 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 min-w-[80px] text-center shadow-[2px_0_5px_rgba(0,0,0,0.05)] whitespace-nowrap">Level</th>
                  <th className="px-4 py-4 border-r border-slate-200 min-w-[200px] text-left whitespace-nowrap">Entity Name</th>
                  <th className="px-4 py-4 border-r border-slate-200 min-w-[130px] text-left whitespace-nowrap">Brand</th>
                  <th className="px-3 py-4 text-right border-r border-slate-200 min-w-[100px] whitespace-nowrap">Full Target</th>
                  <th className="px-3 py-4 text-right border-r border-slate-200 bg-indigo-50 text-indigo-700 min-w-[100px] whitespace-nowrap">MTD Target 🎯</th>
                  <th className="px-3 py-4 text-right border-r border-slate-200 min-w-[100px] whitespace-nowrap">Achievement</th>
                  <th className="px-3 py-4 text-right border-r border-slate-200 min-w-[70px] whitespace-nowrap">%</th>
                  <th className="px-3 py-4 text-right border-r border-slate-200 min-w-[100px] whitespace-nowrap">Gap</th>
                  <th className="px-3 py-4 text-right border-r border-slate-200 min-w-[70px] whitespace-nowrap">RPD</th>
                  <th className="px-3 py-4 text-right border-r border-slate-200 min-w-[70px] whitespace-nowrap">Avg</th>
                  <th className="px-3 py-4 text-right border-r border-slate-200 min-w-[100px] whitespace-nowrap">Expected</th>
                  <th className="px-3 py-4 text-right border-r border-slate-200 min-w-[100px] whitespace-nowrap">Behind</th>
                  <th className="px-3 py-4 text-right border-r border-slate-200 min-w-[70px] whitespace-nowrap">Visited</th>
                  <th className="px-4 py-4 text-right min-w-[100px] whitespace-nowrap">Productive</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {viewItems.map((item, idx) => (
                  <tr 
                    key={`${item.name}-${item.brandName}-${idx}`} 
                    className={`hover:bg-indigo-50/30 transition-colors cursor-pointer ${item.isTotal ? 'bg-slate-50 font-bold border-t-2 border-slate-200' : 'bg-white'}`}
                    onClick={() => {
                       if (!item.isTotal) return;
                       if (currentDrilldown.level === 'National') setDrilldown([...drilldown, { level: 'Region', value: item.name }]);
                       else if (currentDrilldown.level === 'Region') setDrilldown([...drilldown, { level: 'TSM', value: item.name }]);
                       else if (currentDrilldown.level === 'TSM') setDrilldown([...drilldown, { level: 'Town', value: item.name }]);
                    }}
                  >
                    <td className={`px-4 py-3 text-[10px] font-bold text-slate-400 font-mono uppercase sticky left-0 z-10 border-r border-slate-200 min-w-[80px] text-center shadow-[2px_0_5px_rgba(0,0,0,0.05)] ${item.isTotal ? 'bg-slate-50' : 'bg-white'}`}>
                      {item.isTotal ? currentDrilldown.level === 'National' ? 'Region' : currentDrilldown.level === 'Region' ? 'TSM' : currentDrilldown.level === 'TSM' ? 'Town' : 'OB' : ''}
                    </td>
                    <td className={`px-4 py-3 text-[11px] font-black text-slate-800 uppercase border-r border-slate-100 min-w-[200px] text-left truncate ${item.isTotal ? 'opacity-100' : 'opacity-40'}`}>
                      {item.name}
                    </td>
                    <td className={`px-4 py-3 text-[10px] uppercase border-r border-slate-100 min-w-[130px] text-left ${item.isTotal ? 'font-black text-indigo-700' : 'font-bold text-slate-500'}`}>
                      {item.brandName}
                    </td>
                    <td className="px-3 py-3 text-right text-[10px] font-mono border-r border-slate-100 min-w-[100px] font-medium">{Math.round(item.target).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-[10px] font-black font-mono text-indigo-700 bg-indigo-50/30 border-r border-slate-100 min-w-[100px]">{Math.round(item.mtdT).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-[11px] font-black font-mono text-slate-900 border-r border-slate-100 min-w-[100px]">{Math.round(item.ach).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right border-r border-slate-100 min-w-[70px]">
                       <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${getColor(item.percent || item.achP)}`}>
                         {Math.round(item.percent || item.achP)}%
                       </span>
                    </td>
                    <td className={`px-3 py-3 text-right text-[10px] font-mono border-r border-slate-100 min-w-[100px] font-bold ${item.gap >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                       {Math.round(item.gap).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-[10px] font-mono text-indigo-600 border-r border-slate-100 min-w-[70px] font-medium">{Math.round(item.rpd)}</td>
                    <td className="px-3 py-3 text-right text-[10px] font-mono text-slate-500 border-r border-slate-100 min-w-[70px]">{Math.round(item.dailyAvg || 0)}</td>
                    <td className="px-3 py-3 text-right text-[10px] font-mono text-indigo-700 border-r border-slate-100 min-w-[100px] font-black tracking-tighter">{Math.round(item.expected || 0).toLocaleString()}</td>
                    <td className={`px-3 py-3 text-right text-[10px] font-mono border-r border-slate-100 min-w-[100px] ${item.behind > 0 ? 'text-rose-600 font-black' : 'text-emerald-600'}`}>
                       {Math.round(item.behind || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-[10px] font-mono text-slate-500 border-r border-slate-100 min-w-[70px]">{item.visited || 0}</td>
                    <td className="px-4 py-3 text-right text-[10px] font-black text-emerald-600 min-w-[100px] bg-emerald-50/20">{item.productive || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};


