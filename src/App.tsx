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
  CheckCircle2, 
  AlertCircle,
  Loader2,
  History,
  ArrowLeft,
  Download,
  LayoutDashboard,
  ClipboardList,
  Settings,
  Plus,
  Trash,
  Search,
  Lock,
  Waves,
  Store,
  EyeOff,
  Upload,
  RefreshCw
} from 'lucide-react';
import { SKUS, CATEGORIES, OrderState, OrderItem, SKU, OBAssignment } from './types';

const STORAGE_KEY = 'ob_order_draft';
const ADMIN_PASSWORD = 'admin';
const LOGO_STORAGE_KEY = 'app_logo_base64';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export default function App() {
  const [view, setView] = useState<'entry' | 'history' | 'dashboard' | 'admin'>('entry');
  const [history, setHistory] = useState<any[]>([]);
  const [historyFilters, setHistoryFilters] = useState({ ob: '', from: '', to: '' });
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [obAssignments, setObAssignments] = useState<OBAssignment[]>([]);
  const [obSearch, setObSearch] = useState('');
  const [appConfig, setAppConfig] = useState<Record<string, string>>({ total_working_days: '25' });
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [selectedTSM, setSelectedTSM] = useState<string>('');
  const [mtdAchievement, setMtdAchievement] = useState<Record<string, number>>({});
  const [appLogo, setAppLogo] = useState<string | null>(localStorage.getItem(LOGO_STORAGE_KEY));
  const [selectedOBForTargets, setSelectedOBForTargets] = useState<string | null>(null);
  const [obTargetsEdit, setObTargetsEdit] = useState<Record<string, number>>({});

  const [order, setOrder] = useState<OrderState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaultState: OrderState = {
      date: new Date().toISOString().split('T')[0],
      tsm: '',
      town: '',
      distributor: '',
      orderBooker: '',
      obContact: '',
      route: '',
      totalShops: 50,
      visitedShops: 0,
      productiveShops: 0,
      categoryProductiveShops: {},
      items: {},
      targets: {}
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          items: parsed.items || {},
          targets: parsed.targets || {},
          categoryProductiveShops: parsed.categoryProductiveShops || {}
        };
      } catch (e) {
        return defaultState;
      }
    }
    return defaultState;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<any | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const focusableIds = useMemo(() => {
    const ids: string[] = [];
    SKUS.forEach(sku => {
      ids.push(`${sku.id}-ctn`);
      if (sku.unitsPerDozen > 0) ids.push(`${sku.id}-dzn`);
      ids.push(`${sku.id}-pks`);
    });
    return ids;
  }, []);

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
      if (field === 'obContact') {
        const assignment = obAssignments.find(a => a.contact === value);
        if (assignment) {
          newState.orderBooker = assignment.name;
          newState.town = assignment.town;
          newState.distributor = assignment.distributor;
          newState.tsm = assignment.tsm || '';
          newState.route = ''; 
          newState.totalShops = assignment.totalShops || 0;
          fetchTargetsForOB(value as string);
          fetchMTDForOB(value as string);
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
      if (response.ok) setMessage({ text: 'Draft saved', type: 'success' });
      else throw new Error('Failed to save draft');
    } catch (err) {
      setMessage({ text: 'Error saving draft', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const submitOrder = () => {
    if (!order.route) {
      setMessage({ text: 'Select a route', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    const totalPacks = (Object.values(categoryTotals) as number[]).reduce((a, b) => a + b, 0);
    if (totalPacks === 0) {
      setMessage({ text: 'Order is empty', type: 'error' });
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
        setLastSubmittedOrder({ ...order });
        setMessage({ text: 'Submitted!', type: 'success' });
        setOrder({
          date: new Date().toISOString().split('T')[0],
          tsm: '', town: '', distributor: '', orderBooker: '', obContact: '', route: '',
          totalShops: 50, visitedShops: 0, productiveShops: 0, categoryProductiveShops: {}, items: {}, targets: {}
        });
        localStorage.removeItem(STORAGE_KEY);
      } else throw new Error('Failed to submit');
    } catch (err) {
      setMessage({ text: 'Error submitting', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const fetchHistory = async (ignoreFilters = false) => {
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (!ignoreFilters) {
        if (historyFilters.ob) params.append('ob', historyFilters.ob);
        if (historyFilters.from) params.append('from', historyFilters.from);
        if (historyFilters.to) params.append('to', historyFilters.to);
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.map((h: any) => ({
          ...h,
          category_productive_data: typeof h.category_productive_data === 'string' ? JSON.parse(h.category_productive_data) : (h.category_productive_data || {})
        })));
      }
    } catch (err) { console.error(err); }
    finally { setIsLoadingHistory(false); }
  };

  const getTimeGone = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;
    for (let d = 1; d <= totalDays; d++) {
      const day = new Date(year, month, d).getDay();
      if (day !== 0) workingDays++; // Not Sunday
    }
    
    let daysGone = 0;
    for (let d = 1; d <= now.getDate(); d++) {
      const day = new Date(year, month, d).getDay();
      if (day !== 0) daysGone++;
    }
    
    return workingDays > 0 ? (daysGone / workingDays) * 100 : 0;
  };

  const fetchAdminData = async () => {
    setIsLoadingAdmin(true);
    try {
      const [obsRes, configRes] = await Promise.all([
        fetch('/api/admin/obs'),
        fetch('/api/admin/config')
      ]);
      if (obsRes.ok && configRes.ok) {
        setObAssignments(await obsRes.json());
        setAppConfig(await configRes.json());
      }
    } catch (err) { console.error(err); }
    finally { setIsLoadingAdmin(false); }
  };

  const fetchTargetsForOB = async (contact: string) => {
    try {
      const res = await fetch(`/api/admin/targets/${contact}`);
      if (res.ok) {
        const targets = await res.json();
        const targetMap: Record<string, number> = {};
        targets.forEach((t: any) => { targetMap[t.brand_name] = t.target_ctn; });
        setOrder(prev => ({ ...prev, targets: targetMap }));
      }
    } catch (err) { console.error(err); }
  };

  const fetchMTDForOB = async (contact: string) => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const allOrders = await res.json();
        const currentMonth = new Date().toISOString().slice(0, 7);
        const obOrders = allOrders.filter((o: any) => o.ob_contact === contact && o.date.startsWith(currentMonth));
        
        const mtd: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          mtd[cat] = obOrders.reduce((sum: number, order: any) => {
            const orderData = JSON.parse(order.order_data);
            const catTotal = SKUS
              .filter(sku => sku.category === cat)
              .reduce((s, sku) => {
                const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
                return s + (packs / sku.unitsPerCarton);
              }, 0);
            return sum + catTotal;
          }, 0);
        });
        setMtdAchievement(mtd);
      }
    } catch (err) { console.error(err); }
  };

  const fetchTargetsForOBEdit = async (contact: string) => {
    try {
      const res = await fetch(`/api/admin/targets/${contact}`);
      if (res.ok) {
        const targets = await res.json();
        const targetMap: Record<string, number> = {};
        targets.forEach((t: any) => { targetMap[t.brand_name] = t.target_ctn; });
        setObTargetsEdit(targetMap);
      }
    } catch (err) { console.error(err); }
  };

  const handleTargetUpdate = async (obContact: string, brandName: string, value: string) => {
    const targetCtn = parseFloat(value) || 0;
    setObTargetsEdit(prev => ({ ...prev, [brandName]: targetCtn }));
    try {
      await fetch('/api/admin/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obContact, brandName, targetCtn })
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchAdminData(); }, []);
  useEffect(() => {
    if (view === 'history') fetchHistory();
    if (view === 'dashboard') fetchHistory(true);
    if (view === 'admin' || view === 'dashboard') fetchAdminData();
  }, [view]);

  const MainNav = () => (
    <nav className="bg-white border-b border-slate-200 px-4 h-12 flex justify-around items-center sticky top-0 z-40 shadow-sm">
      <button onClick={() => setView('entry')} className={`p-2 flex flex-col items-center gap-0.5 transition-colors ${view === 'entry' ? 'text-seablue' : 'text-slate-400'}`}>
        <ClipboardList className="w-5 h-5" />
        <span className="text-[8px] font-black uppercase tracking-tighter">Entry</span>
        {view === 'entry' && <motion.div layoutId="nav-indicator" className="h-0.5 w-4 bg-seablue rounded-full" />}
      </button>
      <button onClick={() => setView('dashboard')} className={`p-2 flex flex-col items-center gap-0.5 transition-colors ${view === 'dashboard' ? 'text-seablue' : 'text-slate-400'}`}>
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[8px] font-black uppercase tracking-tighter">Stats</span>
        {view === 'dashboard' && <motion.div layoutId="nav-indicator" className="h-0.5 w-4 bg-seablue rounded-full" />}
      </button>
      <button onClick={() => setView('history')} className={`p-2 flex flex-col items-center gap-0.5 transition-colors ${view === 'history' ? 'text-seablue' : 'text-slate-400'}`}>
        <History className="w-5 h-5" />
        <span className="text-[8px] font-black uppercase tracking-tighter">History</span>
        {view === 'history' && <motion.div layoutId="nav-indicator" className="h-0.5 w-4 bg-seablue rounded-full" />}
      </button>
      <button onClick={() => setView('admin')} className={`p-2 flex flex-col items-center gap-0.5 transition-colors ${view === 'admin' ? 'text-seablue' : 'text-slate-400'}`}>
        <Settings className="w-5 h-5" />
        <span className="text-[8px] font-black uppercase tracking-tighter">Admin</span>
        {view === 'admin' && <motion.div layoutId="nav-indicator" className="h-0.5 w-4 bg-seablue rounded-full" />}
      </button>
    </nav>
  );

  const calculateTimeGone = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let totalWorkingDays = 0;
    let workingDaysPassed = 0;
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date.getDay() !== 0) { // Not Sunday
        totalWorkingDays++;
        if (d <= today) {
          workingDaysPassed++;
        }
      }
    }
    
    return {
      percentage: (workingDaysPassed / totalWorkingDays) * 100,
      passed: workingDaysPassed,
      total: totalWorkingDays
    };
  };

  const timeGone = calculateTimeGone();

  const tsmList = useMemo(() => {
    const tsms = new Set<string>();
    obAssignments.forEach(ob => { if (ob.tsm) tsms.add(ob.tsm); });
    return Array.from(tsms).sort();
  }, [obAssignments]);

  const filteredOBs = useMemo(() => {
    if (!selectedTSM) return obAssignments;
    return obAssignments.filter(ob => ob.tsm === selectedTSM);
  }, [obAssignments, selectedTSM]);

  const resetDatabase = async () => {
    if (window.confirm("WARNING: This will delete ALL history (submitted orders and drafts). Continue?")) {
      try {
        const res = await fetch('/api/admin/reset', { method: 'POST' });
        if (res.ok) {
          setMessage({ text: 'History Cleared', type: 'success' });
          fetchHistory();
        }
      } catch (e) { setMessage({ text: 'Reset Failed', type: 'error' }); }
      finally { setTimeout(() => setMessage(null), 3000); }
    }
  };

  const reseedTeam = async () => {
    if (window.confirm("This will replace all current OB assignments with the new team structure. Continue?")) {
      try {
        const res = await fetch('/api/admin/reseed', { method: 'POST' });
        if (res.ok) {
          setMessage({ text: 'Team Re-seeded!', type: 'success' });
          fetchAdminData();
        }
      } catch (e) { setMessage({ text: 'Reseed Failed', type: 'error' }); }
      finally { setTimeout(() => setMessage(null), 3000); }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAppLogo(base64String);
        localStorage.setItem(LOGO_STORAGE_KEY, base64String);
        setMessage({ text: 'Logo Updated!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  if (view === 'dashboard') {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);
    
    const todayOrders = history.filter(h => h.date === today);
    const mtdOrders = history.filter(h => h.date.startsWith(currentMonth));
    
    const calculateCatTotals = (orders: any[]) => {
      const totals: Record<string, number> = {};
      CATEGORIES.forEach(cat => {
        totals[cat] = orders.reduce((sum, h) => {
          const items = h.order_data || {};
          const catAch = SKUS
            .filter(sku => sku.category === cat)
            .reduce((s, sku) => {
              const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
              const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
              return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
            }, 0);
          return sum + catAch;
        }, 0);
      });
      return totals;
    };

    const globalToday = calculateCatTotals(todayOrders);
    const globalMtd = calculateCatTotals(mtdOrders);
    const globalTargets = (() => {
      const totals: Record<string, number> = {};
      CATEGORIES.forEach(cat => {
        totals[cat] = obAssignments.reduce((sum, ob) => sum + (ob.targets?.[cat] || 0), 0);
      });
      return totals;
    })();

    const chartData = CATEGORIES.map(cat => ({
      name: cat,
      Target: globalTargets[cat] || 0,
      Achievement: globalToday[cat] || 0,
      MTD: globalMtd[cat] || 0
    }));

    // OB Sales Analysis
    const obAnalysis = obAssignments.map(ob => {
      const obOrders = mtdOrders.filter(h => h.ob_contact === ob.contact);
      const totals: Record<string, number> = {};
      CATEGORIES.forEach(cat => {
        totals[cat] = obOrders.reduce((sum, h) => {
          const items = h.order_data || {};
          const catAch = SKUS
            .filter(sku => sku.category === cat)
            .reduce((s, sku) => {
              const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
              const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
              return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
            }, 0);
          return sum + catAch;
        }, 0);
      });
      
      const totalVisited = obOrders.reduce((sum, h) => sum + (h.visited_shops || 0), 0);
      const totalProductive = obOrders.reduce((sum, h) => sum + (h.productive_shops || 0), 0);
      const totalShops = obOrders.length * (ob.totalShops || 0);

      return {
        name: ob.name,
        contact: ob.contact,
        totals,
        totalAch: Object.values(totals).reduce((a: number, b: number) => a + b, 0),
        target: Object.values(ob.targets || {}).reduce((a: number, b: number) => a + b, 0),
        shops: { t: totalShops, v: totalVisited, p: totalProductive }
      };
    }).sort((a, b) => b.totalAch - a.totalAch);

    if (isLoadingHistory || isLoadingAdmin) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <MainNav />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-seablue animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Stats...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 pb-10">
        <MainNav />
        <header className="bg-white border-b border-slate-200 p-4 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold text-seablue">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { fetchHistory(true); fetchAdminData(); }}
                className="p-2 hover:bg-slate-100 rounded-full text-seablue transition-colors"
                title="Refresh Stats"
              >
                <RefreshCw className={`w-5 h-5 ${(isLoadingHistory || isLoadingAdmin) ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => {
                  const summary = `*Global Sales Dashboard - ${today}*\n` +
                    `------------------\n` +
                    chartData.map(d => `*${d.name}:*\n  Ach: ${d.Achievement.toFixed(2)}\n  MTD: ${d.MTD.toFixed(2)}\n  Tgt: ${d.Target.toFixed(2)}`).join('\n') +
                    `\n------------------\n` +
                    `*Total Today:* ${(Object.values(globalToday) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(2)}\n` +
                    `*Total MTD:* ${(Object.values(globalMtd) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(2)}\n` +
                    `*Total Target:* ${(Object.values(globalTargets) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(2)}`;
                  
                  const encodedMsg = encodeURIComponent(summary);
                  window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
                }}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                title="Share Global Summary"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {history.length === 0 ? (
            <div className="card-clean p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-700">No Sales Data Yet</h3>
                <p className="text-sm text-slate-400">Submit some reports to see your performance stats here.</p>
              </div>
              <button onClick={() => setView('entry')} className="btn-seablue px-6 py-2">Go to Entry</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-clean p-4 bg-seablue text-white shadow-blue-200 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-white/60">Today Total Sales</div>
              <div className="text-3xl font-black">{(Object.values(globalToday) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(2)}</div>
            </div>
            <div className="card-clean p-4 bg-emerald-600 text-white shadow-emerald-200 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-white/60">MTD Total Sales</div>
              <div className="text-3xl font-black">{(Object.values(globalMtd) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(2)}</div>
            </div>
            <div className="card-clean p-4 bg-slate-800 text-white shadow-slate-200 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-white/60">Time Gone</div>
              <div className="text-3xl font-black">{timeGone.percentage.toFixed(1)}%</div>
            </div>
          </div>

          <div className="card-clean p-4">
            <h3 className="text-sm font-bold mb-4 text-seablue uppercase">Brand Wise Performance</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                  <Bar dataKey="Target" name="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Achievement" name="Today" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="MTD" name="MTD" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-clean p-4">
            <h3 className="text-sm font-bold mb-4 text-seablue uppercase">OB Sales Analysis (MTD)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase">
                    <th className="py-2">OB Name</th>
                    <th className="py-2 text-center">T/V/P</th>
                    {CATEGORIES.map(cat => <th key={cat} className="py-2 text-center">{cat}</th>)}
                    <th className="py-2 text-right">Ach/Tgt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {obAnalysis.map(ob => (
                    <tr key={ob.contact} className="hover:bg-slate-50">
                      <td className="py-2 font-bold text-slate-700">{ob.name}</td>
                      <td className="py-2 text-center text-slate-500">{ob.shops.t}/{ob.shops.v}/{ob.shops.p}</td>
                      {CATEGORIES.map(cat => (
                        <td key={cat} className="py-2 text-center font-mono">{ob.totals[cat].toFixed(1)}</td>
                      ))}
                      <td className="py-2 text-right">
                        <div className="font-bold text-seablue">{ob.totalAch.toFixed(1)}</div>
                        <div className="text-[8px] text-slate-400">{ob.target.toFixed(1)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </main>
      </div>
    );
  }

  if (view === 'admin') {
    if (isLoadingAdmin) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <MainNav />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-seablue animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Admin...</p>
            </div>
          </div>
        </div>
      );
    }

    if (!adminAuthenticated) {
      return (
        <div className="min-h-screen bg-slate-50">
          <MainNav />
          <div className="flex items-center justify-center p-4 pt-20">
            <div className="card-clean p-8 max-w-sm w-full space-y-6 text-center">
              <Lock className="w-12 h-12 text-seablue mx-auto" />
              <h2 className="text-xl font-bold text-seablue">Admin Login</h2>
              <form onSubmit={(e) => { e.preventDefault(); if (adminPassInput.toLowerCase() === ADMIN_PASSWORD) setAdminAuthenticated(true); else setMessage({ text: 'Wrong Pass', type: 'error' }); }} className="space-y-4">
                <input type="password" placeholder="Enter Password" value={adminPassInput} onChange={(e) => setAdminPassInput(e.target.value)} className="input-clean w-full text-center" autoFocus />
                <button type="submit" className="btn-seablue w-full">Login to Admin</button>
                <button type="button" onClick={() => setView('entry')} className="text-xs text-slate-400 font-bold hover:underline">Cancel</button>
              </form>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 pb-10">
        <MainNav />
        <header className="bg-white border-b border-slate-200 p-4 shadow-sm">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white">
                <Settings className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold text-seablue">Admin Panel</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchAdminData} className="p-2 hover:bg-slate-100 rounded-full text-seablue" title="Refresh Data"><RefreshCw className={`w-5 h-5 ${isLoadingAdmin ? 'animate-spin' : ''}`} /></button>
              <button onClick={reseedTeam} className="px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-50"><RefreshCw className="w-3 h-3" /> Re-seed Team</button>
              <button onClick={resetDatabase} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-[10px] font-black uppercase hover:bg-red-50">Clear History</button>
              <button onClick={() => setAdminAuthenticated(false)} className="text-xs font-bold text-slate-400 hover:underline">Logout</button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-clean p-4 flex items-center gap-6 overflow-x-auto">
              <div><div className="text-[10px] font-bold text-slate-400 uppercase">OBs</div><div className="text-xl font-bold text-seablue">{obAssignments.length}</div></div>
              <div className="w-px h-8 bg-slate-100" />
              <div><div className="text-[10px] font-bold text-slate-400 uppercase">Days</div><div className="text-xl font-bold text-seablue">{appConfig.total_working_days}</div></div>
              <div className="w-px h-8 bg-slate-100" />
              <div><div className="text-[10px] font-bold text-slate-400 uppercase">Time</div><div className="text-xl font-bold text-seablue">{timeGone.percentage.toFixed(1)}%</div></div>
            </div>

            <div className="card-clean p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">App Logo</div>
                <label className="btn-seablue text-xs cursor-pointer flex items-center gap-2">
                  <Upload className="w-3 h-3" />
                  Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
              {appLogo && (
                <div className="w-12 h-12 rounded-lg border border-slate-100 overflow-hidden flex items-center justify-center bg-white">
                  <img src={appLogo} alt="App Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          <section className="card-clean overflow-hidden">
            <div className="bg-seablue text-white px-4 py-2 flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-widest">OB Assignments</h2>
              <button onClick={async () => { const name = prompt("Name:"); const contact = prompt("ID:"); if (name && contact) { await fetch('/api/admin/obs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, contact, town: '', distributor: '', routes: [] }) }); fetchAdminData(); } }} className="text-xs font-bold bg-white/20 px-2 py-1 rounded hover:bg-white/30">+ Add</button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {obAssignments.map(ob => (
                <div key={ob.id} className="p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Name</label>
                      <input type="text" defaultValue={ob.name} onBlur={async (e) => { await fetch('/api/admin/obs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ob, name: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">ID/Contact</label>
                      <input type="text" defaultValue={ob.contact} onBlur={async (e) => { await fetch('/api/admin/obs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ob, contact: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Town</label>
                      <input type="text" defaultValue={ob.town} onBlur={async (e) => { await fetch('/api/admin/obs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ob, town: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Distributor</label>
                      <input type="text" defaultValue={ob.distributor} onBlur={async (e) => { await fetch('/api/admin/obs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ob, distributor: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">TSM</label>
                      <input type="text" defaultValue={ob.tsm} onBlur={async (e) => { await fetch('/api/admin/obs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ob, tsm: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Total Shops in Route</label>
                      <input type="number" defaultValue={ob.totalShops || 0} onBlur={async (e) => { await fetch('/api/admin/obs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ob, totalShops: parseInt(e.target.value) || 0 }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Routes (comma separated)</label>
                      <input type="text" defaultValue={ob.routes.join(", ")} onBlur={async (e) => { const routes = e.target.value.split(",").map(r => r.trim()).filter(r => r); await fetch('/api/admin/obs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ob, routes }) }); }} className="input-clean w-full" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <button 
                      onClick={() => {
                        if (selectedOBForTargets === ob.contact) {
                          setSelectedOBForTargets(null);
                        } else {
                          setSelectedOBForTargets(ob.contact);
                          fetchTargetsForOBEdit(ob.contact);
                        }
                      }} 
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors ${selectedOBForTargets === ob.contact ? 'bg-seablue text-white border-seablue' : 'bg-white text-seablue border-seablue/20 hover:bg-seablue/5'}`}
                    >
                      {selectedOBForTargets === ob.contact ? 'Close Targets' : 'Manage Brand Targets'}
                    </button>
                    <button onClick={async () => { if (confirm("Delete?")) { await fetch(`/api/admin/obs/${ob.id}`, { method: 'DELETE' }); fetchAdminData(); } }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash className="w-4 h-4" /></button>
                  </div>

                  {selectedOBForTargets === ob.contact && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
                      <h4 className="text-[10px] font-black text-seablue uppercase tracking-widest">Brand Targets for {ob.name} (Ctn)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {CATEGORIES.map(cat => (
                          <div key={cat} className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase">{cat}</label>
                            <input 
                              type="number" 
                              value={obTargetsEdit[cat] || ''} 
                              onChange={(e) => handleTargetUpdate(ob.contact, cat, e.target.value)} 
                              className="input-clean w-full bg-white" 
                              placeholder="0.00"
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  const groupedHistory = useMemo(() => {
    const groups: Record<string, any[]> = {};
    history.forEach(h => {
      const ob = h.order_booker || 'Unknown';
      if (!groups[ob]) groups[ob] = [];
      groups[ob].push(h);
    });
    return Object.keys(groups).sort().map(ob => ({
      obName: ob,
      entries: groups[ob].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }));
  }, [history]);

  if (view === 'history') {
    if (isLoadingHistory) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <MainNav />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-seablue animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading History...</p>
            </div>
          </div>
        </div>
      );
    }

    const paginatedHistory = history.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);
    const totalPages = Math.ceil(history.length / itemsPerPage);

    return (
      <div className="min-h-screen bg-slate-50 pb-10">
        <MainNav />
        <header className="bg-white border-b border-slate-200 p-4 sticky top-12 z-20 shadow-sm">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white">
                  <History className="w-5 h-5" />
                </div>
                <h1 className="text-lg font-bold text-seablue">History</h1>
              </div>
              <button onClick={() => {
                const headers = [
                  'Date', 'TSM', 'Town', 'Distributor', 'OB Name', 'OB Contact', 'Route', 
                  'Total Shops', 'Visited Shops', 'Productive Shops',
                  ...SKUS.map(sku => `${sku.name} (${sku.category})`),
                  'Total Achievement'
                ];
                
                const rows = history.map(h => {
                  const items = h.order_data || {};
                  
                  const skuValues = SKUS.map(sku => {
                    const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                    const total = (item.ctn * sku.unitsPerCarton + item.dzn * sku.unitsPerDozen + item.pks) / (sku.unitsPerCarton || 1);
                    return total.toFixed(3);
                  });

                  const totalAch = skuValues.reduce((a, b) => a + parseFloat(b), 0);

                  return [
                    h.date, h.tsm, h.town, h.distributor, h.order_booker, h.ob_contact, h.route,
                    h.total_shops, h.visited_shops, h.productive_shops,
                    ...skuValues,
                    totalAch.toFixed(3)
                  ].join(",");
                });

                const csvContent = [headers.join(","), ...rows].join("\n");
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const fileName = `sales_history_${new Date().toISOString().split('T')[0]}.csv`;
                
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'text/csv' })] })) {
                  navigator.share({
                    files: [new File([blob], fileName, { type: 'text/csv' })],
                    title: 'Sales History Export',
                    text: 'Complete Sales History Export'
                  }).catch(err => console.error('Share failed:', err));
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select 
                value={historyFilters.ob} 
                onChange={(e) => setHistoryFilters(prev => ({ ...prev, ob: e.target.value }))}
                className="input-clean text-xs py-1.5"
              >
                <option value="">All OBs</option>
                {obAssignments.map(ob => <option key={ob.contact} value={ob.name}>{ob.name}</option>)}
              </select>
              <input 
                type="date" 
                value={historyFilters.from} 
                onChange={(e) => setHistoryFilters(prev => ({ ...prev, from: e.target.value }))}
                className="input-clean text-xs py-1.5"
              />
              <input 
                type="date" 
                value={historyFilters.to} 
                onChange={(e) => setHistoryFilters(prev => ({ ...prev, to: e.target.value }))}
                className="input-clean text-xs py-1.5"
              />
              <button onClick={() => { setHistoryPage(1); fetchHistory(); }} className="btn-seablue text-xs py-1.5 col-span-1 md:col-span-3">Apply Filters</button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="card-clean overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[9px] uppercase font-black text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-3">Date / OB</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3 text-center">T/V/P</th>
                    {CATEGORIES.map(cat => <th key={cat} className="px-4 py-3 text-center">{cat}</th>)}
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedHistory.map(h => {
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
                      <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="text-[10px] font-bold text-slate-700">{h.date}</div>
                          <div className="text-[9px] text-slate-400">{h.order_booker}</div>
                        </td>
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
                                if (item.ctn === 0 && item.dzn === 0 && item.pks === 0) return null;
                                let detail = `*${sku.name}:* `;
                                const parts = [];
                                if (item.ctn > 0) parts.push(`${item.ctn} Ctn`);
                                if (item.dzn > 0) parts.push(`${item.dzn} Dzn`);
                                if (item.pks > 0) parts.push(`${item.pks} Pks`);
                                return detail + parts.join(", ");
                              }).filter(Boolean).join('\n');

                              const summary = `*Sales Summary - ${h.date}*\n` +
                                `*OB:* ${h.order_booker}\n` +
                                `*Route:* ${h.route}\n` +
                                `*Shops (T/V/P):* ${h.total_shops}/${h.visited_shops}/${h.productive_shops}\n` +
                                `------------------\n` +
                                `*SKU Details:*\n${skuDetails}\n` +
                                `------------------\n` +
                                CATEGORIES.map(cat => `*${cat}:* ${totals[cat].toFixed(2)}`).join('\n') +
                                `\n------------------\n` +
                                `*Total Achievement:* ${totalAch.toFixed(2)}`;
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

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)} className="btn-seablue px-3 py-1 text-xs disabled:opacity-50">Prev</button>
              <span className="text-xs font-bold flex items-center">Page {historyPage} of {totalPages}</span>
              <button disabled={historyPage === totalPages} onClick={() => setHistoryPage(p => p + 1)} className="btn-seablue px-3 py-1 text-xs disabled:opacity-50">Next</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-80">
      <MainNav />
      <header className="bg-white border-b border-slate-200 sticky top-12 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-seablue rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden">
                {appLogo ? (
                  <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Waves className="w-6 h-6" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-black text-seablue uppercase tracking-tight leading-none">OB Sales</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Secondary Sales System</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={saveDraft} 
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="hidden sm:inline">Save Draft</span>
              </button>
              <button 
                onClick={submitOrder} 
                disabled={isSubmitting}
                className="flex items-center gap-2 px-3 py-2 bg-seablue text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-200 hover:bg-seablue-dark transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Submit Report</span>
              </button>
              <button 
                onClick={() => {
                  const items = order.items || {};
                  const skuDetails = SKUS.map(sku => {
                    const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                    if (item.ctn === 0 && item.dzn === 0 && item.pks === 0) return null;
                    let detail = `*${sku.name}:* `;
                    const parts = [];
                    if (item.ctn > 0) parts.push(`${item.ctn} Ctn`);
                    if (item.dzn > 0) parts.push(`${item.dzn} Dzn`);
                    if (item.pks > 0) parts.push(`${item.pks} Pks`);
                    return detail + parts.join(", ");
                  }).filter(Boolean).join('\n');

                  const summary = `*Sales Entry - ${order.date}*\n` +
                    `*OB:* ${order.orderBooker}\n` +
                    `*Route:* ${order.route}\n` +
                    `*Shops (T/V/P):* ${order.totalShops}/${order.visitedShops}/${order.productiveShops}\n` +
                    `------------------\n` +
                    `*SKU Details:*\n${skuDetails}\n` +
                    `------------------\n` +
                    CATEGORIES.map(cat => `*${cat}:* ${categoryTotals[cat].toFixed(2)} ${["Kite Glow", "Burq Action", "Vero"].includes(cat) ? 'Bags' : 'Ctns'}`).join('\n') +
                    `\n------------------\n` +
                    `*Total Achievement:* ${(Object.values(categoryTotals) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(2)}`;
                  
                  const encodedSummary = encodeURIComponent(summary);
                  window.open(`https://wa.me/?text=${encodedSummary}`, '_blank');
                }}
                className="flex items-center gap-2 px-3 py-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                title="Share via WhatsApp"
              >
                <WhatsAppIcon />
                <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Share WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* TSM Filter */}
        {tsmList.length > 0 && (
          <div className="card-clean p-3 flex items-center gap-4 bg-seablue/5 border-seablue/10">
            <label className="text-[10px] font-black text-seablue uppercase tracking-widest">Select TSM:</label>
            <select 
              value={selectedTSM} 
              onChange={(e) => {
                setSelectedTSM(e.target.value);
                setOrder(prev => ({ ...prev, obContact: '', orderBooker: '', route: '', town: '', distributor: '', totalShops: 0 }));
              }} 
              className="input-clean flex-1 max-w-xs"
            >
              <option value="">All TSMs</option>
              {tsmList.map(tsm => <option key={tsm} value={tsm}>{tsm}</option>)}
            </select>
            {selectedTSM && (
              <p className="text-[10px] font-bold text-seablue/60 uppercase">Showing {filteredOBs.length} OBs</p>
            )}
          </div>
        )}

        {/* Meta Info Section */}
        <div className="card-clean p-4 grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
            <input type="date" value={order.date} onChange={(e) => handleMetaChange('date', e.target.value)} className="input-clean w-full" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Order Booker</label>
            <select value={order.obContact} onChange={(e) => handleMetaChange('obContact', e.target.value)} className="input-clean w-full">
              <option value="">Select OB</option>
              {filteredOBs.map(ob => <option key={ob.contact} value={ob.contact}>{ob.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Route</label>
            <select value={order.route} onChange={(e) => handleMetaChange('route', e.target.value)} className="input-clean w-full" disabled={!order.obContact}>
              <option value="">Select Route</option>
              {obAssignments.find(a => a.contact === order.obContact)?.routes.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Total Shops</label>
            <input type="number" value={order.totalShops || ''} onChange={(e) => handleMetaChange('totalShops', parseInt(e.target.value) || 0)} className="input-clean w-full bg-slate-50" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Visited</label>
            <input type="number" value={order.visitedShops || ''} onChange={(e) => handleMetaChange('visitedShops', parseInt(e.target.value) || 0)} className="input-clean w-full" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Productive</label>
            <input type="number" value={order.productiveShops || ''} onChange={(e) => handleMetaChange('productiveShops', parseInt(e.target.value) || 0)} className={`input-clean w-full ${order.visitedShops > 0 && (order.productiveShops / order.visitedShops) < 0.7 ? 'border-red-300' : ''}`} />
          </div>
        </div>

        {/* Never Visited Indicator */}
        {order.totalShops > 0 && (
          <div className="flex justify-center">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border ${Math.max(0, order.totalShops - order.visitedShops) > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              <EyeOff className="w-3 h-3" />
              Never Visited Shops: <span className="text-sm">{Math.max(0, order.totalShops - order.visitedShops)}</span>
            </div>
          </div>
        )}

        {/* Category Summary Section */}
        <div className="card-clean p-1.5 flex flex-wrap items-center justify-center gap-1.5 md:gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-sm">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Washing Powder</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-seablue">{(categoryTotals["Kite Glow"] + categoryTotals["Burq Action"] + categoryTotals["Vero"]).toFixed(2)}</span>
              <span className="text-[8px] font-bold text-slate-400">Tgt: {((order.targets["Kite Glow"] || 0) + (order.targets["Burq Action"] || 0) + (order.targets["Vero"] || 0)).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-sm">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">DWB</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-seablue">{categoryTotals["DWB"].toFixed(2)}</span>
              <span className="text-[8px] font-bold text-slate-400">Tgt: {(order.targets["DWB"] || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-sm">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Match</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-seablue">{categoryTotals["Match"].toFixed(2)}</span>
              <span className="text-[8px] font-bold text-slate-400">Tgt: {(order.targets["Match"] || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-4">
          {CATEGORIES.map(category => (
            <section key={category} className="card-clean overflow-hidden">
              <div className="bg-seablue/5 px-4 py-2 flex justify-between items-center border-b border-slate-100">
                <h2 className="text-[11px] font-black text-seablue uppercase tracking-tighter w-20">{category}</h2>
                
                <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
                  {/* 2nd: Productive Shops */}
                  <div className="flex flex-col items-center bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm min-w-[45px]">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Prod</span>
                    <input type="number" value={order.categoryProductiveShops[category] || ''} onChange={(e) => setOrder(prev => ({ ...prev, categoryProductiveShops: { ...prev.categoryProductiveShops, [category]: parseInt(e.target.value) || 0 } }))} className="w-8 text-center text-[11px] font-bold text-seablue focus:outline-none" />
                  </div>

                  {/* 3rd: Today Sales */}
                  <div className="flex flex-col items-center bg-seablue rounded-lg px-3 py-1 shadow-sm border border-seablue/20 min-w-[60px]">
                    <span className="text-[7px] font-black text-white/80 uppercase tracking-tighter">Today</span>
                    <span className="text-[13px] font-black text-white leading-tight">{categoryTotals[category].toFixed(2)}</span>
                  </div>

                  {/* 4th: Target */}
                  <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 min-w-[50px]">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Target</span>
                    <span className="text-[11px] font-bold text-slate-600">{(order.targets[category] || 0)}</span>
                  </div>

                  {/* 5th: MTD Sales */}
                  <div className="flex flex-col items-center bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 min-w-[55px]">
                    <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter">MTD Ach</span>
                    <span className="text-[11px] font-bold text-emerald-700">{(mtdAchievement[category] || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400">
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-2 py-2 text-center w-20">{["Kite Glow", "Burq Action", "Vero"].includes(category) ? 'Bag' : 'Ctn'}</th>
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
                          <td className="px-4 py-2">
                            <div className="text-xs font-bold text-slate-700">{sku.name}</div>
                            <div className="text-[9px] text-slate-400 font-mono">{sku.unitsPerCarton}u/C</div>
                          </td>
                          <td className="px-1 py-2"><input ref={el => inputRefs.current[`${sku.id}-ctn`] = el} type="number" value={item.ctn || ''} onChange={(e) => handleInputChange(sku.id, 'ctn', e.target.value)} onKeyDown={(e) => handleKeyDown(e, `${sku.id}-ctn`)} className="input-clean w-full py-1 text-center" /></td>
                          {category !== "Match" && (
                            <td className="px-1 py-2"><input ref={el => inputRefs.current[`${sku.id}-dzn`] = el} type="number" disabled={sku.unitsPerDozen === 0} value={item.dzn || ''} onChange={(e) => handleInputChange(sku.id, 'dzn', e.target.value)} onKeyDown={(e) => handleKeyDown(e, `${sku.id}-dzn`)} className="input-clean w-full py-1 text-center disabled:opacity-30" /></td>
                          )}
                          <td className="px-1 py-2"><input ref={el => inputRefs.current[`${sku.id}-pks`] = el} type="number" value={item.pks || ''} onChange={(e) => handleInputChange(sku.id, 'pks', e.target.value)} onKeyDown={(e) => handleKeyDown(e, `${sku.id}-pks`)} className="input-clean w-full py-1 text-center" /></td>
                          <td className="px-4 py-2 text-right font-mono text-[10px] font-bold text-seablue">{calculateTotalCartons(sku.id).toFixed(3)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {isConfirming && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-clean p-8 max-w-sm w-full text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><Send className="w-8 h-8" /></div>
              <h3 className="text-xl font-bold text-seablue">Confirm Submission</h3>
              <p className="text-sm text-slate-500">Submit report for <span className="font-bold text-seablue">{order.route}</span>?</p>
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
                      let detail = `*${sku.name}:* `;
                      const parts = [];
                      if (item.ctn > 0) parts.push(`${item.ctn} Ctn`);
                      if (item.dzn > 0) parts.push(`${item.dzn} Dzn`);
                      if (item.pks > 0) parts.push(`${item.pks} Pks`);
                      return detail + parts.join(", ");
                    }).filter(Boolean).join('\n');

                    const summary = `*Sales Summary - ${lastSubmittedOrder.date}*\n` +
                      `*OB:* ${lastSubmittedOrder.orderBooker}\n` +
                      `*Route:* ${lastSubmittedOrder.route}\n` +
                      `*Shops:* ${lastSubmittedOrder.productiveShops}/${lastSubmittedOrder.visitedShops}/${lastSubmittedOrder.totalShops}\n` +
                      `------------------\n` +
                      `*SKU Details:*\n${skuDetails}\n` +
                      `------------------\n` +
                      CATEGORIES.map(cat => `*${cat}:* ${totals[cat].toFixed(2)} ${["Kite Glow", "Burq Action", "Vero"].includes(cat) ? 'Bags' : 'Ctns'}`).join('\n') +
                      `\n------------------\n` +
                      `*Total Achievement:* ${totalAch.toFixed(2)}`;
                    
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
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50 ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-bold uppercase tracking-widest">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
