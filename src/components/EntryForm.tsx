import React from 'react';
import { motion } from 'motion/react';
import { EyeOff, Target, Store } from 'lucide-react';
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
}) => {
  return (
    <main className="max-w-4xl mx-auto p-4 space-y-6 pb-40">
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
                    <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 min-w-[50px]">
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Brand Target</span>
                      </div>
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
                              <div className="text-xs font-bold text-slate-700 leading-tight">{sku.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{sku.unitsPerCarton}u</div>
                            </td>
                            <td className="px-1 py-1.5"><input ref={el => inputRefs.current[`${sku.id}-ctn`] = el} type="number" inputMode="numeric" autoComplete="off" value={item.ctn || ''} onChange={(e) => handleInputChange(sku.id, 'ctn', e.target.value)} onKeyDown={(e) => handleKeyDown(e, `${sku.id}-ctn`)} className="input-clean w-full py-3 text-center text-base" /></td>
                            {category !== "Match" && (
                              <td className="px-1 py-1.5"><input ref={el => inputRefs.current[`${sku.id}-dzn`] = el} type="number" inputMode="numeric" autoComplete="off" disabled={sku.unitsPerDozen === 0} value={item.dzn || ''} onChange={(e) => handleInputChange(sku.id, 'dzn', e.target.value)} onKeyDown={(e) => handleKeyDown(e, `${sku.id}-dzn`)} className="input-clean w-full py-3 text-center text-base disabled:opacity-30" /></td>
                            )}
                            <td className="px-1 py-1.5"><input ref={el => inputRefs.current[`${sku.id}-pks`] = el} type="number" inputMode="numeric" autoComplete="off" value={item.pks || ''} onChange={(e) => handleInputChange(sku.id, 'pks', e.target.value)} onKeyDown={(e) => handleKeyDown(e, `${sku.id}-pks`)} className="input-clean w-full py-3 text-center text-base" /></td>
                            <td className="px-2 py-1.5 text-right font-mono text-sm font-bold text-seablue">{calculateTotalCartons(sku.id).toFixed(3)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
            {/* MTD Target vs Achievement Summary */}
            <section className="card-clean p-4 bg-white shadow-xl shadow-slate-200/40 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-seablue" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest text-[10px]">MTD Target vs Achievement Summary</h3>
              </div>
              <div className="overflow-x-auto scrollbar-thin pb-2">
                <div className="flex gap-4 min-w-max">
                  {CATEGORIES.map(cat => {
                    const ach = mtdCategoryTotals[cat] || 0;
                    const target = order.targets[cat] || 0;
                    const percent = target > 0 ? (ach / target) * 100 : 0;
                    return (
                      <div key={cat} className="flex flex-col p-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-[140px]">
                        <span className="text-[9px] font-black text-slate-400 uppercase mb-1">{cat}</span>
                        <div className="flex items-end justify-between">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-black text-seablue">{ach.toFixed(1)}</span>
                            <span className="text-[8px] font-bold text-slate-400">Target: {target.toFixed(1)}</span>
                          </div>
                          <span className={`text-[10px] font-black ${percent >= 100 ? 'text-emerald-600' : percent >= 80 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {percent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </>
      ) : (
        <div className="card-clean p-12 flex flex-col items-center justify-center text-slate-400 space-y-4">
          <Store className="w-12 h-12 opacity-20" />
          <p className="text-xs font-bold uppercase tracking-widest">Select an Order Booker to start</p>
        </div>
      )}
    </main>
  );
};
