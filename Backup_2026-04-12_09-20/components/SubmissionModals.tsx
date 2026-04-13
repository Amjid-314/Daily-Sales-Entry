import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { CATEGORIES, SKUS } from '../types';

interface SubmissionModalsProps {
  isConfirming: boolean;
  setIsConfirming: (v: boolean) => void;
  confirmSubmit: () => void;
  lastSubmittedOrder: any;
  setLastSubmittedOrder: (v: any) => void;
  message: { text: string; type: 'success' | 'error' | 'info' } | null;
  confirmModal: { message: string; onConfirm: () => void; onCancel: () => void } | null;
  order: any;
}

export const SubmissionModals: React.FC<SubmissionModalsProps> = ({
  isConfirming,
  setIsConfirming,
  confirmSubmit,
  lastSubmittedOrder,
  setLastSubmittedOrder,
  message,
  confirmModal,
  order,
}) => {
  return (
    <>
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
                      const target = lastSubmittedOrder.targets?.[cat] || 0;
                      return `${cat}: ${catTotal.toFixed(2)} / ${target.toFixed(2)} ${label} (Brand Target)`;
                    }).join('\n');
 
                    const summary = `Sales Summary\n` +
                      `${lastSubmittedOrder.date}\n` +
                      `OB: ${lastSubmittedOrder.order_booker || lastSubmittedOrder.orderBooker}\n` +
                      `Town Name: ${lastSubmittedOrder.town}\n` +
                      `Route: ${lastSubmittedOrder.route}\n` +
                      `Shops T/V/P: ${lastSubmittedOrder.totalShops || 50}/${lastSubmittedOrder.visitedShops}/${lastSubmittedOrder.productiveShops}\n` +
                      `------------------\n` +
                      `SKU Details:\n${skuDetails}\n` +
                      `------------------\n` +
                      `${brandTotals}\n` +
                      `------------------\n` +
                      `Total Achievement: ${totalAch.toFixed(2)}`;
                    
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
    </>
  );
};
