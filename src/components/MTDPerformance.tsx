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

  const [drilldown, setDrilldown] = useState<{ level: string, value: string | null, parentValue?: string | null }[]>([]);
  const [showBrands, setShowBrands] = useState<Record<string, boolean>>({});

  const currentDrilldown = drilldown.length > 0 
    ? drilldown[drilldown.length - 1] 
    : { level: initialLevel, value: topLevelVal };

  const toggleBrands = (id: string) => setShowBrands(prev => ({ ...prev, [id]: !prev[id] }));

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
    // User requested: If Off Day = Sunday: Exclude Sunday. 
    // Also mentioned "If Off Day = Friday: Exclude Friday".
    const offIdx = offDay === 'Friday Off' ? 5 : 0; // 0 is Sunday, 5 is Friday
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
          visited: 0, target: 0, ach: 0, brands: {}
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
    
    // Brand wise total productive shops logic: sum of all brands
    const totalProductive = CATEGORIES.reduce((s, c) => s + (d.brands[c]?.productive || 0), 0);

    return {
      ...d, wd, mtdT, achP, dailyAvg, expected, rem,
      totalProductive,
      gap: d.ach - mtdT,
      rpd: wd.rem > 0 ? rem / wd.rem : 0,
      behind: expected - d.ach,
      brandDetails: CATEGORIES.map(c => {
        const b = d.brands[c];
        const bMtdT = b.target * wd.ratio;
        const sku = SKUS.find(s => s.category === c);
        const unitLabel = sku?.unit || 'Units';
        return {
          name: c, target: b.target, mtdT: bMtdT, ach: b.ach, productive: b.productive,
          unit: unitLabel,
          percent: bMtdT > 0 ? (b.ach / bMtdT) * 100 : 0,
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
        groups[k] = { name: k, target: 0, ach: 0, visited: 0, brands: {}, offDay: ob.offDay };
        CATEGORIES.forEach(c => groups[k].brands[c] = { target: 0, ach: 0, productive: 0 });
      }
      groups[k].target += ob.target;
      groups[k].ach += ob.ach;
      groups[k].visited += ob.visited;
      CATEGORIES.forEach(c => {
        groups[k].brands[c].target += ob.brands[c].target;
        groups[k].brands[c].ach += ob.brands[c].ach;
        groups[k].brands[c].productive += ob.brands[c].productive;
      });
    });
    return Object.values(groups).map(g => calcKPIs(g)).sort((a, b) => b.ach - a.ach); // Sorting by Achievement now
  };

  const ns = useMemo(() => {
    const base = processed.reduce((acc, ob) => {
      acc.target += ob.target; acc.ach += ob.ach; acc.visited += ob.visited;
      CATEGORIES.forEach(c => {
        acc.brands[c].target += ob.brands[c].target;
        acc.brands[c].ach += ob.brands[c].ach;
        acc.brands[c].productive += ob.brands[c].productive;
      });
      return acc;
    }, { target: 0, ach: 0, visited: 0, brands: CATEGORIES.reduce((a: any, c) => ({ ...a, [c]: { target: 0, ach: 0, productive: 0 } }), {}) });
    return calcKPIs({ ...base, name: 'National' });
  }, [processed]);

  const viewItems = useMemo(() => {
    if (currentDrilldown.level === 'National') return aggregate('Region');
    if (currentDrilldown.level === 'Region') return aggregate('TSM', { k: 'region', v: currentDrilldown.value! });
    if (currentDrilldown.level === 'TSM') return aggregate('Town', { k: 'tsm', v: currentDrilldown.value! });
    if (currentDrilldown.level === 'Town') return processed.filter(x => x.town === currentDrilldown.value).map(x => calcKPIs(x)).sort((a, b) => b.ach - a.ach);
    if (currentDrilldown.level === 'OB') return processed.filter(x => x.name === currentDrilldown.value).map(x => calcKPIs(x));
    return [];
  }, [currentDrilldown, processed]);

  const renderBrandTable = (item: any, isDark = false) => (
    <div className={`mt-4 overflow-x-auto rounded-xl border ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
      <table className="w-full text-[10px] text-left">
        <thead className={`${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'} font-bold uppercase`}>
          <tr>
            <th className="px-2 py-1.5">Brand</th>
            <th className="px-2 py-1.5 text-right">Target</th>
            <th className="px-2 py-1.5 text-right">MTD 🎯</th>
            <th className="px-2 py-1.5 text-right">Ach</th>
            <th className="px-2 py-1.5 text-right">%</th>
            <th className="px-2 py-1.5 text-right">RPD</th>
            <th className="px-2 py-1.5 text-right">Prod</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-white/5 text-white' : 'divide-slate-50 text-slate-800'}`}>
          {item.brandDetails.map((b: any) => (
            <tr key={b.name} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
              <td className="px-2 py-1.5">
                <div className="font-bold uppercase leading-none">{b.name}</div>
                <div className={`text-[7px] font-medium opacity-50 uppercase tracking-widest mt-0.5`}>{b.unit}</div>
              </td>
              <td className="px-2 py-1.5 text-right font-mono">{Math.round(b.target)}</td>
              <td className={`px-2 py-1.5 text-right font-mono ${isDark ? 'text-blue-400' : 'text-indigo-600'}`}>{Math.round(b.mtdT)}</td>
              <td className="px-2 py-1.5 text-right font-mono font-black">{Math.round(b.ach)}</td>
              <td className="px-2 py-1.5 text-right font-black">
                <span className={b.percent >= 90 ? 'text-emerald-500' : b.percent >= 70 ? 'text-amber-500' : 'text-rose-500'}>
                  {b.percent.toFixed(0)}%
                </span>
              </td>
              <td className="px-2 py-1.5 text-right font-mono opacity-50">{Math.round(b.rpd)}</td>
              <td className="px-2 py-1.5 text-right font-black text-emerald-500">{b.productive}</td>
            </tr>
          ))}
          {/* Add Brand-wise Totals for Washing Powder */}
          {(() => {
            const wpBrands = BRAND_GROUPS["Washing Powder*"];
            const wpTgt = item.brandDetails.filter((b:any) => wpBrands.includes(b.name)).reduce((s:number, b:any) => s + b.target, 0);
            const wpMtdT = item.brandDetails.filter((b:any) => wpBrands.includes(b.name)).reduce((s:number, b:any) => s + b.mtdT, 0);
            const wpAch = item.brandDetails.filter((b:any) => wpBrands.includes(b.name)).reduce((s:number, b:any) => s + b.ach, 0);
            const wpProd = item.brandDetails.filter((b:any) => wpBrands.includes(b.name)).reduce((s:number, b:any) => s + b.productive, 0);
            const wpPerc = wpMtdT > 0 ? (wpAch / wpMtdT) * 100 : 0;
            const wpRpd = item.wd.rem > 0 ? (wpTgt - wpAch) / item.wd.rem : 0;
            
            return (
              <tr className={`${isDark ? 'bg-white/5 font-black border-t border-white/20' : 'bg-slate-100 font-black border-t border-slate-200'}`}>
                <td className="px-2 py-1.5 uppercase text-[9px]">WP Total</td>
                <td className="px-2 py-1.5 text-right font-mono">{Math.round(wpTgt)}</td>
                <td className="px-2 py-1.5 text-right font-mono">{Math.round(wpMtdT)}</td>
                <td className="px-2 py-1.5 text-right font-mono">{Math.round(wpAch)}</td>
                <td className="px-2 py-1.5 text-right">
                   <span className={wpPerc >= 90 ? 'text-emerald-500' : wpPerc >= 70 ? 'text-amber-500' : 'text-rose-500'}>
                    {wpPerc.toFixed(0)}%
                  </span>
                </td>
                <td className="px-2 py-1.5 text-right font-mono opacity-50">{Math.round(wpRpd)}</td>
                <td className="px-2 py-1.5 text-right text-emerald-500">{wpProd}</td>
              </tr>
            )
          })()}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-40 font-sans bg-slate-50/30 min-h-screen">
      <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 sticky top-4 z-40">
        <div className="flex items-center gap-3">
          {drilldown.length > 0 && (
            <button onClick={() => setDrilldown(prev => prev.slice(0, -1))} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">MTD Target vs Achievement 🎯</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {currentDrilldown.value || 'National'} Breakdown
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-seablue uppercase tracking-widest bg-seablue/5 px-2 py-1 rounded-lg inline-block mb-1">{selectedMonth}</p>
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-bold">{ns.wd.gone}/{ns.wd.total} Work Days</span>
          </div>
        </div>
      </div>

      {/* National Summary Card - ALWAYS VISIBLE OR AS DRILLDOWN ROOT */}
      {currentDrilldown.level === 'National' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-seablue/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">National Performance Matrix</p>
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl sm:text-5xl font-black">{ns.achP.toFixed(1)}<span className="text-xl sm:text-2xl text-slate-500 ml-1">%</span></h2>
                  <div className={`px-4 py-1 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest ${ns.achP >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {ns.achP >= 100 ? 'On Track' : 'Gap Warning'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-right w-full sm:w-auto mt-2 sm:mt-0">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Visited</p>
                  <p className="text-lg sm:text-xl font-black text-white">{ns.visited.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Productive</p>
                  <p className="text-lg sm:text-xl font-black text-emerald-400">{ns.totalProductive.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5">
                <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">Full Month Target</p>
                <p className="text-lg sm:text-2xl font-black text-white">{Math.round(ns.target).toLocaleString()}</p>
              </div>
              <div className="bg-white/5 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5">
                <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">MTD Target 🎯</p>
                <p className="text-lg sm:text-2xl font-black text-blue-400">{Math.round(ns.mtdT).toLocaleString()}</p>
              </div>
              <div className="bg-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 ring-1 ring-white/10 text-emerald-400">
                <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 sm:mb-2">Achievement</p>
                <p className="text-lg sm:text-2xl font-black">{Math.round(ns.ach).toLocaleString()}</p>
              </div>
              <div className="bg-white/5 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5">
                <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">Total Gap</p>
                <p className={`text-lg sm:text-2xl font-black ${ns.gap >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Math.round(ns.gap).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl mb-8">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Required Per Day (RPD)</p>
                <p className="text-xl font-black text-indigo-400">{Math.round(ns.rpd).toLocaleString()} <span className="text-[12px] font-bold opacity-50">Avg/Day</span></p>
              </div>
            </div>

            <div className="bg-white/5 rounded-3xl border border-white/5 p-4">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <Package className="w-4 h-4" /> Brand Performance Breakdown
               </h3>
               {renderBrandTable(ns, true)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Drilldown List - Table Format */}
      {currentDrilldown.level !== 'National' || true ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
               {currentDrilldown.level === 'National' ? 'Regional' : 
                currentDrilldown.level === 'Region' ? `${currentDrilldown.value} - TSM` : 
                currentDrilldown.level === 'TSM' ? `${currentDrilldown.value} - Town` : 
                'Details'} Hierarchy View
             </h3>
             <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">
               {viewItems.length} Records
             </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                    <th className="px-4 py-4 sticky left-0 bg-slate-50 z-10 w-40">Entity Name</th>
                    <th className="px-2 py-4 text-right">Target</th>
                    <th className="px-2 py-4 text-right">MTD 🎯</th>
                    <th className="px-2 py-4 text-right">Ach</th>
                    <th className="px-2 py-4 text-right">%</th>
                    <th className="px-2 py-4 text-right">RPD</th>
                    <th className="px-2 py-4 text-right">Prod</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {viewItems.map((item, idx) => (
                    <React.Fragment key={item.name + idx}>
                      <tr 
                        className={`hover:bg-slate-50 group transition-colors cursor-pointer ${showBrands[item.id] ? 'bg-indigo-50/30' : ''}`}
                        onClick={() => {
                          if (currentDrilldown.level === 'National') setDrilldown([...drilldown, { level: 'Region', value: item.name }]);
                          else if (currentDrilldown.level === 'Region') setDrilldown([...drilldown, { level: 'TSM', value: item.name }]);
                          else if (currentDrilldown.level === 'TSM') setDrilldown([...drilldown, { level: 'Town', value: item.name }]);
                          else toggleBrands(item.id);
                        }}
                      >
                        <td className={`px-4 py-4 sticky left-0 group-hover:bg-slate-50 z-10 ${showBrands[item.id] ? 'bg-indigo-50/30' : 'bg-white'}`}>
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${item.achP >= 100 ? 'bg-emerald-500' : item.achP >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                             <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate max-w-[120px]">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-4 text-right text-[10px] font-bold text-slate-400">
                          {Math.round(item.target).toLocaleString()}
                        </td>
                        <td className="px-2 py-4 text-right text-[10px] font-black text-indigo-500">
                          {Math.round(item.mtdT).toLocaleString()}
                        </td>
                        <td className="px-2 py-4 text-right text-[11px] font-black text-slate-800">
                          {Math.round(item.ach).toLocaleString()}
                        </td>
                        <td className="px-2 py-4 text-right">
                           <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${item.achP >= 100 ? 'bg-emerald-100 text-emerald-700' : item.achP >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                             {Math.round(item.achP)}%
                           </span>
                        </td>
                        <td className="px-2 py-4 text-right text-[10px] font-bold text-slate-400">
                           {Math.round(item.rpd)}
                        </td>
                        <td className="px-2 py-4 text-right text-[10px] font-black text-emerald-500">
                           {item.totalProductive}
                        </td>
                        <td className="px-4 py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                              {currentDrilldown.level === 'Town' && (
                                <button className="p-1 px-2 border border-slate-200 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest hover:border-seablue hover:text-seablue transition-all">
                                  {showBrands[item.id] ? 'Hide' : 'Brands'}
                                </button>
                              )}
                              <ChevronRight className={`w-3 h-3 text-slate-300 transition-transform ${showBrands[item.id] ? 'rotate-90' : ''}`} />
                           </div>
                        </td>
                      </tr>
                      {(currentDrilldown.level === 'Town' || currentDrilldown.level === 'OB') && showBrands[item.id] && (
                        <tr>
                          <td colSpan={8} className="px-4 py-4 bg-slate-50/50">
                             <div className="pl-4 border-l-4 border-seablue/20">
                               {renderBrandTable(item)}
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

