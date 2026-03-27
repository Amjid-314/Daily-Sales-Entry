import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  RefreshCw, 
  AlertTriangle, 
  LayoutDashboard, 
  Target, 
  History, 
  Search 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line 
} from 'recharts';
import { isTSMEntry } from '../lib/utils';
import { BRAND_GROUP_NAMES, BRAND_GROUPS, CATEGORIES, SKUS } from '../types';

const ReportsView = ({ history, obAssignments, tsmList, appConfig, getPSTDate, userRole, userName, userRegion, userContact, onRefresh, isSyncing, selectedMonth, setSelectedMonth }: any) => {
  const currentMonth = selectedMonth || getPSTDate().slice(0, 7);
  const today = getPSTDate();
  const dayOfMonth = parseInt(today.split('-')[2]);
  const normalizedRole = (userRole || '').trim().toUpperCase();
  const isStaff = ['ADMIN', 'SUPER ADMIN', 'TSM', 'ASM', 'RSM', 'NSM', 'DIRECTOR', 'SC', 'OB'].includes(normalizedRole);
  
  const [selectedAnalysisRoute, setSelectedAnalysisRoute] = useState('');
  const [selectedAnalysisOB, setSelectedAnalysisOB] = useState('');
  const [matrixView, setMatrixView] = useState('Total');
  const [targetView, setTargetView] = useState('Brand');

  const filteredOBs = useMemo(() => {
    let obs = [];
    if (userRole === 'Admin' || userRole === 'Super Admin') {
      obs = obAssignments;
    } else if (userRole === 'Director') {
      obs = obAssignments.filter((ob: any) => (ob.director || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    } else if (userRole === 'NSM') {
      obs = obAssignments.filter((ob: any) => (ob.nsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    } else if (userRole === 'RSM' || userRole === 'SC') {
      obs = obAssignments.filter((ob: any) => (ob.region || '').trim().toLowerCase() === (userRegion || '').trim().toLowerCase() || (ob.rsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase() || (ob.sc || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    } else if ((userRole === 'TSM' || userRole === 'ASM')) {
      obs = obAssignments.filter((ob: any) => (ob.tsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    } else if (userRole === 'OB') {
      obs = obAssignments.filter((ob: any) => (ob.contact || '').trim() === (userContact || '').trim());
    }
    
    // Exclude TSM entries and Test OBs from reports
    return obs.filter((ob: any) => !isTSMEntry(ob.name, ob.tsm) && !ob.name.toLowerCase().includes('test'));
  }, [obAssignments, userRole, userRegion, userName, userContact]);

  const reportsMonthStats = useMemo(() => {
    return history.filter((h: any) => h.date.startsWith(currentMonth));
  }, [history, currentMonth]);

  const alerts = useMemo(() => {
    const list: any[] = [];
    filteredOBs.forEach((ob: any) => {
      const obStats = reportsMonthStats.filter((s: any) => s.ob_contact === ob.contact);
      const visited = obStats.reduce((sum: number, s: any) => sum + s.visited_shops, 0);
      const productive = obStats.reduce((sum: number, s: any) => sum + s.productive_shops, 0);
      const productivity = visited > 0 ? (productive / visited) * 100 : 0;
      
      if (visited > 50 && productivity < 20) {
        list.push({
          type: 'Low Productivity',
          title: ob.name,
          desc: `${productivity.toFixed(1)}% Productivity (${ob.town})`,
          severity: 'high'
        });
      }

      const sortedStats = [...obStats].sort((a, b) => b.date.localeCompare(a.date));
      if (sortedStats.length > 0) {
        const lastDate = new Date(sortedStats[0].date);
        const todayDate = new Date(getPSTDate());
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 3) {
          list.push({
            type: 'Inactivity',
            title: ob.name,
            desc: `No submission for ${diffDays} days`,
            severity: 'critical'
          });
        }
      }
    });
    return list;
  }, [filteredOBs, reportsMonthStats, getPSTDate]);

  const routeAnalysisData = useMemo(() => {
    if (!selectedAnalysisOB || !selectedAnalysisRoute) return null;
    const obOrders = history.filter((h: any) => h.ob_contact === selectedAnalysisOB && h.route === selectedAnalysisRoute);
    const last16 = obOrders.sort((a: any, b: any) => b.date.localeCompare(a.date)).slice(0, 16);
    
    return last16.reverse().map((h: any) => {
      const data = h.order_data || {};
      const brandSales: Record<string, number> = {};
      let totalSales = 0;
      CATEGORIES.forEach((cat: string) => {
        const sales = SKUS.filter((s: any) => s.category === cat).reduce((sum: number, sku: any) => {
          const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
          return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
        }, 0);
        brandSales[cat] = sales;
        totalSales += sales;
      });
      return {
        date: h.date,
        visited: h.visited_shops,
        productive: h.productive_shops,
        totalSales,
        brandSales,
        visit_type: h.visit_type
      };
    });
  }, [history, selectedAnalysisOB, selectedAnalysisRoute]);

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen pb-40">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-seablue uppercase tracking-tight leading-none">Performance Reports</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Detailed Analysis & Sales Matrix</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-xl border border-white/60">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input 
                type="month" 
                value={currentMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-[11px] font-black text-slate-600 focus:outline-none bg-transparent"
              />
            </div>
            <button 
              onClick={onRefresh}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-seablue text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-seablue/90 transition-all shadow-lg shadow-seablue/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Irregular Activities & Performance Gaps */}
      <section className="card-clean bg-amber-50 border border-amber-100 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-amber-900 uppercase tracking-tight">Irregular Activities & Performance Gaps</h2>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Critical Alerts for {currentMonth}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.length === 0 ? (
            <div className="col-span-full py-8 text-center text-amber-600 font-bold uppercase text-[10px] tracking-widest">No critical alerts found for this period</div>
          ) : (
            alerts.map((alert, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col gap-1">
                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">{alert.type}</span>
                <h4 className="text-xs font-black text-slate-800">{alert.title}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{alert.desc}</p>
              </div>
            ))
          )}
        </div>
      </section>

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
              <optgroup label="Category-wise">
                {BRAND_GROUP_NAMES.map(cat => <option key={`cat_${cat}`} value={`cat_${cat}`}>{cat}</option>)}
              </optgroup>
              <optgroup label="Brand-wise">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </optgroup>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left min-w-[1200px] border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-4 py-3 sticky left-0 bg-slate-50/90 backdrop-blur-sm z-10 border-r border-slate-100 whitespace-nowrap w-24 sm:w-32 truncate" title="OB Name">OB Name</th>
                <th className="px-4 py-3 text-center border-r border-slate-100/50 whitespace-nowrap">Hierarchy</th>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <th key={day} className="px-2 py-3 text-center border-r border-slate-100/50 whitespace-nowrap">{day}</th>
                ))}
                <th className="px-4 py-3 text-right bg-slate-50/90 backdrop-blur-sm sticky right-0 z-10 border-l border-slate-100 whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOBs.map((ob: any, idx: number) => {
                const obStats = reportsMonthStats.filter((h: any) => h.ob_contact === ob.contact);
                let total = 0;
                return (
                  <tr key={ob.contact || `ob-matrix-${idx}`} className="group hover:bg-slate-50/80 transition-all">
                    <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10 text-[10px] font-black text-slate-700 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] whitespace-nowrap w-24 sm:w-32 truncate" title={ob.name}>{ob.name}</td>
                    <td className="px-4 py-3 text-center border-r border-slate-100/50 whitespace-nowrap">
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none">National &gt; {ob.region || 'N/A'}</p>
                      <p className="text-[9px] font-black text-seablue uppercase mt-0.5">{ob.town || 'N/A'}</p>
                    </td>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day, dIdx) => {
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
                        } else if (matrixView.startsWith('cat_')) {
                          const categoryName = matrixView.replace('cat_', '');
                          const brandsInGroup = BRAND_GROUPS[categoryName] || [];
                          return sum + SKUS.filter(s => brandsInGroup.includes(s.category)).reduce((s, sku) => {
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
                      const hasRR = dayOrders.some((h: any) => h.visit_type === 'RR');
                      const hasNormal = dayOrders.some((h: any) => h.visit_type !== 'RR' && h.visit_type !== 'Absent');
                      const cellBg = hasRR ? 'bg-yellow-100' : (hasNormal ? 'bg-green-50' : '');
                      return (
                        <td key={`${ob.contact}-${day}-${dIdx}`} className={`px-2 py-3 text-center text-[10px] border-r border-slate-100/30 font-mono ${cellBg} ${daySales > 0 ? 'font-black text-seablue' : 'text-slate-200'}`}>
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

      {/* Target vs Achievement (MTD) */}
      <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{targetView} Target vs Achievement (MTD)</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase">View:</span>
            <select 
              className="input-clean text-[10px] py-1 px-2 rounded-lg"
              value={targetView}
              onChange={(e) => setTargetView(e.target.value)}
            >
              <option value="Brand">Brand-wise</option>
              <option value="Category">Category-wise</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4 whitespace-nowrap">{targetView} Name</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Target</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Achievement</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Ach %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(targetView === 'Brand' ? CATEGORIES : BRAND_GROUP_NAMES).map(cat => {
                let catTarget = 0;
                let catAch = 0;

                if (targetView === 'Brand') {
                  catTarget = filteredOBs.reduce((sum: number, ob: any) => sum + (ob.targets?.[cat] || 0), 0);
                  const filteredOBContacts = new Set(filteredOBs.map((ob: any) => ob.contact));
                  catAch = history
                    .filter((h: any) => h.date.startsWith(currentMonth) && filteredOBContacts.has(h.ob_contact))
                    .reduce((sum: number, h: any) => {
                      const data = h.order_data || {};
                      return sum + SKUS.filter((s: any) => s.category === cat).reduce((s: number, sku: any) => {
                        const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                        const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                        return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                      }, 0);
                    }, 0);
                } else {
                  const brandsInGroup = BRAND_GROUPS[cat] || [];
                  catTarget = filteredOBs.reduce((sum: number, ob: any) => {
                    return sum + brandsInGroup.reduce((s, brand) => s + (ob.targets?.[brand] || 0), 0);
                  }, 0);
                  const filteredOBContacts = new Set(filteredOBs.map((ob: any) => ob.contact));
                  catAch = history
                    .filter((h: any) => h.date.startsWith(currentMonth) && filteredOBContacts.has(h.ob_contact))
                    .reduce((sum: number, h: any) => {
                      const data = h.order_data || {};
                      return sum + SKUS.filter((s: any) => brandsInGroup.includes(s.category)).reduce((s: number, sku: any) => {
                        const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                        const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                        return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                      }, 0);
                    }, 0);
                }

                const percent = catTarget > 0 ? (catAch / catTarget) * 100 : 0;
                return (
                  <tr key={cat} className="group hover:bg-slate-50/80 transition-all">
                    <td className="px-6 py-4 text-xs font-black text-slate-700 group-hover:text-seablue transition-colors whitespace-nowrap">{cat}</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500 font-mono whitespace-nowrap">{catTarget.toFixed(1)}</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-seablue font-mono whitespace-nowrap">{catAch.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
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
            <div className="flex flex-col">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Route Analysis (Last 16 Visits)</h3>
              {selectedAnalysisOB && (
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                  National &gt; {filteredOBs.find((ob: any) => ob.contact === selectedAnalysisOB)?.region || 'N/A'} &gt; {filteredOBs.find((ob: any) => ob.contact === selectedAnalysisOB)?.town || 'N/A'}
                </p>
              )}
            </div>
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
          <div className="space-y-6">
            <div className="px-6 pt-6">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={routeAnalysisData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      hide 
                    />
                    <YAxis 
                      tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalSales" 
                      stroke="#1e3a8a" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#1e3a8a', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      name="Total Sales"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="productive" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                      name="Productive Shops"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-seablue"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Sales Trend</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Productivity Trend</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4 whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Visited</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Productive</th>
                  {CATEGORIES.map(cat => <th key={cat} className="px-6 py-4 text-center whitespace-nowrap">{cat}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {routeAnalysisData.map((h: any) => (
                  <tr key={h.date} className={`group hover:bg-slate-50/80 transition-all ${h.visit_type === 'RR' ? 'bg-yellow-100' : 'bg-green-50'}`}>
                    <td className="px-6 py-4 text-xs font-black text-slate-700 font-mono whitespace-nowrap">{h.date}</td>
                    <td className="px-6 py-4 text-center text-xs text-slate-500 font-bold whitespace-nowrap">{h.visited}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{h.productive}</span>
                    </td>
                    {CATEGORIES.map(cat => (
                      <td key={cat} className="px-6 py-4 text-center text-xs font-mono text-seablue font-black whitespace-nowrap">{h.brandSales[cat].toFixed(1)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                        const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
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

export default ReportsView;
