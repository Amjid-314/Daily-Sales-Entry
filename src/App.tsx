/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
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
  Loader2,
  History,
  ArrowLeft,
  Download,
  LayoutDashboard,
  ClipboardList,
  Settings,
  Plus,
  Trash
} from 'lucide-react';
import { SKUS, CATEGORIES, OrderState, OrderItem, SKU, OBAssignment } from './types';

const STORAGE_KEY = 'ob_order_draft';

export default function App() {
  const [view, setView] = useState<'entry' | 'history' | 'dashboard' | 'admin'>('entry');
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [obAssignments, setObAssignments] = useState<OBAssignment[]>([]);
  const [adminTargets, setAdminTargets] = useState<any[]>([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [order, setOrder] = useState<OrderState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaultState: OrderState = {
      date: new Date().toISOString().split('T')[0],
      tsm: '',
      town: '',
      distributor: '',
      orderBooker: '',
      route: '',
      visitedShops: 0,
      productiveShops: 0,
      categoryProductiveShops: {},
      items: {},
      targets: {}
    };

    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultState,
        ...parsed,
        // Ensure nested objects exist
        items: parsed.items || {},
        targets: parsed.targets || {},
        categoryProductiveShops: parsed.categoryProductiveShops || {}
      };
    }
    return defaultState;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const focusableIds = useMemo(() => {
    const ids: string[] = [];
    SKUS.forEach(sku => {
      ids.push(`${sku.id}-ctn`);
      if (sku.unitsPerDozen > 0) {
        ids.push(`${sku.id}-dzn`);
      }
      ids.push(`${sku.id}-pks`);
    });
    return ids;
  }, []);

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

  const handleMetaChange = (field: keyof Omit<OrderState, 'items' | 'targets' | 'categoryProductiveShops'>, value: string | number) => {
    setOrder(prev => {
      const newState = { ...prev, [field]: value };
      
      // If OB changes, auto-populate Town, Distributor and reset Route
      if (field === 'orderBooker') {
        const assignment = obAssignments.find(a => a.name === value);
        if (assignment) {
          newState.town = assignment.town;
          newState.distributor = assignment.distributor;
          newState.route = ''; // Reset route so user picks from filtered list
        }
      }
      
      return newState;
    });
  };

  const calculateTotalPacks = (skuId: string) => {
    const item = order.items[skuId];
    if (!item) return 0;
    const sku = SKUS.find(s => s.id === skuId);
    if (!sku) return 0;

    return (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
  };

  const calculateTotalCartons = (skuId: string) => {
    const packs = calculateTotalPacks(skuId);
    const sku = SKUS.find(s => s.id === skuId);
    if (!sku || sku.unitsPerCarton === 0) return 0;
    return packs / sku.unitsPerCarton;
  };

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      totals[cat] = SKUS
        .filter(sku => sku.category === cat)
        .reduce((sum, sku) => sum + calculateTotalCartons(sku.id), 0);
    });
    return totals;
  }, [order.items]);

  const handleKeyDown = (e: React.KeyboardEvent, currentId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentIndex = focusableIds.indexOf(currentId);
      if (currentIndex > -1 && currentIndex < focusableIds.length - 1) {
        const nextId = focusableIds[currentIndex + 1];
        const nextInput = inputRefs.current[nextId];
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
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

  const submitOrder = () => {
    // Basic validation
    if (!order.route) {
      setMessage({ text: 'Please enter a route name', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    const totalPacks = (Object.values(categoryTotals) as number[]).reduce((a, b) => a + b, 0);
    if (totalPacks === 0) {
      setMessage({ text: 'Cannot submit an empty order', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsConfirming(true);
  };

  const confirmSubmit = async () => {
    setIsConfirming(false);
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
          tsm: '',
          town: '',
          distributor: '',
          orderBooker: '',
          route: '',
          visitedShops: 0,
          productiveShops: 0,
          items: {},
          targets: {}
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
        tsm: '',
        town: '',
        distributor: '',
        orderBooker: '',
        route: '',
        visitedShops: 0,
        productiveShops: 0,
        items: {},
        targets: {}
      };
      setOrder(freshOrder);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.map((h: any) => ({
          ...h,
          category_productive_data: typeof h.category_productive_data === 'string' ? JSON.parse(h.category_productive_data) : (h.category_productive_data || {})
        })));
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchAdminData = async () => {
    setIsLoadingAdmin(true);
    try {
      const [obsRes, targetsRes] = await Promise.all([
        fetch('/api/admin/obs'),
        fetch('/api/admin/targets')
      ]);
      if (obsRes.ok && targetsRes.ok) {
        const obs = await obsRes.json();
        const targets = await targetsRes.json();
        setObAssignments(obs);
        setAdminTargets(targets);
        
        // Update current order targets if they are empty
        setOrder(prev => {
          const newTargets = { ...prev.targets };
          targets.forEach((t: any) => {
            if (!newTargets[t.brand_name]) {
              newTargets[t.brand_name] = t.target_ctn;
            }
          });
          return { ...prev, targets: newTargets };
        });
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (view === 'history') {
      fetchHistory();
    }
    if (view === 'admin') {
      fetchAdminData();
    }
  }, [view]);

  const downloadCSV = () => {
    if (history.length === 0) return;
    
    // Flatten data for CSV
    const headers = ["ID", "Date", "TSM", "Town", "Distributor", "OB", "Route", "Visited", "Productive", "Brand", "Brand Prod", "SKU", "Ctn", "Dzn", "Pks", "Total (Ctn)"];
    const rows = history.flatMap(h => {
      return Object.entries(h.order_data).map(([skuId, item]: [string, any]) => {
        const sku = SKUS.find(s => s.id === skuId);
        const packs = (item.ctn * (sku?.unitsPerCarton || 0)) + (item.dzn * (sku?.unitsPerDozen || 0)) + item.pks;
        const cartons = sku?.unitsPerCarton ? packs / sku.unitsPerCarton : 0;
        const brandProd = h.category_productive_data?.[sku?.category || ''] || 0;
        return [
          h.id,
          h.date,
          h.tsm,
          h.town,
          h.distributor,
          h.order_booker,
          h.route,
          h.visited_shops,
          h.productive_shops,
          sku?.category || '',
          brandProd,
          sku?.name || skuId,
          item.ctn,
          item.dzn,
          item.pks,
          cartons.toFixed(3)
        ].join(",");
      });
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (view === 'dashboard') {
    const chartData = CATEGORIES.map(cat => ({
      name: cat,
      Target: order.targets[cat] || 0,
      Achievement: categoryTotals[cat] || 0,
      Percentage: order.targets[cat] > 0 ? (categoryTotals[cat] / order.targets[cat] * 100) : 0
    }));

    const productivityData = [
      { name: 'Productive', value: order.productiveShops },
      { name: 'Non-Productive', value: Math.max(0, order.visitedShops - order.productiveShops) }
    ];

    const COLORS = ['#10b981', '#ef4444'];

    return (
      <div className="min-h-screen bg-[#F5F5F5] text-[#141414] font-sans pb-20">
        <header className="bg-white border-b border-[#141414]/10 sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('entry')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold tracking-tight text-[#141414]">Performance Dashboard</h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setView('entry')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141414] text-white hover:bg-[#141414]/90 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Back to Entry</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#141414]/10 shadow-sm">
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40 mb-1">Grand Total Achievement</div>
              <div className="text-3xl font-mono font-bold">
                {chartData.reduce((a, b) => a + b.Achievement, 0).toFixed(3)} <span className="text-sm font-normal text-[#141414]/40">Ctn</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${Math.min(100, (chartData.reduce((a, b) => a + b.Achievement, 0) / (chartData.reduce((a, b) => a + b.Target, 0) || 1) * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-bold font-mono">
                  {((chartData.reduce((a, b) => a + b.Achievement, 0) / (chartData.reduce((a, b) => a + b.Target, 0) || 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#141414]/10 shadow-sm">
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40 mb-1">Shop Productivity</div>
              <div className="text-3xl font-mono font-bold">
                {order.productiveShops} <span className="text-sm font-normal text-[#141414]/40">/ {order.visitedShops}</span>
              </div>
              <div className="mt-2 text-xs font-medium text-emerald-600">
                {order.visitedShops > 0 ? (order.productiveShops / order.visitedShops * 100).toFixed(1) : 0}% Efficiency
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#141414]/10 shadow-sm">
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40 mb-1">Active Route</div>
              <div className="text-xl font-bold truncate">{order.route || 'Not Selected'}</div>
              <div className="text-xs text-[#141414]/40 mt-1">{order.orderBooker} • {order.town}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Achievement Chart */}
            <div className="bg-white p-6 rounded-2xl border border-[#141414]/10 shadow-sm">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                <BarChart className="w-4 h-4" /> Category Achievement (Ctn)
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: '#f9fafb' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                    <Bar dataKey="Target" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Achievement" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Productivity Pie Chart */}
            <div className="bg-white p-6 rounded-2xl border border-[#141414]/10 shadow-sm">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                <PieChart className="w-4 h-4" /> Shop Productivity Ratio
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productivityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {productivityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Brand-wise Productivity Table */}
          <div className="bg-white rounded-2xl border border-[#141414]/10 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#141414]/5 bg-gray-50">
              <h3 className="text-sm font-bold">Brand-wise Productive Shops</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-y divide-[#141414]/5">
              {CATEGORIES.map(cat => (
                <div key={cat} className="p-4">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40 mb-1">{cat}</div>
                  <div className="text-xl font-mono font-bold">{order.categoryProductiveShops[cat] || 0}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">
                    {order.visitedShops > 0 ? ((order.categoryProductiveShops[cat] || 0) / order.visitedShops * 100).toFixed(0) : 0}% Coverage
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] text-[#141414] font-sans pb-20">
        <header className="bg-white border-b border-[#141414]/10 sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('entry')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold tracking-tight text-[#141414]">Admin Panel</h1>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* Admin Actions */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#141414]/10 shadow-sm flex items-center gap-6">
              <div>
                <div className="text-[10px] uppercase font-bold text-[#141414]/40">Total Target</div>
                <div className="text-xl font-mono font-bold">{adminTargets.reduce((a, b) => a + b.target_ctn, 0).toFixed(2)}</div>
              </div>
              <div className="h-8 w-px bg-gray-100" />
              <div>
                <div className="text-[10px] uppercase font-bold text-[#141414]/40">Total Achieved</div>
                <div className="text-xl font-mono font-bold">
                  {CATEGORIES.reduce((acc, cat) => acc + (categoryTotals[cat] || 0), 0).toFixed(3)}
                </div>
              </div>
              <div className="h-8 w-px bg-gray-100" />
              <div>
                <div className="text-[10px] uppercase font-bold text-[#141414]/40">Overall %</div>
                <div className="text-xl font-mono font-bold text-emerald-600">
                  {adminTargets.reduce((a, b) => a + b.target_ctn, 0) > 0 
                    ? ((CATEGORIES.reduce((acc, cat) => acc + (categoryTotals[cat] || 0), 0) / adminTargets.reduce((a, b) => a + b.target_ctn, 0)) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
            </div>
            <button 
              onClick={downloadCSV}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg hover:bg-emerald-700 transition-all transform hover:-translate-y-0.5"
            >
              <Download className="w-5 h-5" />
              <span>Download All Sales Data (CSV)</span>
            </button>
          </div>

          {/* Brand Targets Management */}
          <section className="bg-white rounded-2xl border border-[#141414]/10 overflow-hidden shadow-sm">
            <div className="bg-[#141414] text-white px-6 py-4">
              <h2 className="font-bold">Brand Targets (Cartons)</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminTargets.map((target) => (
                <div key={target.id} className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{target.brand_name}</label>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      defaultValue={target.target_ctn}
                      onBlur={async (e) => {
                        const val = parseFloat(e.target.value) || 0;
                        await fetch('/api/admin/targets', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ brand_name: target.brand_name, target_ctn: val })
                        });
                        fetchAdminData();
                      }}
                      className="flex-1 bg-gray-50 border border-[#141414]/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#141414]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* OB Assignments Management */}
          <section className="bg-white rounded-2xl border border-[#141414]/10 overflow-hidden shadow-sm">
            <div className="bg-[#141414] text-white px-6 py-4 flex justify-between items-center">
              <h2 className="font-bold">Order Booker Assignments</h2>
              <button 
                onClick={async () => {
                  const name = prompt("Enter OB Name:");
                  if (name) {
                    await fetch('/api/admin/obs', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name, town: '', distributor: '', routes: [] })
                    });
                    fetchAdminData();
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              >
                <Plus className="w-4 h-4" /> Add OB
              </button>
            </div>
            <div className="divide-y divide-[#141414]/5">
              {obAssignments.map((ob) => (
                <div key={ob.id} className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#141414]/40">Name</label>
                        <input 
                          type="text"
                          defaultValue={ob.name}
                          onBlur={async (e) => {
                            await fetch('/api/admin/obs', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...ob, name: e.target.value })
                            });
                            fetchAdminData();
                          }}
                          className="w-full bg-gray-50 border border-[#141414]/10 rounded-lg px-3 py-2 text-sm font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#141414]/40">Town</label>
                        <input 
                          type="text"
                          defaultValue={ob.town}
                          onBlur={async (e) => {
                            await fetch('/api/admin/obs', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...ob, town: e.target.value })
                            });
                            fetchAdminData();
                          }}
                          className="w-full bg-gray-50 border border-[#141414]/10 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#141414]/40">Distributor</label>
                        <input 
                          type="text"
                          defaultValue={ob.distributor}
                          onBlur={async (e) => {
                            await fetch('/api/admin/obs', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...ob, distributor: e.target.value })
                            });
                            fetchAdminData();
                          }}
                          className="w-full bg-gray-50 border border-[#141414]/10 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        if (confirm("Delete this OB?")) {
                          await fetch(`/api/admin/obs/${ob.id}`, { method: 'DELETE' });
                          fetchAdminData();
                        }
                      }}
                      className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-[#141414]/40">Routes (Comma separated)</label>
                    <input 
                      type="text"
                      defaultValue={ob.routes.join(", ")}
                      onBlur={async (e) => {
                        const routes = e.target.value.split(",").map(r => r.trim()).filter(r => r !== "");
                        await fetch('/api/admin/obs', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...ob, routes })
                        });
                        fetchAdminData();
                      }}
                      className="w-full bg-gray-50 border border-[#141414]/10 rounded-lg px-3 py-2 text-sm"
                      placeholder="Route 1, Route 2, Route 3"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] text-[#141414] font-sans pb-20">
        <header className="bg-white border-b border-[#141414]/10 sticky top-0 z-10 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('entry')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold tracking-tight text-[#141414]">Order History</h1>
            </div>
            <button 
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141414] text-white hover:bg-[#141414]/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#141414]/40">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#141414]/40 bg-white rounded-2xl border border-dashed border-[#141414]/20">
              <History className="w-12 h-12 mb-4 opacity-20" />
              <p>No submitted orders yet.</p>
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="bg-white rounded-2xl border border-[#141414]/10 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-4 border-b border-[#141414]/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="text-sm font-bold">{h.route || 'No Route'} <span className="text-[#141414]/40 font-normal">({h.town})</span></div>
                    <div className="text-[10px] text-[#141414]/40 font-mono uppercase tracking-wider">
                      {h.date} • {h.distributor} • OB: {h.order_booker}
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">Shops</div>
                      <div className="text-sm font-mono">
                        {h.productive_shops}/{h.visited_shops}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                    {Object.entries(h.order_data).map(([skuId, item]: [string, any]) => {
                      const sku = SKUS.find(s => s.id === skuId);
                      const totalPacks = (item.ctn * (sku?.unitsPerCarton || 0)) + (item.dzn * (sku?.unitsPerDozen || 0)) + item.pks;
                      if (totalPacks === 0) return null;
                      
                      return (
                        <div key={skuId} className="flex justify-between items-center py-1 border-b border-gray-50 text-sm">
                          <span className="text-[#141414]/70">{sku?.name || skuId}</span>
                          <span className="font-mono font-bold">
                            {item.ctn}c {item.dzn}d {item.pks}p
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#141414] font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b-2 border-[#141414] sticky top-0 z-10 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Top Row: Navigation and Primary Actions */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-black tracking-tighter text-[#141414] uppercase italic">OB Order</h1>
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button 
                    onClick={() => setView('entry')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'entry' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#141414]/40 hover:text-[#141414]'}`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span className="hidden sm:inline">Entry</span>
                  </button>
                  <button 
                    onClick={() => setView('dashboard')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'dashboard' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#141414]/40 hover:text-[#141414]'}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                  <button 
                    onClick={() => setView('history')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'history' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#141414]/40 hover:text-[#141414]'}`}
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">History</span>
                  </button>
                  <button 
                    onClick={() => setView('admin')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'admin' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#141414]/40 hover:text-[#141414]'}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={saveDraft}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-[#141414] font-bold text-xs hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span className="hidden sm:inline">Save Draft</span>
                </button>
                <button 
                  onClick={submitOrder}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141414] text-white font-bold text-xs hover:bg-[#141414]/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Submit Order</span>
                </button>
              </div>
            </div>

            {/* Metadata Grid: Structured for visibility */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded-xl border border-[#141414]/5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#141414]/40 uppercase tracking-widest">Order Booker</label>
                  <select 
                    value={order.orderBooker}
                    onChange={(e) => handleMetaChange('orderBooker', e.target.value)}
                    className="w-full bg-white border-2 border-[#141414]/10 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-[#141414] transition-all"
                  >
                    <option value="">Select OB</option>
                    {obAssignments.map(ob => (
                      <option key={ob.name} value={ob.name}>{ob.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#141414]/40 uppercase tracking-widest">Route</label>
                  <select 
                    value={order.route}
                    onChange={(e) => handleMetaChange('route', e.target.value)}
                    className="w-full bg-white border-2 border-[#141414]/10 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-[#141414] transition-all"
                    disabled={!order.orderBooker}
                  >
                    <option value="">Select Route</option>
                    {obAssignments.find(a => a.name === order.orderBooker)?.routes.map(route => (
                      <option key={route} value={route}>{route}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#141414]/40 uppercase tracking-widest">Town</label>
                  <div className="w-full bg-gray-200/50 border-2 border-transparent rounded-lg px-2 py-1.5 text-xs font-medium text-[#141414]/60 truncate">
                    {order.town || '---'}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#141414]/40 uppercase tracking-widest">Date</label>
                  <input 
                    type="date" 
                    value={order.date}
                    onChange={(e) => handleMetaChange('date', e.target.value)}
                    className="w-full bg-white border-2 border-[#141414]/10 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#141414] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#141414]/40 uppercase tracking-widest">Visited</label>
                  <input 
                    type="number" 
                    value={order.visitedShops || ''}
                    onChange={(e) => handleMetaChange('visitedShops', parseInt(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-[#141414]/10 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-[#141414] transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#141414]/40 uppercase tracking-widest">Productive</label>
                  <input 
                    type="number" 
                    value={order.productiveShops || ''}
                    onChange={(e) => handleMetaChange('productiveShops', parseInt(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-[#141414]/10 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-[#141414] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-2 py-4 space-y-4">
        {CATEGORIES.map(category => (
          <section key={category} className="bg-white rounded-2xl border-2 border-[#141414]/10 overflow-hidden shadow-sm">
            <div className="bg-[#141414] text-white px-4 py-3 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <h2 className="font-black tracking-tighter text-lg uppercase italic">{category}</h2>
              
              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto bg-white/5 p-2 rounded-lg border border-white/10">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-white/40">Prod Shops</label>
                  <input 
                    type="number"
                    value={(order.categoryProductiveShops && order.categoryProductiveShops[category]) || ''}
                    placeholder="0"
                    onChange={(e) => setOrder(prev => ({
                      ...prev,
                      categoryProductiveShops: { ...(prev.categoryProductiveShops || {}), [category]: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-16 bg-white/10 border-2 border-white/20 rounded-md px-2 py-1 text-xs font-bold text-center outline-none focus:border-white/60 transition-all"
                  />
                </div>
                
                <div className="h-6 w-px bg-white/20 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-white/40">Target</label>
                  <input 
                    type="number"
                    value={(order.targets && order.targets[category]) || ''}
                    placeholder="0"
                    onChange={(e) => setOrder(prev => ({
                      ...prev,
                      targets: { ...(prev.targets || {}), [category]: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-16 bg-white/10 border-2 border-white/20 rounded-md px-2 py-1 text-xs font-bold text-center outline-none focus:border-white/60 transition-all"
                  />
                </div>

                <div className="h-6 w-px bg-white/20 hidden sm:block" />

                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono">
                    <span className="text-white/40 uppercase text-[10px] font-black tracking-widest mr-2">Ach:</span>
                    <span className="font-black text-sm">{categoryTotals[category].toFixed(3)}</span>
                  </div>
                  
                  {order.targets && order.targets[category] > 0 && (
                    <div className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${
                      (categoryTotals[category] / order.targets[category]) >= 1 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}>
                      {((categoryTotals[category] / order.targets[category]) * 100).toFixed(0)}% Done
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#141414]/5">
                    <th className="px-4 py-2 text-[9px] uppercase tracking-widest font-bold text-[#141414]/40">SKU</th>
                    <th className="px-2 py-2 text-[9px] uppercase tracking-widest font-bold text-[#141414]/40 text-center w-16">Ctn</th>
                    <th className="px-2 py-2 text-[9px] uppercase tracking-widest font-bold text-[#141414]/40 text-center w-16">Dzn</th>
                    <th className="px-2 py-2 text-[9px] uppercase tracking-widest font-bold text-[#141414]/40 text-center w-16">Pks</th>
                    <th className="px-4 py-2 text-[9px] uppercase tracking-widest font-bold text-[#141414]/40 text-right w-20">Total</th>
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
                        <td className="px-4 py-2">
                          <div className="font-medium text-xs">{sku.name}</div>
                          <div className="text-[9px] text-[#141414]/40 font-mono">
                            {sku.unitsPerCarton}u/C
                          </div>
                        </td>
                        <td className="px-1 py-2">
                          <input 
                            ref={el => inputRefs.current[`${sku.id}-ctn`] = el}
                            type="number"
                            value={item.ctn || ''}
                            placeholder="0"
                            onChange={(e) => handleInputChange(sku.id, 'ctn', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, `${sku.id}-ctn`)}
                            className="w-full bg-transparent border border-[#141414]/10 rounded px-1 py-0.5 text-center text-xs focus:border-[#141414] focus:ring-1 focus:ring-[#141414] outline-none transition-all"
                          />
                        </td>
                        <td className="px-1 py-2">
                          <input 
                            ref={el => inputRefs.current[`${sku.id}-dzn`] = el}
                            type="number"
                            disabled={sku.unitsPerDozen === 0}
                            value={item.dzn || ''}
                            placeholder="0"
                            onChange={(e) => handleInputChange(sku.id, 'dzn', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, `${sku.id}-dzn`)}
                            className="w-full bg-transparent border border-[#141414]/10 rounded px-1 py-0.5 text-center text-xs focus:border-[#141414] focus:ring-1 focus:ring-[#141414] outline-none transition-all disabled:bg-gray-100 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-1 py-2">
                          <input 
                            ref={el => inputRefs.current[`${sku.id}-pks`] = el}
                            type="number"
                            value={item.pks || ''}
                            placeholder="0"
                            onChange={(e) => handleInputChange(sku.id, 'pks', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, `${sku.id}-pks`)}
                            className="w-full bg-transparent border border-[#141414]/10 rounded px-1 py-0.5 text-center text-xs focus:border-[#141414] focus:ring-1 focus:ring-[#141414] outline-none transition-all"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={`font-mono text-xs ${hasValue ? 'font-bold text-emerald-600' : 'text-[#141414]/20'}`}>
                            {calculateTotalCartons(sku.id).toFixed(3)}
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

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {isConfirming && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-[#141414]/10"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                  <Send className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Confirm Submission</h3>
                  <p className="text-[#141414]/60 text-sm">
                    Are you sure you want to submit this order for <span className="font-bold text-[#141414]">{order.route}</span>?
                  </p>
                </div>
                
                <div className="w-full pt-4 space-y-3">
                  <button 
                    onClick={confirmSubmit}
                    className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold hover:bg-[#141414]/90 transition-colors"
                  >
                    Yes, Submit Now
                  </button>
                  <button 
                    onClick={() => setIsConfirming(false)}
                    className="w-full py-4 bg-gray-50 text-[#141414]/60 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">Grand Total (Ctn)</div>
          <div className="font-mono font-bold text-lg">
            {(Object.values(categoryTotals) as number[]).reduce((a, b) => a + b, 0).toFixed(3)}
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
