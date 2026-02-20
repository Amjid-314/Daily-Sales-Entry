/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, 
  Send, 
  Trash2, 
  Calendar, 
  MapPin, 
  Store, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { SKUS, CATEGORIES, OrderState, OrderItem, SKU } from './types';

const STORAGE_KEY = 'ob_order_draft';

export default function App() {
  const [order, setOrder] = useState<OrderState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      date: new Date().toISOString().split('T')[0],
      route: '',
      visitedShops: 0,
      productiveShops: 0,
      items: {}
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
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

  const handleMetaChange = (field: keyof Omit<OrderState, 'items'>, value: string | number) => {
    setOrder(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotalPacks = (skuId: string) => {
    const item = order.items[skuId];
    if (!item) return 0;
    const sku = SKUS.find(s => s.id === skuId);
    if (!sku) return 0;

    return (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
  };

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      totals[cat] = SKUS
        .filter(sku => sku.category === cat)
        .reduce((sum, sku) => sum + calculateTotalPacks(sku.id), 0);
    });
    return totals;
  }, [order.items]);

  const handleKeyDown = (e: React.KeyboardEvent, currentId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const keys = Object.keys(inputRefs.current);
      const currentIndex = keys.indexOf(currentId);
      if (currentIndex > -1 && currentIndex < keys.length - 1) {
        inputRefs.current[keys[currentIndex + 1]]?.focus();
        inputRefs.current[keys[currentIndex + 1]]?.select();
      }
    }
  };

  const saveDraft = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'current_draft', data: order })
      });
      if (response.ok) {
        setMessage({ text: 'Draft saved to server', type: 'success' });
      } else {
        throw new Error('Failed to save draft');
      }
    } catch (err) {
      setMessage({ text: 'Error saving draft', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const submitOrder = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: order })
      });
      if (response.ok) {
        setMessage({ text: 'Order submitted successfully!', type: 'success' });
        // Clear draft after successful submission
        const freshOrder = {
          date: new Date().toISOString().split('T')[0],
          route: '',
          visitedShops: 0,
          productiveShops: 0,
          items: {}
        };
        setOrder(freshOrder);
        localStorage.removeItem(STORAGE_KEY);
      } else {
        throw new Error('Failed to submit order');
      }
    } catch (err) {
      setMessage({ text: 'Error submitting order', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const clearOrder = () => {
    if (window.confirm('Are you sure you want to clear all entries?')) {
      const freshOrder = {
        date: new Date().toISOString().split('T')[0],
        route: '',
        visitedShops: 0,
        productiveShops: 0,
        items: {}
      };
      setOrder(freshOrder);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#141414] font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[#141414]/10 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">OB Order Entry</h1>
            <div className="flex gap-2">
              <button 
                onClick={saveDraft}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#141414]/20 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="hidden sm:inline">Save Draft</span>
              </button>
              <button 
                onClick={submitOrder}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141414] text-white hover:bg-[#141414]/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Submit</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[#141414]/50 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </label>
              <input 
                type="date" 
                value={order.date}
                onChange={(e) => handleMetaChange('date', e.target.value)}
                className="w-full bg-gray-50 border border-[#141414]/10 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#141414]/10 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[#141414]/50 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Route
              </label>
              <input 
                type="text" 
                placeholder="Enter Route"
                value={order.route}
                onChange={(e) => handleMetaChange('route', e.target.value)}
                className="w-full bg-gray-50 border border-[#141414]/10 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#141414]/10 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[#141414]/50 flex items-center gap-1">
                <Store className="w-3 h-3" /> Visited
              </label>
              <input 
                type="number" 
                value={order.visitedShops}
                onChange={(e) => handleMetaChange('visitedShops', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-50 border border-[#141414]/10 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#141414]/10 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[#141414]/50 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Productive
              </label>
              <input 
                type="number" 
                value={order.productiveShops}
                onChange={(e) => handleMetaChange('productiveShops', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-50 border border-[#141414]/10 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#141414]/10 outline-none"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {CATEGORIES.map(category => (
          <section key={category} className="bg-white rounded-2xl border border-[#141414]/10 overflow-hidden shadow-sm">
            <div className="bg-[#141414] text-white px-6 py-3 flex justify-between items-center">
              <h2 className="font-bold tracking-tight">{category}</h2>
              <div className="text-xs font-mono opacity-80">
                Total: <span className="font-bold text-sm">{categoryTotals[category]}</span> Packs
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#141414]/5">
                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">SKU Name</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-[#141414]/40 text-center w-24">Ctn</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-[#141414]/40 text-center w-24">Dzn</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-[#141414]/40 text-center w-24">Pks</th>
                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-[#141414]/40 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {SKUS.filter(sku => sku.category === category).map((sku) => {
                    const item = order.items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                    const total = calculateTotalPacks(sku.id);
                    const hasValue = total > 0;

                    return (
                      <tr 
                        key={sku.id} 
                        className={`border-b border-[#141414]/5 transition-colors ${hasValue ? 'bg-emerald-50/30' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-sm">{sku.name}</div>
                          <div className="text-[10px] text-[#141414]/40 font-mono">
                            {sku.unitsPerCarton}u/C | {sku.unitsPerDozen}u/D
                          </div>
                        </td>
                        <td className="px-2 py-4">
                          <input 
                            ref={el => inputRefs.current[`${sku.id}-ctn`] = el}
                            type="number"
                            value={item.ctn || ''}
                            placeholder="0"
                            onChange={(e) => handleInputChange(sku.id, 'ctn', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, `${sku.id}-ctn`)}
                            className="w-full bg-transparent border border-[#141414]/10 rounded px-2 py-1 text-center text-sm focus:border-[#141414] focus:ring-1 focus:ring-[#141414] outline-none transition-all"
                          />
                        </td>
                        <td className="px-2 py-4">
                          <input 
                            ref={el => inputRefs.current[`${sku.id}-dzn`] = el}
                            type="number"
                            disabled={sku.unitsPerDozen === 0}
                            value={item.dzn || ''}
                            placeholder="0"
                            onChange={(e) => handleInputChange(sku.id, 'dzn', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, `${sku.id}-dzn`)}
                            className="w-full bg-transparent border border-[#141414]/10 rounded px-2 py-1 text-center text-sm focus:border-[#141414] focus:ring-1 focus:ring-[#141414] outline-none transition-all disabled:bg-gray-100 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-2 py-4">
                          <input 
                            ref={el => inputRefs.current[`${sku.id}-pks`] = el}
                            type="number"
                            value={item.pks || ''}
                            placeholder="0"
                            onChange={(e) => handleInputChange(sku.id, 'pks', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, `${sku.id}-pks`)}
                            className="w-full bg-transparent border border-[#141414]/10 rounded px-2 py-1 text-center text-sm focus:border-[#141414] focus:ring-1 focus:ring-[#141414] outline-none transition-all"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-mono text-sm ${hasValue ? 'font-bold text-emerald-600' : 'text-[#141414]/20'}`}>
                            {total}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <div className="flex justify-center pt-8">
          <button 
            onClick={clearOrder}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium border border-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Entries
          </button>
        </div>
      </main>

      {/* Status Messages */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-50 ${
              message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Summary (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#141414]/10 p-4 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">Grand Total</div>
          <div className="font-mono font-bold text-lg">
            {(Object.values(categoryTotals) as number[]).reduce((a, b) => a + b, 0)} <span className="text-xs font-normal">Pks</span>
          </div>
        </div>
        <button 
          onClick={submitOrder}
          disabled={isSubmitting}
          className="bg-[#141414] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Submit
        </button>
      </div>
    </div>
  );
}
