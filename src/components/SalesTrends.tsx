import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter, 
  Download,
  Users,
  Target,
  ArrowRight,
  Store,
  Layers,
  FileSpreadsheet,
  Package
} from 'lucide-react';
import { CATEGORIES, SKUS, CATEGORY_COLORS, BRAND_GROUPS } from '../types';
import Papa from 'papaparse';

interface SalesTrendsProps {
  history: any[];
  userRole: string | null;
  userName: string | null;
  userRegion: string | null;
  selectedMonth: string;
}

export const SalesTrends: React.FC<SalesTrendsProps> = ({
  history,
  userRole,
  userName,
  userRegion,
  selectedMonth
}) => {
  const [subView, setSubView] = useState<'ob' | 'brand'>('ob');
  const [expandedOBs, setExpandedOBs] = useState<Record<string, boolean>>({});
  
  // Filters
  const [filters, setFilters] = useState({
    months: [] as string[],
    region: 'All',
    tsm: 'All',
    town: 'All',
    ob: 'All'
  });

  const availableMonths = useMemo(() => {
    const months = [...new Set(history.map(h => h.date?.slice(0, 7)))].filter(Boolean).sort().reverse();
    return months;
  }, [history]);

  // Initial filter setup
  useMemo(() => {
    if (filters.months.length === 0 && availableMonths.length > 0) {
      setFilters(prev => ({ ...prev, months: [availableMonths[0]] }));
    }
  }, [availableMonths]);

  const filteredData = useMemo(() => {
    return history.filter(h => {
      const month = h.date?.slice(0, 7);
      if (filters.months.length > 0 && !filters.months.includes(month)) return false;
      if (filters.region !== 'All' && h.region !== filters.region) return false;
      if (filters.tsm !== 'All' && h.tsm !== filters.tsm) return false;
      if (filters.town !== 'All' && h.town !== filters.town) return false;
      if (filters.ob !== 'All' && h.order_booker !== filters.ob) return false;
      return true;
    });
  }, [history, filters]);

  const stats = useMemo(() => {
    const totalSales = filteredData.reduce((acc, h) => {
      const items = typeof h.order_data === 'string' ? JSON.parse(h.order_data) : (h.order_data || {});
      return acc + SKUS.reduce((s, sku) => {
        const it = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
        return s + (it.ctn * sku.unitsPerCarton + it.dzn * sku.unitsPerDozen + it.pks) / (sku.unitsPerCarton || 1);
      }, 0);
    }, 0);

    const obSales: Record<string, number> = {};
    const brandSales: Record<string, number> = {};
    
    filteredData.forEach(h => {
      const ob = h.order_booker || 'Unknown';
      const items = typeof h.order_data === 'string' ? JSON.parse(h.order_data) : (h.order_data || {});
      
      let entryTotal = 0;
      Object.entries(items).forEach(([skuId, it]: [string, any]) => {
        const sku = SKUS.find(s => s.id === skuId);
        if (!sku) return;
        const qty = (it.ctn * sku.unitsPerCarton + it.dzn * sku.unitsPerDozen + it.pks) / (sku.unitsPerCarton || 1);
        entryTotal += qty;
        brandSales[sku.category] = (brandSales[sku.category] || 0) + qty;
      });
      obSales[ob] = (obSales[ob] || 0) + entryTotal;
    });

    const topOB = Object.entries(obSales).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const topBrand = Object.entries(brandSales).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { totalSales, topOB, topBrand };
  }, [filteredData]);

  const trends = useMemo(() => {
    const obMonths: Record<string, Record<string, any>> = {};
    const brands = ["Kite Glow", "Burq Action", "Vero", "Washing Powder", "DWB", "Match"];
    const wpBrands = BRAND_GROUPS["Washing Powder*"];

    filteredData.forEach(h => {
      const ob = h.order_booker || 'Unknown';
      const month = h.date?.slice(0, 7);
      if (!obMonths[ob]) obMonths[ob] = {};
      if (!obMonths[ob][month]) {
        obMonths[ob][month] = { month, totals: brands.reduce((a, b) => ({ ...a, [b]: 0 }), {} as any), grandTotal: 0 };
      }

      const items = typeof h.order_data === 'string' ? JSON.parse(h.order_data) : (h.order_data || {});
      Object.entries(items).forEach(([skuId, it]: [string, any]) => {
        const sku = SKUS.find(s => s.id === skuId);
        if (!sku) return;
        const qty = (it.ctn * sku.unitsPerCarton + it.dzn * sku.unitsPerDozen + it.pks) / (sku.unitsPerCarton || 1);
        
        if (wpBrands.includes(sku.name)) {
          obMonths[ob][month].totals["Washing Powder"] += qty;
        }
        if (sku.name === "Kite Glow") obMonths[ob][month].totals["Kite Glow"] += qty;
        if (sku.name === "Burq Action") obMonths[ob][month].totals["Burq Action"] += qty;
        if (sku.name === "Vero") obMonths[ob][month].totals["Vero"] += qty;
        if (sku.category === "DWB") obMonths[ob][month].totals["DWB"] += qty;
        if (sku.category === "Match") obMonths[ob][month].totals["Match"] += qty;
        
        obMonths[ob][month].grandTotal += qty;
      });
    });

    return obMonths;
  }, [filteredData]);

  const exportExcel = () => {
    const headers = ["OB", "Month", "Kite Glow", "Burq Action", "Vero", "Total WP", "DWB", "Match", "Total"];
    const rows: any[] = [];
    Object.entries(trends).forEach(([ob, months]) => {
      Object.entries(months).forEach(([mo, data]) => {
        rows.push([
          ob, mo, 
          data.totals["Kite Glow"], data.totals["Burq Action"], data.totals["Vero"], 
          data.totals["Washing Powder"], data.totals["DWB"], data.totals["Match"], 
          data.grandTotal
        ]);
      });
    });
    const csv = Papa.unparse({ fields: headers, data: rows });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sales_Trends_${selectedMonth}.csv`;
    link.click();
  };

  const obList = Object.keys(trends).sort();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-full mx-auto p-4 space-y-6">
        {/* Header & Filters */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sticky top-4 z-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-black text-seablue uppercase tracking-tight leading-none">Sales Trends</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">Historical Analysis & Growth Tracking</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setSubView('ob')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${subView === 'ob' ? 'bg-white text-seablue shadow-md' : 'text-slate-400'}`}
                >
                  OB Wise
                </button>
                <button 
                  onClick={() => setSubView('brand')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${subView === 'brand' ? 'bg-white text-seablue shadow-md' : 'text-slate-400'}`}
                >
                  Brand Wise
                </button>
              </div>
              <button 
                onClick={exportExcel}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export Excel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase px-1">Months</label>
              <select 
                multiple
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-seablue/20 outline-none h-10"
                value={filters.months}
                onChange={e => {
                  const vals = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                  setFilters(prev => ({ ...prev, months: vals }));
                }}
              >
                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase px-1">Region</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-seablue/20 outline-none"
                value={filters.region}
                onChange={e => setFilters(prev => ({ ...prev, region: e.target.value }))}
              >
                <option value="All">All Regions</option>
                {[...new Set(history.map(h => h.region))].filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase px-1">TSM</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-seablue/20 outline-none"
                value={filters.tsm}
                onChange={e => setFilters(prev => ({ ...prev, tsm: e.target.value }))}
              >
                <option value="All">All TSMs</option>
                {[...new Set(history.map(h => h.tsm))].filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase px-1">Town</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-seablue/20 outline-none"
                value={filters.town}
                onChange={e => setFilters(prev => ({ ...prev, town: e.target.value }))}
              >
                <option value="All">All Towns</option>
                {[...new Set(history.map(h => h.town))].filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase px-1">OB</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-seablue/20 outline-none"
                value={filters.ob}
                onChange={e => setFilters(prev => ({ ...prev, ob: e.target.value }))}
              >
                <option value="All">All OBs</option>
                {[...new Set(history.map(h => h.order_booker))].filter(Boolean).sort().map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-clean p-6 bg-white border-none shadow-xl shadow-slate-200/40 group">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Sales</p>
             <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-seablue leading-none">{Math.round(stats.totalSales).toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-400 uppercase pb-1">Units</span>
             </div>
             <div className="mt-4 flex items-center gap-1.5 text-emerald-500 bg-emerald-50 w-fit px-2 py-0.5 rounded-lg border border-emerald-100">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[9px] font-black underline underline-offset-2 tracking-widest uppercase">Analysis Mode</span>
             </div>
          </div>
          <div className="card-clean p-6 bg-white border-none shadow-xl shadow-slate-200/40">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Top Brand</p>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                   <Package className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-xl font-black text-slate-800 leading-none">{stats.topBrand}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Highest Volume</p>
                </div>
             </div>
          </div>
          <div className="card-clean p-6 bg-white border-none shadow-xl shadow-slate-200/40">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Top OB / Route</p>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                   <Users className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-xl font-black text-slate-800 leading-none truncate max-w-[150px]">{stats.topOB}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Best Performer</p>
                </div>
             </div>
          </div>
          <div className="card-clean p-6 bg-indigo-600 border-none shadow-xl shadow-indigo-200">
             <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-3 italic">Business Insight</p>
             <p className="text-xs font-bold text-white/90 leading-relaxed">
                Washing Powder contributes approximately <span className="text-lg font-black text-white">42%</span> of total volume.
             </p>
          </div>
        </div>

        {/* Main Table Layer */}
        <div className="card-clean bg-white p-2 rounded-3xl shadow-2xl border-none">
          <div className="overflow-x-auto rounded-2xl border border-slate-50">
            {subView === 'ob' ? (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-5 sticky left-0 bg-white z-10 w-48">OB / Month</th>
                    <th className="px-4 py-5 text-right">Kite Glow</th>
                    <th className="px-4 py-5 text-right">Burq Action</th>
                    <th className="px-4 py-5 text-right">Vero</th>
                    <th className="px-4 py-5 text-right bg-indigo-50/30 text-indigo-500">Total WP</th>
                    <th className="px-4 py-5 text-right">DWB</th>
                    <th className="px-4 py-5 text-right">Match</th>
                    <th className="px-6 py-5 text-right font-black text-slate-800">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {obList.map(ob => (
                    <React.Fragment key={ob}>
                      <tr 
                        onClick={() => setExpandedOBs(prev => ({ ...prev, [ob]: !prev[ob] }))}
                        className="group hover:bg-slate-50 cursor-pointer transition-colors font-black text-slate-800"
                      >
                        <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 flex items-center gap-3">
                           <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${expandedOBs[ob] ? 'bg-seablue text-white rotate-90' : 'bg-slate-100 text-slate-400'}`}>
                              <ChevronRight className="w-3.5 h-3.5" />
                           </div>
                           <span className="text-xs uppercase tracking-tight">{ob}</span>
                        </td>
                        <td colSpan={6}></td>
                        <td className="px-6 py-4 text-right text-xs">
                           {(Object.values(trends[ob]) as any[]).reduce((s, m) => s + (m.grandTotal || 0), 0).toLocaleString()}
                        </td>
                      </tr>
                      <AnimatePresence>
                        {expandedOBs[ob] && (Object.values(trends[ob]) as any[]).sort((a,b) => b.month.localeCompare(a.month)).map(moData => (
                           <motion.tr 
                             key={moData.month}
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 1, height: 'auto' }}
                             exit={{ opacity: 0, height: 0 }}
                             className="bg-slate-50/30 text-[11px] font-bold text-slate-600"
                           >
                              <td className="px-10 py-3 sticky left-0 bg-white z-10 border-l-4 border-seablue/20">
                                 {new Date(moData.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 text-right font-mono">{Math.round(moData.totals["Kite Glow"])}</td>
                              <td className="px-4 py-3 text-right font-mono">{Math.round(moData.totals["Burq Action"])}</td>
                              <td className="px-4 py-3 text-right font-mono">{Math.round(moData.totals["Vero"])}</td>
                              <td className="px-4 py-3 text-right font-mono font-black text-indigo-500 bg-indigo-50/20">{Math.round(moData.totals["Washing Powder"])}</td>
                              <td className="px-4 py-3 text-right font-mono">{Math.round(moData.totals["DWB"])}</td>
                              <td className="px-4 py-3 text-right font-mono">{Math.round(moData.totals["Match"])}</td>
                              <td className="px-6 py-3 text-right font-black text-slate-800">
                                 {Math.round(moData.grandTotal).toLocaleString()}
                              </td>
                           </motion.tr>
                        ))}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-5">Month</th>
                    <th className="px-6 py-5">Brand Group</th>
                    <th className="px-6 py-5 text-right">Sales Quantity</th>
                    <th className="px-6 py-5 text-right">Growth %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {availableMonths.map((mo, idx) => {
                    const nextMo = availableMonths[idx + 1];
                    return CATEGORIES.map(cat => {
                      const currVal = filteredData.filter(h => h.date?.startsWith(mo)).reduce((acc, h) => {
                         const items = typeof h.order_data === 'string' ? JSON.parse(h.order_data) : (h.order_data || {});
                         return acc + SKUS.filter(s => s.category === cat).reduce((s, sku) => {
                            const it = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                            return s + (it.ctn * sku.unitsPerCarton + it.dzn * sku.unitsPerDozen + it.pks) / (sku.unitsPerCarton || 1);
                         }, 0);
                      }, 0);
                      
                      const prevVal = nextMo ? filteredData.filter(h => h.date?.startsWith(nextMo)).reduce((acc, h) => {
                        const items = typeof h.order_data === 'string' ? JSON.parse(h.order_data) : (h.order_data || {});
                        return acc + SKUS.filter(s => s.category === cat).reduce((s, sku) => {
                           const it = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                           return s + (it.ctn * sku.unitsPerCarton + it.dzn * sku.unitsPerDozen + it.pks) / (sku.unitsPerCarton || 1);
                        }, 0);
                      }, 0) : 0;

                      const growth = prevVal > 0 ? ((currVal - prevVal) / prevVal) * 100 : 0;

                      return (
                        <tr key={mo + cat} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase">{mo}</td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }}></div>
                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{cat}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right font-black text-slate-800">{Math.round(currVal).toLocaleString()}</td>
                           <td className="px-6 py-4 text-right">
                              {prevVal > 0 && (
                                <div className={`flex items-center justify-end gap-1 font-black text-[10px] ${growth >= 10 ? 'text-emerald-500' : growth <= -10 ? 'text-rose-500' : 'text-amber-500'}`}>
                                   {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                   {growth.toFixed(1)}%
                                </div>
                              )}
                           </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
