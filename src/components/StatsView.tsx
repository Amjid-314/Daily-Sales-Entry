import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  RefreshCw, 
  Calendar, 
  Target, 
  Clock 
} from 'lucide-react';
import { isTSMEntry, calculateTotalBags } from '../lib/utils';

const StatsView = ({ history, obAssignments, tsmList, appConfig, getPSTDate, SKUS, CATEGORIES, userRole, userName, userRegion, userContact, onRefresh, isSyncing, selectedMonth, setSelectedMonth }: any) => {
  const currentMonth = selectedMonth || getPSTDate().slice(0, 7);
  const today = getPSTDate();
  
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
    
    // Exclude TSM entries and Test OBs from stats
    return obs.filter((ob: any) => !isTSMEntry(ob.name, ob.tsm) && !ob.name.toLowerCase().includes('test'));
  }, [obAssignments, userRole, userRegion, userName, userContact]);

  const monthStats = useMemo(() => {
    const filteredOBContacts = new Set(filteredOBs.map((ob: any) => ob.contact));
    const monthHistory = history.filter((h: any) => h.date.startsWith(currentMonth) && filteredOBContacts.has(h.ob_contact));
    
    const totalBags = monthHistory.reduce((sum: number, h: any) => sum + calculateTotalBags(h, SKUS), 0);
    const totalVisited = monthHistory.reduce((sum: number, h: any) => sum + (h.visited_shops || 0), 0);
    const totalProductive = monthHistory.reduce((sum: number, h: any) => sum + (h.productive_shops || 0), 0);
    
    const brandSales: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      brandSales[cat] = monthHistory.reduce((sum: number, h: any) => {
        const data = h.order_data || {};
        return sum + SKUS.filter(s => s.category === cat).reduce((s, sku) => {
          const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
          return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
        }, 0);
      }, 0);
    });

    const todayStats = monthHistory.filter((h: any) => h.date === today);
    const todayBags = todayStats.reduce((sum: number, h: any) => sum + calculateTotalBags(h, SKUS), 0);

    return {
      totalBags,
      totalVisited,
      totalProductive,
      brandSales,
      todayBags,
      submissionCount: monthHistory.length,
      activeOBs: new Set(monthHistory.map((h: any) => h.ob_contact)).size
    };
  }, [history, currentMonth, filteredOBs, SKUS, CATEGORIES, today]);

  const statsCards = [
    { label: 'MTD Sales', value: monthStats.totalBags.toFixed(1), unit: 'Bags', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Today Sales', value: monthStats.todayBags.toFixed(1), unit: 'Bags', icon: Clock, color: 'text-seablue', bg: 'bg-blue-50' },
    { label: 'Active OBs', value: monthStats.activeOBs, unit: `of ${filteredOBs.length}`, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Productivity', value: monthStats.totalVisited > 0 ? ((monthStats.totalProductive / monthStats.totalVisited) * 100).toFixed(1) : '0', unit: '%', icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen pb-40">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-seablue uppercase tracking-tight leading-none">Sales Statistics</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Monthly Performance Overview</p>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3"
          >
            <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center shadow-sm`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-black ${card.color}`}>{card.value}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{card.unit}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card-clean bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Brand-wise Sales (MTD)</h3>
          </div>
          <div className="space-y-4">
            {CATEGORIES.map(cat => {
              const sales = monthStats.brandSales[cat] || 0;
              const maxSales = Math.max(...Object.values(monthStats.brandSales), 1);
              const percent = (sales / maxSales) * 100;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-600 uppercase">{cat}</span>
                    <span className="text-[10px] font-black text-seablue font-mono">{sales.toFixed(1)} Bags</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      className="h-full bg-seablue rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card-clean bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Top Performing OBs (MTD)</h3>
          </div>
          <div className="space-y-3">
            {filteredOBs
              .map(ob => {
                const obHistory = history.filter(h => h.ob_contact === ob.contact && h.date.startsWith(currentMonth));
                const sales = obHistory.reduce((sum, h) => sum + calculateTotalBags(h, SKUS), 0);
                return { ...ob, sales };
              })
              .sort((a, b) => b.sales - a.sales)
              .slice(0, 5)
              .map((ob, i) => (
                <div key={ob.contact} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100 shadow-sm">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700">{ob.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{ob.town}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-seablue font-mono">{ob.sales.toFixed(1)}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Bags</p>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StatsView;
