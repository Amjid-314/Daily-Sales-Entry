import React from 'react';
import { motion } from 'motion/react';
import { History, RefreshCw, Loader2, ClipboardList } from 'lucide-react';
import Papa from 'papaparse';
import { MainNav } from './MainNav';
import { WhatsAppIcon } from './WhatsAppIcon';

interface HistoryViewProps {
  view: string;
  setView: (v: any) => void;
  userRole: string | null;
  handleLogout: () => void;
  isLoadingHistory: boolean;
  history: any[];
  historyPage: number;
  itemsPerPage: number;
  lastUpdated: string;
  fetchHistory: (force?: boolean) => void;
  SKUS: any[];
  obAssignments: any[];
  historyFilters: any;
  setHistoryFilters: (f: any | ((prev: any) => any)) => void;
  tsmList: string[];
  groupedHistory: any[];
  setMessage: (m: any) => void;
  calculateAchievement: (data: any) => any;
  CATEGORIES: string[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  view,
  setView,
  userRole,
  handleLogout,
  isLoadingHistory,
  history,
  historyPage,
  itemsPerPage,
  lastUpdated,
  fetchHistory,
  SKUS,
  obAssignments,
  historyFilters,
  setHistoryFilters,
  tsmList,
  groupedHistory,
  setMessage,
  calculateAchievement,
  CATEGORIES,
}) => {
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

          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none w-full">
            <select 
              value={historyFilters.tsm} 
              onChange={(e) => {
                const val = e.target.value;
                setHistoryFilters((prev: any) => ({ ...prev, tsm: val, ob: '' }));
                setTimeout(() => fetchHistory(), 0);
              }}
              className="input-clean text-[10px] py-1 px-1.5 min-w-[90px] flex-1"
            >
              <option value="">All TSMs</option>
              {tsmList.map(tsm => <option key={tsm} value={tsm}>{tsm}</option>)}
            </select>
            <select 
              value={historyFilters.ob} 
              onChange={(e) => {
                const val = e.target.value;
                setHistoryFilters((prev: any) => ({ ...prev, ob: val }));
                setTimeout(() => fetchHistory(), 0);
              }}
              className="input-clean text-[10px] py-1 px-1.5 min-w-[90px] flex-1"
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
                setHistoryFilters((prev: any) => ({ ...prev, from: val }));
                setTimeout(() => fetchHistory(), 0);
              }}
              className="input-clean text-[10px] py-1 px-1 min-w-[100px] flex-1"
            />
            <input 
              type="date" 
              value={historyFilters.to} 
              onChange={(e) => {
                const val = e.target.value;
                setHistoryFilters((prev: any) => ({ ...prev, to: val }));
                setTimeout(() => fetchHistory(), 0);
              }}
              className="input-clean text-[10px] py-1 px-1 min-w-[100px] flex-1"
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
                      {group.entries.map((h: any) => {
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
                          <tr key={h.id} className={`hover:bg-slate-50/50 transition-colors group ${h.visit_type === 'RR' ? 'bg-yellow-100' : (h.visit_type !== 'Absent' ? 'bg-green-50' : '')}`}>
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
                                    const prefix = (sku.category === 'DWB' || sku.category === 'Kite Glow' || sku.category === 'Burq Action' || sku.category === 'Vero') ? 'DWB ' : (sku.category === 'Match' ? 'Match ' : '');
                                    return `${prefix}${sku.name}: ${totalCtns.toFixed(2)} ${label}`;
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
                                    return sum + Object.values(ach).reduce((a: number, b: number) => a + b, 0);
                                  }, 0);

                                  const summary = `*Sales Summary*\n` +
                                    `*${h.date}*\n` +
                                    `*OB:* ${h.order_booker}\n` +
                                    `*Town:* ${h.town}\n` +
                                    `*Route:* ${h.route}\n` +
                                    `*Shops T/V/P:* ${h.total_shops}/${h.visited_shops}/${h.productive_shops}\n` +
                                    `------------------\n` +
                                    `*SKU Details:*\n${skuDetails}\n` +
                                    `------------------\n` +
                                    CATEGORIES.map(cat => {
                                      const label = cat === 'Kite Glow' || cat === 'Burq Action' || cat === 'Vero' ? 'Bags' : 'Ctns';
                                      const mtd = mtdBrandSales.split('\n').find(l => l.startsWith(cat))?.split(': ')[1] || '0.00';
                                      return `*${cat}:* ${totals[cat].toFixed(2)} ${label}\nMTD: ${mtd}`;
                                    }).join('\n\n') +
                                    `\n------------------\n` +
                                    `*Total Today:* ${totalAch.toFixed(2)} Bags\n` +
                                    `*Total MTD:* ${mtdTotal.toFixed(2)} Bags\n` +
                                    `*Total Target:* ${h.target_ctn || 0} Bags`;
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
        )}
      </main>
    </div>
  );
};
