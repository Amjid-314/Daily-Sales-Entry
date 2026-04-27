import React from 'react';
import { motion } from 'motion/react';
import { EyeOff, Target, Store, Activity } from 'lucide-react';
import { SKU, CATEGORIES, SKUS } from '../types';

interface EntryFormProps {
  order: any;
  setOrder: React.Dispatch<React.SetStateAction<any>>;
  categoryTotals: Record<string, number>;
  mtdCategoryTotals: Record<string, number>;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  handleKeyDown: (e: React.KeyboardEvent, currentId: string) => void;
  handleTargetChange: (category: string, value: number) => void;
  handleInputChange: (skuId: string, field: 'ctn' | 'dzn' | 'pks', value: string) => void;
  calculateTotalCartons: (skuId: string) => number;
  currentDistributorStock?: Record<string, any>;
}

export const EntryForm: React.FC<EntryFormProps> = ({
  order,
  setOrder,
  categoryTotals,
  mtdCategoryTotals,
  inputRefs,
  handleKeyDown,
  handleTargetChange,
  handleInputChange,
  calculateTotalCartons,
  currentDistributorStock = {},
}) => {
  return (
    <main className="max-w-4xl mx-auto p-2 space-y-4 pb-40">
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
                    ref={el => inputRefs.current[`prod-${category}`] = el}
                    type="number" 
                    inputMode="numeric" 
                    autoComplete="off" 
                    placeholder="0"
                    value={order.categoryProductiveShops[category] || ''} 
                    onChange={(e) => setOrder((prev: any) => ({ ...prev, categoryProductiveShops: { ...prev.categoryProductiveShops, [category]: parseInt(e.target.value) || 0 } }))} 
                    onKeyDown={(e) => handleKeyDown(e, `prod-${category}`)}
                    className={`w-6 text-center text-[10px] font-bold focus:outline-none bg-transparent ${categoryTotals[category] > 0 && (order.categoryProductiveShops[category] || 0) <= 0 ? 'text-red-700' : 'text-seablue'}`} 
                  />
                </div>

                {/* 3rd: Today Sales */}
                <div className="flex flex-col items-center bg-slate-100 rounded-lg px-2 py-0.5 shadow-sm border border-slate-200 min-w-[45px]">
                  <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">Today</span>
                  <span className="text-[10px] font-black text-slate-700 leading-tight">{categoryTotals[category].toFixed(2)}</span>
                </div>

                {/* 4th: MTD Ach */}
                <div className="flex flex-col items-center bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5 min-w-[45px]">
                  <span className="text-[6px] font-black text-emerald-400 uppercase tracking-tighter">MTD Ach</span>
                  <span className="text-[10px] font-black text-emerald-700 leading-tight">{mtdCategoryTotals[category].toFixed(2)}</span>
                </div>

                {/* 5th: Brand Target */}
                <div className="flex flex-col items-center bg-white border border-slate-200 rounded-lg px-2 py-0.5 min-w-[50px] shadow-sm">
                  <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">Budget</span>
                  <input 
                    ref={el => inputRefs.current[`target-${category}`] = el}
                    type="number" 
                    inputMode="decimal"
                    autoComplete="off"
                    value={order.targets[category] || ''} 
                    onChange={(e) => handleTargetChange(category, parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => handleKeyDown(e, `target-${category}`)}
                    className="w-10 text-center text-[11px] font-bold text-slate-600 bg-transparent focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400">
                    <th className="px-4 py-2">SKU Details</th>
                    <th className="px-2 py-2 text-center w-20">Ctn</th>
                    {category !== "Match" && <th className="px-2 py-2 text-center w-20">Dzn</th>}
                    <th className="px-2 py-2 text-center w-20">Pks</th>
                    <th className="px-4 py-2 text-right w-24">Total ach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {SKUS.filter(s => s.category === category).map(sku => {
                    const item = order.items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                    const totalAch = calculateTotalCartons(sku.id);
                    const availableStock = Number(currentDistributorStock[sku.id]?.ctn || 0);
                    const isExceeding = totalAch > availableStock && availableStock > 0;

                    return (
                      <tr key={sku.id} className={`hover:bg-slate-50/50 transition-colors ${isExceeding ? 'bg-red-50/30' : ''}`}>
                        <td className="px-2 py-1.5">
                          <div className="text-xs font-black text-slate-700 leading-tight">{sku.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                             <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{sku.unitsPerCarton}u</div>
                             {availableStock > 0 ? (
                               <div className={`text-[9px] font-black px-1 rounded ${isExceeding ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                 Stock: {availableStock.toFixed(1)}
                               </div>
                             ) : (
                               <div className="text-[9px] font-bold text-slate-300 italic">Stock: 0.0</div>
                             )}
                          </div>
                        </td>
                        <td className="px-1 py-1.5"><input ref={el => inputRefs.current[`${sku.id}-ctn`] = el} type="number" inputMode="numeric" autoComplete="off" value={item.ctn || ''} onChange={(e) => handleInputChange(sku.id, 'ctn', e.target.value)} onKeyDown={(e) => handleKeyDown(e, `${sku.id}-ctn`)} className={`input-clean w-full py-2.5 text-center text-sm font-black ${isExceeding ? 'border-red-500 ring-1 ring-red-200' : ''}`} /></td>
                        {category !== "Match" && (
                          <td className="px-1 py-1.5"><input ref={el => inputRefs.current[`${sku.id}-dzn`] = el} type="number" inputMode="numeric" autoComplete="off" disabled={sku.unitsPerDozen === 0} value={item.dzn || ''} onChange={(e) => handleInputChange(sku.id, 'dzn', e.target.value)} onKeyDown={(e) => handleKeyDown(e, `${sku.id}-dzn`)} className="input-clean w-full py-2.5 text-center text-sm font-black disabled:opacity-30" /></td>
                        )}
                        <td className="px-1 py-1.5"><input ref={el => inputRefs.current[`${sku.id}-pks`] = el} type="number" inputMode="numeric" autoComplete="off" value={item.pks || ''} onChange={(e) => handleInputChange(sku.id, 'pks', e.target.value)} onKeyDown={(e) => handleKeyDown(e, `${sku.id}-pks`)} className="input-clean w-full py-2.5 text-center text-sm font-black" /></td>
                        <td className={`px-2 py-1.5 text-right font-mono text-xs font-black ${isExceeding ? 'text-red-600' : 'text-seablue'}`}>
                          {totalAch.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        {/* MTD Performance Summary in Foot */}
        <section className="card-clean p-4 bg-slate-900 text-white shadow-2xl mt-4 rounded-[2rem]">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-seablue" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">MTD Performance vs Target</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {CATEGORIES.map(cat => {
              const ach = mtdCategoryTotals[cat] || 0;
              const target = order.targets[cat] || 0;
              const percent = target > 0 ? (ach / target) * 100 : 0;
              return (
                <div key={cat} className="flex flex-col p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase mb-1 truncate">{cat}</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-black text-white">{ach.toFixed(1)}</span>
                    <span className={`text-[10px] font-black ${percent >= 100 ? 'text-emerald-400' : percent >= 80 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full mt-1 overflow-hidden">
                     <div className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : percent >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, percent)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

