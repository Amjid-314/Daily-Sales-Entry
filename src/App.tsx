import * as React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  AreaChart,
  Area,
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
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip as MapTooltip } from 'react-leaflet';
import { MainNav, APP_TABS } from './components/MainNav';
import { Logo } from './components/Logo';
import { TOWN_COORDINATES } from './townCoordinates';
import { DailyStatusView } from './components/DailyStatusView';
import { Calendar as CalendarComponent } from './components/Calendar';
import { EntryForm } from './components/EntryForm';
import { MissingEntriesReport } from './components/MissingEntriesReport';
import { SubmissionModals } from './components/SubmissionModals';
import { Login } from './components/Login';
import { WhatsAppIcon } from './components/WhatsAppIcon';
import { 
  Save, 
  Send, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Scale,
  Loader2,
  History,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Download,
  AlertTriangle,
  RefreshCw,
  LayoutDashboard,
  ClipboardList,
  Settings,
  Plus,
  ShieldCheck,
  Trash,
  Search,
  Lock,
  Store,
  Clock,
  EyeOff,
  Upload,
  Link2,
  ExternalLink,
  ShoppingCart,
  Cloud,
  CloudDownload,
  Share2,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  DollarSign,
  Package,
  PackageSearch,
  MessageCircle,
  ChevronRight,
  Filter,
  ArrowDownRight,
  Mail,
  Key,
  User,
  HelpCircle,
  Activity,
  FileText,
  Truck,
  Edit2
} from 'lucide-react';
import { SKUS, CATEGORIES, BRAND_GROUPS, BRAND_GROUP_NAMES, OrderState, OrderItem, SKU, OBAssignment, CATEGORY_COLORS } from './types';
import { getPSTDate, getPSTTimestamp, getWorkingDays, isTSMEntry, calculateOrderAge, calculateTonnage, calculateGross } from './lib/utils';

const STORAGE_KEY = 'ob_order_draft';
const LOGO_STORAGE_KEY = 'app_logo_base64';

const SUPER_ADMIN_EMAILS = ['amjid.bisconni@gmail.com', 'Amjid.psh@gmail.com'];

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    const state = (this as any).state;
    const userEmail = localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data')!).email : '';
    const isSuperAdmin = SUPER_ADMIN_EMAILS.map(e => e.toLowerCase()).includes((userEmail || '').toLowerCase());

    if (state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="card-clean p-8 max-w-md w-full bg-white shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">System Notice</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                The application is currently being updated or encountered a temporary issue. Please refresh to continue.
              </p>
            </div>
            {state.error && isSuperAdmin && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
                <p className="text-[10px] font-mono text-rose-500 break-all">{state.error.message}</p>
              </div>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="btn-seablue w-full py-3 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Application
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!isStandalone && isMobile) {
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }
  }, []);

  if (!showPrompt) return null;

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 left-4 right-4 z-[9999] bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 flex items-center gap-4"
    >
      <div className="w-12 h-12 bg-seablue rounded-xl flex items-center justify-center text-white shrink-0">
        <Download className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Install App</p>
        <p className="text-[11px] font-bold text-slate-700 leading-tight">
          {isIOS 
            ? 'Tap the Share icon and select "Add to Home Screen" to use as a full app.'
            : 'Select "Install App" from your browser menu for the best experience.'}
        </p>
      </div>
      <button 
        onClick={() => {
          setShowPrompt(false);
          localStorage.setItem('pwa_prompt_dismissed', 'true');
        }}
        className="p-2 text-slate-400"
      >
        <Plus className="w-5 h-5 rotate-45" />
      </button>
    </motion.div>
  );
};

const HomeHub = ({ setView, userRole, userName, logo, tabs, userEmail }: any) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const menuItems = tabs.filter((tab: any) => {
    const email = (userEmail || '').toLowerCase();
    const isSuperAdmin = SUPER_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email);
    
    if (['admin', 'settings'].includes(tab.id)) {
      return isSuperAdmin;
    }

    if (!userRole) return false;
    const normalizedRole = userRole.toUpperCase();

    if (!isSuperAdmin) {
      if (['admin', 'settings'].includes(tab.id)) return false;
      return tab.roles.map((r: string) => r.toUpperCase()).includes(normalizedRole);
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-seablue/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>

      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20 z-10"
      >
        {logo ? (
          <img src={logo} alt="Logo" className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-2xl border border-white/10" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-20 h-20 bg-seablue rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <LayoutDashboard className="w-10 h-10 text-white" />
          </div>
        )}
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">SalesPulse</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">Welcome back, {userName}</p>
      </motion.div>

      {/* Radial Menu Container */}
      <div className="relative w-80 h-80 flex items-center justify-center z-20">
        {/* Central Button */}
        <motion.button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-24 h-24 bg-white rounded-full shadow-[0_0_50px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center z-30 border-4 border-seablue/20 group"
        >
          <div className={`transition-transform duration-500 ${isMenuOpen ? 'rotate-180' : ''}`}>
            {isMenuOpen ? <Plus className="w-8 h-8 text-seablue rotate-45" /> : <Activity className="w-8 h-8 text-seablue animate-pulse" />}
          </div>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Menu</span>
        </motion.button>

        {/* Menu Items (Radial) */}
        <AnimatePresence>
          {isMenuOpen && menuItems.map((item: any, idx: number) => {
            const angle = (idx * (360 / menuItems.length)) - 90;
            const radius = 120;
            const x = radius * Math.cos(angle * (Math.PI / 180));
            const y = radius * Math.sin(angle * (Math.PI / 180));

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x, y }}
                exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: idx * 0.05 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setView(item.id);
                }}
                type="button"
                className="absolute w-16 h-16 bg-slate-800 border border-white/10 rounded-2xl flex flex-col items-center justify-center shadow-2xl hover:bg-seablue hover:scale-110 transition-all group z-50 cursor-pointer"
              >
                <item.icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                <span className="text-[7px] font-black text-slate-400 group-hover:text-white uppercase tracking-tighter mt-1 text-center px-1 leading-none">{item.label}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Decorative Rings */}
        <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_20s_linear_infinite]"></div>
        <div className="absolute inset-4 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
      </div>

      {/* Quick Stats Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-20 grid grid-cols-3 gap-8 text-center"
      >
        <div>
          <p className="text-xl font-black text-white">24/7</p>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Active</p>
        </div>
        <div className="px-8 border-x border-white/10">
          <p className="text-xl font-black text-seablue">LIVE</p>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
        </div>
        <div>
          <p className="text-xl font-black text-white">MTD</p>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Ready</p>
        </div>
      </motion.div>
    </div>
  );
};

interface NationalDashboardProps {
  view?: string;
  setView: (v: any) => void;
  stats: any[];
  hierarchy: any[];
  categories: string[];
  skus: any[];
  isSyncing?: boolean;
  onRefresh?: () => void;
  userRole: any;
  userEmail?: string | null;
  userRegion?: string | null;
  userName?: string | null;
  userContact?: string | null;
  timeGone: number;
  holidays: string;
  lastSync?: string;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  apiFetch: any;
  backupLogs?: any[];
  stockHistory?: any[];
  missingEntriesReport: any[];
  fetchMissingEntriesReport: (m?: string) => void;
  isLoadingMissingEntries: boolean;
  users?: any[];
  obAssignments?: any[];
  selectedHeadCountDetail: any;
  setSelectedHeadCountDetail: (d: any) => void;
}

const NationalDashboard = ({ 
  view, setView, stats, hierarchy, categories, skus, isSyncing, onRefresh, 
  userRole, userEmail, userRegion, userName, userContact, 
  timeGone, holidays, lastSync, selectedMonth, setSelectedMonth, 
  apiFetch, backupLogs = [], stockHistory = [],
  missingEntriesReport, fetchMissingEntriesReport, isLoadingMissingEntries,
  users = [], obAssignments = [],
  selectedHeadCountDetail, setSelectedHeadCountDetail
}: NationalDashboardProps) => {
  const [offDayFilter, setOffDayFilter] = useState('All');
  const [expandedOB, setExpandedOB] = useState<string | null>(null);
  const [headCountDrillDown, setHeadCountDrillDown] = useState<{ level: string, value: string }[]>([]);

  const filteredHeadCountData = useMemo(() => {
    if (!selectedHeadCountDetail) return [];
    const role = selectedHeadCountDetail.designation;
    const currentMonth = selectedMonth;
    const currentMonthHistory = stats.filter((s: any) => s.date.startsWith(currentMonth));

    // Base data: all users for this role
    let data: any[] = [];
    if (role === 'OB') {
      const obMap = new Map();
      obAssignments.forEach((ob: any) => {
        const name = ob.name || ob.ob_name || '';
        const id = ob.contact || ob.ob_id || '';
        const tsm = ob.tsm || ob.asm_tsm_name || '';
        if (name.trim() !== '' && !isTSMEntry(name, tsm)) {
          if (!obMap.has(id)) {
            obMap.set(id, { name, contact: id, role: 'OB', region: ob.region, town: ob.town, tsm: ob.tsm });
          }
        }
      });
      data = Array.from(obMap.values()).map(u => {
        const h = hierarchy.find(h => h.ob_id === u.contact);
        const entries = currentMonthHistory.filter(s => (s.ob_contact || '').toLowerCase() === (u.contact || '').toLowerCase());
        return { ...u, h: h || { territory_region: u.region, town_name: u.town, asm_tsm_name: u.tsm }, entries, isActive: entries.length > 0 };
      });
    } else {
      data = users.filter((u: any) => u.role === role).map(u => {
        const h = hierarchy.find(h => h.ob_id === u.contact || h.asm_tsm_name === u.name || h.rsm_name === u.name);
        const entries = currentMonthHistory.filter(s => {
          if (role === 'RSM') return (s.rsm || '').trim().toLowerCase() === (u.name || '').trim().toLowerCase();
          if (role === 'SC') return (s.sc || '').trim().toLowerCase() === (u.name || '').trim().toLowerCase();
          if (role === 'TSM' || role === 'ASM') return (s.tsm || '').trim().toLowerCase() === (u.name || '').trim().toLowerCase();
          return false;
        });
        return { ...u, h, entries, isActive: entries.length > 0 };
      });
    }

    // Apply drill-down filters
    headCountDrillDown.forEach(filter => {
      if (filter.level === 'Region') {
        data = data.filter(u => u.h?.territory_region === filter.value);
      } else if (filter.level === 'TSM') {
        data = data.filter(u => u.h?.asm_tsm_name === filter.value);
      } else if (filter.level === 'Town') {
        data = data.filter(u => u.h?.town_name === filter.value);
      }
    });

    return data;
  }, [selectedHeadCountDetail, headCountDrillDown, users, hierarchy, stats, selectedMonth]);

  const filteredOBs = useMemo(() => {
    const uniqueOBs = new Map();
    hierarchy.forEach(h => {
      if (!uniqueOBs.has(h.ob_id)) {
        uniqueOBs.set(h.ob_id, h);
      }
    });

    return Array.from(uniqueOBs.values()).filter((h: any) => {
      if (userRole === 'Admin' || userRole === 'Super Admin' || userRole === 'Director' || userRole === 'NSM') return true;
      if (userRole === 'RSM' || userRole === 'SC') {
        const normalizedRegion = (userRegion || '').trim().toLowerCase();
        const normalizedName = (userName || '').trim().toLowerCase();
        return (h.territory_region || '').trim().toLowerCase() === normalizedRegion || 
               (h.rsm_name || '').trim().toLowerCase() === normalizedName || 
               (h.sc_name || '').trim().toLowerCase() === normalizedName;
      }
      if (userRole === 'TSM' || userRole === 'ASM') return (h.asm_tsm_name || '').trim().toLowerCase() === (userName || '').trim().toLowerCase();
      if (userRole === 'OB') return h.ob_id === userContact;
      return false;
    }).filter(h => !(h.ob_name || '').toLowerCase().includes('test'));
  }, [hierarchy, userRole, userRegion, userName, userContact]);

  const [filterLevel, setFilterLevel] = useState<'National' | 'Region' | 'TSM' | 'Town' | 'OB' | 'Route'>(() => {
    if (userRole === 'Admin' || userRole === 'Super Admin' || userRole === 'Director' || userRole === 'NSM') return 'National';
    if (userRole === 'RSM' || userRole === 'SC') return 'Region';
    if (userRole === 'TSM' || userRole === 'ASM') return 'TSM';
    if (userRole === 'OB') return 'OB';
    return 'National';
  });

  const [mapLevel, setMapLevel] = useState<'region' | 'town'>('town');
  const [mapFilterRegion, setMapFilterRegion] = useState('All');
  const [mapFilterTSM, setMapFilterTSM] = useState('All');
  const [mapFilterTown, setMapFilterTown] = useState('All');
  const [mapFilterOB, setMapFilterOB] = useState('All');
  const [mapFilterBrand, setMapFilterBrand] = useState('All');
  const [selectedOBForRoute, setSelectedOBForRoute] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<string>(() => {
    if (userRole === 'RSM' || userRole === 'SC') return userRegion || '';
    if (userRole === 'TSM' || userRole === 'ASM') return userName || '';
    if (userRole === 'OB') return userContact || '';
    return '';
  });
  const [navHistory, setNavHistory] = useState<{ level: string, value: string }[]>([]);

  useEffect(() => {
    if (view === 'command_center') {
      const selectedTsm = localStorage.getItem('cc_selected_tsm');
      if (selectedTsm) {
        setFilterLevel('TSM');
        setFilterValue(selectedTsm);
        localStorage.removeItem('cc_selected_tsm');
      }
    }
  }, [view]);

  const [routeAnalysisCategoryFilter, setRouteAnalysisCategoryFilter] = useState('All');
  const [routeAnalysisBrandFilter, setRouteAnalysisBrandFilter] = useState('All');

  const handleDrillDown = (level: string, value: string) => {
    setNavHistory(prev => [...prev, { level: filterLevel, value: filterValue }]);
    setFilterLevel(level as any);
    setFilterValue(value);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setFilterLevel(visibleFilterLevels[0] as any);
      setFilterValue(() => {
        if (userRole === 'RSM' || userRole === 'SC') return userRegion || '';
        if (userRole === 'TSM' || userRole === 'ASM') return userName || '';
        if (userRole === 'OB') return userContact || '';
        return '';
      });
      setNavHistory([]);
    } else {
      const item = navHistory[index];
      setFilterLevel(item.level as any);
      setFilterValue(item.value);
      setNavHistory(navHistory.slice(0, index));
    }
  };
  const [targetView, setTargetView] = useState('Brand');
  const [contributionView, setContributionView] = useState<'Brand' | 'Category' | 'SKU'>('Brand');
  const [achievementView, setAchievementView] = useState<'Brand' | 'Category' | 'SKU'>('Brand');
  const [topCategoryFilter, setTopCategoryFilter] = useState('All');
  const [topBrandFilter, setTopBrandFilter] = useState('All');
  const [heatmapView, setHeatmapView] = useState('Total');
  const [tsmCategoryFilter, setTsmCategoryFilter] = useState('All');
  const [tsmBrandFilter, setTsmBrandFilter] = useState('All');
  const [obReportCategoryFilter, setObReportCategoryFilter] = useState('All');
  const [obReportBrandFilter, setObReportBrandFilter] = useState('All');
  const [tsmSkuFilter, setTsmSkuFilter] = useState('All');
  const [worstBrandFilter, setWorstBrandFilter] = useState('All');
  const [categoryWiseCategoryFilter, setCategoryWiseCategoryFilter] = useState('Washing Powder*');
  const [categoryWiseBrandFilter, setCategoryWiseBrandFilter] = useState('All');

  const visibleFilterLevels = useMemo(() => {
    if (userRole === 'Admin' || userRole === 'Super Admin' || userRole === 'Director' || userRole === 'NSM') {
      return ['National', 'Region', 'TSM', 'Town', 'OB', 'Route'];
    } else if (userRole === 'RSM' || userRole === 'SC') {
      return ['Region', 'TSM', 'Town', 'OB', 'Route'];
    } else if ((userRole === 'TSM' || userRole === 'ASM')) {
      return ['TSM', 'Town', 'OB', 'Route'];
    } else {
      return ['OB', 'Route'];
    }
  }, [userRole]);

  useEffect(() => {
    if (!visibleFilterLevels.includes(filterLevel)) {
      setFilterLevel(visibleFilterLevels[0] as any);
    }
  }, [visibleFilterLevels]);

  const headCountStats = useMemo(() => {
    if (!users || !obAssignments || !stats) return [];

    const currentMonth = selectedMonth;
    const currentMonthHistory = stats.filter((s: any) => s.date.startsWith(currentMonth));

    const getRoleStats = (roleName: string) => {
      const roleUsers = users.filter((u: any) => u.role === roleName);
      const total = roleUsers.length;
      let active = 0;
      roleUsers.forEach((u: any) => {
        const hasEntry = currentMonthHistory.some((s: any) => {
          if (roleName === 'RSM') return (s.rsm || '').trim().toLowerCase() === (u.name || '').trim().toLowerCase();
          if (roleName === 'SC') return (s.sc || '').trim().toLowerCase() === (u.name || '').trim().toLowerCase();
          if (roleName === 'TSM' || roleName === 'ASM') return (s.tsm || '').trim().toLowerCase() === (u.name || '').trim().toLowerCase();
          return false;
        });
        if (hasEntry) active++;
      });
      return { designation: roleName, total, active };
    };

    const rsmStats = getRoleStats('RSM');
    const asmStats = getRoleStats('ASM');
    const tsmStats = getRoleStats('TSM');
    const scStats = getRoleStats('SC');

    const obMap = new Map();
    obAssignments.forEach((ob: any) => {
      const name = ob.name || ob.ob_name || '';
      const id = ob.contact || ob.ob_id || '';
      const tsm = ob.tsm || ob.asm_tsm_name || '';
      if (name.trim() !== '' && !isTSMEntry(name, tsm)) {
        obMap.set(id, name);
      }
    });
    const totalOBs = obMap.size;
    let activeOBs = 0;
    obMap.forEach((name, id) => {
      const hasEntry = currentMonthHistory.some((s: any) => s.ob_contact === id);
      if (hasEntry) activeOBs++;
    });

    const obStats = { designation: 'OB', total: totalOBs, active: activeOBs };
    return [rsmStats, asmStats, tsmStats, scStats, obStats];
  }, [users, obAssignments, stats, selectedMonth]);

  const brands = useMemo(() => {
    if (topBrandFilter !== 'All') return [topBrandFilter];
    if (topCategoryFilter !== 'All') return BRAND_GROUPS[topCategoryFilter] || [];
    return categories;
  }, [topCategoryFilter, topBrandFilter, categories]);

  const processedStats = useMemo(() => {
    let baseStats = stats;
    
    const tsmContacts = new Set(hierarchy.map(h => (h.asm_tsm_contact || '').trim()).filter(Boolean));
    // Add contacts starting with TSM- to tsmContacts
    stats.forEach(s => {
      if ((s.ob_contact || '').startsWith('TSM-')) {
        tsmContacts.add(s.ob_contact);
      }
    });

    const testOBIds = new Set(hierarchy.filter(h => (h.ob_name || '').toLowerCase().includes('test')).map(h => h.ob_id));
    
    // Global exclusion of test OBs
    baseStats = baseStats.filter(s => !testOBIds.has(s.ob_contact) && !(s.ob_name || '').toLowerCase().includes('test'));

    return baseStats.map(s => {
      const h = hierarchy.find(h => h.ob_id === s.ob_contact);
      // Strictly define TSM entry - handle *TSM - prefix and TSM- contact prefix
      const obNameClean = (s.order_booker || '').replace(/^\*TSM\s*-\s*/i, '').trim().toLowerCase();
      const tsmNameClean = (s.tsm || '').trim().toLowerCase();
      
      const isTSMEntryRow = 
        (s.ob_contact || '').startsWith('TSM-') || 
        tsmContacts.has(s.ob_contact) || 
        (obNameClean && tsmNameClean && (obNameClean === tsmNameClean || obNameClean.includes(tsmNameClean) || tsmNameClean.includes(obNameClean))) || 
        (h && (h.role === 'TSM' || h.role === 'ASM' || h.role === 'RSM'));

      const orderData = (() => {
        if (typeof s.order_data === 'string') {
          try { return JSON.parse(s.order_data); } catch (e) { return null; }
        }
        return s.order_data;
      })();
      
      let totalBags = 0;
      let totalCtns = 0;
      let brandSales: Record<string, number> = {};
      let brandTonnage: Record<string, number> = {};
      let totalWeightKg = 0;
      
      skus.forEach(sku => {
        const item = (orderData || {})[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
        const packs = (Number(item.ctn || 0) * Number(sku.unitsPerCarton || 0)) + (Number(item.dzn || 0) * Number(sku.unitsPerDozen || 0)) + Number(item.pks || 0);
        const ctns = Number(sku.unitsPerCarton || 0) > 0 ? packs / Number(sku.unitsPerCarton) : 0;
        
        let matchesFilter = true;
        if (topCategoryFilter !== 'All') {
          const brandsInGroup = BRAND_GROUPS[topCategoryFilter] || [];
          matchesFilter = brandsInGroup.includes(sku.category);
        }
        if (matchesFilter && topBrandFilter !== 'All') {
          matchesFilter = sku.category === topBrandFilter;
        }
        
        if (matchesFilter) {
          if (sku.unit === 'Bags') {
            totalBags += ctns;
          } else {
            totalCtns += ctns;
          }
          const weightKg = (packs * (Number(sku.weight_gm_per_pack) || 0)) / 1000;
          
          // Ignore "Match" tonnage for now as per user request
          if (sku.category !== 'Match') {
            totalWeightKg += weightKg;
            brandTonnage[sku.category] = (brandTonnage[sku.category] || 0) + (weightKg / 1000);
          } else {
            brandTonnage[sku.category] = 0;
          }
          
          brandSales[sku.category] = (brandSales[sku.category] || 0) + ctns;
        }
      });

      const visitEfficiency = s.visited_shops > 0 ? s.productive_shops / s.visited_shops : 0;
      const isFakeVisit = s.visited_shops >= 50 && s.productive_shops <= 20;

      return {
        ...s,
        totalBags,
        totalCtns,
        totalWeightKg,
        brandSales,
        brandTonnage,
        isTSMEntry: isTSMEntryRow,
        visitEfficiency,
        isFakeVisit,
        region: h?.territory_region || s.region || 'Unassigned',
        tsm: h?.asm_tsm_name || s.tsm || 'Unassigned',
        rsm: h?.rsm_name || s.rsm || 'Unassigned',
        sc: h?.sc_name || s.sc || 'Unassigned',
        nsm: h?.nsm_name || s.nsm || 'Unassigned',
        director: h?.director_sales || s.director || 'Unassigned',
        supervisor: h?.supervisor_name || 'Unassigned',
        town: h?.town_name || s.town || 'Unassigned',
        distributor: h?.distributor_name || s.distributor || 'Unassigned',
        ob_name: h?.ob_name || s.order_booker || 'Unassigned',
        month: s.date.slice(0, 7)
      };
    });
  }, [stats, hierarchy, skus, userRole, userRegion, userName, userContact, topCategoryFilter, topBrandFilter]);

  const filteredStats = useMemo(() => {
    let result = processedStats;
    if (filterLevel !== 'National') {
      const normalizedFilter = (filterValue || '').trim().toLowerCase();
      result = result.filter(s => {
        if (filterLevel === 'Region') return (s.region || '').trim().toLowerCase() === normalizedFilter;
        if (filterLevel === 'SC') return (s.sc || '').trim().toLowerCase() === normalizedFilter;
        if (filterLevel === 'TSM') return (s.tsm || '').trim().toLowerCase() === normalizedFilter;
        if (filterLevel === 'Supervisor') return (s.supervisor || '').trim().toLowerCase() === normalizedFilter;
        if (filterLevel === 'Town') return (s.town || '').trim().toLowerCase() === normalizedFilter;
        if (filterLevel === 'Distributor') return (s.distributor || '').trim().toLowerCase() === normalizedFilter;
        if (filterLevel === 'OB') return (s.ob_contact || '').trim().toLowerCase() === normalizedFilter;
        if (filterLevel === 'Route') return (s.route || '').trim().toLowerCase() === normalizedFilter;
        return true;
      });
    }
    return result;
  }, [processedStats, filterLevel, filterValue]);

  const filteredHierarchy = useMemo(() => {
    if (filterLevel === 'National') return hierarchy;
    return hierarchy.filter(h => {
      if (filterLevel === 'Region') return (h.territory_region || '').trim().toLowerCase() === filterValue.trim().toLowerCase();
      if (filterLevel === 'TSM') return (h.asm_tsm_name || '').trim().toLowerCase() === filterValue.trim().toLowerCase();
      if (filterLevel === 'Town') return (h.town_name || '').trim().toLowerCase() === filterValue.trim().toLowerCase();
      if (filterLevel === 'OB') return (h.ob_id || '').trim().toLowerCase() === filterValue.trim().toLowerCase();
      if (filterLevel === 'Route') {
        const routes = (() => {
          if (typeof h.routes === 'string') {
            try { return JSON.parse(h.routes); } catch (e) { return []; }
          }
          return h.routes || [];
        })();
        return Array.isArray(routes) && routes.some((r: string) => r.trim().toLowerCase() === filterValue.trim().toLowerCase());
      }
      return true;
    });
  }, [hierarchy, filterLevel, filterValue]);

  const monthStats = useMemo(() => {
    return filteredStats.filter(s => s.month === selectedMonth);
  }, [filteredStats, selectedMonth]);

  const obRoutePerformance = useMemo(() => {
    if (!selectedOBForRoute) return [];
    const routes: Record<string, any> = {};
    monthStats.filter(s => s.ob_contact === selectedOBForRoute && !s.isTSMEntry).forEach(s => {
      const routeName = s.route || 'Unassigned';
      if (!routes[routeName]) {
        routes[routeName] = {
          name: routeName,
          sales: 0,
          visited: 0,
          productive: 0,
          entries: 0
        };
      }
      routes[routeName].sales += (s.totalBags + s.totalCtns);
      routes[routeName].visited += s.visited_shops;
      routes[routeName].productive += s.productive_shops;
      routes[routeName].entries += 1;
    });
    return Object.values(routes).sort((a, b) => b.sales - a.sales);
  }, [monthStats, selectedOBForRoute]);

  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {
      Region: ['Lahore', 'Rawalpindi', 'North', 'Central Punjab (FSD)', 'South Punjab (Multan)', 'Sindh', 'Karachi', 'Direct'],
      TSM: Array.from(new Set(processedStats.map(s => s.tsm))).filter(Boolean).sort() as string[],
      Town: Array.from(new Set(processedStats.map(s => s.town))).filter(Boolean).sort() as string[],
      OB: Array.from(new Set(processedStats.map(s => JSON.stringify({ name: s.ob_name, contact: s.ob_contact }))))
        .map((s: string) => JSON.parse(s))
        .sort((a, b) => a.name.localeCompare(b.name)),
      Route: Array.from(new Set(processedStats.map(s => s.route))).filter(Boolean).sort() as string[],
    };
    return options;
  }, [processedStats]);

  const obPerformance = useMemo(() => {
    const obs: Record<string, any> = {};
    monthStats.forEach(s => {
      if (s.isTSMEntry) return; // Exclude TSM entries
      if (!obs[s.ob_contact]) { 
        obs[s.ob_contact] = { 
          ob_contact: s.ob_contact,
          name: s.ob_name, 
          town: s.town, 
          tsm: s.tsm, 
          distributor: s.distributor,
          region: s.region,
          totalBags: 0,
          totalCtns: 0,
          totalSales: 0,
          totalWeight: 0,
          visited: 0,
          productive: 0,
          entries: 0,
          brandSales: {}
        };
        CATEGORIES.forEach(b => obs[s.ob_contact].brandSales[b] = 0);
      }
      obs[s.ob_contact].totalBags += (s.totalBags || 0);
      obs[s.ob_contact].totalCtns += (s.totalCtns || 0);
      obs[s.ob_contact].totalSales += (s.totalBags || 0) + (s.totalCtns || 0);
      obs[s.ob_contact].totalWeight += s.totalWeightKg;
      obs[s.ob_contact].visited += s.visited_shops;
      obs[s.ob_contact].productive += s.productive_shops;
      obs[s.ob_contact].entries += 1;
      CATEGORIES.forEach(b => {
        obs[s.ob_contact].brandSales[b] += (s.brandSales[b] || 0);
      });
    });

    return Object.values(obs)
      .filter(ob => ob.totalSales > 0 || ob.entries > 0)
      .map(ob => {
      const h = hierarchy.find(h => h.ob_id === ob.ob_contact);
      const target = h ? CATEGORIES.reduce((sum, cat) => {
        const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
        return sum + (Number(h[targetKey]) || 0);
      }, 0) : 0;
      const achievement = target > 0 ? (ob.totalSales / target) * 100 : 0;

      const workingDays = 25; // Default
      const consistencyScore = (ob.entries / workingDays) * 100;
      
      // OB Productivity Score
      // Weights: Sales 50%, Visit Coverage 30%, Productive Ratio 20%
      const salesPerf = target > 0 ? Math.min(100, achievement) : Math.min(100, (ob.totalSales / 100) * 100); 
      const visitCoverage = Math.min(100, (ob.visited / (ob.entries * 50)) * 100); // 50 shops per day
      const productiveRatio = ob.visited > 0 ? (ob.productive / ob.visited) * 100 : 0;
      
      const productivityScore = (0.5 * salesPerf) + (0.3 * visitCoverage) + (0.2 * productiveRatio);

      let scoreLabel = 'Weak';
      if (productivityScore >= 90) scoreLabel = 'Excellent';
      else if (productivityScore >= 70) scoreLabel = 'Good';
      else if (productivityScore >= 50) scoreLabel = 'Average';

      let category: 'A' | 'B' | 'C' | 'D' = 'D';
      if (ob.totalSales >= 300) category = 'A';
      else if (ob.totalSales >= 200) category = 'B';
      else if (ob.totalSales >= 100) category = 'C';

      return {
        ...ob,
        target,
        achievement,
        consistencyScore,
        productivityScore,
        scoreLabel,
        isIrregular: consistencyScore < 70,
        category
      };
    });
  }, [monthStats, hierarchy]);

  const tsmDirectPerformance = useMemo(() => {
    const tsms: Record<string, any> = {};
    monthStats.forEach(s => {
      if (!s.isTSMEntry) return; // Only include TSM entries
      if (!tsms[s.ob_contact]) { 
        tsms[s.ob_contact] = { 
          ob_contact: s.ob_contact,
          name: s.ob_name, 
          town: s.town, 
          tsm: s.tsm, 
          distributor: s.distributor,
          region: s.region,
          totalBags: 0,
          totalCtns: 0,
          totalSales: 0,
          totalWeight: 0,
          visited: 0,
          productive: 0,
          entries: 0,
          brandSales: {}
        };
        CATEGORIES.forEach(b => tsms[s.ob_contact].brandSales[b] = 0);
      }
      tsms[s.ob_contact].totalBags += (s.totalBags || 0);
      tsms[s.ob_contact].totalCtns += (s.totalCtns || 0);
      tsms[s.ob_contact].totalSales += (s.totalBags || 0) + (s.totalCtns || 0);
      tsms[s.ob_contact].totalWeight += s.totalWeightKg;
      tsms[s.ob_contact].visited += s.visited_shops;
      tsms[s.ob_contact].productive += s.productive_shops;
      tsms[s.ob_contact].entries += 1;
      CATEGORIES.forEach(b => {
        tsms[s.ob_contact].brandSales[b] += (s.brandSales[b] || 0);
      });
    });

    return Object.values(tsms)
      .filter(tsm => tsm.totalSales > 0 || tsm.entries > 0)
      .map(tsm => {
      const h = hierarchy.find(h => h.ob_id === tsm.ob_contact);
      const target = h ? CATEGORIES.reduce((sum, cat) => {
        const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
        return sum + (Number(h[targetKey]) || 0);
      }, 0) : 0;
      const achievement = target > 0 ? (tsm.totalSales / target) * 100 : 0;

      const workingDays = 25; // Default
      const consistencyScore = (tsm.entries / workingDays) * 100;
      
      const salesPerf = target > 0 ? Math.min(100, achievement) : Math.min(100, (tsm.totalSales / 100) * 100); 
      const visitCoverage = Math.min(100, (tsm.visited / (tsm.entries * 50)) * 100); // 50 shops per day
      const productiveRatio = tsm.visited > 0 ? (tsm.productive / tsm.visited) * 100 : 0;
      
      const productivityScore = (0.5 * salesPerf) + (0.3 * visitCoverage) + (0.2 * productiveRatio);

      let scoreLabel = 'Weak';
      if (productivityScore >= 90) scoreLabel = 'Excellent';
      else if (productivityScore >= 70) scoreLabel = 'Good';
      else if (productivityScore >= 50) scoreLabel = 'Average';

      let category: 'A' | 'B' | 'C' | 'D' = 'D';
      if (tsm.totalSales >= 300) category = 'A';
      else if (tsm.totalSales >= 200) category = 'B';
      else if (tsm.totalSales >= 100) category = 'C';

      return {
        ...tsm,
        target,
        achievement,
        consistencyScore,
        productivityScore,
        scoreLabel,
        isIrregular: consistencyScore < 70,
        category
      };
    });
  }, [monthStats, hierarchy]);

  const routeWeakness = useMemo(() => {
    const routes: Record<string, any[]> = {};
    filteredStats.forEach(s => {
      if (s.isTSMEntry) return; // Exclude TSM entries
      const key = `${s.ob_contact}-${s.route}`;
      if (!routes[key]) routes[key] = [];
      routes[key].push(s);
    });

    const weakRoutes: any[] = [];
    Object.entries(routes).forEach(([key, entries]) => {
      const sorted = entries.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
      if (sorted.length < 2) return;

      const latest = sorted[0];
      const previous = sorted[1];

      const salesDeclining = latest.totalBags < previous.totalBags;
      const productiveDeclining = latest.productive_shops < previous.productive_shops;
      const lowCoverage = latest.visited_shops < 40;

      if (salesDeclining || productiveDeclining || lowCoverage) {
        weakRoutes.push({
          ob: latest.ob_name,
          route: latest.route,
          latestSales: latest.totalBags,
          prevSales: previous.totalBags,
          latestProd: latest.productive_shops,
          prevProd: previous.productive_shops,
          coverage: latest.visited_shops,
          reasons: [
            salesDeclining && 'Declining Sales',
            productiveDeclining && 'Lower Productivity',
            lowCoverage && 'Low Coverage'
          ].filter(Boolean)
        });
      }
    });

    return weakRoutes.sort((a, b) => a.latestSales - b.latestSales).slice(0, 10);
  }, [filteredStats]);

  const stockGapsData = useMemo(() => {
    if (!stockHistory || !hierarchy) return [];
    
    // Get latest stock for each distributor
    const latestStocks: Record<string, any> = {};
    [...stockHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(s => {
      latestStocks[s.distributor] = s;
    });

    const gaps: any[] = [];
    Object.entries(latestStocks).forEach(([distName, stock]) => {
      const items = typeof stock.stocks === 'string' ? JSON.parse(stock.stocks) : (stock.stocks || {});
      const lowItems = Object.entries(items)
        .filter(([skuId, data]: [string, any]) => Number(data.ctn || 0) <= 2)
        .map(([skuId]) => SKUS.find(s => s.id === skuId)?.name || skuId);

      if (lowItems.length > 0) {
        const h = hierarchy.find(h => h.distributor_town === distName);
        gaps.push({
          distributor: distName,
          region: h?.territory_region || 'Unknown',
          tsm: h?.asm_tsm_name || 'Unknown',
          lowItems,
          count: lowItems.length
        });
      }
    });

    return gaps.sort((a, b) => b.count - a.count);
  }, [stockHistory, hierarchy]);

  const data = useMemo(() => {
    const totalBags = monthStats.reduce((sum, s) => sum + (s.totalBags || 0), 0);
    const totalCtns = monthStats.reduce((sum, s) => sum + (s.totalCtns || 0), 0);
    const uniqueOBs = new Set(monthStats.filter(s => !s.isTSMEntry).map(s => s.ob_contact)).size;
    const uniqueTSMs = new Set(monthStats.map(s => s.tsm)).size;
    
    const totalTarget = filteredHierarchy.reduce((sum, h) => {
      return sum + CATEGORIES.reduce((bSum, cat) => {
        let isMatch = true;
        if (topCategoryFilter !== 'All') {
          const brandsInGroup = BRAND_GROUPS[topCategoryFilter] || [];
          isMatch = brandsInGroup.includes(cat);
        }
        if (isMatch && topBrandFilter !== 'All') {
          isMatch = cat === topBrandFilter;
        }

        if (isMatch) {
          const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
          return bSum + (Number(h[targetKey]) || 0);
        }
        return bSum;
      }, 0);
    }, 0);
    const totalSales = totalBags + totalCtns;
    const achievementPerc = totalTarget > 0 ? (totalSales / totalTarget) * 100 : 0;

    const totalOBSalary = uniqueOBs * 50000;
    const totalTSMSalary = uniqueTSMs * 70000;
    const totalSalaryCost = totalOBSalary + totalTSMSalary;
    const costPerBag = totalSales > 0 ? totalSalaryCost / totalSales : 0;
    const totalTonnage = monthStats.filter(s => !s.isTSMEntry).reduce((sum, s) => sum + (s.totalWeightKg || 0), 0) / 1000;
    const costPerKg = totalTonnage > 0 ? totalSalaryCost / (totalTonnage * 1000) : 0;

    const brandTotals: Record<string, number> = {};
    const brandActiveOBs: Record<string, number> = {};
    const brandTonnage: Record<string, number> = {};
    const brandTargets: Record<string, number> = {};
    const skuTotals: Record<string, number> = {};

    monthStats.forEach(s => {
      if (s.isTSMEntry) return; // Exclude TSM entries
      const orderData = (() => {
        if (typeof s.order_data === 'string') {
          try { return JSON.parse(s.order_data); } catch (e) { return null; }
        }
        return s.order_data;
      })();
      skus.forEach(sku => {
        if (sku.id === 'dwb-new') return;
        const item = (orderData || {})[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
        const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
        const ctns = sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0;
        
        let prefix = '';
        if (sku.category === 'DWB') prefix = 'D - ';
        if (sku.category === 'Match') prefix = 'M - ';
        const displayName = `${prefix}${sku.name}`;
        
        skuTotals[displayName] = (skuTotals[displayName] || 0) + ctns;
      });
    });

    brands.forEach(b => {
      const obOnlyStats = monthStats.filter(s => !s.isTSMEntry);
      const brandStats = obOnlyStats.filter(s => (s.brandSales[b] || 0) > 0);
      brandTotals[b] = obOnlyStats.reduce((sum, s) => sum + (s.brandSales[b] || 0), 0);
      brandActiveOBs[b] = new Set(brandStats.map(s => s.ob_contact)).size;
      brandTonnage[b] = obOnlyStats.reduce((sum, s) => sum + (s.brandTonnage[b] || 0), 0);
      
      brandTargets[b] = filteredHierarchy.reduce((sum, h) => {
        const targetKey = `target_${b.toLowerCase().replace(/\s+/g, '_')}`;
        return sum + (Number(h[targetKey]) || 0);
      }, 0);
    });

    const totalVisited = monthStats.filter(s => !s.isTSMEntry).reduce((sum, s) => sum + s.visited_shops, 0);
    const totalProductive = monthStats.filter(s => !s.isTSMEntry).reduce((sum, s) => sum + s.productive_shops, 0);
    const totalShops = filteredHierarchy.reduce((sum, h) => sum + (Number(h.total_shops) || 0), 0);
    const productivity = totalVisited > 0 ? (totalProductive / totalVisited) * 100 : 0;

    const zeroSaleOBs = obPerformance.filter(ob => ob.totalSales === 0).length;
    const lowPerfOBs = obPerformance.filter(ob => ob.achievement < 50).length;
    const avgSalesPerOB = uniqueOBs > 0 ? totalSales / uniqueOBs : 0;
    const dropSize = totalProductive > 0 ? totalSales / totalProductive : 0;

    const brandWiseStats = brands.map(b => {
      const firstSku = skus.find(s => s.category === b);
      const unit = firstSku?.unit === 'Ctns' ? 'C' : 'B';
      return {
        name: b,
        target: brandTargets[b] || 0,
        achievement: brandTotals[b] || 0,
        percentage: (brandTargets[b] || 0) > 0 ? (brandTotals[b] / brandTargets[b]) * 100 : 0,
        tonnage: brandTonnage[b] || 0,
        unit
      };
    });

    const weakestRoutes = routeWeakness.map(rw => ({
      route: rw.route,
      ob: rw.ob,
      reasons: rw.reasons,
      avgSales: rw.latestSales,
      efficiency: rw.latestProd
    })).sort((a, b) => a.efficiency - b.efficiency).slice(0, 5);

    const last8Visits = monthStats.filter(s => !s.isTSMEntry).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map(s => ({
      date: s.date,
      route: s.route,
      obName: s.ob_name,
      brands: s.brandSales
    }));

    return { 
      totalBags, totalCtns, totalSales, totalTarget, achievementPerc, uniqueOBs, uniqueTSMs, 
      totalSalaryCost, costPerBag, costPerKg, brandTotals, brandActiveOBs, brandTonnage, 
      brandTargets, totalTonnage, skuTotals, productivity, zeroSaleOBs, lowPerfOBs, 
      avgSalesPerOB, dropSize, totalVisited, totalProductive, totalShops, brandWiseStats,
      weakestRoutes, last8Visits
    };
  }, [monthStats, filteredHierarchy, brands, skus, obPerformance, routeWeakness, topCategoryFilter, topBrandFilter]);

  const summary = data;

  const categoryStats = useMemo(() => {
    const cats = { A: { count: 0, sales: 0 }, B: { count: 0, sales: 0 }, C: { count: 0, sales: 0 }, D: { count: 0, sales: 0 } };
    obPerformance.forEach(ob => {
      const cat = ob.category as keyof typeof cats;
      cats[cat].count++;
      cats[cat].sales += ob.totalSales;
    });
    return Object.entries(cats).map(([cat, data]) => ({
      category: cat,
      count: data.count,
      totalSales: data.sales,
      avgSales: data.count > 0 ? data.sales / data.count : 0
    }));
  }, [obPerformance]);

  const trendData = useMemo(() => {
    const months: Record<string, any> = {};
    filteredStats.forEach(s => {
      if (s.isTSMEntry) return; // Exclude TSM entries
      if (!months[s.month]) {
        months[s.month] = { month: s.month, totalSales: 0, obCount: new Set(), tsmCount: new Set() };
        brands.forEach(b => months[s.month][b] = 0);
      }
      months[s.month].totalSales += s.totalBags;
      months[s.month].obCount.add(s.ob_contact);
      months[s.month].tsmCount.add(s.tsm);
      brands.forEach(b => months[s.month][b] += (s.brandSales[b] || 0));
    });

    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).map(m => {
      const totalSalary = (m.obCount.size * 50000) + (m.tsmCount.size * 70000);
      return {
        ...m,
        costPerBag: m.totalSales > 0 ? totalSalary / m.totalSales : 0,
        totalSalary
      };
    });
  }, [filteredStats, brands]);

  const routeAnalysisData = useMemo(() => {
    if (filterLevel !== 'Route' && filterLevel !== 'OB') return [];
    
    let data = filteredStats.filter(s => !s.isTSMEntry);
    
    // Apply filters for route analysis
    if (routeAnalysisCategoryFilter !== 'All' || routeAnalysisBrandFilter !== 'All') {
      data = data.map(s => {
        let filteredBags = 0;
        let filteredTons = 0;
        
        CATEGORIES.forEach(cat => {
          const isCategoryMatch = routeAnalysisCategoryFilter === 'All' || BRAND_GROUPS[routeAnalysisCategoryFilter]?.includes(cat);
          const isBrandMatch = routeAnalysisBrandFilter === 'All' || routeAnalysisBrandFilter === cat;
          
          if (isCategoryMatch && isBrandMatch) {
            filteredBags += (s.brandSales[cat] || 0);
            filteredTons += (s.brandTonnage[cat] || 0);
          }
        });
        
        return { ...s, totalBags: filteredBags, totalWeightKg: filteredTons * 1000 };
      });
    }
    
    data = [...data].sort((a, b) => b.date.localeCompare(a.date));
    return data.slice(0, 16).reverse().map(d => ({
      ...d,
      ...d.brandSales // Spread brandSales to top level for Recharts
    })); // Chronological for charts
  }, [filteredStats, filterLevel, routeAnalysisCategoryFilter, routeAnalysisBrandFilter]);

  const worstOBs = useMemo(() => {
    return [...obPerformance]
      .filter(ob => ob.target > 0)
      .sort((a, b) => a.achievement - b.achievement)
      .slice(0, 50);
  }, [obPerformance]);

  const worstByBrand = useMemo(() => {
    const brandWorst: Record<string, any[]> = {};
    CATEGORIES.forEach(cat => {
      brandWorst[cat] = [...obPerformance]
        .sort((a, b) => (a.brandSales[cat] || 0) - (b.brandSales[cat] || 0))
        .slice(0, 50)
        .map(ob => ({
          name: ob.name,
          town: ob.town,
          tsm: ob.tsm,
          region: ob.region,
          sales: ob.brandSales[cat] || 0
        }));
    });
    return brandWorst;
  }, [obPerformance]);

  const tsmPerformance = useMemo(() => {
    const tsms: Record<string, any> = {};
    const obStatsByTsm: Record<string, Set<string>> = {};
    
    // Filter out TSM entries for sales calculation
    const obOnlyStats = monthStats.filter(s => !s.isTSMEntry);
    
    obOnlyStats.forEach(s => {
      if (!s.tsm || s.tsm === 'Unassigned') return;
      if (!tsms[s.tsm]) {
        tsms[s.tsm] = {
          name: s.tsm,
          region: s.region,
          town: s.town,
          rsm: s.rsm,
          totalSales: 0,
          totalTarget: 0,
          activeOBs: 0,
          totalOBs: hierarchy.filter(h => h.asm_tsm_name === s.tsm && h.role !== 'TSM' && h.role !== 'ASM').length,
          averageOBAchievement: 0,
          averageOBSales: 0,
          totalVisited: 0,
          totalProductive: 0
        };
        obStatsByTsm[s.tsm] = new Set();
      }
      tsms[s.tsm].totalSales += s.totalBags;
      tsms[s.tsm].totalVisited += s.visited;
      tsms[s.tsm].totalProductive += s.productive;
      obStatsByTsm[s.tsm].add(s.ob_contact);
    });

    // Calculate active OBs and average achievement
    Object.keys(tsms).forEach(tsm => {
      const activeOBs = obStatsByTsm[tsm].size;
      tsms[tsm].activeOBs = activeOBs;
      tsms[tsm].averageOBSales = activeOBs > 0 ? tsms[tsm].totalSales / activeOBs : 0;
      tsms[tsm].rpd = tsms[tsm].totalVisited > 0 ? (tsms[tsm].totalProductive / tsms[tsm].totalVisited) * 100 : 0;
      tsms[tsm].productivity = tsms[tsm].totalVisited > 0 ? (tsms[tsm].totalProductive / tsms[tsm].totalVisited) * 100 : 0;
      
      const obContacts = Array.from(obStatsByTsm[tsm]);
      let tsmTotalTarget = 0;
      const achievements = obContacts.map(contact => {
        const obSales = obOnlyStats.filter(s => s.ob_contact === contact).reduce((sum, s) => sum + s.totalBags, 0);
        const obTarget = hierarchy.filter(h => h.ob_id === contact).reduce((sum, h) => sum + (Number(h.target_ctn) || 0), 0);
        tsmTotalTarget += obTarget;
        return obTarget > 0 ? (obSales / obTarget) * 100 : 0;
      });
      
      // Add targets for inactive OBs as well
      const allTsmOBs = hierarchy.filter(h => h.asm_tsm_name === tsm && h.role !== 'TSM' && h.role !== 'ASM');
      allTsmOBs.forEach(ob => {
        if (!obStatsByTsm[tsm].has(ob.ob_id)) {
           tsmTotalTarget += (Number(ob.target_ctn) || 0);
        }
      });

      tsms[tsm].totalTarget = tsmTotalTarget;
      tsms[tsm].achievementPerc = tsmTotalTarget > 0 ? (tsms[tsm].totalSales / tsmTotalTarget) * 100 : 0;
      tsms[tsm].averageOBAchievement = achievements.length > 0 ? achievements.reduce((a, b) => a + b, 0) / achievements.length : 0;
      
      // Projected Sales
      const workingDays = 25; // Default
      const daysPassed = new Set(obOnlyStats.map(s => s.date)).size || 1;
      tsms[tsm].projectedSales = (tsms[tsm].totalSales / daysPassed) * workingDays;
    });

    return Object.values(tsms)
      .filter(tsm => tsm.activeOBs > 0 || tsm.totalSales > 0)
      .sort((a, b) => a.achievementPerc - b.achievementPerc); // Sort by % ascending (Bottom to Top)
  }, [monthStats, hierarchy]);

  const yesterdayMissing = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = [
      yesterday.getFullYear(),
      String(yesterday.getMonth() + 1).padStart(2, '0'),
      String(yesterday.getDate()).padStart(2, '0')
    ].join('-');
    
    const holidayList = (holidays || '').split(',').map(d => d.trim());
    const isSunday = yesterday.getDay() === 0;
    const isHoliday = holidayList.includes(yesterdayStr);
    
    if (isSunday || isHoliday) return [];

    const submittedContacts = new Set(stats.filter(s => s.date === yesterdayStr).map(s => s.ob_contact));
    
    return hierarchy.filter(h => h.ob_id && !submittedContacts.has(h.ob_id)).map(h => ({
      name: h.ob_name,
      contact: h.ob_id,
      town: h.town_name,
      tsm: h.asm_tsm_name
    }));
  }, [stats, hierarchy, holidays]);

  const filteredTableCategories = useMemo(() => {
    return CATEGORIES.filter(cat => {
      const isCategoryMatch = categoryWiseCategoryFilter === 'All' || BRAND_GROUPS[categoryWiseCategoryFilter]?.includes(cat);
      const isBrandMatch = categoryWiseBrandFilter === 'All' || categoryWiseBrandFilter === cat;
      return isCategoryMatch && isBrandMatch;
    });
  }, [categoryWiseCategoryFilter, categoryWiseBrandFilter]);

  const categoryWiseSales = useMemo(() => {
    const groups: Record<string, any> = {};
    
    const createEmptyGroup = (key: string, displayName: string) => ({
      name: key, 
      displayName: displayName,
      obCount: new Set(), 
      totalSales: 0, 
      totalSalesNoMatch: 0,
      totalTonnage: 0,
      visitedShops: 0,
      productiveShops: 0,
      brandSales: CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {}),
      brandTonnage: CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {}),
      brandTargets: CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {}),
      totalTarget: 0
    });

    // Seed groups from hierarchy to ensure all entities are shown even with 0 sales
    filteredHierarchy.forEach(h => {
      let key = '';
      let displayName = '';
      if (filterLevel === 'National') {
        key = h.territory_region || 'Unassigned';
        displayName = key;
      } else if (filterLevel === 'Region') {
        key = h.asm_tsm_name || 'Unassigned';
        displayName = key;
      } else if (filterLevel === 'TSM') {
        key = h.town_name || 'Unassigned';
        displayName = key;
      } else if (filterLevel === 'Town') {
        key = h.ob_id || 'Unassigned';
        displayName = h.ob_name || key;
      } else if (filterLevel === 'OB') {
        const routes = (() => {
          if (typeof h.routes === 'string') {
            try { return JSON.parse(h.routes); } catch (e) { return []; }
          }
          return h.routes || [];
        })();
        if (Array.isArray(routes)) {
          routes.forEach((r: string) => {
            if (!groups[r]) groups[r] = createEmptyGroup(r, r);
          });
        }
        return;
      } else {
        return;
      }
      
      if (key && !groups[key]) {
        groups[key] = createEmptyGroup(key, displayName);
      }
    });

    monthStats.forEach(s => {
      if (s.isTSMEntry) return; // Exclude TSM entries
      let key = 'Other';
      if (filterLevel === 'National') key = s.region || 'Unassigned';
      else if (filterLevel === 'Region') key = s.tsm || 'Unassigned';
      else if (filterLevel === 'TSM') key = s.town || 'Unassigned';
      else if (filterLevel === 'Town') key = s.ob_contact || 'Unassigned';
      else if (filterLevel === 'OB') key = s.route || 'Unassigned';
      else if (filterLevel === 'Route') key = s.route || 'Unassigned';
      
      if (!groups[key]) {
        groups[key] = createEmptyGroup(key, filterLevel === 'Town' ? (s.ob_name || key) : key);
      }
      
      groups[key].obCount.add(s.ob_contact);
      groups[key].visitedShops += s.visited_shops;
      groups[key].productiveShops += s.productive_shops;
      
      let relevantBags = 0;
      let relevantTons = 0;

      CATEGORIES.forEach(cat => {
        // User requested: calculate only Washing Powder, exclude DWB+Match Sales
        // If category filter is 'All', we restrict to Washing Powder categories
        const isWashingPowder = BRAND_GROUPS["Washing Powder*"].includes(cat);
        const isCategoryMatch = categoryWiseCategoryFilter === 'All' 
          ? isWashingPowder 
          : BRAND_GROUPS[categoryWiseCategoryFilter]?.includes(cat);
          
        const isBrandMatch = categoryWiseBrandFilter === 'All' || categoryWiseBrandFilter === cat;

        if (isCategoryMatch && isBrandMatch) {
          const bags = (s.brandSales[cat] || 0);
          const tons = (s.brandTonnage[cat] || 0);
          
          groups[key].brandSales[cat] += bags;
          groups[key].brandTonnage[cat] += tons;
          relevantBags += bags;
          relevantTons += tons;
        }
      });

      groups[key].totalSales += relevantBags;
      groups[key].totalTonnage += relevantTons;
    });

    // Calculate targets for each group
    Object.keys(groups).forEach(key => {
      const groupHierarchy = hierarchy.filter(h => {
        if (filterLevel === 'National') return (h.territory_region || '').trim().toLowerCase() === key.trim().toLowerCase();
        if (filterLevel === 'Region') return (h.asm_tsm_name || '').trim().toLowerCase() === key.trim().toLowerCase();
        if (filterLevel === 'TSM') return (h.town_name || '').trim().toLowerCase() === key.trim().toLowerCase();
        if (filterLevel === 'Town') return (h.ob_id || '').trim().toLowerCase() === key.trim().toLowerCase();
        if (filterLevel === 'OB') {
          const routes = (() => {
            if (typeof h.routes === 'string') {
              try { return JSON.parse(h.routes); } catch (e) { return []; }
            }
            return h.routes || [];
          })();
          return Array.isArray(routes) && routes.some((r: string) => r.trim().toLowerCase() === key.trim().toLowerCase());
        }
        return false;
      });
      
      groups[key].totalTarget = groupHierarchy.reduce((sum, h) => {
        return sum + CATEGORIES.reduce((bSum, cat) => {
          const isCategoryMatch = categoryWiseCategoryFilter === 'All' || BRAND_GROUPS[categoryWiseCategoryFilter]?.includes(cat);
          const isBrandMatch = categoryWiseBrandFilter === 'All' || categoryWiseBrandFilter === cat;
          if (isCategoryMatch && isBrandMatch) {
            const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
            const brandTarget = (Number(h[targetKey]) || 0);
            groups[key].brandTargets[cat] = (groups[key].brandTargets[cat] || 0) + brandTarget;
            return bSum + brandTarget;
          }
          return bSum;
        }, 0);
      }, 0);
    });

    return Object.values(groups).map(g => ({
      ...g,
      obCount: g.obCount.size,
      avgSales: g.obCount.size > 0 ? g.totalSales / g.obCount.size : 0
    })).sort((a, b) => b.totalSales - a.totalSales);
  }, [monthStats, hierarchy, filteredHierarchy, filterLevel, categoryWiseCategoryFilter, categoryWiseBrandFilter]);

  const dayOfWeekData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = days.map(day => ({ name: day, sales: 0, productive: 0, visited: 0 }));
    
    monthStats.filter(s => !s.isTSMEntry).forEach(s => {
      const date = new Date(s.date);
      if (!isNaN(date.getTime())) {
        const dayIdx = date.getDay();
        dayStats[dayIdx].sales += (s.totalBags + s.totalCtns);
        dayStats[dayIdx].productive += s.productive_shops;
        dayStats[dayIdx].visited += s.visited_shops;
      }
    });
    
    return dayStats.map(d => ({
      ...d,
      dropSize: d.productive > 0 ? d.sales / d.productive : 0,
      productivity: d.visited > 0 ? (d.productive / d.visited) * 100 : 0
    }));
  }, [monthStats]);

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-seablue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-seablue uppercase tracking-tight">SalesPulse Intelligence</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">National Performance & Field Analytics</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                const headers = ['Date', 'Month', 'Director', 'NSM', 'RSM', 'SC', 'ASM/TSM', 'Town', 'Distributor', 'OB Name', 'OB ID', 'Route', 'Total Shops', 'Visited Shops', 'Productive Shops', 'Visit Type', ...CATEGORIES.flatMap(cat => [`${cat} (Bags)`, `${cat} (Tons)`]), 'Total Bags', 'Total Tonnage (T)'];
                const rows = monthStats.map(s => {
                  const h = hierarchy.find(h => h.ob_id === s.ob_contact);
                  return [
                    s.date, s.month, h?.director_sales || '', h?.nsm_name || '', h?.rsm_name || '', h?.sc_name || '', s.tsm, s.town, s.distributor, s.ob_name, s.ob_contact, s.route,
                    s.total_shops, s.visited_shops, s.productive_shops, s.visit_type,
                    ...CATEGORIES.flatMap(cat => [(s.brandSales[cat] || 0).toFixed(2), (s.brandTonnage[cat] || 0).toFixed(3)]),
                    s.totalBags.toFixed(2),
                    (s.totalWeightKg / 1000).toFixed(3)
                  ];
                });
                const csv = Papa.unparse([headers, ...rows]);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Sales_Report_${selectedMonth}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
            <button 
              onClick={onRefresh}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-seablue text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-seablue/90 transition-all shadow-lg shadow-seablue/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
            {backupLogs && backupLogs.length > 0 && (
              <div className="flex flex-col justify-center mr-2 border-r border-slate-200 pr-3">
                <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Last Backup</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-500">{new Date(backupLogs[0].timestamp).toLocaleDateString()} {new Date(backupLogs[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${backupLogs[0].action === 'BACKUP_SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </div>
              </div>
            )}
            {lastSync && (
              <div className="flex flex-col justify-center">
                <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Last Sync</span>
                <span className="text-[9px] font-bold text-slate-500">{new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-clean text-[10px] font-black uppercase py-2 px-3 bg-slate-50"
            />
          </div>
        </div>

        {/* Head Count System (MTD) - Dynamic Block */}
        {view === 'dashboard' && (
          <section className="pt-4 border-t border-slate-50">
            <div className="card-clean bg-white p-6 shadow-xl shadow-slate-200/40">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-seablue" />
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Head Count (MTD)</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Designation wise Total vs Active</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-seablue uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">Click to Drill Down</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {headCountStats.map((stat, idx) => (
                  <motion.button 
                    key={idx}
                    onClick={() => setSelectedHeadCountDetail(stat)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between text-left hover:bg-slate-100 hover:border-seablue/30 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-seablue transition-colors">{stat.designation}</span>
                      <div className={`w-2 h-2 rounded-full ${stat.active > 0 ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-black text-slate-800 leading-none">{stat.active}<span className="text-xs text-slate-400 font-bold ml-1">/ {stat.total}</span></p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">Active Staff</p>
                      </div>
                      <div className="text-right w-1/2">
                        <p className="text-[11px] font-black text-emerald-600 mb-1">{stat.total > 0 ? Math.round((stat.active / stat.total) * 100) : 0}%</p>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-1000" 
                            style={{ width: `${stat.total > 0 ? (stat.active / stat.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-50">
          <button 
            onClick={() => handleBreadcrumbClick(-1)}
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${filterLevel === visibleFilterLevels[0] ? 'bg-seablue text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            {visibleFilterLevels[0]}
          </button>
          {navHistory.filter(item => item.level !== visibleFilterLevels[0]).map((item, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <button 
                onClick={() => handleBreadcrumbClick(navHistory.findIndex(h => h === item))}
                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all"
              >
                {item.value || item.level}
              </button>
            </React.Fragment>
          ))}
          {filterLevel !== visibleFilterLevels[0] && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-seablue text-white shadow-lg shadow-blue-200">
                {filterValue || filterLevel}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category:</span>
            <select 
              value={topCategoryFilter} 
              onChange={(e) => { setTopCategoryFilter(e.target.value); setTopBrandFilter('All'); }}
              className="bg-transparent text-[10px] font-black text-seablue uppercase focus:outline-none"
            >
              <option value="All">All Categories</option>
              {BRAND_GROUP_NAMES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Brand:</span>
            <select 
              value={topBrandFilter} 
              onChange={(e) => setTopBrandFilter(e.target.value)}
              className="bg-transparent text-[10px] font-black text-seablue uppercase focus:outline-none"
            >
              <option value="All">All Brands</option>
              {(topCategoryFilter === 'All' ? CATEGORIES : BRAND_GROUPS[topCategoryFilter] || []).map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Level:</span>
            <select 
              value={filterLevel} 
              onChange={(e) => { setFilterLevel(e.target.value as any); setFilterValue(''); }}
              className="bg-transparent text-[10px] font-black text-seablue uppercase focus:outline-none"
            >
              {visibleFilterLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          {filterLevel !== 'National' && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select:</span>
              <select 
                value={filterValue} 
                onChange={(e) => setFilterValue(e.target.value)}
                className="bg-transparent text-[10px] font-black text-seablue uppercase focus:outline-none max-w-[150px]"
              >
                <option value="">All {filterLevel}s</option>
                {filterLevel === 'OB' ? (
                  (filterOptions['OB'] as any[]).map(ob => (
                    <option key={ob.contact} value={ob.contact}>{ob.name} ({ob.contact})</option>
                  ))
                ) : (
                  (filterOptions[filterLevel as keyof typeof filterOptions] || []).map(opt => (
                    <option key={opt as string} value={opt as string}>{opt as string}</option>
                  ))
                )}
              </select>
            </div>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-seablue transition-all duration-1000" 
                style={{ width: `${timeGone || 0}%` }}
              />
            </div>
            <span className="text-[9px] font-black text-seablue uppercase tracking-widest">
              Month Progress: {Math.round(timeGone || 0)}%
            </span>
          </div>
        </div>
      </div>

      {view === 'dashboard' && (
        <>
          {/* A Block: Brand-Wise Performance */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {summary.brandWiseStats.map((brand) => (
              <div 
                key={brand.name} 
                className="card-clean p-5 bg-white border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setCategoryWiseBrandFilter(brand.name);
                  setView('command_center');
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[brand.name] }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{brand.name}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${brand.percentage >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {brand.percentage.toFixed(1)}%
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Target</div>
                    <div className="text-xl font-black text-slate-700 tracking-tighter">
                      {Math.round(brand.target).toLocaleString()} <span className="text-[10px] font-normal opacity-70">{brand.unit}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Achievement</div>
                    <div className="text-xl font-black text-seablue tracking-tighter">
                      {Math.round(brand.achievement).toLocaleString()} <span className="text-[10px] font-normal opacity-70">{brand.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Tonnage</span>
                    <span className="text-xs font-black text-slate-700">{brand.tonnage.toFixed(3)} T</span>
                  </div>
                  <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: `${Math.min(100, brand.percentage)}%`,
                        backgroundColor: CATEGORY_COLORS[brand.name]
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card-clean p-5 bg-gradient-to-br from-seablue to-indigo-900 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
              <div className="text-[10px] uppercase font-black text-white/60 tracking-widest mb-1">Total Target</div>
              <div className="text-4xl font-black tracking-tighter">{Math.round(summary.totalTarget).toLocaleString()} <span className="text-sm font-normal opacity-70">B/C</span></div>
              <div className="text-[10px] font-black text-white/80 mt-2 uppercase tracking-tight">Monthly Goal</div>
            </div>
            <div className="card-clean p-5 bg-gradient-to-br from-emerald-600 to-teal-900 text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
              <div className="text-[10px] uppercase font-black text-white/60 tracking-widest mb-1">Total Achievement</div>
              <div className="text-4xl font-black tracking-tighter">{Math.round(summary.totalSales).toLocaleString()} <span className="text-sm font-normal opacity-70">B/C</span></div>
              <div className="text-[10px] font-black text-white/80 mt-2 uppercase tracking-tight">Current Month Sales</div>
            </div>
            <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Achievement %</div>
              <div className={`text-4xl font-black ${summary.achievementPerc >= 100 ? 'text-emerald-600' : summary.achievementPerc >= 80 ? 'text-amber-500' : 'text-rose-600'}`}>
                {summary.achievementPerc.toFixed(1)}%
              </div>
              <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Target vs Ach</div>
            </div>
            <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">MTD Sales</div>
              <div className="text-4xl font-black text-indigo-600">{Math.round(summary.totalSales).toLocaleString()} <span className="text-sm font-normal opacity-70 text-slate-400">B/C</span></div>
              <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Month to Date</div>
            </div>
            <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Productivity %</div>
              <div className={`text-4xl font-black ${summary.productivity >= 70 ? 'text-emerald-600' : summary.productivity >= 50 ? 'text-amber-500' : 'text-rose-600'}`}>
                {summary.productivity.toFixed(1)}%
              </div>
              <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Productive / Visited</div>
            </div>
            <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Cost / KG</div>
              <div className="text-4xl font-black text-rose-600">
                Rs.{summary.costPerKg.toFixed(1)}
              </div>
              <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Salary Cost per KG</div>
            </div>
            <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Cost / Bag</div>
              <div className="text-4xl font-black text-rose-600">
                Rs.{summary.costPerBag.toFixed(1)}
              </div>
              <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Salary Cost per Bag</div>
            </div>
            <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Avg Sales / OB</div>
              <div className="text-4xl font-black text-seablue">
                {Math.round(summary.avgSalesPerOB).toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Bags per OB</div>
            </div>
            <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Drop Size</div>
              <div className="text-4xl font-black text-emerald-600">
                {summary.dropSize.toFixed(1)}
              </div>
              <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Bags / Productive Shop</div>
            </div>
          </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean p-6 bg-white border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Brand Contribution</h3>
            <select 
              value={contributionView}
              onChange={(e) => setContributionView(e.target.value as any)}
              className="text-[10px] font-black text-seablue uppercase bg-slate-50 px-2 py-1 rounded border-none focus:ring-0"
            >
              <option value="Brand">Brand Wise</option>
              <option value="Category">Category Wise</option>
              <option value="SKU">SKU Wise</option>
            </select>
          </div>
          <div className="h-[300px] min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    contributionView === 'SKU' 
                      ? Object.entries(summary.skuTotals).map(([name, value]) => ({ name, value }))
                      : contributionView === 'Category'
                      ? BRAND_GROUP_NAMES.map(group => ({
                          name: group,
                          value: BRAND_GROUPS[group].reduce((sum, brand) => sum + (summary.brandTotals[brand] || 0), 0)
                        }))
                      : Object.entries(summary.brandTotals).map(([name, value]) => ({ name, value }))
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(contributionView === 'SKU' 
                    ? Object.entries(summary.skuTotals)
                    : contributionView === 'Category'
                    ? BRAND_GROUP_NAMES.map(g => [g])
                    : Object.entries(summary.brandTotals)
                  ).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        contributionView === 'Category' 
                          ? ['#0ea5e9', '#22c55e', '#1e3a8a'][index % 3]
                          : CATEGORY_COLORS[entry[0]] || ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
                      } 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const total = payload[0].value;
                      const overallTotal = contributionView === 'SKU' 
                        ? Object.values(summary.skuTotals).reduce((a: number, b: number) => a + b, 0)
                        : summary.totalSales;
                      const percentage = ((total / overallTotal) * 100).toFixed(1);
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{data.name}</p>
                          <p className="text-sm font-black text-slate-700">{Math.round(total).toLocaleString()} Bags</p>
                          <p className="text-[10px] font-bold text-emerald-600">{percentage}% Contribution</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e3a8a' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-clean p-6 bg-white border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Brand Target vs Achievement</h3>
            <select 
              value={achievementView}
              onChange={(e) => setAchievementView(e.target.value as any)}
              className="text-[10px] font-black text-seablue uppercase bg-slate-50 px-2 py-1 rounded border-none focus:ring-0"
            >
              <option value="Brand">Brand Wise</option>
              <option value="Category">Category Wise</option>
              <option value="SKU">SKU Wise</option>
            </select>
          </div>
          <div className="h-[300px] min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={
                  achievementView === 'Category'
                    ? BRAND_GROUP_NAMES.map(group => {
                        const achievement = BRAND_GROUPS[group].reduce((sum, brand) => sum + (summary.brandTotals[brand] || 0), 0);
                        const target = hierarchy.reduce((sum, h) => {
                          return sum + BRAND_GROUPS[group].reduce((bSum, brand) => {
                            const targetKey = `target_${brand.toLowerCase().replace(/\s+/g, '_')}`;
                            return bSum + (Number(h[targetKey]) || 0);
                          }, 0);
                        }, 0);
                        return { name: group, achievement, target: target || 1 };
                      })
                    : achievementView === 'SKU'
                    ? Object.entries(summary.skuTotals).map(([name, value]) => {
                        const sku = skus.find(s => {
                          let prefix = '';
                          if (s.category === 'DWB') prefix = 'D - ';
                          if (s.category === 'Match') prefix = 'M - ';
                          return `${prefix}${s.name}` === name;
                        });
                        const target = sku ? hierarchy.reduce((sum, h) => {
                          const targetKey = `target_${sku.category.toLowerCase().replace(/\s+/g, '_')}`;
                          const brandTarget = Number(h[targetKey]) || 0;
                          // Simple heuristic: distribute brand target among its SKUs equally for now
                          const skusInBrand = skus.filter(s => s.category === sku.category).length;
                          return sum + (brandTarget / (skusInBrand || 1));
                        }, 0) : 0;
                        return { name, achievement: value as number, target: target || 0 };
                      }).sort((a, b) => (b.achievement as number) - (a.achievement as number))
                    : [
                        ...CATEGORIES.map(cat => {
                          const achievement = summary.brandTotals[cat] || 0;
                          const target = hierarchy.reduce((sum, h) => {
                            const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
                            return sum + (Number(h[targetKey]) || 0);
                          }, 0);
                          return { name: cat, achievement, target: target || 1 };
                        }),
                        {
                          name: 'Total',
                          achievement: Object.values(summary.brandTotals).reduce((a: number, b: any) => a + (Number(b) || 0), 0),
                          target: hierarchy.reduce((sum, h) => {
                            return sum + CATEGORIES.reduce((bSum, cat) => {
                              const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
                              return bSum + (Number(h[targetKey]) || 0);
                            }, 0);
                          }, 0) || 1
                        }
                      ]
                }
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 'bold', fill: '#64748b' }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const ach = data.achievement;
                      const tar = data.target;
                      const perc = tar > 0 ? ((ach / tar) * 100).toFixed(1) : '0';
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{data.name}</p>
                          <p className="text-xs font-black text-slate-700">Ach: {Math.round(ach).toLocaleString()}</p>
                          {tar > 0 && <p className="text-xs font-bold text-slate-400">Tar: {Math.round(tar).toLocaleString()}</p>}
                          {tar > 0 && <p className="text-[10px] font-black text-emerald-600 mt-1">{perc}% Achievement</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px', color: '#1e3a8a' }} />
                <Bar dataKey="achievement" radius={[0, 4, 4, 0]} barSize={12} name="Ach">
                  {(achievementView === 'Category'
                    ? BRAND_GROUP_NAMES.map(g => ({ name: g }))
                    : achievementView === 'SKU'
                    ? Object.entries(summary.skuTotals).map(([name]) => ({ name })).sort((a, b) => (summary.skuTotals[b.name] || 0) - (summary.skuTotals[a.name] || 0))
                    : [...CATEGORIES.map(cat => ({ name: cat })), { name: 'Total' }]
                  ).map((entry, index) => (
                    <Cell 
                      key={`cell-ach-${index}`} 
                      fill={
                        entry.name === 'Total' ? '#1e3a8a' :
                        achievementView === 'Category' ? ['#0ea5e9', '#22c55e', '#1e3a8a'][index % 3] :
                        CATEGORY_COLORS[entry.name] || ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
                      } 
                    />
                  ))}
                </Bar>
                {achievementView !== 'SKU' && <Bar dataKey="target" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={12} name="Tar" />}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 overflow-x-auto border-t border-slate-50 pt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="px-4 py-2">{achievementView} Name</th>
                  <th className="px-4 py-2 text-right">Target</th>
                  <th className="px-4 py-2 text-right">Ach</th>
                  <th className="px-4 py-2 text-right">Ach %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(achievementView === 'Category'
                  ? BRAND_GROUP_NAMES.map(group => {
                      const achievement = BRAND_GROUPS[group].reduce((sum, brand) => sum + (summary.brandTotals[brand] || 0), 0);
                      const target = hierarchy.reduce((sum, h) => {
                        return sum + BRAND_GROUPS[group].reduce((bSum, brand) => {
                          const targetKey = `target_${brand.toLowerCase().replace(/\s+/g, '_')}`;
                          return bSum + (Number(h[targetKey]) || 0);
                        }, 0);
                      }, 0);
                      return { name: group, achievement, target: target || 1 };
                    })
                  : achievementView === 'SKU'
                  ? Object.entries(summary.skuTotals).map(([name, value]) => {
                      const sku = skus.find(s => {
                        let prefix = '';
                        if (s.category === 'DWB') prefix = 'D - ';
                        if (s.category === 'Match') prefix = 'M - ';
                        return `${prefix}${s.name}` === name;
                      });
                      const target = sku ? hierarchy.reduce((sum, h) => {
                        const targetKey = `target_${sku.category.toLowerCase().replace(/\s+/g, '_')}`;
                        const brandTarget = Number(h[targetKey]) || 0;
                        const skusInBrand = skus.filter(s => s.category === sku.category).length;
                        return sum + (brandTarget / (skusInBrand || 1));
                      }, 0) : 0;
                      return { name, achievement: value as number, target: target || 0 };
                    }).sort((a, b) => (b.achievement as number) - (a.achievement as number))
                  : [
                      ...CATEGORIES.map(cat => {
                        const achievement = summary.brandTotals[cat] || 0;
                        const target = hierarchy.reduce((sum, h) => {
                          const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
                          return sum + (Number(h[targetKey]) || 0);
                        }, 0);
                        return { name: cat, achievement, target: target || 1 };
                      }),
                      {
                        name: 'Total',
                        achievement: Object.values(summary.brandTotals).reduce((a: number, b: any) => a + (Number(b) || 0), 0),
                        target: hierarchy.reduce((sum, h) => {
                          return sum + CATEGORIES.reduce((bSum, cat) => {
                            const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
                            return bSum + (Number(h[targetKey]) || 0);
                          }, 0);
                        }, 0) || 1
                      }
                    ]
                ).map((item, idx) => {
                  const perc = item.target > 0 ? (item.achievement / item.target) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/30">
                      <td className="px-4 py-2 text-[10px] font-bold text-slate-700">{item.name}</td>
                      <td className="px-4 py-2 text-right text-[10px] font-mono text-slate-500">{Math.round(item.target).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-[10px] font-black text-seablue font-mono">{Math.round(item.achievement).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${perc >= 100 ? 'bg-emerald-100 text-emerald-700' : perc >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {Math.round(perc)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Productivity Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Total Shops (T)</div>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-700">{summary.totalShops.toLocaleString()}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Target Universe</div>
        </div>
        <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Visited Shops (V)</div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{summary.totalVisited.toLocaleString()}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Coverage: {summary.totalShops > 0 ? ((summary.totalVisited / summary.totalShops) * 100).toFixed(1) : 0}%</div>
        </div>
        <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Productive Shops (P)</div>
            <Users className="w-4 h-4 text-seablue" />
          </div>
          <div className="text-3xl font-black text-seablue">{summary.totalProductive.toLocaleString()}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Productivity: {summary.productivity.toFixed(1)}%</div>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Avg Sales per OB</div>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-indigo-600">{summary.avgSalesPerOB.toFixed(1)} <span className="text-sm font-normal opacity-70">B</span></div>
          <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Performance Density</div>
        </div>
        <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Zero Sale OBs</div>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600">{summary.zeroSaleOBs}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Needs Attention</div>
        </div>
        <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Low Performance OBs</div>
            <TrendingDown className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-3xl font-black text-orange-600">{summary.lowPerfOBs}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">&lt; 50% Achievement</div>
        </div>
      </div>

      {/* Stock Gaps Analysis */}
      <div className="grid grid-cols-1 gap-6">
        <div className="card-clean bg-white overflow-hidden border border-slate-100">
          <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <PackageSearch className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest">Critical Stock Gaps</h3>
                <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mt-0.5">Distributors with Low Inventory</p>
              </div>
            </div>
            <div className="text-[10px] font-black text-amber-600 uppercase bg-white px-3 py-1 rounded-full border border-amber-200">
              {stockGapsData.length} Gaps Detected
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-3">Distributor / Town</th>
                  <th className="px-6 py-3">Region</th>
                  <th className="px-6 py-3">TSM</th>
                  <th className="px-6 py-3">Low Stock SKUs</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stockGapsData.slice(0, 10).map((gap, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-black text-slate-700 uppercase">{gap.distributor}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{gap.region}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{gap.tsm}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {gap.lowItems.slice(0, 3).map((item: string) => (
                          <span key={item} className="text-[8px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100 uppercase">
                            {item}
                          </span>
                        ))}
                        {gap.lowItems.length > 3 && (
                          <span className="text-[8px] font-black text-slate-300 uppercase">+{gap.lowItems.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          const text = `*STOCK GAP ALERT*\n\nDistributor: ${gap.distributor}\nTSM: ${gap.tsm}\nRegion: ${gap.region}\n\n*Low Stock SKUs:*\n${gap.lowItems.join('\n')}\n\nPlease ensure inventory is replenished immediately.`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="flex items-center gap-1.5 ml-auto text-[10px] font-black text-emerald-600 uppercase hover:text-emerald-700 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Notify TSM
                      </button>
                    </td>
                  </tr>
                ))}
                {stockGapsData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No Critical Stock Gaps Found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {stockGapsData.length > 10 && (
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
              <button className="text-[10px] font-black text-slate-400 uppercase hover:text-seablue transition-colors">
                View All {stockGapsData.length} Gaps
              </button>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {view === 'missing_entries' && (
        <MissingEntriesReport 
          report={missingEntriesReport}
          onRefresh={fetchMissingEntriesReport}
          isLoading={isLoadingMissingEntries}
          selectedMonth={selectedMonth}
        />
      )}

      {view === 'command_center' && (
      <div className="grid grid-cols-1 gap-6">
        <div className="card-clean bg-white overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              SalesPulse ({filterLevel}) {categoryWiseCategoryFilter === 'All' ? '(All Categories)' : `(${categoryWiseCategoryFilter})`}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const headers = [
                    filterLevel === 'National' ? 'Region' : 
                    filterLevel === 'Region' ? 'TSM' : 
                    filterLevel === 'TSM' ? 'Town' : 
                    filterLevel === 'Town' ? 'OB' : 
                    filterLevel === 'OB' ? 'Route' : 'Route',
                    'OBs',
                    ...filteredTableCategories.flatMap(cat => [`${cat} Tar`, `${cat} Ach`, `${cat} %`, `${cat} Tons`]),
                    'Total Tar', 'Total Ach', 'Total %', 'Total Tons', 'Avg/OB'
                  ];
                  const rows = categoryWiseSales.map(row => [
                    row.displayName || row.name,
                    row.obCount,
                    ...filteredTableCategories.flatMap(cat => [
                      Math.round(row.brandTargets[cat] || 0),
                      Math.round(row.brandSales[cat] || 0),
                      `${Math.round((row.brandTargets[cat] || 0) > 0 ? ((row.brandSales[cat] || 0) / (row.brandTargets[cat] || 0)) * 100 : 0)}%`,
                      (row.brandTonnage[cat] || 0).toFixed(2)
                    ]),
                    Math.round(row.totalTarget),
                    Math.round(row.totalSales),
                    `${Math.round(row.totalTarget > 0 ? (row.totalSales / row.totalTarget) * 100 : 0)}%`,
                    row.totalTonnage.toFixed(2),
                    Math.round(row.avgSales)
                  ]);
                  const csv = Papa.unparse([headers, ...rows]);
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Command_Center_${filterLevel}_${selectedMonth}.csv`;
                  a.click();
                }}
                className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
              <select 
                value={categoryWiseCategoryFilter} 
                onChange={(e) => setCategoryWiseCategoryFilter(e.target.value)}
                className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="All">All Categories</option>
                {Object.keys(BRAND_GROUPS).map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              <select 
                value={categoryWiseBrandFilter} 
                onChange={(e) => setCategoryWiseBrandFilter(e.target.value)}
                className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="All">All Brands</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th rowSpan={2} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">
                    {filterLevel === 'National' ? 'Region' : 
                      filterLevel === 'Region' ? 'TSM' : 
                      filterLevel === 'TSM' ? 'Town' : 
                      filterLevel === 'Town' ? 'OB' : 
                      filterLevel === 'OB' ? 'Route' : 'Route'}
                  </th>
                  <th rowSpan={2} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-center">OBs</th>
                  {filteredTableCategories.map(cat => (
                    <th key={cat} colSpan={4} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-center border-l border-slate-100">{cat}</th>
                  ))}
                  <th colSpan={4} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-center border-l border-slate-100">Total</th>
                  <th rowSpan={2} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Avg/OB</th>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {filteredTableCategories.map(cat => (
                    <React.Fragment key={cat}>
                      <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase text-right border-l border-slate-100">Tar</th>
                      <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase text-right">Ach</th>
                      <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase text-right">%</th>
                      <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase text-right">Tons</th>
                    </React.Fragment>
                  ))}
                  <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase text-right border-l border-slate-100">Tar</th>
                  <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase text-right">Ach</th>
                  <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase text-right">%</th>
                  <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase text-right">Tons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categoryWiseSales.map(row => (
                  <tr 
                    key={row.name} 
                    className={`hover:bg-slate-50 transition-colors ${filterLevel !== 'Route' ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (filterLevel === 'National') {
                        handleDrillDown('Region', row.name);
                      } else if (filterLevel === 'Region') {
                        handleDrillDown('TSM', row.name);
                      } else if (filterLevel === 'TSM') {
                        handleDrillDown('Town', row.name);
                      } else if (filterLevel === 'Town') {
                        handleDrillDown('OB', row.name);
                      } else if (filterLevel === 'OB') {
                        handleDrillDown('Route', row.name);
                      }
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-700">{row.displayName || row.name}</span>
                        {filterLevel !== 'Route' && (
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 text-center">{row.obCount}</td>
                    {filteredTableCategories.map(cat => {
                      const tar = row.brandTargets[cat] || 0;
                      const ach = row.brandSales[cat] || 0;
                      const tons = row.brandTonnage[cat] || 0;
                      const perc = tar > 0 ? (ach / tar) * 100 : 0;
                      return (
                        <React.Fragment key={cat}>
                          <td className="px-6 py-4 text-right border-l border-slate-50">
                            <span className="text-[10px] font-bold text-slate-400">{Math.round(tar)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs font-black text-slate-700">{Math.round(ach)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-[9px] font-black px-1 py-0.5 rounded ${perc >= 100 ? 'bg-emerald-100 text-emerald-700' : perc >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                              {Math.round(perc)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[10px] font-bold text-slate-400">{tons.toFixed(2)}</span>
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="px-6 py-4 text-right border-l border-slate-50">
                      <span className="text-[10px] font-bold text-slate-400">{Math.round(row.totalTarget)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-black text-seablue">{Math.round(row.totalSales)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[9px] font-black px-1 py-0.5 rounded ${row.totalTarget > 0 && (row.totalSales / row.totalTarget) * 100 >= 100 ? 'bg-emerald-100 text-emerald-700' : row.totalTarget > 0 && (row.totalSales / row.totalTarget) * 100 >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {row.totalTarget > 0 ? Math.round((row.totalSales / row.totalTarget) * 100) : 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-bold text-slate-400">{row.totalTonnage.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-600 text-right">{Math.round(row.avgSales)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-black">
                <tr>
                  <td className="px-6 py-4 text-xs uppercase tracking-widest text-slate-400">Total</td>
                  <td className="px-6 py-4 text-xs text-center text-slate-600">
                    {categoryWiseSales.reduce((sum, r) => sum + r.obCount, 0)}
                  </td>
                  {filteredTableCategories.map(cat => {
                    const totalTar = categoryWiseSales.reduce((sum, r) => sum + (r.brandTargets[cat] || 0), 0);
                    const totalAch = categoryWiseSales.reduce((sum, r) => sum + (r.brandSales[cat] || 0), 0);
                    const totalTons = categoryWiseSales.reduce((sum, r) => sum + (r.brandTonnage[cat] || 0), 0);
                    const totalPerc = totalTar > 0 ? (totalAch / totalTar) * 100 : 0;
                    return (
                      <React.Fragment key={cat}>
                        <td className="px-6 py-4 text-right border-l border-slate-100">
                          <span className="text-[10px] text-slate-400">{Math.round(totalTar)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs text-slate-600">{Math.round(totalAch)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-[9px] font-black px-1 py-0.5 rounded ${totalPerc >= 100 ? 'bg-emerald-100 text-emerald-700' : totalPerc >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                            {Math.round(totalPerc)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[10px] text-slate-400">{totalTons.toFixed(2)}</span>
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="px-6 py-4 text-right border-l border-slate-100">
                    <span className="text-[10px] text-slate-400">{Math.round(categoryWiseSales.reduce((sum, r) => sum + r.totalTarget, 0))}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-seablue">{Math.round(categoryWiseSales.reduce((sum, r) => sum + r.totalSales, 0))}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-[9px] font-black px-1 py-0.5 rounded ${categoryWiseSales.reduce((sum, r) => sum + r.totalTarget, 0) > 0 && (categoryWiseSales.reduce((sum, r) => sum + r.totalSales, 0) / categoryWiseSales.reduce((sum, r) => sum + r.totalTarget, 0)) * 100 >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {categoryWiseSales.reduce((sum, r) => sum + r.totalTarget, 0) > 0 ? Math.round((categoryWiseSales.reduce((sum, r) => sum + r.totalSales, 0) / categoryWiseSales.reduce((sum, r) => sum + r.totalTarget, 0)) * 100) : 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[10px] text-slate-400">
                      {categoryWiseSales.reduce((sum, r) => sum + r.totalTonnage, 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-right text-emerald-600">
                    {(categoryWiseSales.reduce((sum, r) => sum + r.totalSales, 0) / Math.max(1, categoryWiseSales.reduce((sum, r) => sum + r.obCount, 0))).toFixed(1)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      )}

      {view === 'insights' && (
        <>
      {/* Geospatial Sales Distribution Map */}
      <div className="card-clean bg-white overflow-hidden mb-6">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Geospatial Sales Distribution</h3>
            <div className="flex bg-white rounded-lg p-1 border border-slate-200">
              <button 
                onClick={() => setMapLevel('region')}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${mapLevel === 'region' ? 'bg-seablue text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Region
              </button>
              <button 
                onClick={() => setMapLevel('town')}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${mapLevel === 'town' ? 'bg-seablue text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Town
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <select 
              value={mapFilterBrand} 
              onChange={e => setMapFilterBrand(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-seablue/20"
            >
              <option value="All">All Brands</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select 
              value={mapFilterRegion} 
              onChange={e => setMapFilterRegion(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-seablue/20"
            >
              <option value="All">All Regions</option>
              {Array.from(new Set(monthStats.filter(s => !s.isTSMEntry).map(s => s.region))).filter(Boolean).sort().map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select 
              value={mapFilterTSM} 
              onChange={e => setMapFilterTSM(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-seablue/20"
            >
              <option value="All">All TSMs</option>
              {Array.from(new Set(monthStats.filter(s => !s.isTSMEntry && (mapFilterRegion === 'All' || s.region === mapFilterRegion)).map(s => s.tsm))).filter(Boolean).sort().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select 
              value={mapFilterTown} 
              onChange={e => setMapFilterTown(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-seablue/20"
            >
              <option value="All">All Towns</option>
              {Array.from(new Set(monthStats.filter(s => !s.isTSMEntry && (mapFilterRegion === 'All' || s.region === mapFilterRegion) && (mapFilterTSM === 'All' || s.tsm === mapFilterTSM)).map(s => s.town))).filter(Boolean).sort().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select 
              value={mapFilterOB} 
              onChange={e => setMapFilterOB(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-seablue/20"
            >
              <option value="All">All OBs</option>
              {Array.from(new Set(monthStats.filter(s => !s.isTSMEntry && (mapFilterRegion === 'All' || s.region === mapFilterRegion) && (mapFilterTSM === 'All' || s.tsm === mapFilterTSM) && (mapFilterTown === 'All' || s.town === mapFilterTown)).map(s => s.ob_name))).filter(Boolean).sort().map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="h-[450px] w-full z-0 relative">
          <MapContainer center={[30.3753, 69.3451]} zoom={5} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {(() => {
              const filteredMapStats = monthStats.filter(s => {
                if (s.isTSMEntry) return false;
                if (mapFilterRegion !== 'All' && s.region !== mapFilterRegion) return false;
                if (mapFilterTSM !== 'All' && s.tsm !== mapFilterTSM) return false;
                if (mapFilterTown !== 'All' && s.town !== mapFilterTown) return false;
                if (mapFilterOB !== 'All' && s.ob_name !== mapFilterOB) return false;
                return true;
              });

              const getSalesForSpecificBrand = (s: any, brand: string) => {
                const orderData = typeof s.order_data === 'string' ? JSON.parse(s.order_data) : (s.order_data || {});
                const brandSkus = SKUS.filter((sku: any) => sku.category === brand);
                return brandSkus.reduce((sum: number, sku: any) => {
                  const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                  const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                  return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                }, 0);
              };

              const brandsToShow = mapFilterBrand === 'All' ? CATEGORIES : [mapFilterBrand];

              if (mapLevel === 'region') {
                const regionData: Record<string, any> = {};
                
                filteredMapStats.forEach(s => {
                  const coords = TOWN_COORDINATES[s.town] || (s.latitude && s.longitude ? [s.latitude, s.longitude] : null);
                  if (!coords) return;

                  if (!regionData[s.region]) {
                    regionData[s.region] = { region: s.region, totalSales: 0, brandSales: {}, lats: [], lngs: [], towns: new Set() };
                  }

                  let addedAny = false;
                  brandsToShow.forEach(brand => {
                    const sales = getSalesForSpecificBrand(s, brand);
                    if (sales > 0) {
                      regionData[s.region].brandSales[brand] = (regionData[s.region].brandSales[brand] || 0) + sales;
                      regionData[s.region].totalSales += sales;
                      addedAny = true;
                    }
                  });

                  if (addedAny) {
                    regionData[s.region].lats.push(coords[0]);
                    regionData[s.region].lngs.push(coords[1]);
                    regionData[s.region].towns.add(s.town);
                  }
                });

                return Object.values(regionData).filter(r => r.totalSales > 0).map((r: any, i) => {
                  const avgLat = r.lats.reduce((a:any,b:any)=>a+b,0)/r.lats.length;
                  const avgLng = r.lngs.reduce((a:any,b:any)=>a+b,0)/r.lngs.length;
                  
                  const color = mapFilterBrand !== 'All' ? (CATEGORY_COLORS[mapFilterBrand] || '#0ea5e9') : '#0ea5e9';

                  return (
                    <CircleMarker 
                      key={`region-${r.region}-${i}`} 
                      center={[avgLat, avgLng]} 
                      radius={Math.max(8, Math.min(30, r.totalSales / 50))}
                      pathOptions={{ color: color, fillColor: color, fillOpacity: 0.6, weight: 2 }}
                    >
                      <MapTooltip direction="top" offset={[0, -10]} className="bg-white/95 backdrop-blur-sm border-none shadow-xl rounded-xl p-2 min-w-[120px]">
                        <div className="text-[10px] font-black text-slate-800 uppercase text-center mb-1 border-b border-slate-100 pb-1">{r.region}</div>
                        <div className="space-y-1 mt-1">
                          {Object.entries(r.brandSales).sort(([,a]:any, [,b]:any) => b - a).slice(0, 4).map(([brand, sales]: any) => (
                            <div key={brand} className="flex justify-between items-center text-[9px]">
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[brand] || '#ccc' }}></div>
                                <span className="font-bold text-slate-600 truncate max-w-[60px]">{brand}</span>
                              </div>
                              <span className="font-black text-slate-800">{Math.round(sales)}</span>
                            </div>
                          ))}
                        </div>
                      </MapTooltip>
                      <Popup>
                        <div className="p-2 min-w-[150px]">
                          <h4 className="text-sm font-black text-slate-800 uppercase mb-2">{r.region} Region</h4>
                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between text-[10px] border-b border-slate-100 pb-1">
                              <span className="text-slate-400 font-bold uppercase">Total Sales:</span>
                              <span className="font-black text-seablue">{Math.round(r.totalSales)}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-400 font-bold uppercase">Active Towns:</span>
                              <span className="font-black text-slate-700">{r.towns.size}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Brand Breakdown</h5>
                            {Object.entries(r.brandSales).sort(([,a]:any, [,b]:any) => b - a).map(([brand, sales]: any) => (
                              <div key={brand} className="flex justify-between items-center text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[brand] || '#ccc' }}></div>
                                  <span className="font-bold text-slate-600">{brand}</span>
                                </div>
                                <span className="font-black text-slate-800">{Math.round(sales)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                });
              } else {
                const townData: Record<string, any> = {};
                
                filteredMapStats.forEach(s => {
                  const coords = TOWN_COORDINATES[s.town] || (s.latitude && s.longitude ? [s.latitude, s.longitude] : null);
                  if (!coords) return;

                  if (!townData[s.town]) {
                    townData[s.town] = { town: s.town, region: s.region, totalSales: 0, brandSales: {}, lats: [], lngs: [], obs: new Set() };
                  }

                  let addedAny = false;
                  brandsToShow.forEach(brand => {
                    const sales = getSalesForSpecificBrand(s, brand);
                    if (sales > 0) {
                      townData[s.town].brandSales[brand] = (townData[s.town].brandSales[brand] || 0) + sales;
                      townData[s.town].totalSales += sales;
                      addedAny = true;
                    }
                  });

                  if (addedAny) {
                    if (TOWN_COORDINATES[s.town]) {
                      townData[s.town].lats = [TOWN_COORDINATES[s.town][0]];
                      townData[s.town].lngs = [TOWN_COORDINATES[s.town][1]];
                    } else {
                      townData[s.town].lats.push(coords[0]);
                      townData[s.town].lngs.push(coords[1]);
                    }
                    townData[s.town].obs.add(s.ob_name);
                  }
                });

                return Object.values(townData).filter(t => t.totalSales > 0).map((t: any, i) => {
                  const avgLat = t.lats.reduce((a:any,b:any)=>a+b,0)/t.lats.length;
                  const avgLng = t.lngs.reduce((a:any,b:any)=>a+b,0)/t.lngs.length;
                  
                  const color = mapFilterBrand !== 'All' ? (CATEGORY_COLORS[mapFilterBrand] || '#006994') : '#006994';

                  return (
                    <CircleMarker 
                      key={`town-${t.town}-${i}`} 
                      center={[avgLat, avgLng]} 
                      radius={Math.max(5, Math.min(20, t.totalSales / 20))}
                      pathOptions={{ color: color, fillColor: color, fillOpacity: 0.6, weight: 1 }}
                    >
                      <MapTooltip direction="top" offset={[0, -10]} className="bg-white/95 backdrop-blur-sm border-none shadow-xl rounded-xl p-2 min-w-[120px]">
                        <div className="text-[10px] font-black text-slate-800 uppercase text-center mb-1 border-b border-slate-100 pb-1">{t.town}</div>
                        <div className="space-y-1 mt-1">
                          {Object.entries(t.brandSales).sort(([,a]:any, [,b]:any) => b - a).slice(0, 4).map(([brand, sales]: any) => (
                            <div key={brand} className="flex justify-between items-center text-[9px]">
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[brand] || '#ccc' }}></div>
                                <span className="font-bold text-slate-600 truncate max-w-[60px]">{brand}</span>
                              </div>
                              <span className="font-black text-slate-800">{Math.round(sales)}</span>
                            </div>
                          ))}
                        </div>
                      </MapTooltip>
                      <Popup>
                        <div className="p-2 min-w-[150px]">
                          <h4 className="text-sm font-black text-slate-800 uppercase mb-1">{t.town}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t.region} Region</p>
                          
                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between text-[10px] border-b border-slate-100 pb-1">
                              <span className="text-slate-400 font-bold uppercase">Total Sales:</span>
                              <span className="font-black text-seablue">{Math.round(t.totalSales)}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-400 font-bold uppercase">Active OBs:</span>
                              <span className="font-black text-slate-700">{t.obs.size}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Brand Breakdown</h5>
                            {Object.entries(t.brandSales).sort(([,a]:any, [,b]:any) => b - a).map(([brand, sales]: any) => (
                              <div key={brand} className="flex justify-between items-center text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[brand] || '#ccc' }}></div>
                                  <span className="font-bold text-slate-600">{brand}</span>
                                </div>
                                <span className="font-black text-slate-800">{Math.round(sales)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                });
              }
            })()}
          </MapContainer>
          
          {/* Map Legend */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-lg z-[1000] space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Brands</h4>
            {Object.entries(CATEGORY_COLORS).map(([brand, color]) => (
              <div key={brand} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-clean bg-white overflow-hidden mb-6">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            OB Performance Report (Target vs Achievement)
          </h3>
          <div className="flex items-center gap-2">
            <select 
              value={offDayFilter} 
              onChange={(e) => setOffDayFilter(e.target.value)}
              className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="All">All Off Days</option>
              <option value="Sunday">Sunday</option>
              <option value="Friday">Friday</option>
            </select>
            <select 
              value={obReportCategoryFilter} 
              onChange={(e) => setObReportCategoryFilter(e.target.value)}
              className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="All">All Categories</option>
              {BRAND_GROUP_NAMES.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
            <select 
              value={obReportBrandFilter} 
              onChange={(e) => setObReportBrandFilter(e.target.value)}
              className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="All">All Brands</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left min-w-[800px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">OB Name</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Town</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">TSM</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Target (Ctns)</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Achieved (Ctns)</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Ach %</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(() => {
                const obData = filteredOBs.map(ob => {
                  let sales = 0;
                  let target = 0;
                  
                  const obStats = monthStats.filter(s => s.ob_contact === ob.ob_id && !s.isTSMEntry);
                  
                  obStats.forEach(s => {
                    if (obReportCategoryFilter !== 'All') {
                      const brandsInGroup = BRAND_GROUPS[obReportCategoryFilter] || [];
                      sales += brandsInGroup.reduce((sum, brand) => sum + (s.brandSales[brand] || 0), 0);
                    } else if (obReportBrandFilter !== 'All') {
                      sales += (s.brandSales[obReportBrandFilter] || 0);
                    } else {
                      sales += s.totalBags;
                    }
                  });

                  target = Number(ob.target_ctn) || 0;
                  const perc = target > 0 ? (sales / target) * 100 : 0;
                  
                  const recentSales = obStats.slice(-3).reduce((sum, s) => sum + s.totalBags, 0);
                  const prevSales = obStats.slice(-6, -3).reduce((sum, s) => sum + s.totalBags, 0);
                  const trend = recentSales >= prevSales ? 'up' : 'down';

                  return { ...ob, sales, target, perc, trend };
                }).sort((a, b) => b.sales - a.sales);

                return obData.map((row, idx) => (
                  <React.Fragment key={row.ob_id}>
                    <tr 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedOBForRoute === row.ob_id ? 'bg-seablue/5' : ''}`}
                      onClick={() => setSelectedOBForRoute(selectedOBForRoute === row.ob_id ? null : row.ob_id)}
                    >
                      <td className="px-6 py-3 text-xs font-black text-slate-700">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${selectedOBForRoute === row.ob_id ? 'bg-seablue animate-pulse' : 'bg-slate-200'}`} />
                          {row.ob_name}
                        </div>
                        <span className="text-[9px] text-slate-400 font-normal block ml-4">{row.ob_id}</span>
                      </td>
                      <td className="px-6 py-3 text-xs font-bold text-slate-500">{row.town_name}</td>
                      <td className="px-6 py-3 text-xs font-bold text-slate-500">{row.asm_tsm_name}</td>
                      <td className="px-6 py-3 text-xs font-bold text-slate-600 text-right">{Math.round(row.target).toLocaleString()}</td>
                      <td className="px-6 py-3 text-xs font-black text-seablue text-right">{Math.round(row.sales).toLocaleString()}</td>
                      <td className={`px-6 py-3 text-xs font-black text-right ${row.perc >= 100 ? 'text-emerald-600' : row.perc >= 80 ? 'text-amber-500' : 'text-rose-600'}`}>
                        {row.perc.toFixed(1)}%
                      </td>
                      <td className="px-6 py-3 text-right">
                        {row.trend === 'up' ? (
                          <span className="inline-flex items-center text-emerald-500"><TrendingUp className="w-4 h-4" /></span>
                        ) : (
                          <span className="inline-flex items-center text-rose-500"><TrendingDown className="w-4 h-4" /></span>
                        )}
                      </td>
                    </tr>
                    {selectedOBForRoute === row.ob_id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-slate-50/50">
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                          >
                            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Route Performance: {row.ob_name}</h4>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{obRoutePerformance.length} Routes Found</span>
                            </div>
                            <table className="w-full text-left">
                              <thead>
                                <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                  <th className="px-4 py-2">Route Name</th>
                                  <th className="px-4 py-2 text-right">Sales</th>
                                  <th className="px-4 py-2 text-right">Productivity</th>
                                  <th className="px-4 py-2 text-right">Visits</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {obRoutePerformance.map((route: any) => (
                                  <tr key={route.name} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-4 py-2 text-[10px] font-bold text-slate-700">{route.name}</td>
                                    <td className="px-4 py-2 text-right text-[10px] font-black text-seablue">{Math.round(route.sales)}</td>
                                    <td className="px-4 py-2 text-right">
                                      <span className="text-[10px] font-bold text-emerald-600">
                                        {route.visited > 0 ? ((route.productive / route.visited) * 100).toFixed(0) : 0}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-right text-[10px] font-medium text-slate-500">{route.visited}</td>
                                  </tr>
                                ))}
                                {obRoutePerformance.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase">No route data available</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-clean p-6 bg-white border border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Sales by Day of Week</h3>
        </div>
        <div className="h-[300px] min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayOfWeekData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} 
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                dx={-10}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                dx={10}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                labelStyle={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
              />
              <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', fontWeight: 700, color: '#1e3a8a', paddingTop: '20px' }} />
              <Bar yAxisId="left" dataKey="sales" name="Total Sales (Bags)" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={30} />
              <Line yAxisId="right" type="monotone" dataKey="dropSize" name="Drop Size" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-clean p-6 bg-white border border-slate-100 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Top 10 TSM Performance</h3>
          <div className="flex gap-2">
            <select 
              value={tsmCategoryFilter}
              onChange={(e) => setTsmCategoryFilter(e.target.value)}
              className="text-[8px] font-black text-seablue uppercase bg-slate-50 px-2 py-1 rounded border-none focus:ring-0"
            >
              <option value="All">All Categories</option>
              {BRAND_GROUP_NAMES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select 
              value={tsmBrandFilter}
              onChange={(e) => setTsmBrandFilter(e.target.value)}
              className="text-[8px] font-black text-seablue uppercase bg-slate-50 px-2 py-1 rounded border-none focus:ring-0"
            >
              <option value="All">All Brands</option>
              {brands.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
        <div className="h-[300px] min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(() => {
              const filteredTSMs = tsmPerformance.map(tsm => {
                let sales = 0;
                let target = 0;
                const tsmStats = monthStats.filter(s => s.tsm === tsm.name && !s.isTSMEntry);
                
                tsmStats.forEach(s => {
                  if (tsmCategoryFilter !== 'All') {
                    const brandsInGroup = BRAND_GROUPS[tsmCategoryFilter] || [];
                    sales += brandsInGroup.reduce((sum, brand) => sum + (s.brandSales[brand] || 0), 0);
                  } else if (tsmBrandFilter !== 'All') {
                    sales += (s.brandSales[tsmBrandFilter] || 0);
                  } else {
                    sales += s.totalBags;
                  }
                });

                // Calculate target for filtered view
                const tsmOBs = hierarchy.filter(h => h.asm_tsm_name === tsm.name);
                tsmOBs.forEach(h => {
                  if (tsmCategoryFilter !== 'All') {
                    const brandsInGroup = BRAND_GROUPS[tsmCategoryFilter] || [];
                    target += (Number(h.target_ctn) || 0); 
                  } else if (tsmBrandFilter !== 'All') {
                    target += (Number(h.target_ctn) || 0);
                  } else {
                    target += (Number(h.target_ctn) || 0);
                  }
                });

                const perc = target > 0 ? (sales / target) * 100 : 0;
                return { ...tsm, totalSales: sales, achievementPerc: perc };
              }).sort((a, b) => a.achievementPerc - b.achievementPerc); // Bottom to top
              return filteredTSMs.slice(0, 10);
            })()}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 8, fontWeight: 'bold', fill: '#94a3b8' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 8, fontWeight: 'bold', fill: '#94a3b8' }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [Math.round(value).toLocaleString(), 'Sales (Ctns)']}
              />
              <Bar dataKey="totalSales" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TSM / ASM Direct Sales Performance */}
      {tsmDirectPerformance.length > 0 && (
        <div className="card-clean bg-white overflow-hidden border border-slate-100 mt-6">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">TSM / ASM Direct Sales Performance</h3>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">By Achievement %</span>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Town</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Region</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Target</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Ach</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Ach %</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Productivity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tsmDirectPerformance.sort((a, b) => b.achievement - a.achievement).map((tsm, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">
                      <span className="text-slate-300 mr-2">{idx + 1}.</span>
                      {tsm.name}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{tsm.town}</td>
                    <td className="px-6 py-4 text-[10px] font-black text-seablue uppercase tracking-widest">{tsm.region}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 text-right">{Math.round(tsm.target).toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700 text-right">{Math.round(tsm.totalSales).toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-black text-emerald-600 text-right">{tsm.achievement.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-600 text-right">{tsm.productivityScore.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Route Analysis Section (Visible when OB or Route is selected) */}
      {(filterLevel === 'OB' || filterLevel === 'Route') && (
        <div className="card-clean bg-white overflow-hidden border border-slate-200 shadow-sm">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-seablue uppercase tracking-widest">Route Analysis (Last 16 Visits)</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Detailed performance trend for {filterValue}</p>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={routeAnalysisCategoryFilter} 
                onChange={(e) => setRouteAnalysisCategoryFilter(e.target.value)}
                className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="All">All Categories</option>
                {Object.keys(BRAND_GROUPS).map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              <select 
                value={routeAnalysisBrandFilter} 
                onChange={(e) => setRouteAnalysisBrandFilter(e.target.value)}
                className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="All">All Brands</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-[300px] min-h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={routeAnalysisData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={9} 
                        tick={{ fill: '#64748b', fontWeight: 700 }}
                        tickFormatter={(val) => val.split('-').slice(1).join('/')}
                      />
                      <YAxis fontSize={9} tick={{ fill: '#64748b', fontWeight: 700 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px', color: '#1e3a8a' }} />
                      {CATEGORIES.map((cat, idx) => {
                        return (
                          <Line 
                            key={cat}
                            type="monotone" 
                            dataKey={cat} 
                            stroke={CATEGORY_COLORS[cat]} 
                            strokeWidth={2} 
                            dot={{ r: 3, fill: CATEGORY_COLORS[cat] }} 
                            activeDot={{ r: 5 }} 
                            name={`${cat} (Bags)`} 
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Visit Stats</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Total Visits</span>
                      <span className="text-xs font-black text-slate-700">{routeAnalysisData.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Productive Visits</span>
                      <span className="text-xs font-black text-emerald-600">{routeAnalysisData.filter(d => d.sales > 0).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Zero Sales</span>
                      <span className="text-xs font-black text-rose-600">{routeAnalysisData.filter(d => d.sales === 0).length}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-700 uppercase">Avg Sales/Visit</span>
                      <span className="text-xs font-black text-seablue">
                        {routeAnalysisData.length > 0 ? (routeAnalysisData.reduce((sum, d) => sum + d.sales, 0) / routeAnalysisData.length).toFixed(1) : 0} B
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Top Brand on Route</h4>
                  {(() => {
                    const brandSales: Record<string, number> = {};
                    routeAnalysisData.forEach(d => {
                      Object.entries(d.brandSales).forEach(([b, s]) => {
                        brandSales[b] = (brandSales[b] || 0) + (s as number);
                      });
                    });
                    const topBrand = Object.entries(brandSales).sort((a, b) => b[1] - a[1])[0];
                    return topBrand ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xs">
                          {topBrand[0][0]}
                        </div>
                        <div>
                          <p className="text-xs font-black text-indigo-900 uppercase">{topBrand[0]}</p>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase">{Math.round(topBrand[1])} Bags Total</p>
                        </div>
                      </div>
                    ) : <p className="text-[10px] font-bold text-indigo-400 uppercase">No sales data</p>;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-3 h-3 text-amber-600" />
        <p className="text-[9px] font-bold text-amber-700 uppercase tracking-tight">
          Note: "Match" Tonnage is excluded from all tonnage and cost calculations as per policy.
        </p>
      </div>

      {/* TSM Quick Review Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-black text-seablue uppercase tracking-widest">TSM Quick Review (Bottom 50)</h2>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3">Hierarchy</th>
                <th className="px-4 py-3">TSM Name</th>
                <th className="px-4 py-3 text-right">Active OBs</th>
                <th className="px-4 py-3 text-right">Target</th>
                <th className="px-4 py-3 text-right">Achieved</th>
                <th className="px-4 py-3 text-right">Ach %</th>
                <th className="px-4 py-3 text-right">RPD</th>
                <th className="px-4 py-3 text-right">Avg OB Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tsmPerformance.slice(0, 50).map((tsm, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="text-[8px] font-black text-slate-400 uppercase leading-none">National &gt; {tsm.region}</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">{tsm.town}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700 text-xs">{tsm.name}</td>
                  <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">{tsm.activeOBs}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-400 font-mono text-xs">{Math.round(tsm.totalTarget).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 font-mono text-xs">{Math.round(tsm.totalSales).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 font-mono text-xs">{tsm.achievementPerc.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-600 font-mono text-xs">{tsm.rpd.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right font-bold text-seablue font-mono text-xs">{Math.round(tsm.averageOBSales).toLocaleString()}</td>
                </tr>
              ))}
              {tsmPerformance.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                    No TSM data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean bg-white overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Worst Performing OB (Bottom 50)</h3>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">By Achievement %</span>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">OB Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Town</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">TSM</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Target</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Ach</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Ach %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {worstOBs.map((ob, idx) => (
                  <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">
                      <span className="text-slate-300 mr-2">{idx + 1}.</span>
                      {ob.name}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{ob.town}</td>
                    <td className="px-6 py-4 text-[10px] font-black text-seablue uppercase tracking-widest">{ob.tsm}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 text-right">{Math.round(ob.target).toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700 text-right">{Math.round(ob.totalSales).toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-black text-rose-600 text-right">{ob.achievement.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-clean bg-white overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Worst OB by Brand (Bottom 50)</h3>
            <select 
              value={worstBrandFilter}
              onChange={(e) => setWorstBrandFilter(e.target.value)}
              className="text-[10px] font-black text-seablue uppercase bg-white px-2 py-1 rounded border border-slate-200 focus:ring-0"
            >
              <option value="All">All Brands</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">OB Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Town</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Brand</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(() => {
                  let data: any[] = [];
                  if (worstBrandFilter === 'All') {
                    CATEGORIES.forEach(cat => {
                      data = [...data, ...(worstByBrand[cat] || []).map(ob => ({ ...ob, brand: cat }))];
                    });
                  } else {
                    data = (worstByBrand[worstBrandFilter] || []).map(ob => ({ ...ob, brand: worstBrandFilter }));
                  }
                  return data.sort((a, b) => a.sales - b.sales).slice(0, 50).map((ob, idx) => (
                    <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">
                        <span className="text-slate-300 mr-2">{idx + 1}.</span>
                        {ob.name}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{ob.town}</td>
                      <td className="px-6 py-4 text-[10px] font-black text-seablue uppercase tracking-widest">{ob.brand}</td>
                      <td className="px-6 py-4 text-xs font-black text-rose-600 text-right">{ob.sales.toFixed(1)}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean bg-white overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Route Weakness Detection</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">OB / Route</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Sales Trend</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {routeWeakness.map((rw, idx) => (
                  <tr key={idx} className="hover:bg-rose-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">{rw.ob}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{rw.route}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-600">{rw.latestSales.toFixed(1)}</span>
                        <ArrowDownRight className="w-3 h-3 text-rose-500" />
                        <span className="text-[10px] text-slate-400 font-bold">vs {rw.prevSales.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {rw.reasons.map((r: string) => (
                          <span key={r} className="text-[8px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">{r}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-clean bg-white p-6">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Daily Sales Heatmap (MTD)</h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase">View:</span>
              <select 
                className="input-clean text-[10px] py-1 px-2 rounded-lg"
                value={heatmapView}
                onChange={(e) => setHeatmapView(e.target.value)}
              >
                <option value="Total">Total Bags/Ctns</option>
                <optgroup label="Category-wise">
                  {BRAND_GROUP_NAMES.map(cat => <option key={`cat_${cat}`} value={`cat_${cat}`}>{cat}</option>)}
                </optgroup>
                <optgroup label="Brand-wise">
                  {brands.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </optgroup>
              </select>
            </div>
          </div>
          <div className="h-64 min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthStats.reduce((acc: any[], s) => {
                const dateKey = s.date.split('-')[2];
                let existing = acc.find(a => a.date === dateKey);
                if (!existing) {
                  existing = { date: dateKey, sales: 0 };
                  acc.push(existing);
                }
                
                if (heatmapView === 'Total') {
                  existing.sales += s.totalBags;
                } else if (heatmapView.startsWith('cat_')) {
                  const categoryName = heatmapView.replace('cat_', '');
                  const brandsInGroup = BRAND_GROUPS[categoryName] || [];
                  existing.sales += brandsInGroup.reduce((sum, brand) => sum + (s.brandSales[brand] || 0), 0);
                } else {
                  existing.sales += (s.brandSales[heatmapView] || 0);
                }
                
                return acc;
              }, []).sort((a, b) => a.date.localeCompare(b.date))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: '900', color: '#1e293b', fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Bar dataKey="sales" fill="#0066cc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-clean p-6 bg-white space-y-4 mt-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">
          {filterLevel === 'National' ? 'National' : `${filterLevel}: ${filterValue}`} Monthly Sales Trend
        </h3>
        <div className="h-[300px] min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
              <YAxis fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
              <Tooltip />
              <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px', color: '#1e3a8a' }} />
              {brands.map((brand, idx) => (
                <Line key={brand} type="monotone" dataKey={brand} stroke={CATEGORY_COLORS[brand] || '#0ea5e9'} strokeWidth={2} />
              ))}
              <Line type="monotone" dataKey="totalSales" stroke="#0f172a" strokeWidth={3} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )}
      <section className="card-clean bg-white p-6 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Weakest Routes</h3>
          </div>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bottom to Top</span>
        </div>
        <div className="space-y-4">
          {data.weakestRoutes.map((wr: any, idx: number) => (
            <motion.div 
              key={wr.route}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-rose-200 transition-all"
            >
              <div className="space-y-1">
                <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{wr.route}</div>
                <div className="flex flex-wrap gap-1">
                  {wr.reasons.map((reason: string) => (
                    <span key={reason} className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[7px] font-black uppercase tracking-widest rounded">
                      {reason}
                    </span>
                  ))}
                </div>
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{wr.ob}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-black text-rose-600">{wr.avgSales.toFixed(1)} <span className="text-[8px] text-slate-400">Avg</span></div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{wr.efficiency.toFixed(0)}% Efficiency</div>
              </div>
            </motion.div>
          ))}
          {data.weakestRoutes.length === 0 && (
            <div className="py-10 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">All routes performing well!</p>
            </div>
          )}
        </div>
      </section>

      {/* Head Count Detail Modal */}
      <AnimatePresence>
        {selectedHeadCountDetail && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 flex items-center justify-between bg-seablue text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">{selectedHeadCountDetail.designation} SalesPulse</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Active vs Total Staff Drill-down</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedHeadCountDetail(null)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {/* Breadcrumbs for Head Count Drill-down */}
                {headCountDrillDown.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-xl">
                    <button 
                      onClick={() => {
                        setHeadCountDrillDown([]);
                        setSelectedHeadCountDetail({ designation: 'RSM' }); // Reset to top level
                      }}
                      className="text-[10px] font-black text-seablue uppercase hover:underline"
                    >
                      National
                    </button>
                    {headCountDrillDown.map((d, idx) => (
                      <React.Fragment key={idx}>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <button 
                          onClick={() => setHeadCountDrillDown(prev => prev.slice(0, idx + 1))}
                          className="text-[10px] font-black text-slate-600 uppercase"
                        >
                          {d.value}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="p-4">Name / ID</th>
                        <th className="p-4">Region</th>
                        <th className="p-4">TSM / ASM</th>
                        <th className="p-4">Town</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">MTD Activity</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] font-bold text-slate-600">
                      {filteredHeadCountData.map((item: any, i: number) => {
                        const h = item.h;
                        const entries = item.entries;
                        const isActive = item.isActive;
                        
                        return (
                          <React.Fragment key={i}>
                            <tr 
                              onClick={() => {
                                if (selectedHeadCountDetail.designation === 'RSM' || selectedHeadCountDetail.designation === 'SC') {
                                  setHeadCountDrillDown([{ level: 'Region', value: h?.territory_region || 'N/A' }]);
                                  setSelectedHeadCountDetail({ designation: 'TSM' });
                                } else if (selectedHeadCountDetail.designation === 'TSM' || selectedHeadCountDetail.designation === 'ASM') {
                                  setHeadCountDrillDown(prev => [...prev, { level: 'TSM', value: item.name }]);
                                  setSelectedHeadCountDetail({ designation: 'OB' });
                                } else if (selectedHeadCountDetail.designation === 'OB') {
                                  setExpandedOB(expandedOB === item.contact ? null : item.contact);
                                }
                              }}
                              className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group"
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  {selectedHeadCountDetail.designation === 'OB' && (
                                    <div className={`transition-transform ${expandedOB === item.contact ? 'rotate-90' : ''}`}>
                                      <ChevronRight className="w-3 h-3 text-slate-400" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-slate-800 font-black group-hover:text-seablue transition-colors">{item.name}</div>
                                    <div className="text-[9px] text-slate-400 font-bold">{item.contact}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">{h?.territory_region || 'N/A'}</td>
                              <td className="p-4">{h?.asm_tsm_name || 'N/A'}</td>
                              <td className="p-4">{h?.town_name || 'N/A'}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="text-slate-800 font-black">{entries.length} Visits</div>
                                <div className="text-[9px] text-slate-400 font-bold">{entries.reduce((sum: number, s: any) => sum + (s.totalBags || 0), 0).toFixed(1)} Bags</div>
                              </td>
                            </tr>
                            {expandedOB === item.contact && (
                              <tr className="bg-slate-50/50">
                                <td colSpan={6} className="p-4">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Route</p>
                                      <p className="text-[10px] font-black text-slate-800">{h?.route || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Target (Bags)</p>
                                      <p className="text-[10px] font-black text-seablue">{h?.target_ctn || 0}</p>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Distributor</p>
                                      <p className="text-[10px] font-black text-slate-800">{h?.distributor_name || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Visit</p>
                                      <p className="text-[10px] font-black text-slate-800">{entries[0]?.date || 'No visits'}</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedHeadCountDetail(null)}
                  className="w-full py-4 rounded-2xl bg-seablue text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-seablue/90 transition-all"
                >
                  Close SalesPulse
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatsView = ({ 
  history, obAssignments, users, tsmList, appConfig, getPSTDate, SKUS, CATEGORIES, 
  userRole, userName, userRegion, userContact, onRefresh, isSyncing, 
  selectedMonth, setSelectedMonth,
  dailyStatus, fetchDailyStatus, isLoadingDailyStatus,
  missingEntriesReport, fetchMissingEntriesReport, isLoadingMissingEntries
}: any) => {
  const [offDayFilter, setOffDayFilter] = useState('All');
  const currentMonth = selectedMonth || getPSTDate().slice(0, 7);
  const today = getPSTDate();
  const dayOfMonth = parseInt(today.split('-')[2]);

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
    
    // Exclude TSM entries and Test OBs from OB reports
    const baseObs = obs.filter((ob: any) => {
      if (!ob) return false;
      const name = ob.name || ob.ob_name || '';
      const tsm = ob.tsm || ob.asm_tsm_name || '';
      return !isTSMEntry(name, tsm) && !name.toLowerCase().includes('test');
    });

    if (offDayFilter === 'All') return baseObs;
    return baseObs.filter((ob: any) => (ob.off_day || 'Sunday') === offDayFilter);
  }, [obAssignments, userRole, userRegion, userName, userContact, offDayFilter]);

  const filteredTSMList = useMemo(() => {
    if (userRole === 'Admin' || userRole === 'Super Admin') {
      return tsmList;
    }
    if (userRole === 'Director') {
      return tsmList.filter((tsm: string) => obAssignments.some((ob: any) => (ob.tsm || '').trim().toLowerCase() === tsm.toLowerCase() && (ob.director || '').trim().toLowerCase() === (userName || '').trim().toLowerCase()));
    }
    if (userRole === 'NSM') {
      return tsmList.filter((tsm: string) => obAssignments.some((ob: any) => (ob.tsm || '').trim().toLowerCase() === tsm.toLowerCase() && (ob.nsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase()));
    }
    if (userRole === 'RSM' || userRole === 'SC') {
      return tsmList.filter((tsm: string) => obAssignments.some((ob: any) => (ob.tsm || '').trim().toLowerCase() === tsm.toLowerCase() && ((ob.region || '').trim().toLowerCase() === (userRegion || '').trim().toLowerCase() || (ob.rsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase() || (ob.sc || '').trim().toLowerCase() === (userName || '').trim().toLowerCase())));
    }
    if ((userRole === 'TSM' || userRole === 'ASM')) {
      return tsmList.filter((tsm: string) => tsm.toLowerCase() === (userName || '').trim().toLowerCase());
    }
    return [];
  }, [tsmList, obAssignments, userRole, userRegion, userName]);

  const calculateWorkingDaysTillDate = () => {
    const now = new Date(today);
    return getWorkingDays(now.getFullYear(), now.getMonth(), appConfig.holidays || '', dayOfMonth);
  };

  const workingDaysTillDate = calculateWorkingDaysTillDate();
  const totalWorkingDays = parseInt(appConfig.total_working_days || '25');

  // Calculate Summary Metrics
  const totalOBs = filteredOBs.length;
  const activeOBsCount = filteredOBs.filter(ob => history.some((h: any) => h.ob_contact === ob.contact && h.date.startsWith(currentMonth))).length;
  
  const avgEfficiency = filteredOBs.length > 0 ? filteredOBs.reduce((sum, ob) => {
    const obStats = history.filter((h: any) => h.ob_contact === ob.contact && h.date.startsWith(currentMonth));
    const uniqueEntryDays = new Set(obStats.map((h: any) => h.date)).size;
    const now = new Date(today);
    const obWorkingDaysTillDate = getWorkingDays(now.getFullYear(), now.getMonth(), appConfig.holidays || '', dayOfMonth, ob.off_day || 'Sunday');
    return sum + (obWorkingDaysTillDate > 0 ? (uniqueEntryDays / obWorkingDaysTillDate) * 100 : 0);
  }, 0) / filteredOBs.length : 0;

  const dateWiseSummary = useMemo(() => {
    if (!history) return [];
    const dates = Array.from(new Set(history.filter(s => s.date.startsWith(currentMonth)).map(s => s.date))).sort().reverse();
    const totalOBsCount = filteredOBs.length;
    
    return dates.map(date => {
      const dayStats = history.filter(s => s.date === date && !s.isTSMEntry);
      // Filter dayStats to only include OBs visible to the current user
      const visibleDayStats = dayStats.filter(s => filteredOBs.some((ob: any) => ob.contact === s.ob_contact));
      const submittedCount = visibleDayStats.filter(s => s.visit_type !== 'Absent').length;
      const absentCount = visibleDayStats.filter(s => s.visit_type === 'Absent').length;
      const pendingCount = Math.max(0, totalOBsCount - (submittedCount + absentCount));
      const rrOBs = visibleDayStats.filter(s => s.visit_type === 'RR');
      
      return {
        date,
        totalOBs: totalOBsCount,
        submittedCount,
        absentCount,
        pendingCount,
        rrCount: rrOBs.length,
        rrDetails: rrOBs.map(ob => ({
          name: ob.ob_name,
          tsm: ob.tsm
        }))
      };
    }).slice(0, 10); // Show last 10 days
  }, [history, filteredOBs, currentMonth]);

  const headCountStats = useMemo(() => {
    if (!users || !obAssignments || !history) return [];

    const currentMonthHistory = history.filter((s: any) => s.date.startsWith(currentMonth));

    // 1. RSM / ASM / TSM / SC Count
    const getRoleStats = (roleName: string) => {
      // Filter users by role
      const roleUsers = users.filter((u: any) => u.role === roleName);
      const total = roleUsers.length;
      
      // Active logic: user has at least 1 entry in current month where their team submitted data
      let active = 0;
      roleUsers.forEach((u: any) => {
        // Check if their team submitted data
        const hasEntry = currentMonthHistory.some((s: any) => {
          if (roleName === 'RSM') return (s.rsm || '').trim().toLowerCase() === (u.name || '').trim().toLowerCase();
          if (roleName === 'SC') return (s.sc || '').trim().toLowerCase() === (u.name || '').trim().toLowerCase();
          if (roleName === 'TSM' || roleName === 'ASM') return (s.tsm || '').trim().toLowerCase() === (u.name || '').trim().toLowerCase();
          return false;
        });
        if (hasEntry) active++;
      });
      return { designation: roleName, total, active };
    };

    const rsmStats = getRoleStats('RSM');
    const asmStats = getRoleStats('ASM');
    const tsmStats = getRoleStats('TSM');
    const scStats = getRoleStats('SC');

    // 2. OB Count Logic
    const obMap = new Map();
    obAssignments.forEach((ob: any) => {
      const name = ob.name || ob.ob_name || '';
      const id = ob.contact || ob.ob_id || '';
      const tsm = ob.tsm || ob.asm_tsm_name || '';
      if (name.trim() !== '' && !isTSMEntry(name, tsm)) {
        obMap.set(id, name);
      }
    });
    const totalOBs = obMap.size;

    // Active OBs: OB has entry in current month
    let activeOBs = 0;
    obMap.forEach((name, id) => {
      const hasEntry = currentMonthHistory.some((s: any) => s.ob_contact === id);
      if (hasEntry) activeOBs++;
    });

    const obStats = { designation: 'OB', total: totalOBs, active: activeOBs };

    return [rsmStats, asmStats, tsmStats, scStats, obStats];
  }, [users, obAssignments, history, currentMonth]);

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen pb-40">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-seablue uppercase tracking-tight leading-none">Operational Stats</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Submission Status & Activity Tracking</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total OBs</p>
            <p className="text-2xl font-black text-slate-800 leading-none mt-1">{totalOBs}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active OBs</p>
            <p className="text-2xl font-black text-emerald-600 leading-none mt-1">{activeOBsCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-seablue/10 flex items-center justify-center text-seablue">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Efficiency</p>
            <p className="text-2xl font-black text-seablue leading-none mt-1">{avgEfficiency.toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Working Days</p>
            <p className="text-2xl font-black text-amber-600 leading-none mt-1">{workingDaysTillDate}/{totalWorkingDays}</p>
          </div>
        </div>
      </div>

      {/* Daily Submission Status (Moved from Admin) */}
      <section className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border-none overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">Daily Submission Status</h2>
              <p className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Real-time Field Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="date" 
              defaultValue={getPSTDate()} 
              onChange={(e) => fetchDailyStatus(e.target.value)}
              className="bg-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
            <button 
              onClick={() => fetchDailyStatus(getPSTDate())} 
              className="p-2 hover:bg-white/10 rounded-xl transition-colors group"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDailyStatus ? 'animate-spin' : 'group-active:rotate-180 transition-transform'}`} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Submitted Box */}
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Submitted OBs</div>
                  <div className="text-3xl font-black text-emerald-700">{dailyStatus.filter(s => s.submitted && s.visit_type !== 'Absent').length}</div>
                </div>
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {dailyStatus.filter(s => s.submitted && s.visit_type !== 'Absent').map(s => (
                  <div key={s.contact} className="flex flex-col p-2 bg-white/60 rounded-xl border border-emerald-100/50">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-700">{s.name}</span>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg">{s.visit_type}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{s.tsm}</span>
                      <span className="text-[9px] font-black text-rose-500">Missed: {Math.max(0, workingDaysTillDate - (s.entryDaysCount || 0))} Days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Box */}
            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending OBs</div>
                  <div className="text-3xl font-black text-amber-700">{dailyStatus.filter(s => !s.submitted).length}</div>
                </div>
                <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {dailyStatus.filter(s => !s.submitted).map(s => (
                  <div key={s.contact} className="flex flex-col p-2 bg-white/60 rounded-xl border border-amber-100/50">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-700">{s.name}</span>
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg">PENDING</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{s.tsm}</span>
                      <span className="text-[9px] font-black text-rose-500">Missed: {Math.max(0, workingDaysTillDate - (s.entryDaysCount || 0))} Days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Absent Box */}
            <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Absent OBs</div>
                  <div className="text-3xl font-black text-rose-700">{dailyStatus.filter(s => s.visit_type === 'Absent').length}</div>
                </div>
                <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {dailyStatus.filter(s => s.visit_type === 'Absent').map(s => (
                  <div key={s.contact} className="flex flex-col p-2 bg-white/60 rounded-xl border border-rose-100/50">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-700">{s.name}</span>
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-lg">ABSENT</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{s.tsm}</span>
                      <span className="text-[9px] font-black text-rose-500">Missed: {Math.max(0, workingDaysTillDate - (s.entryDaysCount || 0))} Days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-black tracking-widest">
                  <th className="py-4 px-2">OB Name</th>
                  <th className="py-4 px-2">TSM</th>
                  <th className="py-4 px-2 text-center">Status</th>
                  <th className="py-4 px-2 text-center">Visit Type</th>
                  <th className="py-4 px-2 text-center">Missed Days</th>
                  <th className="py-4 px-2 text-right">Last Entry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dailyStatus.map(ob => {
                  const totalWorkingDays = Number(appConfig.total_working_days) || 26;
                  const missedDays = Math.max(0, totalWorkingDays - (ob.entryDaysCount || 0));
                  
                  return (
                    <tr key={ob.contact} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="font-black text-slate-800">{ob.name}</div>
                        <div className="text-[8px] text-slate-400 font-bold">{ob.contact}</div>
                      </td>
                      <td className="py-4 px-2 text-slate-500 font-bold">{ob.tsm}</td>
                      <td className="py-4 px-2 text-center">
                        {ob.submitted ? (
                          ob.visit_type === 'Absent' ? (
                            <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 font-black text-[8px] uppercase tracking-widest border border-rose-100">Absent</span>
                          ) : ob.visit_type === 'RR' ? (
                            <span className="px-2 py-1 rounded-lg bg-amber-400 text-white font-black text-[8px] uppercase tracking-widest shadow-sm">Route Riding</span>
                          ) : ob.visit_type === 'V' ? (
                            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-black text-[8px] uppercase tracking-widest border border-emerald-100">Van Sales</span>
                          ) : (
                            <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-600 font-black text-[8px] uppercase tracking-widest border border-slate-100">Alone</span>
                          )
                        ) : (
                          <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-400 font-black text-[8px] uppercase tracking-widest">Pending</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {ob.submitted && ob.visit_type !== 'Absent' ? (
                          <span className="font-black text-slate-600">{ob.visit_type}</span>
                        ) : '-'}
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={`font-black ${missedDays > 3 ? 'text-rose-600' : 'text-slate-600'}`}>
                          {missedDays}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right font-mono text-slate-400 font-bold">
                        {ob.submitted_at ? new Date(ob.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Date-wise Summary */}
      <section className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border-none overflow-hidden">
        <div className="bg-emerald-600 text-white px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Date-wise Submission Summary</h2>
            <p className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Historical Field Activity</p>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {dateWiseSummary.map((day) => (
              <div key={day.date} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-black text-slate-800">{day.date}</div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded-lg">
                        {day.submittedCount} Submited OB
                      </span>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded-lg">
                        {day.pendingCount} Pending OBs
                      </span>
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[8px] font-black uppercase tracking-widest rounded-lg">
                        {day.absentCount} AbsentOBs
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-200/50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Date : # of Route Riding OB ({day.rrCount})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {day.rrDetails.map((rr, idx) => (
                      <div key={idx} className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-[9px] font-bold text-slate-600 shadow-sm">
                        <span className="text-amber-600 font-black">{rr.tsm}</span>
                        <ChevronRight className="w-3 h-3 inline mx-1 text-slate-300" />
                        <span className="text-slate-800">{rr.name}</span>
                      </div>
                    ))}
                    {day.rrDetails.length === 0 && <span className="text-[9px] text-slate-400 italic">No Route Riding entries</span>}
                  </div>
                </div>
              </div>
            ))}
            {dateWiseSummary.length === 0 && (
              <div className="py-10 text-center text-slate-400 italic text-[10px] font-bold uppercase tracking-widest">
                No historical data available for this month.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TSM Activity Report */}
      <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
          <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
            <Logo className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">TSM Activity Report</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Performance overview for the selected month</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4 whitespace-nowrap">Hierarchy</th>
                <th className="px-6 py-4 whitespace-nowrap">TSM Name</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">
                  Active OBs
                  <p className="text-[8px] text-slate-400 font-medium normal-case tracking-normal mt-0.5">With entries this month</p>
                </th>
                <th className="px-6 py-4 text-center whitespace-nowrap">
                  Total Sales
                  <p className="text-[8px] text-slate-400 font-medium normal-case tracking-normal mt-0.5">Bags (Cartons + Dozens)</p>
                </th>
                <th className="px-6 py-4 text-center whitespace-nowrap">
                  Avg Productivity
                  <p className="text-[8px] text-slate-400 font-medium normal-case tracking-normal mt-0.5">Productive / Visited Shops</p>
                </th>
                <th className="px-6 py-4 text-right whitespace-nowrap">
                  Activity Score
                  <p className="text-[8px] text-slate-400 font-medium normal-case tracking-normal mt-0.5">Based on active OBs & prod.</p>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTSMList.map((tsm: string, idx: number) => {
                const tsmOBs = obAssignments.filter((ob: any) => ob.tsm === tsm && !isTSMEntry(ob.name, ob.tsm));
                const region = tsmOBs[0]?.region || 'Unassigned';
                const tsmOrders = history.filter((h: any) => h.tsm === tsm && h.date.startsWith(currentMonth) && !isTSMEntry(h.order_booker, h.tsm));
                const activeOBs = new Set(tsmOrders.map((h: any) => h.ob_contact)).size;
                const totalSales = tsmOrders.reduce((sum: number, h: any) => {
                  const data = h.order_data || {};
                  const bags = SKUS.reduce((s, sku) => {
                    const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                    const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                    return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                  }, 0);
                  return sum + bags;
                }, 0);
                const avgProd = tsmOrders.length > 0 ? tsmOrders.reduce((sum: number, h: any) => sum + (h.visited_shops > 0 ? (h.productive_shops / h.visited_shops) * 100 : 0), 0) / tsmOrders.length : 0;
                const score = (activeOBs / Math.max(1, tsmOBs.length) * 40) + (avgProd * 0.6);
                
                return (
                  <tr key={tsm || `tsm-${idx}`} className="group hover:bg-slate-50/80 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none">National &gt; {region}</p>
                      <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">{tsmOBs[0]?.town || 'Unassigned'}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-700 group-hover:text-seablue transition-colors whitespace-nowrap">{tsm}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{activeOBs}/{tsmOBs.length}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-black text-seablue font-mono whitespace-nowrap">{totalSales.toFixed(1)}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1 w-24 mx-auto">
                        <span className="text-xs font-black text-emerald-600">{avgProd.toFixed(0)}%</span>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(100, avgProd)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${score > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {score.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* OB Submission Status Report */}
      <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                {userRole === 'OB' ? 'My Activity Status' : 'Missing Entries Report'}
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Report based on your assigned hierarchy</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Filter Off Day</span>
              <select 
                value={offDayFilter} 
                onChange={(e) => setOffDayFilter(e.target.value)}
                className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-seablue"
              >
                <option value="All">All Days</option>
                <option value="Sunday">Sunday</option>
                <option value="Friday">Friday</option>
              </select>
            </div>
            <div className="flex flex-col items-end bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Working Days</span>
              <span className="text-xs font-black text-seablue">{workingDaysTillDate}</span>
            </div>
            <div className="flex flex-col items-end bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Target Days</span>
              <span className="text-xs font-black text-slate-600">{totalWorkingDays}</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4 whitespace-nowrap">Hierarchy</th>
                <th className="px-6 py-4 whitespace-nowrap">OB Name</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Off Day</th>
                <th className="px-6 py-4 whitespace-nowrap">TSM</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">
                  OB Entries
                  <p className="text-[8px] text-slate-400 font-medium normal-case tracking-normal mt-0.5">Submitted by OB</p>
                </th>
                <th className="px-6 py-4 text-center whitespace-nowrap">
                  TSM Entries
                  <p className="text-[8px] text-slate-400 font-medium normal-case tracking-normal mt-0.5">Submitted by TSM</p>
                </th>
                <th className="px-6 py-4 text-center whitespace-nowrap">
                  Missing
                  <p className="text-[8px] text-slate-400 font-medium normal-case tracking-normal mt-0.5">Days without entry</p>
                </th>
                <th className="px-6 py-4 whitespace-nowrap">Last Entry</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">
                  Efficiency
                  <p className="text-[8px] text-slate-400 font-medium normal-case tracking-normal mt-0.5">Entries / Working Days</p>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOBs.map((ob: any, idx: number) => {
                const obStats = history.filter((h: any) => h.ob_contact === ob.contact && h.date.startsWith(currentMonth));
                const obEntries = obStats.filter((h: any) => !isTSMEntry(h.order_booker, h.tsm));
                const tsmEntries = obStats.filter((h: any) => isTSMEntry(h.order_booker, h.tsm));
                
                const uniqueEntryDays = new Set(obStats.map((h: any) => h.date)).size;
                const uniqueEntryDaysTillYesterday = new Set(obStats.filter((h: any) => h.date < today).map((h: any) => h.date)).size;
                const now = new Date(today);
                const obWorkingDaysTillDate = getWorkingDays(now.getFullYear(), now.getMonth(), appConfig.holidays || '', dayOfMonth, ob.off_day || 'Sunday');
                const obWorkingDaysTillYesterday = getWorkingDays(now.getFullYear(), now.getMonth(), appConfig.holidays || '', Math.max(0, dayOfMonth - 1), ob.off_day || 'Sunday');
                const missing = Math.max(0, obWorkingDaysTillYesterday - uniqueEntryDaysTillYesterday);
                const lastEntry = obStats.sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
                const efficiency = obWorkingDaysTillDate > 0 ? (uniqueEntryDays / obWorkingDaysTillDate) * 100 : 0;
                
                // Identify improperly uploaded data (e.g., missing targets, 0 sales but productive shops, etc.)
                const improperEntries = obStats.filter((h: any) => {
                  const data = h.order_data || {};
                  let totalSales = 0;
                  SKUS.forEach((sku: any) => {
                    const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                    totalSales += (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                  });
                  return (h.productive_shops > 0 && totalSales === 0) || (h.visited_shops === 0 && h.productive_shops > 0);
                });

                return (
                  <React.Fragment key={ob.contact || `ob-${idx}`}>
                    <tr className="group hover:bg-slate-50/80 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-[8px] font-black text-slate-400 uppercase leading-none">National &gt; {ob.region}</p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">{ob.town}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-xs font-black text-slate-700 group-hover:text-seablue transition-colors">{ob.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{ob.contact}</p>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                          (ob.off_day || 'Sunday') === 'Sunday' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {ob.off_day || 'Sunday'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{ob.tsm}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{obEntries.length}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${tsmEntries.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                          {tsmEntries.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${missing > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                          {missing}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500 font-mono">{lastEntry?.date || 'Never'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1 w-24 ml-auto">
                          <span className={`text-[10px] font-black ${efficiency < 80 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {efficiency.toFixed(0)}%
                          </span>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${efficiency < 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, efficiency)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    {improperEntries.length > 0 && (
                      <tr className="bg-rose-50/30">
                        <td colSpan={8} className="px-6 py-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] font-black text-rose-700 uppercase">Improper Data Uploads Detected</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {improperEntries.map((entry: any, i: number) => (
                                  <span key={i} className="text-[9px] font-bold text-rose-600 bg-white px-2 py-1 rounded border border-rose-100">
                                    {entry.date}: {entry.productive_shops > 0 && entry.totalSales === 0 ? 'Productive shops with 0 sales' : 'Productive shops > Visited shops'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const TSMPerformanceView = ({ history, hierarchy, CATEGORIES, SKUS, userRole, userName, userRegion, selectedMonth, setSelectedMonth, setView, onRefresh, isSyncing }: any) => {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'achievementPerc', direction: 'asc' });
  const [obSortConfig, setObSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'achievementPerc', direction: 'asc' });
  const [obFilterRegion, setObFilterRegion] = useState('All');
  const [obFilterTSM, setObFilterTSM] = useState('All');
  const [obFilterBrand, setObFilterBrand] = useState('All');

  const tsmPerformanceData = useMemo(() => {
    const monthStats = history.filter((h: any) => h.date.startsWith(selectedMonth));
    const tsms: Record<string, any> = {};

    // Filter hierarchy based on role
    const filteredHierarchy = hierarchy.filter((h: any) => {
      if (userRole === 'Admin' || userRole === 'Super Admin' || userRole === 'Director' || userRole === 'NSM') return true;
      if (userRole === 'RSM' || userRole === 'SC') return (h.territory_region || '').trim().toLowerCase() === (userRegion || '').trim().toLowerCase();
      if (userRole === 'TSM' || userRole === 'ASM') return (h.asm_tsm_name || '').trim().toLowerCase() === (userName || '').trim().toLowerCase();
      return false;
    });

    // Initialize TSMs from hierarchy
    filteredHierarchy.forEach((h: any) => {
      const tsmName = h.asm_tsm_name || 'Unassigned';
      if (!tsms[tsmName]) {
        tsms[tsmName] = {
          month: selectedMonth,
          region: h.territory_region || 'Unassigned',
          rsm: h.rsm_name || 'Unassigned',
          tsmName: tsmName,
          totalOBs: new Set(),
          activeOBs: new Set(),
          target: 0,
          achievement: 0,
          visitedShops: 0,
          productiveShops: 0,
        };
      }
      if (h.ob_id) tsms[tsmName].totalOBs.add(h.ob_id);
      
      const target = CATEGORIES.reduce((sum: number, cat: string) => {
        const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
        return sum + (Number(h[targetKey]) || 0);
      }, 0);
      tsms[tsmName].target += target || Number(h.target_ctn) || 0;
    });

    // Process sales data
    monthStats.forEach((s: any) => {
      if (s.isTSMEntry) return; // Exclude TSM direct entries
      
      const tsmName = s.tsm || 'Unassigned';
      if (!tsms[tsmName]) return; // Only process TSMs visible to user

      const orderData = typeof s.order_data === 'string' ? JSON.parse(s.order_data) : (s.order_data || {});
      const sales = SKUS.reduce((sum: number, sku: any) => {
        const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
        const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
        return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
      }, 0);

      tsms[tsmName].achievement += sales;
      tsms[tsmName].visitedShops += (Number(s.visited_shops) || 0);
      tsms[tsmName].productiveShops += (Number(s.productive_shops) || 0);
      if (s.visit_type !== 'Absent') {
        tsms[tsmName].activeOBs.add(s.ob_contact);
      }
    });

    const today = new Date();
    const isCurrentMonth = selectedMonth === today.toISOString().slice(0, 7);
    const dayOfMonth = isCurrentMonth ? today.getDate() : new Date(parseInt(selectedMonth.slice(0, 4)), parseInt(selectedMonth.slice(5, 7)), 0).getDate();
    const daysInMonth = new Date(parseInt(selectedMonth.slice(0, 4)), parseInt(selectedMonth.slice(5, 7)), 0).getDate();

    return Object.values(tsms).map(tsm => {
      const achievementPerc = tsm.target > 0 ? (tsm.achievement / tsm.target) * 100 : 0;
      const rpd = dayOfMonth > 0 ? tsm.achievement / dayOfMonth : 0;
      const projectedSales = rpd * daysInMonth;
      const avgSales = tsm.activeOBs.size > 0 ? tsm.achievement / tsm.activeOBs.size : 0;
      const productivity = tsm.visitedShops > 0 ? (tsm.productiveShops / tsm.visitedShops) * 100 : 0;

      return {
        ...tsm,
        totalOBs: tsm.totalOBs.size,
        activeOBs: tsm.activeOBs.size,
        achievementPerc,
        rpd,
        projectedSales,
        avgSales,
        productivity
      };
    }).filter(tsm => tsm.totalOBs > 0 || tsm.achievement > 0);
  }, [history, hierarchy, selectedMonth, userRole, userName, userRegion, CATEGORIES, SKUS]);

  const sortedData = useMemo(() => {
    let sortableItems = [...tsmPerformanceData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [tsmPerformanceData, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const obPerformanceData = useMemo(() => {
    const monthStats = history.filter((h: any) => h.date.startsWith(selectedMonth));
    const obs: Record<string, any> = {};

    // Filter hierarchy based on role
    const filteredHierarchy = hierarchy.filter((h: any) => {
      if (userRole === 'Admin' || userRole === 'Super Admin' || userRole === 'Director' || userRole === 'NSM') return true;
      if (userRole === 'RSM' || userRole === 'SC') return (h.territory_region || '').trim().toLowerCase() === (userRegion || '').trim().toLowerCase();
      if (userRole === 'TSM' || userRole === 'ASM') return (h.asm_tsm_name || '').trim().toLowerCase() === (userName || '').trim().toLowerCase();
      return false;
    });

    // Initialize OBs from hierarchy
    filteredHierarchy.forEach((h: any) => {
      const obContact = h.ob_id || 'Unassigned';
      if (!obs[obContact]) {
        obs[obContact] = {
          region: h.territory_region || 'Unassigned',
          rsm: h.rsm_name || 'Unassigned',
          tsmName: h.asm_tsm_name || 'Unassigned',
          town: h.town || 'Unassigned',
          obName: h.ob_name || 'Unassigned',
          obContact: obContact,
          offDay: h.off_day || 'Sunday',
          brands: {}
        };
        CATEGORIES.forEach((cat: string) => {
          const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
          obs[obContact].brands[cat] = {
            target: Number(h[targetKey]) || 0,
            achievement: 0
          };
        });
      } else {
        CATEGORIES.forEach((cat: string) => {
          const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
          obs[obContact].brands[cat].target += Number(h[targetKey]) || 0;
        });
      }
    });

    // Process sales data
    monthStats.forEach((s: any) => {
      if (s.isTSMEntry) return; // Exclude TSM direct entries
      
      const obContact = s.ob_contact;
      if (!obs[obContact]) return; // Only process OBs visible to user

      const orderData = typeof s.order_data === 'string' ? JSON.parse(s.order_data) : (s.order_data || {});
      
      CATEGORIES.forEach((cat: string) => {
        const catSkus = SKUS.filter((sku: any) => sku.category === cat);
        const sales = catSkus.reduce((sum: number, sku: any) => {
          const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
          return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
        }, 0);
        obs[obContact].brands[cat].achievement += sales;
      });
    });

    const today = new Date();
    const isCurrentMonth = selectedMonth === today.toISOString().slice(0, 7);
    const dayOfMonth = isCurrentMonth ? today.getDate() : new Date(parseInt(selectedMonth.slice(0, 4)), parseInt(selectedMonth.slice(5, 7)), 0).getDate();
    const daysInMonth = new Date(parseInt(selectedMonth.slice(0, 4)), parseInt(selectedMonth.slice(5, 7)), 0).getDate();

    const result: any[] = [];
    // Define getWorkingDays manually here if config isn't available, or just ignore working day exact stats since this is just a quick table.

    Object.values(obs).forEach((ob: any) => {
      let obTotalTarget = 0;
      let obTotalAchievement = 0;
      CATEGORIES.forEach((cat: string) => {
        obTotalTarget += ob.brands[cat].target;
        obTotalAchievement += ob.brands[cat].achievement;
      });
      const obTotalPerc = obTotalTarget > 0 ? (obTotalAchievement / obTotalTarget) * 100 : 0;

      CATEGORIES.forEach((cat: string) => {
        const brandData = ob.brands[cat];
        if (brandData.target > 0 || brandData.achievement > 0) {
          const achievementPerc = brandData.target > 0 ? (brandData.achievement / brandData.target) * 100 : 0;
          const avg = dayOfMonth > 0 ? brandData.achievement / dayOfMonth : 0;
          const rpd = (daysInMonth - dayOfMonth) > 0 ? Math.max(0, (brandData.target - brandData.achievement) / (daysInMonth - dayOfMonth)) : 0;
          const brandName = cat + (cat === 'DWB' || cat === 'Match' ? ' (Ctns)' : ' (Bags)');

          result.push({
            region: ob.region,
            rsm: ob.rsm,
            tsmName: ob.tsmName,
            town: ob.town,
            obName: ob.obName,
            obContact: ob.obContact,
            obTotalPerc,
            brand: brandName,
            brandRaw: cat,
            target: brandData.target,
            achievement: brandData.achievement,
            achievementPerc,
            avg,
            rpd
          });
        }
      });
    });

    return result;
  }, [history, hierarchy, selectedMonth, userRole, userName, userRegion, CATEGORIES, SKUS]);

  const filteredObData = useMemo(() => {
    return obPerformanceData.filter(row => {
      if (obFilterRegion !== 'All' && row.region !== obFilterRegion && row.rsm !== obFilterRegion) return false;
      if (obFilterTSM !== 'All' && row.tsmName !== obFilterTSM) return false;
      if (obFilterBrand !== 'All' && row.brandRaw !== obFilterBrand) return false;
      return true;
    });
  }, [obPerformanceData, obFilterRegion, obFilterTSM, obFilterBrand]);

  const sortedObData = useMemo(() => {
    let sortableItems = [...filteredObData];
    if (obSortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Always group by OB first
        if (a.obContact !== b.obContact) {
          // Sort OBs by their overall performance
          if (a.obTotalPerc !== b.obTotalPerc) {
            return obSortConfig.direction === 'asc' ? a.obTotalPerc - b.obTotalPerc : b.obTotalPerc - a.obTotalPerc;
          }
          return a.obName.localeCompare(b.obName);
        }

        // Within the same OB, sort by the selected column
        if (a[obSortConfig.key] < b[obSortConfig.key]) {
          return obSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[obSortConfig.key] > b[obSortConfig.key]) {
          return obSortConfig.direction === 'asc' ? 1 : -1;
        }
        
        // Fallback to brand order
        return CATEGORIES.indexOf(a.brandRaw) - CATEGORIES.indexOf(b.brandRaw);
      });
    }
    return sortableItems;
  }, [filteredObData, obSortConfig, CATEGORIES]);

  const requestObSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (obSortConfig && obSortConfig.key === key && obSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setObSortConfig({ key, direction });
  };

  const uniqueRegions = useMemo(() => Array.from(new Set(obPerformanceData.map(d => d.region))).sort(), [obPerformanceData]);
  const uniqueTSMs = useMemo(() => Array.from(new Set(obPerformanceData.map(d => d.tsmName))).sort(), [obPerformanceData]);

  const handleTSMClick = (tsmName: string) => {
    // We need to set some global filter for command center, but for now we can just navigate
    // A better way is to pass the TSM name to the command center view.
    // Since we don't have a global state for selected TSM in command center, 
    // we might need to add it or just set view to command_center.
    // Let's set a local storage item or dispatch an event that command center can pick up.
    localStorage.setItem('cc_selected_tsm', tsmName);
    setView('command_center');
  };

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-800">Target vs Achievement</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Summary</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-sm font-bold text-slate-700 bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-seablue/20"
          />
          <button onClick={onRefresh} disabled={isSyncing} className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100" onClick={() => requestSort('month')}>Month</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100" onClick={() => requestSort('region')}>Region</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100" onClick={() => requestSort('rsm')}>RSM</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100" onClick={() => requestSort('tsmName')}>TSM Name</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestSort('totalOBs')}>Total OBs</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestSort('activeOBs')}>Active OBs</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestSort('target')}>Target</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestSort('achievement')}>Achievement</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestSort('achievementPerc')}>Ach %</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestSort('rpd')}>RPD</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestSort('avgSales')}>Avg Sales</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestSort('projectedSales')}>Proj. Sales</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestSort('productivity')}>Prod %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => handleTSMClick(row.tsmName)}>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600">{row.month}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600">{row.region}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600">{row.rsm}</td>
                  <td className="px-4 py-3 text-xs font-bold text-seablue hover:underline">{row.tsmName}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right">{row.totalOBs}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right">{row.activeOBs}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right">{row.target.toFixed(0)}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">{row.achievement.toFixed(1)}</td>
                  <td className={`px-4 py-3 text-xs font-bold text-right ${row.achievementPerc >= 100 ? 'text-emerald-600' : row.achievementPerc >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {row.achievementPerc.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right">{row.rpd.toFixed(1)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right">{row.avgSales.toFixed(1)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right">{row.projectedSales.toFixed(1)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right">{row.productivity.toFixed(1)}%</td>
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-sm text-slate-500">No Target vs Achievement data found for the selected month.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-800">Target vs Achievement (Brand-wise)</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={obFilterRegion} onChange={(e) => setObFilterRegion(e.target.value)} className="text-xs font-bold text-slate-700 bg-slate-50 border-none rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-seablue/20">
              <option value="All">All Regions</option>
              {uniqueRegions.map(r => <option key={r as string} value={r as string}>{r as string}</option>)}
            </select>
            <select value={obFilterTSM} onChange={(e) => setObFilterTSM(e.target.value)} className="text-xs font-bold text-slate-700 bg-slate-50 border-none rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-seablue/20">
              <option value="All">All TSMs</option>
              {uniqueTSMs.map(t => <option key={t as string} value={t as string}>{t as string}</option>)}
            </select>
            <select value={obFilterBrand} onChange={(e) => setObFilterBrand(e.target.value)} className="text-xs font-bold text-slate-700 bg-slate-50 border-none rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-seablue/20">
              <option value="All">All Brands</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100" onClick={() => requestObSort('region')}>RSM or Region</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100" onClick={() => requestObSort('tsmName')}>TSM</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100" onClick={() => requestObSort('obName')}>OB</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100" onClick={() => requestObSort('town')}>Town</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100" onClick={() => requestObSort('brand')}>Brand</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestObSort('target')}>Target</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestObSort('achievement')}>Achievement</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestObSort('achievementPerc')}>%</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestObSort('avg')}>Avg</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100" onClick={() => requestObSort('rpd')}>RPD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedObData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium text-slate-600">{row.rsm !== 'Unassigned' ? row.rsm : row.region}</td>
                  <td className="px-4 py-3 text-xs font-bold text-seablue">{row.tsmName}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600">{row.obName}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600">{row.town}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600">{row.brand}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right">{row.target.toFixed(0)}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">{row.achievement.toFixed(1)}</td>
                  <td className={`px-4 py-3 text-xs font-bold text-right ${row.achievementPerc >= 80 ? 'text-emerald-600' : row.achievementPerc >= 50 ? 'text-amber-500' : 'text-red-600'}`}>
                    {row.achievementPerc.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right">{row.avg.toFixed(1)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right">{row.rpd.toFixed(1)}</td>
                </tr>
              ))}
              {sortedObData.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">No Target vs Achievement data found for the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ReportsView = ({ history, obAssignments, hierarchy, tsmList, appConfig, getPSTDate, SKUS, CATEGORIES, userRole, userName, userRegion, userContact, onRefresh, isSyncing, selectedMonth, setSelectedMonth }: any) => {
  const currentMonth = selectedMonth || getPSTDate().slice(0, 7);
  const today = getPSTDate();
  const dayOfMonth = parseInt(today.split('-')[2]);
  const normalizedRole = (userRole || '').trim().toUpperCase();
  const isStaff = ['ADMIN', 'SUPER ADMIN', 'TSM', 'ASM', 'RSM', 'NSM', 'DIRECTOR', 'SC', 'OB'].includes(normalizedRole);
  
  const [selectedAnalysisRoute, setSelectedAnalysisRoute] = useState('');
  const [selectedAnalysisOB, setSelectedAnalysisOB] = useState('');
  const [matrixView, setMatrixView] = useState('Total');
  const [targetView, setTargetView] = useState('Brand');
  const [selectedAlertDetail, setSelectedAlertDetail] = useState<any>(null);

  // Hierarchy Filters for Reports
  const [topCategoryFilter, setTopCategoryFilter] = useState('All');
  const [topBrandFilter, setTopBrandFilter] = useState('All');
  const [filterLevel, setFilterLevel] = useState('National');
  const [filterValue, setFilterValue] = useState('');

  const visibleFilterLevels = useMemo(() => {
    if (userRole === 'Admin' || userRole === 'Super Admin') return ['National', 'Region', 'Town', 'TSM', 'OB'];
    if (userRole === 'Director') return ['National', 'NSM', 'RSM', 'TSM', 'OB'];
    if (userRole === 'NSM') return ['National', 'RSM', 'TSM', 'OB'];
    if (userRole === 'RSM' || userRole === 'SC') return ['National', 'Town', 'TSM', 'OB'];
    if (userRole === 'TSM' || userRole === 'ASM') return ['National', 'OB'];
    return ['National'];
  }, [userRole]);

  const filterOptions = useMemo(() => {
    // Use hierarchy as the primary source for filter options as it's more complete
    const options: any = {
      Region: Array.from(new Set(hierarchy.map((h: any) => h.territory_region))).filter(Boolean).sort(),
      Town: Array.from(new Set(hierarchy.map((h: any) => h.town_name))).filter(Boolean).sort(),
      TSM: Array.from(new Set(hierarchy.map((h: any) => h.asm_tsm_name))).filter(Boolean).sort(),
      NSM: Array.from(new Set(hierarchy.map((h: any) => h.nsm_name))).filter(Boolean).sort(),
      RSM: Array.from(new Set(hierarchy.map((h: any) => h.rsm_name))).filter(Boolean).sort(),
      SC: Array.from(new Set(hierarchy.map((h: any) => h.sc_name))).filter(Boolean).sort(),
      OB: Array.from(new Set(hierarchy.map((h: any) => JSON.stringify({ name: h.ob_name, contact: h.ob_id }))))
        .map((s: any) => JSON.parse(s))
        .filter(ob => ob.name && ob.contact)
        .sort((a: any, b: any) => a.name.localeCompare(b.name))
    };
    return options;
  }, [hierarchy]);

  const filteredOBs = useMemo(() => {
    let obs = obAssignments;
    const role = (userRole || '').trim().toUpperCase();
    const name = (userName || '').trim().toLowerCase();
    const region = (userRegion || '').trim().toLowerCase();
    const contact = (userContact || '').trim();

    // Initial role-based filtering
    if (role === 'DIRECTOR') {
      obs = obs.filter((ob: any) => (ob.director || '').trim().toLowerCase() === name);
    } else if (role === 'NSM') {
      obs = obs.filter((ob: any) => (ob.nsm || '').trim().toLowerCase() === name);
    } else if (role === 'RSM' || role === 'SC') {
      obs = obs.filter((ob: any) => 
        (ob.region || '').trim().toLowerCase() === region || 
        (ob.rsm || '').trim().toLowerCase() === name || 
        (ob.sc || '').trim().toLowerCase() === name
      );
    } else if (role === 'TSM' || role === 'ASM') {
      obs = obs.filter((ob: any) => (ob.tsm || '').trim().toLowerCase() === name);
    } else if (role === 'OB') {
      obs = obs.filter((ob: any) => (ob.contact || '').trim() === contact);
    }
    
    // Apply Hierarchy Filters (Level) using the hierarchy data for better accuracy
    if (filterLevel !== 'National' && filterValue) {
      obs = obs.filter((ob: any) => {
        const h = hierarchy?.find((h: any) => h.ob_id === ob.contact);
        if (!h) return false;
        
        if (filterLevel === 'Region') return h.territory_region === filterValue;
        if (filterLevel === 'Town') return h.town_name === filterValue;
        if (filterLevel === 'TSM') return h.asm_tsm_name === filterValue;
        if (filterLevel === 'NSM') return h.nsm_name === filterValue;
        if (filterLevel === 'RSM') return h.rsm_name === filterValue;
        if (filterLevel === 'SC') return h.sc_name === filterValue;
        if (filterLevel === 'OB') return h.ob_id === filterValue;
        return true;
      });
    }

    // Exclude Test OBs from reports, but keep TSM entries functional as requested
    return obs.filter((ob: any) => !ob.name.toLowerCase().includes('test')).map((ob: any) => {
      const obHierarchy = hierarchy?.find((h: any) => h.ob_id === ob.contact);
      const targets: Record<string, number> = {};
      if (obHierarchy) {
        let totalSpecificTarget = 0;
        CATEGORIES.forEach((cat: string) => {
          const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
          const val = Number(obHierarchy[targetKey]) || 0;
          targets[cat] = val;
          totalSpecificTarget += val;
        });
        
        if (totalSpecificTarget === 0) {
          const fallbackTarget = (Number(obHierarchy.target_ctn) || 0) / CATEGORIES.length;
          CATEGORIES.forEach((cat: string) => {
            targets[cat] = fallbackTarget;
          });
        }
      }
      return { ...ob, targets, target_ctn: obHierarchy?.target_ctn || ob.target_ctn || 0 };
    });
  }, [obAssignments, hierarchy, userRole, userRegion, userName, userContact, filterLevel, filterValue]);

  const reportsMonthStats = useMemo(() => {
    return history.filter((h: any) => h.date.startsWith(currentMonth));
  }, [history, currentMonth]);

  const alerts = useMemo(() => {
    const productivityList: any[] = [];
    const inactivityList: any[] = [];
    
    filteredOBs.forEach((ob: any) => {
      const obStats = reportsMonthStats.filter((s: any) => s.ob_contact === ob.contact);
      const visited = obStats.reduce((sum: number, s: any) => sum + s.visited_shops, 0);
      const productive = obStats.reduce((sum: number, s: any) => sum + s.productive_shops, 0);
      const productivity = visited > 0 ? (productive / visited) * 100 : 0;
      
      if (visited > 50 && productivity < 20) {
        productivityList.push({
          type: 'Low Productivity',
          title: ob.name,
          contact: ob.contact,
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
          inactivityList.push({
            type: 'Inactivity',
            title: ob.name,
            contact: ob.contact,
            desc: `No submission for ${diffDays} days`,
            severity: 'critical'
          });
        }
      } else {
        // No submissions at all this month
        inactivityList.push({
          type: 'No Activity',
          title: ob.name,
          contact: ob.contact,
          desc: `No submissions recorded for ${currentMonth}`,
          severity: 'critical'
        });
      }
    });
    return { productivityAlerts: productivityList, inactivityAlerts: inactivityList };
  }, [filteredOBs, reportsMonthStats, getPSTDate, currentMonth]);

  const [routeAnalysisData, setRouteAnalysisData] = useState<any[]>([]);
  const [isLoadingRouteAnalysis, setIsLoadingRouteAnalysis] = useState(false);

  useEffect(() => {
    if (!selectedAnalysisOB || !selectedAnalysisRoute) {
      setRouteAnalysisData([]);
      return;
    }

    const fetchRouteAnalysis = async () => {
      setIsLoadingRouteAnalysis(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`/api/admin/route-analysis?ob_contact=${encodeURIComponent(selectedAnalysisOB)}&route=${encodeURIComponent(selectedAnalysisRoute)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const processed = data.reverse().map((h: any) => {
            const orderData = typeof h.order_data === 'string' ? JSON.parse(h.order_data) : (h.order_data || {});
            const brandSales: Record<string, number> = {};
            let totalSales = 0;
            CATEGORIES.forEach((cat: string) => {
              const sales = SKUS.filter((s: any) => s.category === cat).reduce((sum: number, sku: any) => {
                const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
              }, 0);
              brandSales[cat] = sales;
              
              // Apply hierarchy filters to totalSales
              let isIncluded = true;
              if (topBrandFilter !== 'All' && cat !== topBrandFilter) isIncluded = false;
              if (topCategoryFilter !== 'All') {
                const brandsInGroup = BRAND_GROUPS[topCategoryFilter] || [];
                if (!brandsInGroup.includes(cat)) isIncluded = false;
              }
              if (isIncluded) totalSales += sales;
            });
            return {
              date: h.date,
              visited: h.visited_shops,
              productive: h.productive_shops,
              totalSales,
              brandSales,
              visit_type: h.visit_type,
              ...brandSales // Spread brandSales for Recharts Line dataKey
            };
          });
          setRouteAnalysisData(processed);
        }
      } catch (err) {
        console.error("Failed to fetch route analysis", err);
      } finally {
        setIsLoadingRouteAnalysis(false);
      }
    };

    fetchRouteAnalysis();
  }, [selectedAnalysisOB, selectedAnalysisRoute, CATEGORIES, SKUS, topCategoryFilter, topBrandFilter]);

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

      {userRole !== 'OB' && (
        <>

      {/* OB Date-wise Sales Matrix (MTD) */}
      <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

          {/* Hierarchy Filters */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category:</span>
              <select 
                value={topCategoryFilter} 
                onChange={(e) => { setTopCategoryFilter(e.target.value); setTopBrandFilter('All'); }}
                className="bg-transparent text-[10px] font-black text-seablue uppercase focus:outline-none"
              >
                <option value="All">All Categories</option>
                {BRAND_GROUP_NAMES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Brand:</span>
              <select 
                value={topBrandFilter} 
                onChange={(e) => setTopBrandFilter(e.target.value)}
                className="bg-transparent text-[10px] font-black text-seablue uppercase focus:outline-none"
              >
                <option value="All">All Brands</option>
                {(topCategoryFilter === 'All' ? CATEGORIES : BRAND_GROUPS[topCategoryFilter] || []).map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Level:</span>
              <select 
                value={filterLevel} 
                onChange={(e) => { setFilterLevel(e.target.value as any); setFilterValue(''); }}
                className="bg-transparent text-[10px] font-black text-seablue uppercase focus:outline-none"
              >
                {visibleFilterLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            {filterLevel !== 'National' && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select:</span>
                <select 
                  value={filterValue} 
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="bg-transparent text-[10px] font-black text-seablue uppercase focus:outline-none max-w-[150px]"
                >
                  <option value="">All {filterLevel}s</option>
                  {filterLevel === 'OB' ? (
                    (filterOptions['OB'] as any[]).map(ob => (
                      <option key={ob.contact} value={ob.contact}>{ob.name} ({ob.contact})</option>
                    ))
                  ) : (
                    (filterOptions[filterLevel as keyof typeof filterOptions] || []).map(opt => (
                      <option key={opt as string} value={opt as string}>{opt as string}</option>
                    ))
                  )}
                </select>
              </div>
            )}
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
                      const daySales = dayOrders.reduce((acc, h) => {
                        const data = h.order_data || {};
                        
                        // Apply Hierarchy Filters (Category/Brand)
                        let targetSKUs = SKUS;
                        if (topBrandFilter !== 'All') {
                          targetSKUs = SKUS.filter(s => s.category === topBrandFilter);
                        } else if (topCategoryFilter !== 'All') {
                          const brandsInGroup = BRAND_GROUPS[topCategoryFilter] || [];
                          targetSKUs = SKUS.filter(s => brandsInGroup.includes(s.category));
                        }

                        // Further filter based on matrixView
                        if (matrixView !== 'Total') {
                          if (matrixView.startsWith('cat_')) {
                            const categoryName = matrixView.replace('cat_', '');
                            const brandsInGroup = BRAND_GROUPS[categoryName] || [];
                            targetSKUs = targetSKUs.filter(s => brandsInGroup.includes(s.category));
                          } else {
                            targetSKUs = targetSKUs.filter(s => s.category === matrixView);
                          }
                        }

                        targetSKUs.forEach(sku => {
                          const item = data[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                          const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                          const val = (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                          if (sku.unit === 'Bags') acc.bags += val;
                          else acc.ctns += val;
                        });
                        return acc;
                      }, { bags: 0, ctns: 0 });

                      total += (daySales.bags + daySales.ctns);
                      const hasRR = dayOrders.some((h: any) => h.visit_type === 'RR');
                      const hasNormal = dayOrders.some((h: any) => h.visit_type !== 'RR' && h.visit_type !== 'Absent');
                      const cellBg = hasRR ? 'bg-yellow-100' : (hasNormal ? 'bg-green-50' : '');
                      const hasBags = daySales.bags > 0;
                      const hasCtns = daySales.ctns > 0;

                      return (
                        <td key={`${ob.contact}-${day}-${dIdx}`} className={`px-1 py-2 text-center text-[9px] border-r border-slate-100/30 font-mono ${cellBg} min-w-[45px]`}>
                          {hasBags && <p className="font-black text-emerald-600 leading-none">{daySales.bags.toFixed(1)}<span className="text-[7px] opacity-60 ml-0.5">B</span></p>}
                          {hasCtns && <p className="font-black text-seablue leading-none mt-0.5">{daySales.ctns.toFixed(1)}<span className="text-[7px] opacity-60 ml-0.5">C</span></p>}
                          {!hasBags && !hasCtns && <span className="text-slate-200">-</span>}
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

      {/* Route Analysis Section */}
      <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
              <History className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              {selectedAnalysisOB && (
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                  National &gt; {filteredOBs.find((ob: any) => ob.contact === selectedAnalysisOB)?.region || 'N/A'} &gt; {filteredOBs.find((ob: any) => ob.contact === selectedAnalysisOB)?.town || 'N/A'}
                </p>
              )}
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Route Analysis (Last 16 Visits)</h3>
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
        {isLoadingRouteAnalysis ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-seablue animate-spin" />
          </div>
        ) : routeAnalysisData && routeAnalysisData.length > 0 ? (
          <div className="space-y-6">
            <div className="px-6 pt-6">
              <div className="h-48 w-full min-h-[256px]">
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
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px', color: '#1e3a8a' }} />
                    {CATEGORIES.map((cat, idx) => {
                      return (
                        <Line 
                          key={cat}
                          type="monotone" 
                          dataKey={cat} 
                          stroke={CATEGORY_COLORS[cat]} 
                          strokeWidth={2} 
                          dot={{ r: 3, fill: CATEGORY_COLORS[cat], strokeWidth: 1, stroke: '#fff' }} 
                          activeDot={{ r: 5, strokeWidth: 0 }} 
                          name={`${cat} (Bags)`} 
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4 whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Visited</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Productive</th>
                  {CATEGORIES
                    .filter(cat => {
                      if (topBrandFilter !== 'All') return cat === topBrandFilter;
                      if (topCategoryFilter !== 'All') {
                        const brandsInGroup = BRAND_GROUPS[topCategoryFilter] || [];
                        return brandsInGroup.includes(cat);
                      }
                      return true;
                    })
                    .map(cat => <th key={cat} className="px-6 py-4 text-center whitespace-nowrap">{cat}</th>)}
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
                    {CATEGORIES
                      .filter(cat => {
                        if (topBrandFilter !== 'All') return cat === topBrandFilter;
                        if (topCategoryFilter !== 'All') {
                          const brandsInGroup = BRAND_GROUPS[topCategoryFilter] || [];
                          return brandsInGroup.includes(cat);
                        }
                        return true;
                      })
                      .map(cat => (
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
                {CATEGORIES
                  .filter(cat => {
                    if (topBrandFilter !== 'All') return cat === topBrandFilter;
                    if (topCategoryFilter !== 'All') {
                      const brandsInGroup = BRAND_GROUPS[topCategoryFilter] || [];
                      return brandsInGroup.includes(cat);
                    }
                    return true;
                  })
                  .map(cat => <th key={cat} className="px-6 py-3 text-center">{cat}</th>)}
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
                        const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
                        return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
                      }, 0);
                    }, 0);
                  });

                  return (
                    <tr key={`${ob.contact}-${route}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{route}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{ob.name}</td>
                      <td className="px-6 py-4 text-center text-[10px] font-mono text-slate-600">{t}/{v}/{p}</td>
                      {CATEGORIES
                        .filter(cat => {
                          if (topBrandFilter !== 'All') return cat === topBrandFilter;
                          if (topCategoryFilter !== 'All') {
                            const brandsInGroup = BRAND_GROUPS[topCategoryFilter] || [];
                            return brandsInGroup.includes(cat);
                          }
                          return true;
                        })
                        .map(cat => (
                          <td key={cat} className="px-6 py-4 text-center text-xs font-mono text-slate-500">{brandSales[cat].toFixed(1)}</td>
                        ))}
                      <td className="px-6 py-4 text-right text-xs font-black text-seablue">
                        {Object.entries(brandSales)
                          .filter(([cat]) => {
                            if (topBrandFilter !== 'All') return cat === topBrandFilter;
                            if (topCategoryFilter !== 'All') {
                              const brandsInGroup = BRAND_GROUPS[topCategoryFilter] || [];
                              return brandsInGroup.includes(cat);
                            }
                            return true;
                          })
                          .reduce((a, [_, b]) => a + b, 0).toFixed(1)}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
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
              {(targetView === 'Brand' ? CATEGORIES : BRAND_GROUP_NAMES)
                .filter(cat => {
                  if (topBrandFilter !== 'All') return cat === topBrandFilter;
                  if (topCategoryFilter !== 'All') {
                    if (targetView === 'Brand') {
                      const brandsInGroup = BRAND_GROUPS[topCategoryFilter] || [];
                      return brandsInGroup.includes(cat);
                    } else {
                      return cat === topCategoryFilter;
                    }
                  }
                  return true;
                })
                .map(cat => {
                let catTarget = 0;
                let catAch = 0;
                let unit = 'Ctns';

                if (targetView === 'Brand') {
                  unit = SKUS.find(s => s.category === cat)?.unit || 'Ctns';
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
                  unit = SKUS.find(s => brandsInGroup.includes(s.category))?.unit || 'Ctns';
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
                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500 font-mono whitespace-nowrap">{catTarget.toFixed(1)} <span className="text-[8px] opacity-60">{unit}</span></td>
                    <td className="px-6 py-4 text-center text-xs font-black text-seablue font-mono whitespace-nowrap">{catAch.toFixed(1)} <span className="text-[8px] opacity-60">{unit}</span></td>
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

      {/* Irregular Activities & Performance Gaps */}
      <section className="card-clean bg-slate-50 border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Irregular Activities & Performance Gaps</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Critical Alerts for {currentMonth}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedAlertDetail({ category: 'Productivity', title: 'Productivity Issues', alerts: alerts.productivityAlerts })}
              className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all flex items-center gap-2"
            >
              <TrendingDown className="w-3 h-3" />
              Productivity ({alerts.productivityAlerts.length})
            </button>
            <button 
              onClick={() => setSelectedAlertDetail({ category: 'Inactivity', title: 'Inactivity Issues', alerts: alerts.inactivityAlerts })}
              className="px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all flex items-center gap-2"
            >
              <Clock className="w-3 h-3" />
              Inactivity ({alerts.inactivityAlerts.length})
            </button>
          </div>
        </div>
      </section>

      {/* Alert Detail Modal */}
      <AnimatePresence>
        {selectedAlertDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className={`p-6 flex items-center justify-between ${selectedAlertDetail.category === 'Productivity' ? 'bg-rose-500' : 'bg-amber-500'} text-white`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {selectedAlertDetail.category === 'Productivity' ? <TrendingDown className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">{selectedAlertDetail.title}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{selectedAlertDetail.category} Issues List</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAlertDetail(null)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="p-4">Region</th>
                        <th className="p-4">TSM</th>
                        <th className="p-4">Town</th>
                        <th className="p-4">OB Name</th>
                        <th className="p-4">Route</th>
                        <th className="p-4">Issue</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] font-bold text-slate-600">
                      {(selectedAlertDetail.alerts || []).map((alert: any, i: number) => {
                        const h = hierarchy?.find((h: any) => h.ob_id === alert.contact || h.ob_name === alert.title);
                        return (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="p-4">{h?.territory_region || 'N/A'}</td>
                            <td className="p-4">{h?.asm_tsm_name || 'N/A'}</td>
                            <td className="p-4">{h?.town_name || 'N/A'}</td>
                            <td className="p-4 text-slate-800 font-black">{alert.title}</td>
                            <td className="p-4">{h?.route || 'N/A'}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${selectedAlertDetail.category === 'Productivity' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                                {alert.desc}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedAlertDetail(null)}
                  className={`w-full py-4 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-lg transition-all ${selectedAlertDetail.category === 'Productivity' ? 'bg-rose-500 shadow-rose-200 hover:bg-rose-600' : 'bg-amber-500 shadow-amber-200 hover:bg-amber-600'}`}
                >
                  Close Detail View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
};



const WelcomeScreen = ({ user, stats, hierarchy, logo, onEnter, isLoading, timeGone, userEmail, stockHistory = [] }: any) => {
  const [expandedObId, setExpandedObId] = useState<string | null>(null);

  const kpiGroups = useMemo(() => {
    if (!stats || !hierarchy || isLoading) return null;

    const role = (user?.role || '').toUpperCase();
    const name = (user?.name || '').trim().toLowerCase();
    const contact = (user?.contact || '').trim();
    const currentMonth = getPSTDate().slice(0, 7);

    // Filter hierarchy for the user
    const userHierarchy = hierarchy.filter(h => {
      if (role === 'SUPER ADMIN' || role === 'ADMIN' || role === 'DIRECTOR' || role === 'NSM') return true;
      if (role === 'RSM' || role === 'SC') return (h.territory_region || '').trim().toLowerCase() === (user?.region || '').trim().toLowerCase();
      if (role === 'TSM' || role === 'ASM') return (h.asm_tsm_name || '').trim().toLowerCase() === name;
      if (role === 'OB') return h.ob_id === contact;
      return false;
    });

    // Filter stats for the user and current month
    const userStats = stats.filter(s => {
      // Month filter
      if (s.date?.slice(0, 7) !== currentMonth) return false;

      // For Admin roles, show all stats even if hierarchy is missing for some OBs
      const isAdmin = role === 'SUPER ADMIN' || role === 'ADMIN' || role === 'DIRECTOR' || role === 'NSM';
      if (isAdmin) return true;

      const h = hierarchy.find(h => h.ob_id === s.ob_contact);
      if (!h) return false;
      
      if (role === 'RSM' || role === 'SC') return (h.territory_region || '').trim().toLowerCase() === (user?.region || '').trim().toLowerCase();
      if (role === 'TSM' || role === 'ASM') return (h.asm_tsm_name || '').trim().toLowerCase() === name;
      if (role === 'OB') return s.ob_contact === contact;
      return false;
    });

    // Show individual brands instead of groups
    return CATEGORIES.map(brand => {
      // Calculate Target for this brand
      const target = userHierarchy.reduce((sum, h) => {
        const field = `target_${brand.toLowerCase().replace(/ /g, '_')}`;
        // If specific target field doesn't exist, use target_ctn split by categories
        const specificTarget = Number(h[field]);
        if (!isNaN(specificTarget) && specificTarget > 0) return sum + specificTarget;
        
        const totalTarget = Number(h.target_ctn) || 0;
        return sum + (totalTarget / CATEGORIES.length);
      }, 0);

      // Calculate Achievement and Productivity for this brand
      let groupVisited = 0;
      let groupProductive = 0;
      
      const achievement = userStats.reduce((sum, s) => {
        groupVisited += (Number(s.visited_shops) || 0);
        
        // Use category_productive_data for brand-wise productivity if available
        const prodData = s.category_productive_data || {};
        const catProd = (Number(prodData[brand]) || 0);
        groupProductive += catProd;

        // Ensure brandSales is populated correctly
        const bSales = s.brandSales || {};
        return sum + (Number(bSales[brand]) || 0);
      }, 0);

      const percentage = target > 0 ? (achievement / target) * 100 : 0;
      const remainingTarget = Math.max(0, target - achievement);
      const remainingDays = timeGone?.remaining || 0;
      const passedDays = timeGone?.passed || 1;
      const totalDays = timeGone?.total || 0;
      const requiredPerDay = remainingDays > 0 ? remainingTarget / remainingDays : 0;
      const dailyAvg = achievement / passedDays;
      const productivity = groupVisited > 0 ? (groupProductive / groupVisited) * 100 : 0;

      // Run-Rate Forecasting
      const projectedAchievement = dailyAvg * totalDays;
      const projectedPercentage = target > 0 ? (projectedAchievement / target) * 100 : 0;

      return {
        name: brand,
        target,
        achievement,
        percentage,
        remainingTarget,
        remainingDays,
        requiredPerDay,
        dailyAvg,
        productivity,
        visited: groupVisited,
        productive: groupProductive,
        projectedAchievement,
        projectedPercentage
      };
    });
  }, [user, stats, hierarchy, isLoading, timeGone]);

  const obStockHealth = useMemo(() => {
    if (!stockHistory || !hierarchy || isLoading) return null;
    const role = (user?.role || '').toUpperCase();
    if (role !== 'TSM' && role !== 'ASM') return null;

    const name = (user?.name || '').trim().toLowerCase();
    if (!name) return null;

    // Get all distributors under this TSM/ASM
    const myDistributors = Array.from(new Set(hierarchy
      .filter(h => (h.asm_tsm_name || '').trim().toLowerCase() === name)
      .map(h => h.distributor_town)
    )).filter(d => d);

    return myDistributors.map(distName => {
      // Find latest stock for this distributor
      const distStocks = [...stockHistory]
        .filter(s => s.distributor === distName)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const latest = distStocks[0];
      if (!latest) return { name: distName, status: 'No Data', items: {} };

      let items = {};
      try {
        items = typeof latest.stocks === 'string' ? JSON.parse(latest.stocks) : (latest.stocks || {});
      } catch (e) {
        console.error("Error parsing stocks for", distName, e);
      }
      
      // Simple health check: if any key SKU is 0, it's "Low"
      const lowStockItems = Object.entries(items)
        .filter(([skuId, data]: [string, any]) => Number(data.ctn || 0) <= 2) // Threshold: 2 cartons
        .map(([skuId]) => SKUS.find(s => s.id === skuId)?.name || skuId);

      return {
        name: distName,
        date: latest.date,
        status: lowStockItems.length > 0 ? 'Low Stock' : 'Healthy',
        lowStockItems,
        items
      };
    });
  }, [user, stockHistory, hierarchy, isLoading]);

  const livePulseData = useMemo(() => {
    if (!stats || isLoading) return null;
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
    const todayStats = stats.filter(s => s.date === today);
    
    // Sort by time descending
    const recentSubmissions = [...todayStats].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 5);

    const totalVisited = todayStats.reduce((sum, s) => sum + (Number(s.visited_shops) || 0), 0);
    const totalProductive = todayStats.reduce((sum, s) => sum + (Number(s.productive_shops) || 0), 0);

    return {
      totalVisited,
      totalProductive,
      recentSubmissions
    };
  }, [stats, isLoading]);

  const obWiseKpis = useMemo(() => {
    if (!stats || !hierarchy || isLoading) return null;
    const role = (user?.role || '').toUpperCase();
    if (role !== 'TSM' && role !== 'ASM') return null;

    const name = (user?.name || '').trim().toLowerCase();
    if (!name) return null;
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyStats = stats.filter(s => s.date.startsWith(currentMonth));

    // Get all OBs under this TSM/ASM, filtering out those with empty OB names
    const myOBs = hierarchy.filter(h => 
      (h.asm_tsm_name || '').trim().toLowerCase() === name &&
      (h.ob_name || '').trim() !== ''
    );
    
    const obIds = Array.from(new Set(myOBs.map(h => h.ob_id))).filter(id => id);

    return obIds.map(obId => {
      const obHierarchy = myOBs.filter(h => h.ob_id === obId);
      const obName = obHierarchy[0]?.ob_name || 'Unknown OB';
      const masterTotalShops = Number(obHierarchy[0]?.total_shops) || 50;
      
      const obStats = monthlyStats.filter(s => s.ob_contact === obId);
      const totalDays = timeGone?.total || 0;
      const passedDays = timeGone?.passed || 1;
      const remainingDays = Math.max(0, totalDays - passedDays);

      const groupKpis = BRAND_GROUP_NAMES.map(groupName => {
        const brandsInGroup = BRAND_GROUPS[groupName] || [];
        
        let target = obHierarchy.reduce((sum, h) => {
          return sum + brandsInGroup.reduce((s, brand) => {
            const field = `target_${brand.toLowerCase().replace(/ /g, '_')}`;
            return s + (Number(h[field]) || 0);
          }, 0);
        }, 0);

        if (target === 0) {
          target = obHierarchy.reduce((sum, h) => {
            const totalTarget = Number(h.target_ctn) || 0;
            return sum + (totalTarget * (brandsInGroup.length / CATEGORIES.length));
          }, 0);
        }

        let groupVisited = 0;
        let groupProductive = 0;

        const achievement = obStats.reduce((sum, s) => {
          groupVisited += (Number(s.visited_shops) || 0);
          const prodData = s.category_productive_data || {};
          brandsInGroup.forEach(brand => {
            groupProductive += (Number(prodData[brand]) || 0);
          });

          return sum + brandsInGroup.reduce((s2, brand) => s2 + (s.brandSales?.[brand] || 0), 0);
        }, 0);

        const percentage = target > 0 ? (achievement / target) * 100 : 0;
        const remainingTarget = Math.max(0, target - achievement);
        
        const requiredPerDay = remainingDays > 0 ? remainingTarget / remainingDays : 0;
        const dailyAvg = achievement / passedDays;
        const productivity = groupVisited > 0 ? (groupProductive / groupVisited) * 100 : 0;

        // Run-Rate Forecasting
        const projectedAchievement = dailyAvg * totalDays;
        const projectedPercentage = target > 0 ? (projectedAchievement / target) * 100 : 0;

        return {
          name: groupName,
          target,
          achievement,
          percentage,
          remainingTarget,
          remainingDays,
          requiredPerDay,
          dailyAvg,
          productivity,
          visited: groupVisited,
          productive: groupProductive,
          projectedAchievement,
          projectedPercentage
        };
      });

      // Compliance Tracking
      // Find the latest entry date for this OB
      const sortedObStats = [...obStats].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestStat = sortedObStats[0];
      const latestDate = latestStat ? latestStat.date : null;

      const visitedLatest = Number(latestStat?.visited_shops) || 0;
      const productiveLatest = Number(latestStat?.productive_shops) || 0;
      const skippedLatest = Math.max(0, masterTotalShops - visitedLatest);
      const complianceLatest = masterTotalShops > 0 ? (visitedLatest / masterTotalShops) * 100 : 0;
      const productivityLatest = visitedLatest > 0 ? (productiveLatest / visitedLatest) * 100 : 0;

      // At-Risk Flagging
      const isAtRisk = groupKpis.some(g => g.target > 0 && g.projectedPercentage < 85) || 
                       (latestStat && complianceLatest < 70);

      return {
        obId,
        obName,
        groupKpis,
        masterTotalShops,
        visitedToday: visitedLatest,
        productiveToday: productiveLatest,
        productivityToday: productivityLatest,
        skippedToday: skippedLatest,
        complianceToday: complianceLatest,
        isAtRisk,
        hasSubmittedToday: !!latestStat,
        latestDate
      };
    });
  }, [user, stats, hierarchy, isLoading, timeGone]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-6 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-4"
      >
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-seablue/5 rounded-full -mr-12 -mt-12" />
          <div className="flex justify-center mb-4 relative z-10">
            <div className={`bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-50 overflow-hidden ${logo ? 'h-16 px-3' : 'w-16 h-16'}`}>
              {logo ? (
                <img src={logo} alt="Logo" className="h-full w-auto object-contain py-1.5" />
              ) : (
                <div className="w-full h-full bg-seablue flex items-center justify-center">
                  <Logo className="text-white w-8 h-8" />
                </div>
              )}
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-xs font-black text-seablue uppercase tracking-[0.2em] mb-1">Welcome Back</h2>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{user?.name}</h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-[10px] font-black bg-slate-50 text-slate-600 px-2 py-1.5 rounded-lg uppercase tracking-widest border border-slate-100 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {user?.role}
              </span>
              <span className="text-[10px] font-black bg-slate-50 text-slate-600 px-2 py-1.5 rounded-lg uppercase tracking-widest border border-slate-100 flex items-center gap-1">
                <Store className="w-3 h-3" /> {user?.region || 'National'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Alerts */}
        {(obWiseKpis?.some(ob => ob.isAtRisk) || obStockHealth?.some(d => d.status === 'Low Stock')) && (
          <div className="grid grid-cols-2 gap-3">
            {obWiseKpis?.some(ob => ob.isAtRisk) && (
              <div className="bg-red-50 rounded-2xl p-3 border border-red-100 flex flex-col items-center text-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mb-1" />
                <span className="text-[10px] font-black text-red-700 uppercase">{obWiseKpis.filter(ob => ob.isAtRisk).length} OBs At Risk</span>
              </div>
            )}
            {obStockHealth?.some(d => d.status === 'Low Stock') && (
              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 flex flex-col items-center text-center">
                <PackageSearch className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-[10px] font-black text-amber-700 uppercase">{obStockHealth.filter(d => d.status === 'Low Stock').length} Low Stock</span>
              </div>
            )}
          </div>
        )}

        {/* Live Pulse (Compact) */}
        {livePulseData && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Field Pulse</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-base font-black text-seablue">{livePulseData.totalVisited} <span className="text-[9px] text-slate-400">VISITED</span></span>
                <span className="text-base font-black text-emerald-600">{livePulseData.totalProductive} <span className="text-[9px] text-slate-400">PROD</span></span>
              </div>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        )}

        {/* KPI Summary (Compact Grid) */}
        {kpiGroups ? (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">MTD Performance</h3>
              <span className="text-[10px] font-bold text-slate-400">{timeGone?.passed}/{timeGone?.total} Days</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {kpiGroups.map(group => (
                <div key={group.name} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-500 uppercase truncate mb-1">{group.name}</p>
                  <div className="flex items-end justify-between">
                    <span className={`text-base font-black ${group.percentage < 85 ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {group.percentage.toFixed(0)}%
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 mb-0.5">
                      {Math.round(group.achievement)}/{Math.round(group.target)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full ${group.percentage < 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${Math.min(100, group.percentage)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-seablue animate-spin" />
          </div>
        )}

        {/* Compact OB List for TSM/ASM */}
        {obWiseKpis && obWiseKpis.length > 0 && (
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Team Status</h3>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 no-scrollbar">
              {obWiseKpis.map(ob => (
                <div key={ob.obId} className={`flex flex-col p-2 rounded-xl border ${ob.isAtRisk ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedObId(expandedObId === ob.obId ? null : ob.obId)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[8px] font-black ${ob.isAtRisk ? 'bg-red-200 text-red-700' : 'bg-white text-slate-600 shadow-sm'}`}>
                        {ob.obId.slice(-2)}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-700 truncate max-w-[120px]">{ob.obName}</p>
                        <p className="text-[7px] font-bold text-slate-400 uppercase">{ob.visitedToday}/{ob.masterTotalShops} Visited</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className={`text-[9px] font-black ${ob.isAtRisk ? 'text-red-600' : 'text-emerald-600'}`}>
                          {ob.complianceToday.toFixed(0)}% Comp.
                        </p>
                        <p className="text-[7px] font-bold text-slate-400 uppercase">
                          {ob.groupKpis[0]?.projectedPercentage.toFixed(0)}% Proj.
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedObId === ob.obId ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedObId === ob.obId && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3 pt-3 border-t border-slate-200/50"
                      >
                        <div className="space-y-3">
                          {ob.groupKpis.map(kpi => (
                            <div key={kpi.name} className="bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
                              <p className="text-[9px] font-black text-slate-700 uppercase mb-1">{kpi.name}</p>
                              <div className="grid grid-cols-2 gap-2 text-[8px]">
                                <div>
                                  <span className="text-slate-400">Target:</span> <span className="font-bold">{Math.round(kpi.target)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Achieved:</span> <span className="font-bold">{Math.round(kpi.achievement)} ({kpi.percentage.toFixed(0)}%)</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">RPD:</span> <span className="font-bold">{Math.round(kpi.requiredPerDay)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Avg/Day:</span> <span className="font-bold">{Math.round(kpi.dailyAvg)}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-slate-400">Projected:</span> <span className="font-bold">{Math.round(kpi.projectedAchievement)} ({kpi.projectedPercentage.toFixed(0)}%)</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              let msg = `*Performance Analysis: ${ob.obName}*\n`;
                              msg += `Date: ${new Date().toLocaleDateString()}\n\n`;
                              ob.groupKpis.forEach(kpi => {
                                msg += `*${kpi.name}*\n`;
                                msg += `Target: ${Math.round(kpi.target)} | Achieved: ${Math.round(kpi.achievement)} (${kpi.percentage.toFixed(0)}%)\n`;
                                msg += `RPD: ${Math.round(kpi.requiredPerDay)} | Avg/Day: ${Math.round(kpi.dailyAvg)}\n`;
                                msg += `Projected: ${Math.round(kpi.projectedAchievement)} (${kpi.projectedPercentage.toFixed(0)}%)\n\n`;
                              });
                              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="w-full mt-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Share2 className="w-3 h-3" /> Share via WhatsApp
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onEnter}
          className="w-full bg-seablue hover:bg-seablue-light text-white font-black py-4 rounded-2xl shadow-xl shadow-seablue/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] group"
        >
          Enter Dashboard
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
};

const calculateTotalBags = (order: any) => {
  const items = order.items || order.order_data;
  if (!items) return 0;
  return Object.keys(items).reduce((sum, skuId) => {
    const sku = SKUS.find(s => s.id === skuId);
    if (!sku) return sum;
    const item = items[skuId];
    const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
    return sum + (packs / sku.unitsPerCarton);
  }, 0);
};

const normalizeRole = (role: string): any => {
  const r = (role || '').trim().toUpperCase();
  if (r === 'SUPER ADMIN') return 'Super Admin';
  if (r === 'ADMIN') return 'Admin';
  if (r === 'DIRECTOR') return 'Director';
  if (r === 'NSM' || r === 'NATIONAL SALES MANAGER') return 'NSM';
  if (r === 'RSM' || r === 'REGIONAL SALES MANAGER') return 'RSM';
  if (r === 'SC' || r === 'SALES CONTROLLER' || r === 'SALES COORDINATOR') return 'SC';
  if (r === 'TSM' || r === 'TERRITORY SALES MANAGER') return 'TSM';
  if (r === 'ASM' || r === 'AREA SALES MANAGER') return 'ASM';
  if (r === 'OB' || r === 'ORDER BOOKER') return 'OB';
  return role;
};

export default function App() {
  const [view, setView] = useState<'entry' | 'history' | 'dashboard' | 'admin' | 'stocks' | 'national' | 'reports' | 'intro' | 'help' | 'tsm_performance' | 'command_center' | 'insights' | 'stats' | 'home'>(() => {
    const saved = localStorage.getItem('user_data');
    if (saved) {
      try {
        const role = normalizeRole(JSON.parse(saved).role);
        if (['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM', 'OB'].includes(role)) {
          return 'home';
        }
      } catch(e) {}
    }
    return 'entry';
  });
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('auth_token');
    return (saved === 'null' || !saved) ? null : saved;
  });
  const [user, setUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('user_data');
    try { return saved ? JSON.parse(saved) : null; } catch(e) { return null; }
  });

  const [userRole, setUserRole] = useState<'Super Admin' | 'Admin' | 'TSM' | 'ASM' | 'OB' | 'Director' | 'NSM' | 'RSM' | 'SC' | null>(() => normalizeRole(user?.role));
  const [userName, setUserName] = useState<string | null>(() => user?.name || null);
  const [userContact, setUserContact] = useState<string | null>(() => user?.contact || null);
  const [userEmail, setUserEmail] = useState<string | null>(() => user?.email || null);
  const [userRegion, setUserRegion] = useState<string | null>(() => user?.region || null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [matrixView, setMatrixView] = useState<string>('Total');
  const [targetView, setTargetView] = useState('Brand');
  const [showUserManual, setShowUserManual] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedHeadCountDetail, setSelectedHeadCountDetail] = useState<any>(null);

  const handleLogin = (token: string, userData: any) => {
    const role = normalizeRole(userData.role);
    setToken(token);
    setUser(userData);
    setUserRole(role);
    setUserName(userData.name);
    setUserContact(userData.contact);
    setUserEmail(userData.email);
    setUserRegion(userData.region);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    
    if ((role === 'TSM' || role === 'ASM')) {
      setSelectedTSM(userData.name);
      setSelectedStockTSM(userData.name);
    }

    if (['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM', 'OB'].includes(role)) {
      setView('dashboard');
      setShowWelcome(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUser(null);
    setUserRole(null);
    setUserName(null);
    setUserContact(null);
    setUserEmail(null);
    setUserRegion(null);
    window.location.href = '/';
  };

  const generateWhatsAppMessage = (orderData: any, isFromHistory: boolean = false) => {
    const date = orderData.date;
    const obName = orderData.order_booker || orderData.orderBooker;
    const town = orderData.town;
    const route = orderData.route;
    const totalShops = orderData.total_shops || orderData.totalShops || 50;
    const visitedShops = orderData.visited_shops || orderData.visitedShops || 0;
    const productiveShops = orderData.productive_shops || orderData.productiveShops || 0;
    const visitType = orderData.visit_type || orderData.visitType;
    const isAbsent = visitType === 'Absent';
    
    const catProdData = isFromHistory 
      ? (typeof orderData.category_productive_data === 'string' ? JSON.parse(orderData.category_productive_data) : (orderData.category_productive_data || {}))
      : (orderData.categoryProductiveShops || {});

    const items = isFromHistory 
      ? (typeof orderData.order_data === 'string' ? JSON.parse(orderData.order_data) : (orderData.order_data || {}))
      : (orderData.items || {});

    const brandWiseProductive = CATEGORIES.map(cat => {
      return `${cat}: ${catProdData[cat] || 0}`;
    }).join('\n');

    const skuDetails = SKUS.map(sku => {
      const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
      if (item.ctn === 0 && item.dzn === 0 && item.pks === 0) return null;
      
      const totalPacks = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
      const totalVal = sku.unitsPerCarton > 0 ? totalPacks / sku.unitsPerCarton : 0;
      const label = sku.unit || (['Kite Glow', 'Burq Action', 'Vero'].includes(sku.category) ? 'Bags' : 'Ctns');
      
      return `${sku.name}: ${totalVal.toFixed(2).replace(/\.00$/, '')} ${label}`;
    }).filter(Boolean).join('\n');

    let totalBags = 0;
    let totalCtns = 0;
    const brandSales = CATEGORIES.map(cat => {
      const catSkus = SKUS.filter(s => s.category === cat);
      const catTotal = catSkus.reduce((sum, sku) => {
        const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
        const packs = (Number(item.ctn || 0) * Number(sku.unitsPerCarton)) + (Number(item.dzn || 0) * Number(sku.unitsPerDozen)) + Number(item.pks || 0);
        return sum + (Number(sku.unitsPerCarton) > 0 ? packs / Number(sku.unitsPerCarton) : 0);
      }, 0);
      const label = cat === 'Kite Glow' || cat === 'Burq Action' || cat === 'Vero' ? 'Bags' : 'Ctns';
      if (label === 'Bags') totalBags += catTotal;
      else totalCtns += catTotal;
      return `${cat}: ${catTotal.toFixed(2).replace(/\.00$/, '')} ${label}`;
    }).join('\n');

    const obContact = orderData.ob_contact || orderData.obContact;
    const month = date.slice(0, 7);
    
    // Include current order in MTD if it's not in history yet
    let mtdOrders = history.filter(o => o.ob_contact === obContact && o.date.startsWith(month));
    if (!isFromHistory && !mtdOrders.find(o => o.date === orderData.date)) {
      mtdOrders = [...mtdOrders, { ...orderData, order_data: JSON.stringify(items) }];
    }
    
    const mtdBrandTotals: Record<string, number> = {};
    const mtdBrandSales = CATEGORIES.map(cat => {
      const catSkus = SKUS.filter(s => s.category === cat);
      const mtdTotal = mtdOrders.reduce((sum, o) => {
        const oItems = typeof o.order_data === 'string' ? JSON.parse(o.order_data) : (o.order_data || {});
        const catSum = catSkus.reduce((s2, sku) => {
          const item = oItems[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const packs = (Number(item.ctn || 0) * Number(sku.unitsPerCarton)) + (Number(item.dzn || 0) * Number(sku.unitsPerDozen)) + Number(item.pks || 0);
          return s2 + (Number(sku.unitsPerCarton) > 0 ? packs / Number(sku.unitsPerCarton) : 0);
        }, 0);
        return sum + catSum;
      }, 0);
      mtdBrandTotals[cat] = mtdTotal;
      const label = cat === 'Kite Glow' || cat === 'Burq Action' || cat === 'Vero' ? 'Bags' : 'Ctns';
      return `${cat}: ${mtdTotal.toFixed(2).replace(/\.00$/, '')} ${label}`;
    });

    const mtdTotalBags = (mtdBrandTotals['Kite Glow'] || 0) + (mtdBrandTotals['Burq Action'] || 0) + (mtdBrandTotals['Vero'] || 0);
    const mtdTotalCtns = (mtdBrandTotals['DWB'] || 0) + (mtdBrandTotals['Match'] || 0);
    const washingPowderLine = `Total Washing Powder=${mtdBrandTotals['Kite Glow']?.toFixed(0) || 0}+${mtdBrandTotals['Burq Action']?.toFixed(0) || 0}+${mtdBrandTotals['Vero']?.toFixed(0) || 0}=${mtdTotalBags.toFixed(0)}`;
    const totalMtdExecutionLine = `Total MTD Execution: ${mtdTotalBags.toFixed(2).replace(/\.00$/, '')} Bags, ${mtdTotalCtns.toFixed(2).replace(/\.00$/, '')} Ctns`;

    const targets = isFromHistory 
      ? (typeof orderData.targets === 'string' ? JSON.parse(orderData.targets) : (orderData.targets || {}))
      : (orderData.targets || {});

    const obTarget = Object.keys(targets).length > 0 ? targets : (obAssignments.find(ob => ob.contact === obContact)?.targets || {});
    
    const [year, monthNum, dayStr] = date.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const currentDay = parseInt(dayStr);
    
    const obAssignment = obAssignments.find(ob => ob.contact === obContact);
    const offDay = obAssignment?.off_day || 'Sunday';
    const totalWorkingDays = getWorkingDays(parseInt(year), parseInt(monthNum) - 1, appConfig.holidays || '', daysInMonth, offDay);
    const workingDaysTillYesterday = getWorkingDays(parseInt(year), parseInt(monthNum) - 1, appConfig.holidays || '', Math.max(0, currentDay - 1), offDay);
    const remainingWorkingDays = Math.max(1, totalWorkingDays - workingDaysTillYesterday);
    
    const rpdVsAchievement = CATEGORIES.map(cat => {
      const target = obTarget[cat] || 0;
      const mtdTotal = mtdBrandTotals[cat] || 0;
      
      const catSkus = SKUS.filter(s => s.category === cat);
      const todayAchieved = catSkus.reduce((sum, sku) => {
        const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
        const packs = (Number(item.ctn || 0) * Number(sku.unitsPerCarton)) + (Number(item.dzn || 0) * Number(sku.unitsPerDozen)) + Number(item.pks || 0);
        return sum + (Number(sku.unitsPerCarton) > 0 ? packs / Number(sku.unitsPerCarton) : 0);
      }, 0);

      const mtdBeforeToday = mtdTotal - todayAchieved;
      const rpdForToday = Math.max(0, (target - mtdBeforeToday) / remainingWorkingDays);
      
      const label = cat === 'Kite Glow' || cat === 'Burq Action' || cat === 'Vero' ? 'Bags' : 'Ctns';
      return `${cat}: RPD ${rpdForToday.toFixed(1)} vs Achieved ${todayAchieved.toFixed(1)} ${label}`;
    }).join('\n');

    // Stock Report Check for TSM
    let stockStatus = '';
    const tsmName = orderData.tsm || userName || '';
    const isTsmMsg = isTSMEntry(obName, tsmName);
    if (isTsmMsg) {
      const today = new Date().toISOString().split('T')[0];
      const hasStockReport = stockHistory.some(s => s.date === today);
      stockStatus = `\n*Stock Report Status:*\n${hasStockReport ? '✅ Stock Reports Entered' : '⚠️ Stock Reports Not Entered'}\n`;
    }

    if (isAbsent) {
      return `*Sales Summary*\n` +
        `*${date}*\n\n` +
        `OB: ${obName}\n` +
        `Town: ${town}\n` +
        `Route: ${route}\n` +
        `*Status: Absent/Leave*\n\n` +
        `*RPD vs Today Achievement:*\n${rpdVsAchievement}\n\n` +
        `------------------\n\n` +
        `*MTD Brand Sales:*\n` +
        `${mtdBrandSales[0]}\n` +
        `${mtdBrandSales[1]}\n` +
        `${mtdBrandSales[2]}\n` +
        `${washingPowderLine}\n` +
        `${mtdBrandSales[3]}\n` +
        `${mtdBrandSales[4]}\n` +
        `${totalMtdExecutionLine}` +
        `${stockStatus}`;
    }

    const summary = `*Sales Summary*\n` +
      `*${date}*\n\n` +
      `OB: ${obName}\n` +
      `Town: ${town}\n` +
      `Route: ${route}\n\n` +
      `Shops T/V/P: ${totalShops}/${visitedShops}/${productiveShops}\n\n` +
      `*Brand Wise Productive:*\n${brandWiseProductive}\n\n` +
      `*RPD vs Today Achievement:*\n${rpdVsAchievement}\n\n` +
      `------------------\n\n` +
      `*SKU Details:*\n${skuDetails || 'No SKUs sold'}\n\n` +
      `------------------\n\n` +
      `*Brand Sales:*\n${brandSales}\n\n` +
      `------------------\n\n` +
      `*Today Execution:* ${totalBags.toFixed(2).replace(/\.00$/, '')} Bags, ${totalCtns.toFixed(2).replace(/\.00$/, '')} Ctns\n\n` +
      `*MTD Brand Sales:*\n` +
      `${mtdBrandSales[0]}\n` +
      `${mtdBrandSales[1]}\n` +
      `${mtdBrandSales[2]}\n` +
      `${washingPowderLine}\n` +
      `${mtdBrandSales[3]}\n` +
      `${mtdBrandSales[4]}\n` +
      `${totalMtdExecutionLine}` +
      `${stockStatus}`;

    return summary;
  };

  const apiFetch = async (url: string, options: any = {}) => {
    const currentToken = token || localStorage.getItem('auth_token');
    if (!currentToken || currentToken === 'null') {
      throw new Error("No authentication token found");
    }
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json'
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      console.warn(`apiFetch: 401 on ${url}. Logging out.`);
      const errorMsg = "Session expired. Please login again.";
      setMessage({ text: errorMsg, type: 'error' });
      handleLogout();
      setTimeout(() => setMessage(null), 5000);
      throw new Error(errorMsg);
    }
    if (response.status === 403) {
      console.warn(`apiFetch: 403 on ${url}. Access denied.`);
      let errorMsg = "Access denied. You don't have permission for this action.";
      try {
        const data = await response.json();
        if (data && data.error) {
          errorMsg = data.error;
          // If token is invalid/expired, logout
          if (errorMsg.toLowerCase().includes('token')) {
            handleLogout();
          }
        }
      } catch (e) {}
      setMessage({ text: errorMsg, type: 'error' });
      setTimeout(() => setMessage(null), 5000);
      throw new Error(errorMsg);
    }
    return response;
  };
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [history, setHistory] = useState<any[]>([]);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [nationalStats, setNationalStats] = useState<any[]>([]);
  const [isLoadingNational, setIsLoadingNational] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({ 
    ob: '', 
    tsm: '', 
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasAutoRefreshed, setHasAutoRefreshed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [obAssignments, setObAssignments] = useState<OBAssignment[]>([]);
  
  const [appConfig, setAppConfig] = useState<Record<string, string>>({ total_working_days: '25' });

  useEffect(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
      setHistoryFilters(prev => ({ ...prev, from: firstDay, to: lastDay }));
    }
  }, [selectedMonth]);

  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [selectedEntryRegion, setSelectedEntryRegion] = useState<string>('');
  const [selectedTSM, setSelectedTSM] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('user_data');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return (parsed.role === 'TSM' || parsed.role === 'ASM') ? parsed.name || '' : '';
      }
    } catch (e) {}
    return '';
  });
  const [selectedAdminTSM, setSelectedAdminTSM] = useState<string>('');
  const [targetMonth, setTargetMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [distributors, setDistributors] = useState<any[]>([]);
  const [mtdAchievement, setMtdAchievement] = useState<Record<string, number>>({});
  const [appLogo, setAppLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOGO_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  });
  const [selectedOBForTargets, setSelectedOBForTargets] = useState<string | null>(null);
  const [obTargetsEdit, setObTargetsEdit] = useState<Record<string, number>>({});
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; spreadsheetId: string | null; method?: string }>({ connected: false, spreadsheetId: null });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleConfigLocked, setIsGoogleConfigLocked] = useState(false);
  const [dailyStatus, setDailyStatus] = useState<any[]>([]);
  const [isLoadingDailyStatus, setIsLoadingDailyStatus] = useState(false);

  const [order, setOrder] = useState<OrderState>(() => {
    const defaultState: OrderState = {
      date: getPSTDate(),
      tsm: '',
      town: '',
      distributor: '',
      orderBooker: '',
      obContact: '',
      route: '',
      zone: '',
      region: '',
      nsm: '',
      rsm: '',
      sc: '',
      director: '',
      totalShops: 50,
      visitedShops: 0,
      productiveShops: 0,
      categoryProductiveShops: {},
      items: {},
      targets: {},
      visitType: ''
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          items: parsed.items || {},
          targets: parsed.targets || {},
          categoryProductiveShops: parsed.categoryProductiveShops || {},
          visitType: parsed.visitType || ''
        };
      }
    } catch (e) {
      console.error("Error loading from localStorage", e);
    }
    return defaultState;
  });

  const calculateAchievement = (orderData: any) => {
    const ach: Record<string, { value: number, unit: string }> = {};
    CATEGORIES.forEach(cat => {
      const catSkus = SKUS.filter(sku => sku.category === cat);
      const unit = catSkus[0]?.unit || 'Ctns';
      const value = catSkus.reduce((sum, sku) => {
        const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
        const packs = (Number(item.ctn || 0) * Number(sku.unitsPerCarton)) + (Number(item.dzn || 0) * Number(sku.unitsPerDozen)) + Number(item.pks || 0);
        return sum + (Number(sku.unitsPerCarton) > 0 ? packs / Number(sku.unitsPerCarton) : 0);
      }, 0);
      ach[cat] = { value, unit };
    });
    return ach;
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<any | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void; onCancel: () => void } | null>(null);
  const [stockOrders, setStockOrders] = useState<Record<string, Record<string, { ctn: number }>>>({});
  const [primaryOrdersEntry, setPrimaryOrdersEntry] = useState<Record<string, Record<string, number>>>({});
  const [primaryRemarks, setPrimaryRemarks] = useState<Record<string, string>>({});
  const [primarySearchQuery, setPrimarySearchQuery] = useState('');
  const [primaryOrderHistory, setPrimaryOrderHistory] = useState<any[]>([]);
  const [isLoadingPrimary, setIsLoadingPrimary] = useState(false);
  const [isSubmittingPrimary, setIsSubmittingPrimary] = useState(false);
  const [selectedPrimaryRegion, setSelectedPrimaryRegion] = useState('');
  const [selectedPrimaryTSM, setSelectedPrimaryTSM] = useState('');
  const [selectedPrimaryTown, setSelectedPrimaryTown] = useState('');
  const [selectedStockTSM, setSelectedStockTSM] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('user_data');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return (parsed.role === 'TSM' || parsed.role === 'ASM') ? parsed.name || '' : '';
      }
    } catch (e) {}
    return '';
  });
  const [selectedStockRegion, setSelectedStockRegion] = useState<string>('');
  const [selectedStockTown, setSelectedStockTown] = useState<string>('');
  const [isSubmittingStocks, setIsSubmittingStocks] = useState(false);
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [missingEntriesReport, setMissingEntriesReport] = useState<any[]>([]);
  const [isLoadingMissingEntries, setIsLoadingMissingEntries] = useState(false);

  const fetchMissingEntriesReport = async (month?: string) => {
    setIsLoadingMissingEntries(true);
    try {
      const m = month || selectedMonth;
      const res = await apiFetch(`/api/reports/missing-entries?month=${m}`);
      if (res.ok) {
        const data = await res.json();
        setMissingEntriesReport(data);
      }
    } catch (err) {
      console.error("Failed to fetch missing entries report:", err);
    } finally {
      setIsLoadingMissingEntries(false);
    }
  };

  // Move Stocks hooks to top level
  const allDistributors = useMemo(() => {
    const combined = [
      ...distributors.map(d => ({ town: d.town, distributor: d.name, tsm: d.tsm, region: d.region, ob_id: d.ob_id })),
      ...obAssignments.filter(ob => ob.name).map(ob => ({ town: ob.town, distributor: ob.distributor, tsm: ob.tsm, region: ob.region, ob_id: ob.contact }))
    ];
    return combined.filter((v, i, a) => a.findIndex(t => t.distributor === v.distributor) === i);
  }, [distributors, obAssignments]);

  const filteredDistributors = useMemo(() => {
    return allDistributors.filter(d => {
      const matchTSM = !selectedStockTSM || d.tsm === selectedStockTSM;
      const matchRegion = !selectedStockRegion || d.region === selectedStockRegion;
      const matchTown = !selectedStockTown || d.town === selectedStockTown;
      return matchTSM && matchRegion && matchTown;
    });
  }, [allDistributors, selectedStockTSM, selectedStockRegion, selectedStockTown]);

  const stockRegions = useMemo(() => Array.from(new Set(allDistributors.map(d => d.region).filter(Boolean))).sort(), [allDistributors]);
  const stockTowns = useMemo(() => Array.from(new Set(allDistributors.map(d => d.town).filter(Boolean))).sort(), [allDistributors]);
  const stockTsms = useMemo(() => Array.from(new Set(allDistributors.map(d => d.tsm).filter(Boolean))).sort(), [allDistributors]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          // Suppress location error as requested but log for debugging
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const focusableIds = useMemo(() => {
    const ids: string[] = [];
    CATEGORIES.forEach(category => {
      ids.push(`prod-${category}`);
      ids.push(`target-${category}`);
      SKUS.filter(s => s.category === category).forEach(sku => {
        ids.push(`${sku.id}-ctn`);
        if (sku.unitsPerDozen > 0 && category !== "Match") ids.push(`${sku.id}-dzn`);
        ids.push(`${sku.id}-pks`);
      });
    });
    return ids;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch (e) {
      console.error("Error saving to localStorage", e);
    }
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

  const checkDuplicate = async (date: string, obContact: string) => {
    try {
      const res = await apiFetch(`/api/check-duplicate?date=${date}&ob_contact=${obContact}`);
      const data = await res.json();
      return data.exists;
    } catch (e) {
      return false;
    }
  };

  const fetchDailyStatus = async (date: string) => {
    setIsLoadingDailyStatus(true);
    try {
      const res = await apiFetch(`/api/daily-status?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setDailyStatus(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDailyStatus(false);
    }
  };

  const handleMetaChange = async (field: keyof Omit<OrderState, 'items' | 'targets' | 'categoryProductiveShops'>, value: string | number) => {
    if (field === 'town' && order.obContact.startsWith('TSM-')) {
      const tsmAssigns = tsmAssignments.filter(t => (t.tsm_name || '').trim().toLowerCase() === (order.tsm || '').trim().toLowerCase() && t.town === value);
      let routes: string[] = [];
      tsmAssigns.forEach(t => {
        if (t.routes) routes.push(...t.routes.split(',').map((r:string) => r.trim()));
      });
      if (routes.length === 0) routes = ['TSM Route'];
      
      setOrder(prev => ({
        ...prev,
        town: String(value),
        route: routes[0] || ''
      }));
      return;
    }

    if (field === 'obContact') {
      const assignment = filteredOBs.find(a => a.contact === value);
      if (assignment) {
        if (String(value).startsWith('TSM-')) {
          const tsmName = assignment.tsm;
          const tsmAssigns = tsmAssignments.filter(t => (t.tsm_name || '').trim().toLowerCase() === (tsmName || '').trim().toLowerCase());
          
          let initialTown = assignment.town || '';
          let initialRoutes = assignment.routes || ['TSM Route'];
          
          if (tsmAssigns.length > 0) {
            initialTown = tsmAssigns[0].town;
            initialRoutes = tsmAssigns[0].routes ? tsmAssigns[0].routes.split(',').map((r:string) => r.trim()) : ['TSM Route'];
          }

          setOrder(prev => ({
            ...prev,
            obContact: String(value),
            orderBooker: assignment.name,
            town: initialTown,
            distributor: assignment.distributor || '',
            tsm: assignment.tsm || '',
            zone: assignment.zone || '',
            region: assignment.region || '',
            nsm: assignment.nsm || '',
            rsm: assignment.rsm || '',
            sc: assignment.sc || '',
            director: assignment.director || '',
            route: initialRoutes[0] || '',
            totalShops: 50,
            targets: {},
            items: {},
            categoryProductiveShops: {},
            visitType: ''
          }));
        } else {
          // Filter distributors for this town
          const townDists = distributors.filter(d => d.town === assignment.town);
          let autoDist = assignment.distributor;
          
          // If town has distributors in the independent list, use those
          if (townDists.length === 1) {
            autoDist = townDists[0].name;
          } else if (townDists.length > 1) {
            // If multiple, and the assignment distributor is one of them, keep it.
            // Otherwise, let the user select.
            const found = townDists.find(d => d.name === assignment.distributor);
            if (found) {
              autoDist = found.name;
            } else {
              autoDist = '';
            }
          }

          setOrder(prev => ({
            ...prev,
            obContact: String(value),
            orderBooker: assignment.name,
            town: assignment.town,
            distributor: autoDist,
            tsm: assignment.tsm || '',
            zone: assignment.zone || '',
            region: assignment.region || '',
            nsm: assignment.nsm || '',
            rsm: assignment.rsm || '',
            sc: assignment.sc || '',
            director: assignment.director || '',
            route: assignment.routes?.[0] || '',
            totalShops: assignment.total_shops || 50,
            targets: {},
            items: {},
            categoryProductiveShops: {},
            visitType: ''
          }));
        }
        fetchTargetsForOB(String(value));
      } else {
        setOrder(prev => ({ ...prev, obContact: '', orderBooker: '', route: '', town: '', distributor: '', totalShops: 50, items: {}, productiveShops: 0, categoryProductiveShops: {}, zone: '', region: '', nsm: '', rsm: '', sc: '', director: '' }));
      }
    } else if (field === 'town') {
      const townDists = distributors.filter(d => d.town === value);
      let autoDist = '';
      if (townDists.length === 1) {
        autoDist = townDists[0].name;
      }
      setOrder(prev => ({ ...prev, town: String(value), distributor: autoDist }));
    } else {
      setOrder(prev => ({ ...prev, [field]: value }));
    }
  };

  useEffect(() => {
    if (!token || token === 'null') return;
    if (order.obContact) {
      fetchTargetsForOB(order.obContact);
      fetchMTDForOB(order.obContact, order.date);
    }
  }, [order.obContact, order.date, token]);

  // Pre-fill form if an entry already exists for the selected date, OB, and route
  useEffect(() => {
    if (!order.obContact || !order.date || !order.route) return;
    
    const fetchExisting = async () => {
      if (order.items && Object.keys(order.items).length > 0) return; // Don't overwrite if user already started typing
      
      try {
        const res = await apiFetch(`/api/orders/existing?obContact=${encodeURIComponent(order.obContact)}&date=${encodeURIComponent(order.date)}&route=${encodeURIComponent(order.route)}`);
        if (res.ok) {
          const existing = await res.json();
          const parsedItems = typeof existing.order_data === 'string' ? JSON.parse(existing.order_data) : existing.order_data;
          const parsedCategory = typeof existing.category_productive_data === 'string' ? JSON.parse(existing.category_productive_data) : existing.category_productive_data;
          
          setOrder(prev => ({
            ...prev,
            items: parsedItems || {},
            categoryProductiveShops: parsedCategory || {},
            visitedShops: existing.visited_shops || 0,
            productiveShops: existing.productive_shops || 0,
            totalShops: existing.total_shops || 50,
            visitType: existing.visit_type || 'A'
          }));
          setMessage({ text: "Loaded existing entry for editing.", type: 'success' });
          setTimeout(() => setMessage(null), 3000);
        }
      } catch (e) {
        console.error("Failed to fetch existing order data", e);
      }
    };
    
    fetchExisting();
  }, [order.obContact, order.date, order.route]);

  const handleTargetChange = async (category: string, value: number) => {
    setOrder(prev => ({
      ...prev,
      targets: { ...prev.targets, [category]: value }
    }));
    
    // Persist to database if OB is selected
    if (order.obContact) {
      try {
        await apiFetch('/api/admin/targets', {
          method: 'POST',
          body: JSON.stringify({
            obContact: order.obContact,
            brandName: category,
            targetCtn: value,
            month: new Date().toISOString().slice(0, 7)
          })
        });
      } catch (err) {
        console.error("Failed to save target:", err);
      }
    }
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

  const mtdCategoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const currentMonth = order.date ? order.date.slice(0, 7) : new Date().toISOString().slice(0, 7);
    
    // Get past orders for this OB in the current month
    const pastOrders = history.filter(h => h.ob_contact === order.obContact && h.date.startsWith(currentMonth) && h.date !== order.date);
    
    CATEGORIES.forEach(cat => {
      // Past achievement
      const pastAch = pastOrders.reduce((sum, h) => {
        const items = h.order_data || {};
        return sum + SKUS.filter(sku => sku.category === cat).reduce((s, sku) => {
          const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
          return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
        }, 0);
      }, 0);
      
      // Add current order achievement
      totals[cat] = pastAch + (categoryTotals[cat] || 0);
    });
    return totals;
  }, [order.obContact, order.date, history, categoryTotals, CATEGORIES, SKUS]);

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

  const syncOfflineOrders = async () => {
    if (!navigator.onLine) return;
    try {
      const draftsStr = localStorage.getItem('offline_orders');
      if (!draftsStr) return;
      const drafts = JSON.parse(draftsStr);
      if (!Array.isArray(drafts) || drafts.length === 0) return;

      let successCount = 0;
      const remainingDrafts = [];

      for (const draft of drafts) {
        try {
          const response = await apiFetch('/api/submit', {
            method: 'POST',
            body: JSON.stringify({ data: draft })
          });
          if (response.ok) {
            successCount++;
          } else {
            remainingDrafts.push(draft);
          }
        } catch (e) {
          remainingDrafts.push(draft);
        }
      }

      if (successCount > 0) {
        localStorage.setItem('offline_orders', JSON.stringify(remainingDrafts));
        setMessage({ text: `Successfully synced ${successCount} offline order(s).`, type: 'success' });
        setTimeout(() => setMessage(null), 5000);
        syncGoogle();
        fetchHistory(true);
      }
    } catch (e) {
      console.error("Error syncing offline orders", e);
    }
  };

  useEffect(() => {
    window.addEventListener('online', syncOfflineOrders);
    if (navigator.onLine) {
      syncOfflineOrders();
    }
    return () => {
      window.removeEventListener('online', syncOfflineOrders);
    };
  }, []);

  const saveDraft = () => {
    try {
      const drafts = JSON.parse(localStorage.getItem('offline_orders') || '[]');
      drafts.push(order);
      localStorage.setItem('offline_orders', JSON.stringify(drafts));
      setMessage({ text: 'Saved as draft locally. Will sync when online.', type: 'success' });
      setOrder({
        date: getPSTDate(),
        tsm: '', town: '', distributor: '', orderBooker: '', obContact: '', route: '',
        zone: '', region: '', nsm: '', rsm: '', sc: '', director: '',
        totalShops: 50, visitedShops: 0, productiveShops: 0, categoryProductiveShops: {}, items: {}, targets: {},
        visitType: ''
      });
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      setMessage({ text: 'Error saving draft', type: 'error' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const submitOrder = () => {
    if (!order.visitType) {
      setMessage({ text: 'Select a Visit Type (A/V/RR/Absent)', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (!order.route) {
      setMessage({ text: 'Select a route', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    const totalPacks = (Object.values(categoryTotals) as number[]).reduce((a, b) => a + b, 0);
    if (order.visitType !== 'Absent' && totalPacks === 0) {
      setMessage({ text: 'Order is empty', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setIsConfirming(true);
  };

  const confirmSubmit = async () => {
    // Validation: Brand-wise productive shops must be entered if sales > 0
    if (order.visitType !== 'Absent') {
      const invalidCategories = CATEGORIES.filter(cat => {
        const catTotal = categoryTotals[cat];
        const catProd = order.categoryProductiveShops[cat] || 0;
        return catTotal > 0 && catProd <= 0;
      });

      if (invalidCategories.length > 0) {
        setMessage({ 
          text: `MANDATORY: Enter productive shops for brands with sales: ${invalidCategories.join(', ')}`, 
          type: 'error' 
        });
        setTimeout(() => setMessage(null), 5000);
        setIsConfirming(false);
        return;
      }
    }

    setIsConfirming(false);
    
    // Duplicate check: Prevent same OB + same date + same route duplicate locally first
    const isDuplicate = nationalStats.some(s => s.ob_contact === order.obContact && s.date === order.date && s.route === order.route);
    const isAdmin = userRole === 'Admin' || userRole === 'Super Admin' || userRole === 'Director';
    let isPastEditAllowed = isAdmin;
    
    if (!isAdmin && appConfig?.allow_past_editing) {
      if (appConfig.allow_past_editing === 'true') {
        isPastEditAllowed = true;
      } else if (appConfig.allow_past_editing !== 'false') {
        try {
          const allowedUsers = JSON.parse(appConfig.allow_past_editing);
          if (Array.isArray(allowedUsers) && allowedUsers.includes(userEmail)) {
            isPastEditAllowed = true;
          }
        } catch(e) {}
      }
    }
    
    if (isDuplicate && !isPastEditAllowed) {
      setMessage({ text: `Error: Entry for OB ${order.orderBooker} on ${order.date} for route ${order.route} already exists! Editing existing entries is disabled.`, type: 'error' });
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    if (!order.visitType) {
      setMessage({ text: 'Please select a Visit Type (A, V, RR, or Absent)', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsSubmitting(true);
    
    let currentLoc = location;
    if ("geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        currentLoc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setLocation(currentLoc);
      } catch (e) {}
    }

    if (!navigator.onLine) {
       const drafts = JSON.parse(localStorage.getItem('offline_orders') || '[]');
       drafts.push({ 
         ...order,
         latitude: currentLoc?.latitude,
         longitude: currentLoc?.longitude,
         accuracy: currentLoc?.accuracy
       });
       localStorage.setItem('offline_orders', JSON.stringify(drafts));
       setMessage({ text: 'Offline. Saved as draft. Will sync when online.', type: 'success' });
       setOrder({
         date: getPSTDate(),
         tsm: '', town: '', distributor: '', orderBooker: '', obContact: '', route: '',
         zone: '', region: '', nsm: '', rsm: '', sc: '', director: '',
         totalShops: 50, visitedShops: 0, productiveShops: 0, categoryProductiveShops: {}, items: {}, targets: {},
         visitType: ''
       });
       localStorage.removeItem(STORAGE_KEY);
       setIsSubmitting(false);
       setTimeout(() => setMessage(null), 3000);
       return;
    }

    try {
      const response = await apiFetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify({ 
          data: { 
            ...order,
            latitude: currentLoc?.latitude,
            longitude: currentLoc?.longitude,
            accuracy: currentLoc?.accuracy
          } 
        })
      });
      if (response.ok) {
        setLastSubmittedOrder({ ...order, order_booker: order.orderBooker });
        setMessage({ text: 'Submitted!', type: 'success' });
        // Auto-sync to Google Sheets
        syncGoogle();
        fetchHistory(true);
        fetchAdminData();
        fetchNationalData();
        if (order.obContact) {
          fetchMTDForOB(order.obContact, order.date);
        }
        setOrder({
          date: getPSTDate(),
          tsm: '', town: '', distributor: '', orderBooker: '', obContact: '', route: '',
          zone: '', region: '', nsm: '', rsm: '', sc: '', director: '',
          totalShops: 50, visitedShops: 0, productiveShops: 0, categoryProductiveShops: {}, items: {}, targets: {},
          visitType: ''
        });
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit');
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error submitting', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const fetchPrimaryOrders = async (month?: string) => {
    setIsLoadingPrimary(true);
    try {
      const m = month || selectedMonth;
      const res = await apiFetch(`/api/primary-orders?month=${m}`);
      if (res.ok) {
        const data = await res.json();
        setPrimaryOrderHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch primary orders:", err);
    } finally {
      setIsLoadingPrimary(false);
    }
  };

  const fetchHistory = async (ignoreFilters = false) => {
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (!ignoreFilters) {
        if (historyFilters.ob) params.append('ob', historyFilters.ob);
        if (historyFilters.tsm) params.append('tsm', historyFilters.tsm);
        if (historyFilters.from) params.append('from', historyFilters.from);
        if (historyFilters.to) params.append('to', historyFilters.to);
      }

      const response = await apiFetch(`/api/orders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setHistory(data.map((h: any) => ({
            ...h,
            category_productive_data: typeof h.category_productive_data === 'string' ? JSON.parse(h.category_productive_data) : (h.category_productive_data || {}),
            order_data: typeof h.order_data === 'string' ? JSON.parse(h.order_data) : (h.order_data || {})
          })).sort((a: any, b: any) => {
            // Sort by OB Name then Date
            if (a.order_booker < b.order_booker) return -1;
            if (a.order_booker > b.order_booker) return 1;
            if (a.date < b.date) return 1;
            if (a.date > b.date) return -1;
            return 0;
          }));
          setLastUpdated(new Date().toLocaleTimeString());
        } else {
          console.error("Expected array from /api/orders, got:", data);
          setHistory([]);
        }
      } else {
        const errData = await response.json();
        console.error("History fetch failed:", errData);
        setMessage({ text: 'Failed to load history', type: 'error' });
      }
    } catch (err) { console.error(err); }
    finally { setIsLoadingHistory(false); }
  };


  const calculateTimeGone = () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
    const totalWorkingDays = getWorkingDays(year, month, appConfig?.holidays || '');
    const workingDaysPassed = getWorkingDays(year, month, appConfig?.holidays || '', today);
    
    return {
      percentage: totalWorkingDays > 0 ? (workingDaysPassed / totalWorkingDays) * 100 : 0,
      passed: workingDaysPassed,
      total: totalWorkingDays,
      remaining: Math.max(0, totalWorkingDays - workingDaysPassed)
    };
  };

  const getTimeGone = () => calculateTimeGone().percentage;

  const updateConfig = async (key: string, value: string) => {
    let sanitizedValue = value;
    if (key === 'google_spreadsheet_id') {
      sanitizedValue = value.trim().replace(/^\/+|\/+$/g, '');
    }
    
    // Add confirmation if clearing sensitive fields
    if (['google_spreadsheet_id', 'google_service_account_email', 'google_private_key'].includes(key) && !sanitizedValue && appConfig[key]) {
      setConfirmModal({
        message: `Are you sure you want to REMOVE the ${key.replace(/_/g, ' ')}? This will break Google Sheets sync.`,
        onConfirm: async () => {
          setConfirmModal(null);
          setAppConfig(prev => ({ ...prev, [key]: sanitizedValue }));
          try {
            const res = await apiFetch('/api/admin/config', {
              method: 'POST',
              body: JSON.stringify({ key, value: sanitizedValue })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.config) {
                setAppConfig(data.config);
              }
            }
          } catch (err) {
            console.error(err);
          }
        },
        onCancel: () => setConfirmModal(null)
      });
      return;
    }

    setAppConfig(prev => ({ ...prev, [key]: sanitizedValue }));
    try {
      const res = await apiFetch('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify({ key, value: sanitizedValue })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config && key === 'google_private_key' && sanitizedValue.trim().startsWith('{')) {
          setAppConfig(data.config);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userRole === 'OB' && userContact && obAssignments.length > 0) {
      const assignment = obAssignments.find(a => a.contact === userContact);
      if (assignment && !order.obContact) {
        handleMetaChange('obContact', userContact);
      }
    }
  }, [userRole, userContact, obAssignments, order.obContact]);

  const fetchBackupLogs = async () => {
    try {
      const res = await apiFetch('/api/admin/backup-logs');
      if (res.ok) {
        const data = await res.json();
        setBackupLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch backup logs', err);
    }
  };

  const runManualBackup = async () => {
    setIsBackingUp(true);
    setMessage({ text: 'Starting full system backup...', type: 'info' });
    try {
      const res = await apiFetch('/api/admin/run-backup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Backup completed successfully and stored in Google Drive!', type: 'success' });
      } else {
        throw new Error(data.error || 'Backup failed');
      }
    } catch (err: any) {
      setMessage({ text: 'Backup failed: ' + err.message, type: 'error' });
    } finally {
      fetchBackupLogs();
      setIsBackingUp(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const syncEverything = async () => {
    setIsSyncingGlobal(true);
    try {
      const res = await apiFetch('/api/admin/master-sync', { 
        method: 'POST',
        body: JSON.stringify({ month: selectedMonth })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      
      setMessage({ text: data.message, type: 'success' });
      setAppConfig(prev => ({ ...prev, last_sync_at: data.last_sync_at }));
      fetchAdminData();
      fetchHistory(true);
      fetchNationalData(); // Refresh national data after sync
    } catch (err: any) {
      setMessage({ text: 'Sync Error: ' + err.message, type: 'error' });
    } finally {
      setIsSyncingGlobal(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const recalculateTonnage = async () => {
    setConfirmModal({
      message: 'Are you sure you want to recalculate ALL tonnage data and repush to Google Sheets? This will overwrite the Sales_Data sheet.',
      onConfirm: async () => {
        setConfirmModal(null);
        setIsSyncingGlobal(true);
        try {
          const res = await apiFetch('/api/admin/recalculate-tonnage', { method: 'POST' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Recalculation failed');
          
          setMessage({ text: data.message, type: 'success' });
          fetchHistory(true);
        } catch (err: any) {
          setMessage({ text: 'Recalculation Error: ' + err.message, type: 'error' });
        } finally {
          setIsSyncingGlobal(false);
          setTimeout(() => setMessage(null), 5000);
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  useEffect(() => {
    if (!token || token === 'null') return;
    // Auto-sync on mount if config is available - FOR ALL USERS as requested
    if (appConfig.google_spreadsheet_id && !isSyncingGlobal) {
      syncEverything();
    }
  }, [appConfig.google_spreadsheet_id, token]);

  // Periodic refresh for NSM/RSM/SC/Director every 30 minutes
  useEffect(() => {
    if (!token || token === 'null') return;
    const role = (userRole || '').toUpperCase();
    if (!['NSM', 'RSM', 'SC', 'DIRECTOR', 'ADMIN', 'SUPER ADMIN'].includes(role)) return;

    // Removed auto-refresh per user request
  }, [token, userRole, appConfig.google_spreadsheet_id]);

  // Expose to window for NationalDashboard
  useEffect(() => {
    (window as any).handleMasterSync = syncEverything;
    return () => { delete (window as any).handleMasterSync; };
  }, [syncEverything]);

  useEffect(() => {
    if (!token || token === 'null') return;
    if (view === 'national' || view === 'dashboard' || view === 'reports' || view === 'stats') {
      fetchNationalData();
      fetchHistory(true);
    }
  }, [view, token, selectedMonth]);

  useEffect(() => {
    if (!token || token === 'null') return;
    if (view === 'missing_entries' || view === 'stats') {
      fetchMissingEntriesReport();
    }
  }, [view, token, selectedMonth]);

  useEffect(() => {
    if (!token || token === 'null') return;
    if (view === 'entry' && (userRole === 'TSM' || userRole === 'ASM')) {
      fetchTsmAssignments();
    }
  }, [view, token, userRole]);

  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'OB', name: '', contact: '', region: '', town: '', email: '', tsm: '', ob: '' });

  const [tsmAssignments, setTsmAssignments] = useState<any[]>([]);

  const fetchTsmAssignments = async () => {
    try {
      const res = await apiFetch('/api/admin/tsm_assignments');
      if (res.ok) {
        const data = await res.json();
        setTsmAssignments(data);
      }
    } catch (e) {
      console.error("Failed to fetch TSM assignments", e);
    }
  };

  const fetchUsers = async () => {
    if (!token || token === 'null') return;
    setIsLoadingUsers(true);
    try {
      const res = await apiFetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
    finally { setIsLoadingUsers(false); }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.name) {
      setMessage({ text: "Username and Name are required", type: 'error' });
      return;
    }
    setIsRegisteringUser(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setMessage({ text: "User registered successfully", type: 'success' });
        setNewUser({ username: '', password: '', role: 'OB', name: '', contact: '', region: '', town: '', email: '', tsm: '', ob: '' });
        fetchUsers();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsRegisteringUser(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteUser = async (id: number) => {
    setConfirmModal({
      message: "Are you sure you want to delete this user?",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setMessage({ text: "User deleted", type: 'success' });
            fetchUsers();
          }
        } catch (err) { console.error(err); }
        finally { setTimeout(() => setMessage(null), 3000); }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const autoGenerateUsersFromTeam = async () => {
    setConfirmModal({
      message: "This will create login accounts for all OBs and TSMs who don't have one. Default password will be '123456'. Continue?",
      onConfirm: async () => {
        setConfirmModal(null);
        setIsLoadingAdmin(true);
        let count = 0;
        try {
          // 1. Get all unique TSMs
          const tsms = Array.from(new Set(obAssignments.map(ob => ob.tsm).filter(Boolean))) as string[];
          
          // 2. Combine with OBs
          const teamToRegister = [
            ...tsms.map(name => ({ name, contact: `TSM-${name.replace(/\s+/g, '-')}`, role: 'TSM', town: '', region: '' })),
            ...obAssignments.map(ob => ({ name: ob.name, contact: ob.contact, role: 'OB', town: ob.town, region: ob.region }))
          ];

          for (const member of teamToRegister) {
            // Check if user already exists (by contact or username)
            const exists = users.some(u => u.contact === member.contact || u.username === member.contact);
            if (!exists) {
              await apiFetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                  username: member.contact, // Use contact ID as username
                  password: 'abc123', // Default password
                  role: member.role,
                  name: member.name,
                  contact: member.contact,
                  region: member.region || '',
                  town: member.town || ''
                })
              });
              count++;
            }
          }
          setMessage({ text: `Successfully created ${count} user accounts!`, type: 'success' });
          fetchUsers();
        } catch (err) {
          setMessage({ text: "Failed to auto-generate users", type: 'error' });
        } finally {
          setIsLoadingAdmin(false);
          setTimeout(() => setMessage(null), 5000);
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const fetchAdminData = async () => {
    setIsLoadingAdmin(true);
    try {
      const normalizedRole = (userRole || '').toUpperCase();
      const isSuperAdmin = (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER ADMIN') && SUPER_ADMIN_EMAILS.includes(userEmail || '');
      const isStaff = ['ADMIN', 'SUPER ADMIN', 'TSM', 'ASM', 'RSM', 'NSM', 'DIRECTOR', 'SC', 'OB'].includes(normalizedRole);
      
      const requests = [
        apiFetch('/api/stocks'),
      ];

      if (isStaff) {
        requests.push(apiFetch('/api/admin/obs'));
        requests.push(apiFetch('/api/admin/distributors'));
        requests.push(apiFetch('/api/admin/config'));
        requests.push(apiFetch(`/api/admin/hierarchy?month=${selectedMonth}`));
        requests.push(apiFetch('/api/admin/tsm_assignments'));
      }
      
      if (isSuperAdmin) {
        requests.push(apiFetch('/api/google/status'));
      }

      const results = await Promise.all(requests);
      
      // Map results back to states
      let nextIdx = 0;
      if (results[nextIdx]?.ok) setStockHistory(await results[nextIdx].json());
      nextIdx++;
      
      if (isStaff) {
        if (results[nextIdx]?.ok) setObAssignments(await results[nextIdx].json());
        nextIdx++;
        if (results[nextIdx]?.ok) setDistributors(await results[nextIdx].json());
        nextIdx++;
        if (results[nextIdx]?.ok) setAppConfig(await results[nextIdx].json());
        nextIdx++;
        if (results[nextIdx]?.ok) setHierarchy(await results[nextIdx].json());
        nextIdx++;
        if (results[nextIdx]?.ok) setTsmAssignments(await results[nextIdx].json());
        nextIdx++;
      }
      
      if (isSuperAdmin) {
        if (results[nextIdx]?.ok) setGoogleStatus(await results[nextIdx].json());
        nextIdx++;
      }
      fetchBackupLogs();
    } catch (err) { console.error(err); }
    finally { setIsLoadingAdmin(false); }
  };

  const fetchNationalData = async () => {
    setIsLoadingNational(true);
    try {
      const res = await apiFetch(`/api/national/dashboard-data?month=${selectedMonth}`);
      if (res.ok) {
        const data = await res.json();
        const parsedStats = (data.stats || []).map((h: any) => {
          const orderData = typeof h.order_data === 'string' ? JSON.parse(h.order_data) : (h.order_data || {});
          const categoryProductiveData = typeof h.category_productive_data === 'string' ? JSON.parse(h.category_productive_data) : (h.category_productive_data || {});
          
          // Calculate total cartons and brand-wise sales for dashboard
          let totalCartons = 0;
          const brandSales: Record<string, number> = {};
          
          SKUS.forEach(sku => {
            const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
            const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
            const ctns = sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0;
            totalCartons += ctns;
            
            brandSales[sku.category] = (brandSales[sku.category] || 0) + ctns;
          });

          return {
            ...h,
            order_data: orderData,
            category_productive_data: categoryProductiveData,
            cartons: totalCartons,
            brandSales
          };
        });
        setNationalStats(parsedStats);
        setHierarchy(data.hierarchy || []);
      }
    } catch (err) {
      console.error("Failed to fetch national data", err);
    } finally {
      setIsLoadingNational(false);
    }
  };

  const fetchTargetsForOB = async (contact: string) => {
    try {
      const currentMonth = getPSTDate().slice(0, 7);
      const res = await apiFetch(`/api/admin/targets/${contact}?month=${currentMonth}`);
      if (res.ok) {
        const targets = await res.json();
        const targetMap: Record<string, number> = {};
        targets.forEach((t: any) => { targetMap[t.brand_name] = t.target_ctn; });
        setOrder(prev => ({ ...prev, targets: targetMap }));
      }
    } catch (err) { console.error("Target Fetch Error:", err); }
  };

  const fetchMTDForOB = async (contact: string, date?: string) => {
    try {
      // Use the provided date or the current order date, fallback to today in PST
      const targetDate = date || order.date || getPSTDate();
      const monthStr = targetDate.slice(0, 7); // YYYY-MM
      
      // Fetch only relevant orders for this OB and month
      const res = await apiFetch(`/api/orders?ob_contact=${contact}&from=${monthStr}-01&to=${monthStr}-31`);
      if (res.ok) {
        const obOrders = await res.json();
        
        const mtd: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          mtd[cat] = obOrders.reduce((sum: number, o: any) => {
            const orderData = typeof o.order_data === 'string' ? JSON.parse(o.order_data) : (o.order_data || {});
            const catTotal = SKUS
              .filter(sku => sku.category === cat)
              .reduce((s, sku) => {
                const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                const ctn = Number(item.ctn || 0);
                const dzn = Number(item.dzn || 0);
                const pks = Number(item.pks || 0);
                const packs = (ctn * sku.unitsPerCarton) + (dzn * sku.unitsPerDozen) + pks;
                return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
              }, 0);
            return sum + catTotal;
          }, 0);
        });
        setMtdAchievement(mtd);
      }
    } catch (err) { console.error("MTD Fetch Error:", err); }
  };

  const fetchTargetsForOBEdit = async (contact: string, month?: string) => {
    try {
      const m = month || targetMonth || getPSTDate().slice(0, 7);
      const res = await apiFetch(`/api/admin/targets/${contact}?month=${m}`);
      if (res.ok) {
        const targets = await res.json();
        const targetMap: Record<string, number> = {};
        targets.forEach((t: any) => { targetMap[t.brand_name] = t.target_ctn; });
        setObTargetsEdit(targetMap);
      }
    } catch (err) { console.error("Target Edit Fetch Error:", err); }
  };

  const handleTargetUpdate = async (obContact: string, brandName: string, value: string) => {
    const targetCtn = parseFloat(value) || 0;
    setObTargetsEdit(prev => ({ ...prev, [brandName]: targetCtn }));
    try {
      await apiFetch('/api/admin/targets', {
        method: 'POST',
        body: JSON.stringify({ obContact, brandName, targetCtn, month: targetMonth })
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!token || token === 'null') return;
    const normalizedRole = (userRole || '').toUpperCase();
    if (['ADMIN', 'SUPER ADMIN', 'TSM', 'ASM', 'RSM', 'NSM', 'DIRECTOR', 'SC', 'OB'].includes(normalizedRole)) {
      fetchAdminData();
      fetchUsers();
    }
    fetchHistory();
    fetchNationalData();
    fetchPrimaryOrders();
  }, [view, userRole, token, selectedMonth]);

  useEffect(() => {
    if (!token || token === 'null') return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        fetchAdminData();
        setMessage({ text: 'Google Sheets Connected!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [token]);

  // Auto-refresh fallback for dashboard
  useEffect(() => {
    if (view === 'dashboard' && !isLoadingHistory && !isLoadingAdmin && !isLoadingNational && !hasAutoRefreshed) {
      if (nationalStats.length === 0 && history.length === 0) {
        const timer = setTimeout(() => {
          console.log("Auto-refreshing dashboard data...");
          fetchNationalData();
          fetchHistory(true);
          fetchAdminData();
          setHasAutoRefreshed(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [view, isLoadingHistory, isLoadingAdmin, isLoadingNational, hasAutoRefreshed, nationalStats.length, history.length]);

  const connectGoogle = async () => {
    try {
      const res = await apiFetch('/api/auth/google/url');
      const { url } = await res.json();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (err) {
      setMessage({ text: 'Failed to connect Google', type: 'error' });
    }
  };

  const syncGoogle = async () => {
    setIsSyncing(true);
    try {
      const res = await apiFetch('/api/admin/master-sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Synced to Google Sheets!', type: 'success' });
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err: any) {
      setMessage({ text: 'Sync failed: ' + err.message, type: 'error' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDistributorBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage({ text: 'Parsing CSV...', type: 'info' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      error: (err) => {
        setMessage({ text: 'CSV Parse Error: ' + err.message, type: 'error' });
        setTimeout(() => setMessage(null), 3000);
      },
      complete: async (results) => {
        if (results.errors.length > 0) {
          setMessage({ text: 'CSV has errors. Check format.', type: 'error' });
          console.error("PapaParse Errors:", results.errors);
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        const dists = results.data.map((row: any) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          });

          const getVal = (possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              const normalizedKey = key.toLowerCase();
              if (normalizedRow[normalizedKey] !== undefined) return normalizedRow[normalizedKey];
            }
            return null;
          };

          return {
            name: getVal(['Name', 'name', 'Distributor', 'distributor', 'distributor name']),
            town: getVal(['Town', 'town', 'town name']),
            tsm: getVal(['TSM', 'tsm', 'asm', 'asm/tsm', 'asm / tsm']),
            zone: getVal(['Zone', 'zone']),
            region: getVal(['Region', 'region', 'territory', 'territory/region'])
          };
        }).filter((item: any) => item.name);

        if (dists.length === 0) {
          setMessage({ text: 'No valid records found in CSV', type: 'error' });
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        setConfirmModal({
          message: "Do you want to REPLACE the entire distributor list with this new file? (Click Cancel to just ADD/UPDATE without deleting others)",
          onConfirm: async () => {
            setConfirmModal(null);
            setMessage({ text: `Uploading ${dists.length} records...`, type: 'info' });
            try {
              const res = await apiFetch('/api/admin/distributors/bulk-upload', {
                method: 'POST',
                body: JSON.stringify({ distributors: dists, clearExisting: true })
              });
              const data = await res.json();
              if (res.ok) {
                setMessage({ text: `Successfully uploaded ${dists.length} distributors!`, type: 'success' });
                fetchAdminData();
              } else {
                throw new Error(data.error || 'Upload failed');
              }
            } catch (err: any) {
              setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
            } finally {
              setTimeout(() => setMessage(null), 3000);
              if (e.target) e.target.value = '';
            }
          },
          onCancel: async () => {
            setConfirmModal(null);
            setMessage({ text: `Uploading ${dists.length} records...`, type: 'info' });
            try {
              const res = await apiFetch('/api/admin/distributors/bulk-upload', {
                method: 'POST',
                body: JSON.stringify({ distributors: dists, clearExisting: false })
              });
              const data = await res.json();
              if (res.ok) {
                setMessage({ text: `Successfully uploaded ${dists.length} distributors!`, type: 'success' });
                fetchAdminData();
              } else {
                throw new Error(data.error || 'Upload failed');
              }
            } catch (err: any) {
              setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
            } finally {
              setTimeout(() => setMessage(null), 3000);
              if (e.target) e.target.value = '';
            }
          }
        });
      }
    });
  };

  const handleHierarchyBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage({ text: 'Parsing Hierarchy CSV...', type: 'info' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      error: (err) => {
        setMessage({ text: 'CSV Parse Error: ' + err.message, type: 'error' });
        setTimeout(() => setMessage(null), 3000);
      },
      complete: async (results) => {
        if (results.errors.length > 0) {
          setMessage({ text: 'CSV has errors. Check format.', type: 'error' });
          console.error("PapaParse Errors:", results.errors);
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        const hierarchyData = results.data.map((row: any) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          });

          const getVal = (possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              const normalizedKey = key.toLowerCase();
              if (normalizedRow[normalizedKey] !== undefined) return normalizedRow[normalizedKey];
            }
            return null;
          };

          return {
            director_sales: getVal(['Director Sales', 'director_sales', 'director']),
            nsm_name: getVal(['NSM Name', 'nsm_name', 'nsm']),
            rsm_name: getVal(['RSM Name', 'rsm_name', 'rsm']),
            sc_name: getVal(['SC Name', 'sc_name', 'sc']),
            asm_tsm_name: getVal(['ASM / TSM Name', 'asm/tsm name', 'asm_tsm_name', 'asm', 'tsm', 'asm/tsm']),
            town_name: getVal(['Town Name', 'town_name', 'town']),
            distributor_name: getVal(['Distributor Name', 'distributor_name', 'distributor']),
            distributor_code: getVal(['Distributor Code', 'distributor_code', 'code']),
            ob_name: getVal(['Order Booker Name', 'ob name', 'ob_name', 'ob']),
            ob_id: getVal(['Order Booker ID', 'ob id', 'ob_id', 'id', 'contact']),
            territory_region: getVal(['Territory / Region', 'territory/region', 'territory_region', 'territory', 'region']),
            target_ctn: parseFloat(getVal(['Target', 'target_ctn', 'target']) || '0')
          };
        }).filter((item: any) => item.ob_id && item.ob_name);

        if (hierarchyData.length === 0) {
          setMessage({ text: 'No valid records found in CSV', type: 'error' });
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        setConfirmModal({
          message: "Do you want to REPLACE the entire hierarchy with this new file?",
          onConfirm: async () => {
            setConfirmModal(null);
            setMessage({ text: `Uploading ${hierarchyData.length} hierarchy records...`, type: 'info' });
            try {
              const res = await apiFetch('/api/admin/hierarchy/bulk-upload', {
                method: 'POST',
                body: JSON.stringify({ hierarchy: hierarchyData, clearExisting: true })
              });
              const data = await res.json();
              if (res.ok) {
                setMessage({ text: `Successfully uploaded ${hierarchyData.length} records!`, type: 'success' });
                fetchAdminData();
              } else {
                throw new Error(data.error || 'Upload failed');
              }
            } catch (err: any) {
              setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
            } finally {
              if (e.target) e.target.value = '';
              setTimeout(() => setMessage(null), 3000);
            }
          },
          onCancel: async () => {
            setConfirmModal(null);
            setMessage({ text: `Uploading ${hierarchyData.length} hierarchy records...`, type: 'info' });
            try {
              const res = await apiFetch('/api/admin/hierarchy/bulk-upload', {
                method: 'POST',
                body: JSON.stringify({ hierarchy: hierarchyData, clearExisting: false })
              });
              const data = await res.json();
              if (res.ok) {
                setMessage({ text: `Successfully uploaded ${hierarchyData.length} records!`, type: 'success' });
                fetchAdminData();
              } else {
                throw new Error(data.error || 'Upload failed');
              }
            } catch (err: any) {
              setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
            } finally {
              if (e.target) e.target.value = '';
              setTimeout(() => setMessage(null), 3000);
            }
          }
        });
      }
    });
  };

  const handleTargetBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const rows = results.data as any[];
          const targets: any[] = [];
          
          rows.forEach(row => {
            const contact = row['ID'] || row['id'] || row['Contact'] || row['contact'];
            if (!contact) return;
            
            CATEGORIES.forEach(cat => {
              const targetVal = row[cat] || row[`${cat} Target`] || row[cat.toLowerCase()] || row[`${cat.toLowerCase()}_target`];
              if (targetVal !== undefined && targetVal !== '') {
                targets.push({
                  ob_contact: String(contact),
                  brand_name: cat,
                  target_ctn: parseFloat(targetVal) || 0
                });
              }
            });
          });
          
          if (targets.length === 0) {
            setMessage({ text: 'No valid targets found in CSV', type: 'error' });
            return;
          }
          
          setMessage({ text: `Uploading ${targets.length} targets for ${targetMonth}...`, type: 'info' });
          try {
            const res = await apiFetch('/api/admin/targets/bulk', {
              method: 'POST',
              body: JSON.stringify({ targets, month: targetMonth })
            });
            if (res.ok) {
              setMessage({ text: `Successfully uploaded ${targets.length} targets!`, type: 'success' });
              fetchAdminData();
            } else {
              const data = await res.json();
              throw new Error(data.error || 'Upload failed');
            }
          } catch (err: any) {
            setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
          }
          if (e.target) e.target.value = '';
        }
      });
    }
  };

  const [manualTSMName, setManualTSMName] = useState('');

  const registerTSMsAsOBs = async (manualName?: string) => {
    let tsmToRegister: string[] = [];
    
    if (manualName) {
      tsmToRegister = [manualName];
    } else {
      const uniqueTSMs = Array.from(new Set(obAssignments.map(ob => ob.tsm).filter(Boolean))) as string[];
      if (uniqueTSMs.length === 0) {
        setMessage({ text: "No TSMs found in assignments", type: 'error' });
        return;
      }
      // Filter out TSMs that are already registered as OBs
      tsmToRegister = uniqueTSMs.filter(tsm => {
        const contact = `TSM-${tsm.replace(/\s+/g, '-')}`;
        return !obAssignments.some(ob => ob.contact === contact);
      });
    }

    if (tsmToRegister.length === 0) {
      setMessage({ text: "All TSMs are already registered as Order Bookers", type: 'success' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const performRegistration = async () => {
      setIsLoadingAdmin(true);
      try {
        for (const tsm of tsmToRegister) {
          const contact = `TSM-${(tsm as string).replace(/\s+/g, '-')}`;
          // Find a sample assignment for this TSM to get town/distributor
          const sample = obAssignments.find(ob => ob.tsm === tsm);
          await apiFetch('/api/admin/obs', {
            method: 'POST',
            body: JSON.stringify({
              name: `${tsm} (TSM)`,
              contact: contact,
              town: sample?.town || 'General',
              distributor: sample?.distributor || 'General',
              tsm: tsm,
              total_shops: 50,
              routes: ["TSM Route"]
            })
          });
        }
        setMessage({ text: manualName ? `${manualName} registered successfully` : "TSMs registered as OBs successfully", type: 'success' });
        setManualTSMName('');
        fetchAdminData();
      } catch (err) {
        setMessage({ text: "Failed to register TSMs", type: 'error' });
      } finally {
        setIsLoadingAdmin(false);
        setTimeout(() => setMessage(null), 3000);
      }
    };

    if (manualName) {
      performRegistration();
    } else {
      setConfirmModal({
        message: `Register ${tsmToRegister.length} new TSMs as Order Bookers so they can enter their own reports?`,
        onConfirm: () => {
          setConfirmModal(null);
          performRegistration();
        },
        onCancel: () => setConfirmModal(null)
      });
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage({ text: 'Parsing CSV...', type: 'info' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      error: (err) => {
        setMessage({ text: 'CSV Parse Error: ' + err.message, type: 'error' });
        setTimeout(() => setMessage(null), 3000);
      },
      complete: async (results) => {
        if (results.errors.length > 0) {
          setMessage({ text: 'CSV has errors. Check format.', type: 'error' });
          console.error("PapaParse Errors:", results.errors);
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        const team = results.data.map((row: any) => {
          // Normalize keys to lowercase and trimmed
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          });

          const getVal = (possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              const normalizedKey = key.toLowerCase();
              if (normalizedRow[normalizedKey] !== undefined) return normalizedRow[normalizedKey];
            }
            return null;
          };

          return {
            name: getVal(['OB Name', 'Name', 'name', 'ob name', 'ob_name']),
            contact: getVal(['OB ID', 'ID', 'id', 'Contact', 'contact', 'ob id', 'ob_id']),
            town: getVal(['Town', 'town', 'town name']),
            distributor: getVal(['Distributor', 'distributor', 'distributor name']),
            tsm: getVal(['TSM', 'tsm', 'asm', 'asm/tsm', 'asm / tsm']),
            zone: getVal(['Zone', 'zone']),
            region: getVal(['Region', 'region', 'territory', 'territory/region']),
            nsm: getVal(['NSM', 'nsm', 'nsm name']),
            rsm: getVal(['RSM', 'rsm', 'rsm name']),
            sc: getVal(['SC', 'sc', 'sc name']),
            director: getVal(['Director', 'director', 'director sales']),
            total_shops: parseInt(getVal(['Total Shops', 'total_shops', 'shops']) || '50') || 50,
            routes: getVal(['Routes', 'routes']) ? getVal(['Routes', 'routes']).split(",").map((r: string) => r.trim()).filter((r: string) => r) : [],
            targets: {
              "Kite Glow": parseFloat(getVal(['Kite Glow Target', 'kite_glow_target', 'kite glow', 'kite target'])) || 0,
              "Burq Action": parseFloat(getVal(['Burq Action Target', 'burq_action_target', 'burq action', 'burq target'])) || 0,
              "Vero": parseFloat(getVal(['Vero Target', 'vero_target', 'vero', 'vero target'])) || 0,
              "DWB": parseFloat(getVal(['DWB Target', 'dwb_target', 'dwb', 'dwb target'])) || 0,
              "Match": parseFloat(getVal(['Match Target', 'match_target', 'match', 'match target'])) || 0
            }
          };
        }).filter((item: any) => (item.name && item.contact) || item.distributor);

        if (team.length === 0) {
          setMessage({ text: 'No valid records found in CSV', type: 'error' });
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        setConfirmModal({
          message: "Do you want to REPLACE the entire team list with this new file? (Click Cancel to just ADD/UPDATE without deleting others)",
          onConfirm: async () => {
            setConfirmModal(null);
            setMessage({ text: `Uploading ${team.length} records...`, type: 'info' });
            try {
              const res = await apiFetch('/api/admin/bulk-upload', {
                method: 'POST',
                body: JSON.stringify({ team, clearExisting: true, month: selectedMonth })
              });
              const data = await res.json();
              if (res.ok) {
                setMessage({ text: `Successfully uploaded ${team.length} team members!`, type: 'success' });
                fetchAdminData();
              } else {
                throw new Error(data.error || 'Upload failed');
              }
            } catch (err: any) {
              setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
            } finally {
              setTimeout(() => setMessage(null), 3000);
              e.target.value = '';
            }
          },
          onCancel: async () => {
            setConfirmModal(null);
            setMessage({ text: `Uploading ${team.length} records...`, type: 'info' });
            try {
              const res = await apiFetch('/api/admin/bulk-upload', {
                method: 'POST',
                body: JSON.stringify({ team, clearExisting: false, month: selectedMonth })
              });
              const data = await res.json();
              if (res.ok) {
                setMessage({ text: `Successfully uploaded ${team.length} team members!`, type: 'success' });
                fetchAdminData();
              } else {
                throw new Error(data.error || 'Upload failed');
              }
            } catch (err: any) {
              setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
            } finally {
              setTimeout(() => setMessage(null), 3000);
              e.target.value = '';
            }
          }
        });
      }
    });
  };


  const timeGone = calculateTimeGone();

  const tsmList = useMemo(() => {
    const tsms = new Set<string>(['Muhammad Shoaib', 'Waheed Jamal', 'Ikramullah', 'Muhammad Zeeshan', 'Noman Paracha', 'Muhammad Yousaf', 'Qaisar Yousaf']);
    obAssignments.forEach(ob => { if (ob.tsm) tsms.add(ob.tsm.trim()); });
    distributors.forEach(d => { if (d.tsm) tsms.add(d.tsm.trim()); });
    
    const allTsms = Array.from(tsms).sort();
    
    if (userRole === 'Admin' || userRole === 'Super Admin') {
      return allTsms;
    }
    if (userRole === 'Director') {
      return allTsms.filter(tsm => obAssignments.some(ob => (ob.tsm || '').trim().toLowerCase() === tsm.toLowerCase() && (ob.director || '').trim().toLowerCase() === (userName || '').trim().toLowerCase()));
    }
    if (userRole === 'NSM') {
      return allTsms.filter(tsm => obAssignments.some(ob => (ob.tsm || '').trim().toLowerCase() === tsm.toLowerCase() && (ob.nsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase()));
    }
    if (userRole === 'RSM' || userRole === 'SC') {
      return allTsms.filter(tsm => obAssignments.some(ob => (ob.tsm || '').trim().toLowerCase() === tsm.toLowerCase() && ((ob.region || '').trim().toLowerCase() === (userRegion || '').trim().toLowerCase() || (ob.rsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase() || (ob.sc || '').trim().toLowerCase() === (userName || '').trim().toLowerCase())));
    }
    if ((userRole === 'TSM' || userRole === 'ASM')) {
      const trimmedName = (userName || '').trim().toLowerCase();
      return allTsms.filter(tsm => {
        const tsmLower = tsm.toLowerCase();
        return tsmLower === trimmedName || tsmLower.includes(trimmedName) || trimmedName.includes(tsmLower);
      });
    }
    return [];
  }, [obAssignments, distributors, userRole, userRegion, userName]);

  const entryRegions = useMemo(() => {
    const regions = new Set<string>();
    obAssignments.forEach(ob => { if (ob.region) regions.add(ob.region.trim()); });
    distributors.forEach(d => { if (d.region) regions.add(d.region.trim()); });
    return Array.from(regions).sort();
  }, [obAssignments, distributors]);

  const filteredEntryTSMList = useMemo(() => {
    if (!selectedEntryRegion) return tsmList;
    const tsmsInRegion = new Set<string>();
    obAssignments.forEach(ob => { if (ob.region === selectedEntryRegion && ob.tsm) tsmsInRegion.add(ob.tsm.trim()); });
    distributors.forEach(d => { if (d.region === selectedEntryRegion && d.tsm) tsmsInRegion.add(d.tsm.trim()); });
    return tsmList.filter(tsm => tsmsInRegion.has(tsm));
  }, [tsmList, selectedEntryRegion, obAssignments, distributors]);

  const filteredOBs = useMemo(() => {
    let obs = [...obAssignments];
    
    if (userRole === 'Director') {
      obs = obs.filter(ob => (ob.director || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    } else if (userRole === 'NSM') {
      obs = obs.filter(ob => (ob.nsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    } else if (userRole === 'RSM' || userRole === 'SC') {
      obs = obs.filter(ob => (ob.region || '').trim().toLowerCase() === (userRegion || '').trim().toLowerCase() || (ob.rsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase() || (ob.sc || '').trim().toLowerCase() === (userName || '').trim().toLowerCase());
    } else if ((userRole === 'TSM' || userRole === 'ASM')) {
      const trimmedName = (userName || '').trim().toLowerCase();
      obs = obs.filter(ob => {
        const tsmName = (ob.tsm || '').trim().toLowerCase();
        return tsmName === trimmedName || tsmName.includes(trimmedName) || trimmedName.includes(tsmName);
      });
      
      // Add TSM themselves as an option
      if (userName) {
        const tsmAssign = tsmAssignments.find(t => (t.tsm_name || '').trim().toLowerCase() === trimmedName);
        const tsmTown = tsmAssign?.town || distributors.find(d => (d.tsm || '').trim().toLowerCase() === trimmedName)?.town || '';
        const tsmRoutes = tsmAssign?.routes ? tsmAssign.routes.split(',').map((r: string) => r.trim()) : ['TSM Route'];
        
        obs.unshift({
          name: `*TSM - ${userName}`,
          contact: `TSM-${userName.replace(/\s+/g, '-')}`,
          town: tsmTown,
          distributor: distributors.find(d => d.town === tsmTown)?.name || '',
          routes: tsmRoutes,
          tsm: userName,
          total_shops: 50
        });
      }
    } else if (userRole === 'OB') {
      obs = obs.filter(ob => (ob.contact || '').trim() === (userContact || '').trim());
    }

    if (selectedTSM && userRole !== 'TSM' && userRole !== 'ASM') {
      const trimmedSelected = selectedTSM.trim().toLowerCase();
      obs = obs.filter(ob => {
        const tsmName = (ob.tsm || '').trim().toLowerCase();
        return tsmName === trimmedSelected || tsmName.includes(trimmedSelected) || trimmedSelected.includes(tsmName);
      });
      
      // Add TSM themselves as an option
      const tsmAssign = tsmAssignments.find(t => (t.tsm_name || '').trim().toLowerCase() === trimmedSelected);
      const tsmTown = tsmAssign?.town || distributors.find(d => (d.tsm || '').trim().toLowerCase() === trimmedSelected)?.town || '';
      const tsmRoutes = tsmAssign?.routes ? tsmAssign.routes.split(',').map((r: string) => r.trim()) : ['TSM Route'];

      obs.unshift({
        name: `*TSM - ${selectedTSM}`,
        contact: `TSM-${selectedTSM.replace(/\s+/g, '-')}`,
        town: tsmTown,
        distributor: distributors.find(d => d.town === tsmTown)?.name || '',
        routes: tsmRoutes,
        tsm: selectedTSM,
        total_shops: 50
      });
    }
    return obs;
  }, [obAssignments, selectedTSM, distributors, userRole, userRegion, userName, userContact, tsmAssignments]);

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

  const resetDatabase = async () => {
    setConfirmModal({
      message: "WARNING: This will delete ALL history (submitted orders and drafts). Continue?",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await apiFetch('/api/admin/reset', { method: 'POST' });
          if (res.ok) {
            setMessage({ text: 'History Cleared', type: 'success' });
            fetchHistory();
          }
        } catch (e) { setMessage({ text: 'Reset Failed', type: 'error' }); }
        finally { setTimeout(() => setMessage(null), 3000); }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const reseedTeam = async () => {
    setConfirmModal({
      message: "This will replace all current OB assignments with the new team structure. Continue?",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await apiFetch('/api/admin/reseed', { method: 'POST' });
          if (res.ok) {
            setMessage({ text: 'Team Re-seeded!', type: 'success' });
            fetchAdminData();
          }
        } catch (e) { setMessage({ text: 'Reseed Failed', type: 'error' }); }
        finally { setTimeout(() => setMessage(null), 3000); }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAppLogo(base64String);
        try {
          localStorage.setItem(LOGO_STORAGE_KEY, base64String);
        } catch (e) {
          console.error("Error saving logo to localStorage", e);
        }
        setMessage({ text: 'Logo Updated!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  

  if (!token || token === 'null') {
    return <Login onLogin={handleLogin} logo={appLogo} />;
  }

  if (showWelcome) {
    return (
      <WelcomeScreen 
        user={user} 
        stats={nationalStats} 
        hierarchy={hierarchy} 
        logo={appLogo}
        onEnter={() => {
          setShowWelcome(false);
          setView('home');
        }}
        isLoading={isLoadingNational}
        timeGone={timeGone}
        userEmail={userEmail}
        stockHistory={stockHistory}
      />
    );
  }

  if (view === 'home') {
    return (
      <>
        <PWAInstallPrompt />
        <HomeHub 
          setView={setView}
          userRole={userRole}
          userName={userName}
          logo={appLogo}
          tabs={APP_TABS}
          userEmail={userEmail}
        />
      </>
    );
  }

  if (view === 'dashboard' || view === 'command_center' || view === 'insights' || view === 'missing_entries') {
    try {
      if (isLoadingHistory || isLoadingAdmin) {
        return (
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-seablue animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Dashboard...</p>
                <button onClick={() => { fetchHistory(true); fetchAdminData(); }} className="text-[10px] font-bold text-seablue underline">Retry</button>
              </div>
            </div>
          </div>
        );
      }

      // If management role, show NationalDashboard (Management Dashboard)
      if (['SUPER ADMIN', 'ADMIN', 'RSM', 'NSM', 'DIRECTOR', 'SC', 'TSM', 'ASM', 'OB'].includes((userRole || '').toUpperCase())) {
        return (
          <div className="min-h-screen bg-slate-50 pb-40">
            <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
            {isLoadingNational ? (
              <div className="flex-1 flex items-center justify-center min-h-[80vh]">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-seablue animate-spin" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Dashboard...</p>
                </div>
              </div>
            ) : (
              <NationalDashboard 
                view={view}
                setView={setView}
                stats={nationalStats} 
                hierarchy={hierarchy} 
                categories={CATEGORIES} 
                skus={SKUS}
                isSyncing={isSyncingGlobal}
                onRefresh={syncEverything}
                userRole={userRole}
                userEmail={userEmail}
                userRegion={userRegion}
                userName={userName}
                userContact={userContact}
                timeGone={timeGone.percentage}
                holidays={appConfig.holidays || ''}
                lastSync={appConfig.last_sync_at}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                apiFetch={apiFetch}
                backupLogs={backupLogs}
                stockHistory={stockHistory}
                missingEntriesReport={missingEntriesReport}
                fetchMissingEntriesReport={fetchMissingEntriesReport}
                isLoadingMissingEntries={isLoadingMissingEntries}
                users={users}
                obAssignments={obAssignments}
                selectedHeadCountDetail={selectedHeadCountDetail}
                setSelectedHeadCountDetail={setSelectedHeadCountDetail}
              />
            )}
          </div>
        );
      }

      const normalizedRole = (userRole || '').trim().toUpperCase();
      const isStaff = ['ADMIN', 'SUPER ADMIN', 'TSM', 'ASM', 'RSM', 'NSM', 'DIRECTOR', 'SC', 'OB'].includes(normalizedRole);
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = today.slice(0, 7);
      
      // Role-based data filtering for TSM/OB
      const filteredHistory = history.filter(h => {
        if ((userRole === 'TSM' || userRole === 'ASM')) return h.tsm === userName;
        if (userRole === 'OB') return h.ob_contact === userContact;
        return false;
      });

      const filteredOBAssignments = obAssignments.filter(ob => {
        if (userRole === 'Admin' || userRole === 'Super Admin') return true;
        if (userRole === 'Director') return (ob.director || '').trim().toLowerCase() === (userName || '').trim().toLowerCase();
        if (userRole === 'NSM') return (ob.nsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase();
        if (userRole === 'RSM' || userRole === 'SC') return (ob.region || '').trim().toLowerCase() === (userRegion || '').trim().toLowerCase() || (ob.rsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase() || (ob.sc || '').trim().toLowerCase() === (userName || '').trim().toLowerCase();
        if (userRole === 'TSM' || userRole === 'ASM') return (ob.tsm || '').trim().toLowerCase() === (userName || '').trim().toLowerCase();
        if (userRole === 'OB') return (ob.contact || '').trim() === (userContact || '').trim();
        return false;
      }).map((ob: any) => {
        const obHierarchy = hierarchy?.find((h: any) => h.ob_id === ob.contact);
        const targets: Record<string, number> = {};
        if (obHierarchy) {
          let totalSpecificTarget = 0;
          CATEGORIES.forEach((cat: string) => {
            const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
            const val = Number(obHierarchy[targetKey]) || 0;
            targets[cat] = val;
            totalSpecificTarget += val;
          });
          
          if (totalSpecificTarget === 0) {
            const fallbackTarget = (Number(obHierarchy.target_ctn) || 0) / CATEGORIES.length;
            CATEGORIES.forEach((cat: string) => {
              targets[cat] = fallbackTarget;
            });
          }
        }
        return { ...ob, targets, target_ctn: obHierarchy?.target_ctn || ob.target_ctn || 0 };
      });

      const todayOrders = filteredHistory.filter(h => h.date && typeof h.date === 'string' && h.date === today);
      const mtdOrders = filteredHistory.filter(h => h.date && typeof h.date === 'string' && h.date.startsWith(currentMonth));
      
      const calculateCatTotals = (orders: any[]) => {
        const totals: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          totals[cat] = orders.reduce((sum, h) => {
            const items = h.order_data || {};
            const catAch = SKUS
              .filter(sku => sku.category === cat)
              .reduce((s, sku) => {
                const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
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
          totals[cat] = filteredOBAssignments.reduce((sum, ob) => sum + (ob.targets?.[cat] || 0), 0);
        });
        return totals;
      })();

      const chartData = (targetView === 'Brand' ? CATEGORIES : BRAND_GROUP_NAMES).map(cat => {
        let target = 0;
        let achievement = 0;
        let mtd = 0;

        if (targetView === 'Brand') {
          target = globalTargets[cat] || 0;
          achievement = globalToday[cat] || 0;
          mtd = globalMtd[cat] || 0;
        } else {
          const brandsInGroup = BRAND_GROUPS[cat] || [];
          target = brandsInGroup.reduce((sum, brand) => sum + (globalTargets[brand] || 0), 0);
          achievement = brandsInGroup.reduce((sum, brand) => sum + (globalToday[brand] || 0), 0);
          mtd = brandsInGroup.reduce((sum, brand) => sum + (globalMtd[brand] || 0), 0);
        }

        return {
          name: cat,
          Target: target,
          Achievement: achievement,
          MTD: mtd,
          AchPercent: target > 0 ? ((mtd / target) * 100).toFixed(1) : 0
        };
      });

      // TSM Sales Analysis
      const tsmAnalysis = tsmList.map(tsmName => {
        const tsmOrders = mtdOrders.filter(h => h.tsm === tsmName);
        const totals: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          totals[cat] = tsmOrders.reduce((sum, h) => {
            const items = h.order_data || {};
            const catAch = SKUS
              .filter(sku => sku.category === cat)
              .reduce((s, sku) => {
                const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
              }, 0);
            return sum + catAch;
          }, 0);
        });
        
        const totalAch = Object.values(totals).reduce((a: number, b: number) => a + b, 0);
        const tsmOBs = obAssignments.filter(ob => ob.tsm === tsmName && !isTSMEntry(ob.name, ob.tsm) && !(ob.contact || '').startsWith('TSM-'));
        const totalTarget = tsmOBs.reduce((sum, ob) => {
          return sum + Object.values(ob.targets || {}).reduce((a: number, b: number) => a + b, 0);
        }, 0);

        return {
          name: tsmName,
          totals,
          totalAch,
          target: totalTarget,
          obCount: tsmOBs.length,
          avgSalesPerOB: tsmOBs.length > 0 ? totalAch / tsmOBs.length : 0
        };
      }).sort((a, b) => b.totalAch - a.totalAch);

      // OB Sales Analysis
      const obAnalysis = filteredOBAssignments.map(ob => {
        const obOrders = mtdOrders.filter(h => h.ob_contact === ob.contact);
        const totals: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          totals[cat] = obOrders.reduce((sum, h) => {
            const items = h.order_data || {};
            const catAch = SKUS
              .filter(sku => sku.category === cat)
              .reduce((s, sku) => {
                const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
                const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
                return s + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
              }, 0);
            return sum + catAch;
          }, 0);
        });
        
        const totalVisited = obOrders.reduce((sum, h) => sum + (h.visited_shops || 0), 0);
        const totalProductive = obOrders.reduce((sum, h) => sum + (h.productive_shops || 0), 0);
        const totalShops = obOrders.length * 50;

        const lastEntry = obOrders.length > 0 ? obOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : '-';
        const entryDays = obOrders.length;
        const totalWorkingDays = timeGone.passed;
        const consistencyScore = totalWorkingDays > 0 ? (entryDays / totalWorkingDays) * 100 : 0;

        return {
          name: ob.name,
          contact: ob.contact,
          totals,
          totalAch: Object.values(totals).reduce((a: number, b: number) => a + b, 0),
          target: Object.values(ob.targets || {}).reduce((a: number, b: number) => a + b, 0),
          shops: { t: totalShops, v: totalVisited, p: totalProductive },
          lastEntry,
          entryDays,
          consistencyScore
        };
      }).sort((a, b) => b.totalAch - a.totalAch);

      // Route Sales Analysis
      const routeAnalysis = mtdOrders.reduce((acc: any[], h) => {
        if ((userRole === 'TSM' || userRole === 'ASM') && h.tsm !== userName) return acc;
        if (userRole === 'OB' && h.ob_contact !== userContact) return acc;
        const route = h.route || 'Unknown';
        let routeData = acc.find(r => r.name === route);
        if (!routeData) {
          routeData = { name: route, obName: h.order_booker, ach: 0, shops: { t: 0, v: 0, p: 0 } };
          acc.push(routeData);
        }
        const items = h.order_data || {};
        const orderAch = SKUS.reduce((sum, sku) => {
          const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
          return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
        }, 0);
        routeData.ach += orderAch;
        routeData.shops.t += (h.total_shops || 0);
        routeData.shops.v += (h.visited_shops || 0);
        routeData.shops.p += (h.productive_shops || 0);
        const productiveRatio = routeData.shops.v > 0 ? (routeData.shops.p / routeData.shops.v) * 100 : 0;
        const visitCoverage = routeData.shops.t > 0 ? (routeData.shops.v / routeData.shops.t) * 100 : 0;
        const salesPerf = Math.min(100, (routeData.ach / 10) * 100); // Dummy target 10
        
        const score = (0.5 * salesPerf) + (0.3 * visitCoverage) + (0.2 * productiveRatio);
        let scoreLabel = 'Weak';
        if (score >= 90) scoreLabel = 'Excellent';
        else if (score >= 70) scoreLabel = 'Good';
        else if (score >= 50) scoreLabel = 'Average';
        
        routeData.score = score;
        routeData.scoreLabel = scoreLabel;

        return acc;
      }, []).sort((a, b) => b.ach - a.ach);

      const routeWeakness = Array.from(new Set(mtdOrders.map(o => o.route))).map(routeName => {
        const routeOrders = mtdOrders.filter(o => o.route === routeName).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
        const sales = routeOrders.map(o => {
          const items = o.order_data || {};
          return SKUS.reduce((sum, sku) => {
            const item = items[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
            const packs = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
            return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
          }, 0);
        });
        
        const recent = sales.slice(0, 4).reduce((a, b) => a + b, 0);
        const older = sales.slice(4, 8).reduce((a, b) => a + b, 0);
        const isDeclining = sales.length >= 4 && recent < older;
        
        return {
          name: routeName,
          obName: routeOrders[0]?.order_booker,
          sales,
          isDeclining,
          recentAch: recent
        };
      }).filter(r => r.isDeclining).sort((a, b) => a.recentAch - b.recentAch);

      const obRanking = [...obAnalysis].sort((a, b) => b.totalAch - a.totalAch);
      const bottom10OBs = [...obRanking].reverse().slice(0, 10);
      const underperformingRoutes = routeAnalysis.filter(r => r.shops.v > 0 && (r.shops.p / r.shops.v) < 0.6);
      const weakBrands = CATEGORIES.filter(cat => {
        const ach = globalMtd[cat] || 0;
        const tgt = globalTargets[cat] || 0;
        return tgt > 0 && (ach / tgt) < (timeGone.percentage / 100) * 0.7;
      });

      const zeroVisitRoutes = routeAnalysis.filter(r => r.shops.t > 0 && r.shops.v === 0).sort((a, b) => b.shops.t - a.shops.t);
      const highVisitLowSales = routeAnalysis.filter(r => r.shops.v > 10 && r.ach < 2);
      const highProdLowSales = routeAnalysis.filter(r => r.shops.p > 5 && r.ach < 1);

    return (
      <div className="min-h-screen bg-slate-50 pb-10">
        <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} logo={appLogo} />
        <header className="bg-white border-b border-slate-200 p-4 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-seablue leading-tight">Dashboard</h1>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black bg-seablue/10 text-seablue px-1.5 py-0.5 rounded uppercase tracking-widest">
                    {userRole === 'RSM' ? 'Regional Sales Manager' : 
                     userRole === 'SC' ? 'Sales Coordinator' : 
                     userRole === 'NSM' ? 'National Sales Manager' : 
                     userRole === 'TSM' ? 'Territory Sales Manager' : 
                     userRole === 'ASM' ? 'Area Sales Manager' : 
                     userRole === 'OB' ? 'Order Booker' : 
                     userRole}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{userName}</span>
                </div>
              </div>
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
                    chartData.map(d => `*${d.name}:*\n  Ach: ${d.Achievement.toFixed(2)}\n  Brand Target: ${d.Target.toFixed(2)}`).join('\n') +
                    `\n------------------\n` +
                    `*Total Today:* ${(Object.values(globalToday) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(2)}\n` +
                    `*Total Brand Target:* ${(Object.values(globalTargets) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(2)}`;
                  
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card-clean p-4 bg-seablue text-white shadow-blue-200 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-white/60">Today Sales</div>
              <div className="text-2xl font-black">{(Object.values(globalToday) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(1)}</div>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="text-[7px] font-bold text-white/80 uppercase">
                    {cat}: {globalToday[cat].toFixed(1)}
                  </div>
                ))}
              </div>
            </div>
            <div className="card-clean p-4 bg-emerald-600 text-white shadow-emerald-200 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-white/60">MTD Sales</div>
              <div className="text-2xl font-black">{(Object.values(globalMtd) as number[]).reduce((a: number, b: number) => a + b, 0).toFixed(1)}</div>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="text-[7px] font-bold text-white/80 uppercase">
                    {cat}: {globalMtd[cat].toFixed(1)}
                  </div>
                ))}
              </div>
            </div>
            <div className="card-clean p-4 bg-white border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400">Time Gone</div>
              <div className="text-2xl font-black text-amber-500">{timeGone.percentage.toFixed(0)}%</div>
              <div className="text-[8px] font-bold mt-1 text-slate-400 uppercase">{timeGone.passed}/{timeGone.total} Working Days</div>
            </div>
            <div className="card-clean p-4 bg-white border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400">Overall Ach %</div>
              <div className="text-2xl font-black text-emerald-600">
                {(() => {
                  const ach = (Object.values(globalMtd) as number[]).reduce((a: number, b: number) => a + b, 0);
                  const tgt = filteredOBAssignments.reduce((sum, ob) => sum + Object.values(ob.targets || {}).reduce((a: number, b: number) => a + b, 0), 0);
                  return tgt > 0 ? ((ach / tgt) * 100).toFixed(0) : 0;
                })()}%
              </div>
              <div className="text-[8px] font-bold mt-1 text-slate-400 uppercase">vs {(userRole === 'Admin' || userRole === 'Super Admin') ? 'National' : 'My Team'} Target</div>
            </div>
          </div>

          {/* Route Weakness Detection - TOP in Stats */}
          <div className="card-clean p-4">
            <h3 className="text-sm font-bold mb-4 text-rose-600 uppercase tracking-widest">Route Weakness Detection (Declining Trend - Last 8 Visits)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase">
                    <th className="py-2">Route</th>
                    <th className="py-2">OB Name</th>
                    <th className="py-2 text-center">Last 8 Sales</th>
                    <th className="py-2 text-right">Recent Ach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {routeWeakness.map(route => (
                    <tr key={route.name} className="hover:bg-rose-50/50">
                      <td className="py-2 font-bold text-slate-700">{route.name}</td>
                      <td className="py-2 text-slate-500">{route.obName}</td>
                      <td className="py-2 text-center">
                        <div className="flex justify-center gap-1">
                          {route.sales.map((s, i) => (
                            <div key={i} className={`w-2 h-4 rounded-sm ${s > 0 ? 'bg-rose-400' : 'bg-slate-200'}`} title={`Sale: ${s.toFixed(1)}`}></div>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 text-right font-black text-rose-600">{route.recentAch.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-clean p-4 md:col-span-2 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-seablue uppercase tracking-widest">{(userRole === 'Admin' || userRole === 'Super Admin') ? 'National' : 'My Team'} OB Performance (MTD)</h3>
                <span className="text-[10px] font-bold bg-seablue/10 text-seablue px-2 py-0.5 rounded-full">{obAnalysis.length} OBs</span>
              </div>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase sticky left-0 bg-slate-50 z-10">OB Name</th>
                      <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase">Town</th>
                      {CATEGORIES.map(cat => (
                        <th key={cat} className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase text-center border-l border-slate-100">
                          <div className="text-seablue">{cat}</div>
                          <div className="flex justify-between gap-2 mt-1 px-1">
                            <span>Tgt</span>
                            <span>Ach</span>
                            <span>%</span>
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase text-right border-l border-slate-100">Total %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {obAnalysis.map(ob => {
                      const assignment = filteredOBAssignments.find(a => a.contact === ob.contact);
                      return (
                        <tr key={ob.contact} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-2 text-[10px] font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{ob.name}</td>
                          <td className="px-3 py-2 text-[9px] text-slate-500 font-medium">{assignment?.town}</td>
                          {CATEGORIES.map(cat => {
                            const tgt = assignment?.targets?.[cat] || 0;
                            const ach = ob.totals[cat] || 0;
                            const perc = tgt > 0 ? (ach / tgt) * 100 : 0;
                            return (
                              <td key={cat} className="px-1 py-2 text-[9px] font-bold text-center border-l border-slate-100">
                                <div className="flex justify-between gap-2 px-1">
                                  <span className="text-slate-400">{tgt.toFixed(1)}</span>
                                  <span className="text-slate-700">{ach.toFixed(1)}</span>
                                  <span className={perc >= timeGone.percentage ? 'text-emerald-600' : 'text-amber-600'}>{perc.toFixed(0)}%</span>
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-[10px] font-black text-right border-l border-slate-100">
                            <span className={ob.target > 0 && (ob.totalAch / ob.target * 100) >= timeGone.percentage ? 'text-emerald-600' : 'text-amber-600'}>
                              {ob.target > 0 ? ((ob.totalAch / ob.target) * 100).toFixed(0) : 0}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          <div className="card-clean p-6">
            <MissingEntriesReport 
              report={missingEntriesReport} 
              onRefresh={fetchMissingEntriesReport} 
              isLoading={isLoadingMissingEntries} 
              selectedMonth={selectedMonth} 
            />
          </div>
          </div>

          {/* Target vs Achievement (MTD) - Added here as requested */}
          <div className="card-clean p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-bold text-seablue uppercase tracking-widest">{targetView} Brand Target vs Achievement</h3>
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
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase">
                    <th className="py-2">{targetView} Name</th>
                    <th className="py-2 text-right">Brand Target (Ctn)</th>
                    <th className="py-2 text-right">Ach (Ctn)</th>
                    <th className="py-2 text-right">Ach %</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {chartData.map(d => (
                    <tr key={d.name} className="hover:bg-slate-50">
                      <td className="py-2 font-bold text-slate-700">{d.name}</td>
                      <td className="py-2 text-right font-mono">{d.Target.toFixed(1)}</td>
                      <td className="py-2 text-right font-mono font-bold text-seablue">{d.MTD.toFixed(1)}</td>
                      <td className={`py-2 text-right font-black ${Number(d.AchPercent) >= timeGone.percentage ? 'text-emerald-600' : 'text-amber-600'}`}>{d.AchPercent}%</td>
                      <td className="py-2 text-right">
                        <span className={`px-1.5 py-0.5 rounded-full font-bold text-[8px] uppercase ${Number(d.AchPercent) >= timeGone.percentage ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {Number(d.AchPercent) >= timeGone.percentage ? 'On Track' : 'Behind'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-clean p-4">
              <h3 className="text-sm font-bold mb-4 text-seablue uppercase">{targetView} Wise Brand Target vs Achievement Chart</h3>
              <div className="h-[300px] min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e3a8a' }} />
                    <Bar dataKey="Target" name="Brand Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="MTD" name="MTD Ach" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-clean p-4">
              <h3 className="text-sm font-bold mb-4 text-seablue uppercase">Brand Performance %</h3>
              <div className="space-y-4">
                {chartData.map(d => (
                  <div key={d.name} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-600">{d.name}</span>
                      <span className={Number(d.AchPercent) >= timeGone.percentage ? 'text-emerald-600' : 'text-amber-600'}>
                        {d.AchPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${Number(d.AchPercent) >= timeGone.percentage ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(Number(d.AchPercent), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TSM Activity Report - Added here as requested */}
          <div className="card-clean p-4">
            <h3 className="text-sm font-bold mb-4 text-seablue uppercase tracking-widest">TSM Activity Report</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase">
                    <th className="py-2">TSM Name</th>
                    <th className="py-2 text-center">Total OBs</th>
                    <th className="py-2 text-center">Active OBs</th>
                    <th className="py-2 text-center">T/V/P</th>
                    <th className="py-2 text-right">Achievement</th>
                    <th className="py-2 text-right">Target</th>
                    <th className="py-2 text-right">Ach %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tsmList.map(tsm => {
                    const tsmOBs = obAssignments.filter(ob => ob.tsm === tsm && !isTSMEntry(ob.name, ob.tsm) && !(ob.contact || '').startsWith('TSM-'));
                    const tsmOrders = mtdOrders.filter(o => tsmOBs.some(ob => ob.contact === o.ob_contact));
                    const activeOBs = new Set(tsmOrders.map(o => o.ob_contact)).size;
                    const totalVisited = tsmOrders.reduce((sum, o) => sum + (o.visited_shops || 0), 0);
                    const totalProductive = tsmOrders.reduce((sum, o) => sum + (o.productive_shops || 0), 0);
                    const totalShops = tsmOrders.length * 50;
                    const tsmAch = tsmOrders.reduce((sum, o) => {
                      const orderData = typeof o.order_data === 'string' ? JSON.parse(o.order_data) : (o.order_data || {});
                      const ach = calculateAchievement(orderData);
                      return sum + Object.values(ach).reduce((a: number, b: any) => a + b.value, 0);
                    }, 0);
                    const tsmTarget = tsmOBs.reduce((sum, ob) => sum + Object.values(ob.targets || {}).reduce((a: number, b: number) => a + b, 0), 0);
                    const achPerc = tsmTarget > 0 ? (tsmAch / tsmTarget) * 100 : 0;

                    return (
                      <tr key={tsm} className="hover:bg-slate-50">
                        <td className="py-2 font-bold text-slate-700">{tsm}</td>
                        <td className="py-2 text-center">{tsmOBs.length}</td>
                        <td className="py-2 text-center">{activeOBs}</td>
                        <td className="py-2 text-center text-slate-500">{totalShops}/{totalVisited}/{totalProductive}</td>
                        <td className="py-2 text-right font-mono font-bold text-seablue">{tsmAch.toFixed(1)}</td>
                        <td className="py-2 text-right font-mono text-slate-400">{tsmTarget.toFixed(1)}</td>
                        <td className={`py-2 text-right font-black ${achPerc >= timeGone.percentage ? 'text-emerald-600' : 'text-amber-600'}`}>{achPerc.toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-clean p-4">
            <h3 className="text-sm font-bold mb-4 text-seablue uppercase tracking-widest">Route-to-Route Analysis (MTD)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase">
                    <th className="py-2">Route Name</th>
                    <th className="py-2">OB Name</th>
                    <th className="py-2 text-center">T/V/P</th>
                    {CATEGORIES.map(cat => <th key={cat} className="py-2 text-center">{cat}</th>)}
                    <th className="py-2 text-right">Achievement</th>
                    <th className="py-2 text-right">Efficiency</th>
                    <th className="py-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {routeAnalysis.map(route => (
                    <tr key={route.name} className="hover:bg-slate-50">
                      <td className="py-2 font-bold text-slate-700">{route.name}</td>
                      <td className="py-2 text-slate-500">{route.obName}</td>
                      <td className="py-2 text-center text-slate-500">{route.shops.t}/{route.shops.v}/{route.shops.p}</td>
                      {CATEGORIES.map(cat => (
                        <td key={cat} className="py-2 text-center font-mono">{route.totals[cat].toFixed(1)}</td>
                      ))}
                      <td className="py-2 text-right font-mono font-bold text-seablue">{route.ach.toFixed(1)}</td>
                      <td className="py-2 text-right">
                        <span className={`px-1.5 py-0.5 rounded-full font-bold ${route.shops.v > 0 && (route.shops.p / route.shops.v) > 0.7 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {route.shops.v > 0 ? ((route.shops.p / route.shops.v) * 100).toFixed(0) : 0}%
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <span className={`px-1.5 py-0.5 rounded-full font-bold text-[8px] uppercase ${
                          route.scoreLabel === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                          route.scoreLabel === 'Good' ? 'bg-blue-100 text-blue-700' :
                          route.scoreLabel === 'Average' ? 'bg-orange-100 text-orange-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {route.scoreLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {routeAnalysis.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">No route data available for this month</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-clean p-4 md:col-span-2">
              <h3 className="text-sm font-bold mb-4 text-seablue uppercase tracking-widest">OB Ranking (Brand Wise)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase">
                      <th className="py-2">OB Name</th>
                      {CATEGORIES.map(cat => <th key={cat} className="py-2 text-center">{cat}</th>)}
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {obRanking.slice(0, 50).map((ob, idx) => (
                      <tr key={ob.contact} className="hover:bg-slate-50">
                        <td className="py-2 font-bold text-slate-700">
                          <span className="text-slate-300 mr-1">{idx + 1}.</span>
                          {ob.name} <span className="text-[8px] text-slate-400">({ob.contact})</span>
                        </td>
                        {CATEGORIES.map(cat => (
                          <td key={cat} className="py-2 text-center font-mono">{ob.totals[cat].toFixed(1)}</td>
                        ))}
                        <td className="py-2 text-right font-black text-seablue">{ob.totalAch.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-clean p-4 md:col-span-2">
              <h3 className="text-sm font-bold mb-4 text-rose-600 uppercase">Bottom 50 OBs (Risk Analysis)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase">
                      <th className="py-2">OB Name</th>
                      <th className="py-2">TSM</th>
                      <th className="py-2 text-right">Ach %</th>
                      <th className="py-2 text-right">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...obRanking].reverse().slice(0, 50).map((ob, idx) => {
                      const assignment = obAssignments.find(a => a.contact === ob.contact);
                      const achPerc = ob.target > 0 ? (ob.totalAch / ob.target) * 100 : 0;
                      return (
                        <tr key={ob.contact} className="hover:bg-rose-50/30">
                          <td className="py-2 font-bold text-slate-700">
                            <span className="text-slate-300 mr-1">{obRanking.length - idx}.</span>
                            {ob.name} <span className="text-[8px] text-slate-400">({ob.contact})</span>
                          </td>
                          <td className="py-2 text-slate-500">{assignment?.tsm}</td>
                          <td className={`py-2 text-right font-bold ${achPerc < timeGone.percentage ? 'text-rose-600' : 'text-amber-600'}`}>
                            {achPerc.toFixed(0)}%
                          </td>
                          <td className="py-2 text-right font-black text-rose-600">{ob.totalAch.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-clean p-4 md:col-span-2">
              <h3 className="text-sm font-bold mb-4 text-rose-600 uppercase">Critical Alerts (Routes)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {zeroVisitRoutes.slice(0, 4).map(route => (
                  <div key={route.name} className="p-3 border border-red-100 bg-red-50/30 rounded-xl space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] font-black text-slate-700 uppercase">{route.name}</div>
                      <div className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[7px] font-bold uppercase">Zero Visits</div>
                    </div>
                    <div className="text-[9px] text-slate-500">Total Shops: <span className="font-bold">{route.shops.t}</span></div>
                  </div>
                ))}
                {highVisitLowSales.slice(0, 4).map(route => (
                  <div key={route.name} className="p-3 border border-amber-100 bg-amber-50/30 rounded-xl space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] font-black text-slate-700 uppercase">{route.name}</div>
                      <div className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[7px] font-bold uppercase">High Visit Low Sale</div>
                    </div>
                    <div className="text-[9px] text-slate-500">Visits: <span className="font-bold">{route.shops.v}</span> | Ach: <span className="font-bold">{route.ach.toFixed(1)}</span></div>
                  </div>
                ))}
                {highProdLowSales.slice(0, 4).map(route => (
                  <div key={route.name} className="p-3 border border-orange-100 bg-orange-50/30 rounded-xl space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] font-black text-slate-700 uppercase">{route.name}</div>
                      <div className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[7px] font-bold uppercase">High Prod Low Sale</div>
                    </div>
                    <div className="text-[9px] text-slate-500">Prod: <span className="font-bold">{route.shops.p}</span> | Ach: <span className="font-bold">{route.ach.toFixed(1)}</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-clean p-4 md:col-span-2">
              <h3 className="text-sm font-bold mb-4 text-amber-600 uppercase">Low Sales Routes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {underperformingRoutes.slice(0, 6).map(route => (
                  <div key={route.name} className="p-3 border border-amber-100 bg-amber-50/30 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-black text-slate-700 uppercase">{route.name}</div>
                      <div className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-bold uppercase">Low Sales</div>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Achievement:</span>
                      <span className="font-bold text-amber-700">{route.ach.toFixed(1)} Ctns</span>
                    </div>
                    <div className="w-full bg-amber-100 h-1 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (route.ach / 10) * 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reports Section Merged into Stats */}
          {(userRole === 'Admin' || userRole === 'Super Admin' || userRole === 'RSM' || userRole === 'NSM' || userRole === 'Director' || userRole === 'SC') && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-3 px-4">
                <div className="h-px flex-1 bg-slate-200"></div>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Intelligence Reports</h2>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>
              
              <ReportsView 
                history={nationalStats} 
                obAssignments={obAssignments} 
                hierarchy={hierarchy}
                tsmList={tsmList} 
                appConfig={appConfig} 
                getPSTDate={getPSTDate} 
                SKUS={SKUS} 
                CATEGORIES={CATEGORIES} 
                userRole={userRole} 
                userName={userName} 
                userRegion={userRegion}
                userContact={userContact}
                onRefresh={syncEverything}
                isSyncing={isSyncingGlobal}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
              />
            </div>
          )}

          {/* Admin Quick Actions */}
          {((userRole === 'Admin' || userRole === 'Super Admin') && SUPER_ADMIN_EMAILS.includes(userEmail || '')) && (
            <div className="mt-12 p-6 bg-slate-900 rounded-3xl text-white shadow-2xl shadow-slate-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Admin Quick Actions</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Manage Data Sync & Configuration</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => setView('admin')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    Google Sheets Config
                  </button>
                  <button 
                    onClick={syncEverything}
                    disabled={isSyncingGlobal || !appConfig.google_spreadsheet_id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSyncingGlobal ? 'bg-emerald-500/50 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'}`}
                  >
                    <Cloud className={`w-4 h-4 ${isSyncingGlobal ? 'animate-spin' : ''}`} />
                    {isSyncingGlobal ? 'Syncing...' : 'Master Sync Now'}
                  </button>
                </div>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Spreadsheet ID</div>
                  <div className="text-[10px] font-mono text-slate-300 truncate">{appConfig.google_spreadsheet_id || 'Not Configured'}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Service Account</div>
                  <div className="text-[10px] font-mono text-slate-300 truncate">{appConfig.google_service_account_email || 'Not Configured'}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Last Master Sync</div>
                  <div className="text-[10px] font-mono text-emerald-400">{appConfig.last_sync_at || 'Never'}</div>
                </div>
              </div>
            </div>
          )}

          </>
          )}
        </main>
      </div>
    );
    } catch (err) {
      console.error("Dashboard Error:", err);
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="card-clean p-8 max-w-md text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
              <h2 className="text-xl font-black text-seablue uppercase">Stats Error</h2>
              <p className="text-sm text-slate-500">There was an error processing the sales data. This usually happens if some entries have malformed data.</p>
              <button onClick={() => { fetchHistory(true); fetchAdminData(); }} className="btn-seablue w-full py-3">Retry Loading</button>
            </div>
          </div>
        </div>
      );
    }
  }

  if (view === 'stats') {
    if (!['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM', 'OB'].includes(userRole || '')) {
      setView('dashboard');
      return null;
    }
    return (
      <div className="min-h-screen bg-slate-50 pb-40">
        <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
        {isLoadingNational ? (
          <div className="flex-1 flex items-center justify-center min-h-[80vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-seablue animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Stats...</p>
            </div>
          </div>
        ) : (
          <StatsView 
            history={nationalStats} 
            obAssignments={hierarchy} 
            users={users}
            tsmList={tsmList} 
            appConfig={appConfig} 
            getPSTDate={getPSTDate} 
            SKUS={SKUS} 
            CATEGORIES={CATEGORIES} 
            userRole={userRole}
            userName={userName}
            userRegion={userRegion}
            userContact={userContact}
            onRefresh={syncEverything}
            isSyncing={isSyncingGlobal}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            dailyStatus={dailyStatus}
            fetchDailyStatus={fetchDailyStatus}
            isLoadingDailyStatus={isLoadingDailyStatus}
            missingEntriesReport={missingEntriesReport}
            fetchMissingEntriesReport={fetchMissingEntriesReport}
            isLoadingMissingEntries={isLoadingMissingEntries}
          />
        )}
      </div>
    );
  }

  if (view === 'reports') {
    if (!['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM', 'OB'].includes(userRole || '')) {
      setView('dashboard');
      return null;
    }
    return (
      <ErrorBoundary>
        <PWAInstallPrompt />
        <div className="min-h-screen bg-slate-50 pb-40">
        <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
        {isLoadingNational ? (
          <div className="flex-1 flex items-center justify-center min-h-[80vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-seablue animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Reports...</p>
            </div>
          </div>
        ) : (
          <ReportsView 
            history={nationalStats} 
            obAssignments={obAssignments} 
            hierarchy={hierarchy}
            tsmList={tsmList} 
            appConfig={appConfig} 
            getPSTDate={getPSTDate} 
            SKUS={SKUS} 
            CATEGORIES={CATEGORIES} 
            userRole={userRole} 
            userName={userName} 
            userRegion={userRegion}
            userContact={userContact}
            onRefresh={syncEverything}
            isSyncing={isSyncingGlobal}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />
        )}
      </div>
      </ErrorBoundary>
    );
  }

  if (view === 'tsm_performance') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-50 pb-40">
        <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
        {isLoadingNational ? (
          <div className="flex-1 flex items-center justify-center min-h-[80vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-seablue animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Target vs Achievement...</p>
            </div>
          </div>
        ) : (
          <TSMPerformanceView 
            history={nationalStats} 
            hierarchy={hierarchy} 
            CATEGORIES={CATEGORIES} 
            SKUS={SKUS}
            userRole={userRole}
            userName={userName}
            userRegion={userRegion}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            setView={setView}
            onRefresh={syncEverything}
            isSyncing={isSyncingGlobal}
          />
        )}
      </div>
      </ErrorBoundary>
    );
  }

  if (view === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="card-clean p-6 max-w-sm w-full bg-white shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Admin Access</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authentication Required</p>
                </div>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                if (fd.get('password') === 'Admin@1234' && SUPER_ADMIN_EMAILS.includes(userEmail || '')) {
                  setIsAdminAuthenticated(true);
                } else {
                  setMessage({ text: 'Incorrect password or unauthorized email', type: 'error' });
                  setTimeout(() => setMessage(null), 3000);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-seablue/20 focus:border-seablue outline-none transition-all"
                    placeholder="Enter admin password"
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-seablue w-full py-3">Unlock Admin Panel</button>
              </form>
            </div>
          </div>
        </div>
      );
    }

    if (isLoadingAdmin) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-seablue animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Admin...</p>
              <button onClick={fetchAdminData} className="text-[10px] font-bold text-seablue underline">Retry</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 pb-10">
        <MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} logo={appLogo} />
        <header className="bg-white border-b border-slate-200 p-4 shadow-sm">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white">
                <Settings className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold text-seablue">Admin Panel</h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={syncEverything} 
                disabled={isSyncingGlobal || !appConfig.google_spreadsheet_id}
                className="p-2 hover:bg-slate-100 rounded-full text-seablue relative" 
                title="Master Sync & Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncingGlobal || isLoadingAdmin || isLoadingHistory ? 'animate-spin' : ''}`} />
                {isSyncingGlobal && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-clean p-4 space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</h3>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Database:</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Google Sheets:</span>
                <span className={`text-[10px] font-bold uppercase ${googleStatus.connected ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {googleStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Retention:</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Never Delete data</span>
              </div>
            </div>
            <div className="card-clean p-4 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Recovery & History</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800">
                    <History className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-tight">Restore Historical Targets</span>
                  </div>
                  <p className="text-[9px] text-amber-700 font-medium">Pull targets from a specific month's sheet. By default it looks for 'Team_Data_YYYY_MM'. You can override the sheet name if needed.</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[8px] font-bold text-amber-700 uppercase">Month</label>
                        <input 
                          type="month" 
                          id="restoreMonth"
                          defaultValue="2026-03"
                          className="text-[10px] p-1 border border-amber-200 rounded bg-white outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[8px] font-bold text-amber-700 uppercase">Sheet Name (Optional)</label>
                        <input 
                          type="text" 
                          id="restoreSheetName"
                          placeholder="e.g. Mar-26"
                          className="text-[10px] p-1 border border-amber-200 rounded bg-white outline-none"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        const month = (document.getElementById('restoreMonth') as HTMLInputElement).value;
                        const sheetName = (document.getElementById('restoreSheetName') as HTMLInputElement).value;
                        if (!month) {
                          setMessage({ text: 'Please select a month', type: 'error' });
                          setTimeout(() => setMessage(null), 3000);
                          return;
                        }
                        setConfirmModal({
                          message: `Restore targets for ${month} ${sheetName ? `from sheet '${sheetName}'` : ''}?`,
                          onConfirm: async () => {
                            setConfirmModal(null);
                            setIsSyncing(true);
                            try {
                              const res = await apiFetch('/api/admin/pull-historical-targets', { 
                                method: 'POST',
                                body: JSON.stringify({ month, sheetName })
                              });
                              const data = await res.json();
                              if (res.ok) setMessage({ text: data.message, type: 'success' });
                              else setMessage({ text: 'Failed: ' + data.error, type: 'error' });
                            } catch (err: any) {
                              setMessage({ text: 'Error: ' + err.message, type: 'error' });
                            } finally {
                              setIsSyncing(false);
                              fetchAdminData();
                              setTimeout(() => setMessage(null), 5000);
                            }
                          },
                          onCancel: () => setConfirmModal(null)
                        });
                      }}
                      disabled={isSyncing}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {isSyncing ? 'Restoring...' : 'Restore Now'}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CloudDownload className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-tight">Full History Pull</span>
                  </div>
                  <p className="text-[9px] text-emerald-700 font-medium">Pull ALL sales data from Google Sheets, ignoring the safety month locks. Use this to verify complete data from day 1.</p>
                  <button 
                    onClick={() => {
                      setConfirmModal({
                        message: 'Pull ALL historical sales data? This will ignore month locks and might take a while.',
                        onConfirm: async () => {
                          setConfirmModal(null);
                          setIsSyncingGlobal(true);
                          try {
                            const res = await apiFetch('/api/admin/pull-historical-sales', { method: 'POST' });
                            const data = await res.json();
                            if (res.ok) {
                              setMessage({ text: data.message, type: 'success' });
                              fetchHistory(true);
                              fetchNationalData();
                            } else setMessage({ text: 'Failed: ' + data.error, type: 'error' });
                          } catch (err: any) {
                            setMessage({ text: 'Error: ' + err.message, type: 'error' });
                          } finally {
                            setIsSyncingGlobal(false);
                            setTimeout(() => setMessage(null), 5000);
                          }
                        },
                        onCancel: () => setConfirmModal(null)
                      });
                    }}
                    disabled={isSyncingGlobal}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {isSyncingGlobal ? 'Pulling...' : 'Pull Full History'}
                  </button>
                </div>
              </div>
            </div>

            <div className="card-clean p-4 space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    setConfirmModal({
                      message: 'Restore March 2026 Targets to Google Sheets? This will create a separate sheet for March.',
                      onConfirm: async () => {
                        setConfirmModal(null);
                        setIsSyncing(true);
                        try {
                          const res = await apiFetch('/api/admin/push-historical-targets', { 
                            method: 'POST',
                            body: JSON.stringify({ month: '2026-03' })
                          });
                          const data = await res.json();
                          if (res.ok) setMessage({ text: data.message, type: 'success' });
                          else setMessage({ text: 'Failed: ' + data.error, type: 'error' });
                        } catch (err: any) {
                          setMessage({ text: 'Error: ' + err.message, type: 'error' });
                        } finally {
                          setIsSyncing(false);
                          setTimeout(() => setMessage(null), 5000);
                        }
                      },
                      onCancel: () => setConfirmModal(null)
                    });
                  }}
                  disabled={isSyncing}
                  className="btn-seablue py-2 text-[10px] flex items-center justify-center gap-1"
                >
                  <History className="w-3 h-3" /> Restore Mar-26 Targets
                </button>
                <button 
                  onClick={() => {
                    setConfirmModal({
                      message: 'Are you sure you want to clean duplicates? This will keep the latest record for each OB/Date/Month combination.',
                      onConfirm: async () => {
                        setConfirmModal(null);
                        setIsSyncing(true);
                        try {
                          const res = await apiFetch('/api/admin/clean-duplicates', { method: 'POST' });
                          const data = await res.json();
                          if (res.ok) setMessage({ text: data.message, type: 'success' });
                          else setMessage({ text: 'Failed to clean duplicates: ' + data.error, type: 'error' });
                        } catch (err: any) {
                          setMessage({ text: 'Error: ' + err.message, type: 'error' });
                        } finally {
                          setIsSyncing(false);
                          fetchAdminData();
                          setTimeout(() => setMessage(null), 5000);
                        }
                      },
                      onCancel: () => setConfirmModal(null)
                    });
                  }}
                  disabled={isSyncing}
                  className="btn-seablue py-2 text-[10px] flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clean Duplicates
                </button>
                <button 
                  onClick={() => {
                    setConfirmModal({
                      message: 'Trigger a full backup to Google Drive?',
                      onConfirm: async () => {
                        setConfirmModal(null);
                        setIsSyncing(true);
                        try {
                          const res = await apiFetch('/api/admin/trigger-drive-backup', { method: 'POST' });
                          const data = await res.json();
                          if (res.ok) setMessage({ text: data.message, type: 'success' });
                          else setMessage({ text: 'Drive Backup Failed: ' + data.error, type: 'error' });
                        } catch (err: any) {
                          setMessage({ text: 'Error: ' + err.message, type: 'error' });
                        } finally {
                          setIsSyncing(false);
                          fetchAdminData();
                          setTimeout(() => setMessage(null), 5000);
                        }
                      },
                      onCancel: () => setConfirmModal(null)
                    });
                  }}
                  disabled={isSyncing}
                  className="btn-seablue py-2 text-[10px] flex items-center justify-center gap-1"
                >
                  <Cloud className="w-3 h-3" /> Drive Backup
                </button>
                <button 
                  onClick={() => {
                    setConfirmModal({
                      message: 'Are you sure you want to backup the database?',
                      onConfirm: () => {
                        setConfirmModal(null);
                        window.open('/api/admin/backup', '_blank');
                      },
                      onCancel: () => setConfirmModal(null)
                    });
                  }}
                  className="btn-seablue py-2 text-[10px] flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" /> Local Backup
                </button>
                <button 
                  onClick={recalculateTonnage}
                  disabled={isSyncingGlobal}
                  className="btn-seablue py-2 text-[10px] flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingGlobal ? 'animate-spin' : ''}`} /> Recalculate Tonnage
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mt-2 flex items-start gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-[10px] font-medium text-blue-800">
                  <strong>Single Bulk Uploads:</strong> To update Hierarchy, Targets, Team, or Distributors, simply update your <strong>Google Sheet</strong> and click the <strong className="text-seablue">Master Sync</strong> button at the top right. No need to upload separate files anymore!
                </p>
              </div>
            </div>
            <div className="card-clean p-4 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Sheets Sync</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${googleStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {googleStatus.connected ? `Connected (${googleStatus.method || 'OAuth2'})` : 'Not Connected'}
                  </span>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4">
                <p className="text-[10px] font-bold text-amber-800">
                  ⚠️ IMPORTANT: To prevent these credentials from being lost during app updates, please save them in the <strong>AI Studio Settings &gt; Secrets</strong> menu as <code className="bg-amber-100 px-1 rounded">GOOGLE_SPREADSHEET_ID</code>, <code className="bg-amber-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_EMAIL</code>, and <code className="bg-amber-100 px-1 rounded">GOOGLE_PRIVATE_KEY</code>.
                </p>
              </div>
              
              <div className="space-y-3 transition-all duration-300">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase flex justify-between">
                    Spreadsheet ID
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter ID"
                    value={appConfig.google_spreadsheet_id || ''} 
                    onChange={(e) => updateConfig('google_spreadsheet_id', e.target.value)}
                    className="input-clean w-full text-[10px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase">Service Account Email</label>
                  <input 
                    type="text" 
                    placeholder="email@project.iam.gserviceaccount.com"
                    value={appConfig.google_service_account_email || ''} 
                    onChange={(e) => updateConfig('google_service_account_email', e.target.value)}
                    className="input-clean w-full text-[10px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase">Backup Folder ID (Google Drive)</label>
                  <input 
                    type="text" 
                    placeholder="Enter Folder ID"
                    value={appConfig.google_drive_folder_id || '1obtuVTe100g6jrvS6ST8-KVUtXYvQVDY'} 
                    onChange={(e) => updateConfig('google_drive_folder_id', e.target.value)}
                    className="input-clean w-full text-[10px]"
                  />
                  <p className="text-[7px] text-slate-400 italic mt-1">
                    Share this folder with <span className="font-bold text-seablue select-all">{appConfig.google_service_account_email}</span> as an <b>Editor</b>. 
                    If you get a "storage quota" error, use a <b>Shared Drive</b>.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase flex justify-between items-center">
                    <span>Private Key (JSON)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] lowercase italic">Paste the entire private_key from your JSON file</span>
                      {appConfig.google_private_key && (
                        <button 
                          onClick={() => {
                            const blob = new Blob([JSON.stringify({
                              client_email: appConfig.google_service_account_email || '',
                              private_key: appConfig.google_private_key
                            }, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'salespulse-service-account.json';
                            a.click();
                          }}
                          className="text-[9px] font-bold text-seablue hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Download
                        </button>
                      )}
                    </div>
                  </label>
                  <textarea 
                    placeholder="-----BEGIN PRIVATE KEY-----..."
                    value={appConfig.google_private_key || ''} 
                    onChange={(e) => updateConfig('google_private_key', e.target.value)}
                    className="input-clean w-full text-[10px] h-32 resize-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button 
                  onClick={async () => {
                    setIsSyncing(true);
                    setMessage({ text: 'Testing connection...', type: 'info' });
                    try {
                      const res = await apiFetch('/api/admin/test-google');
                      const data = await res.json();
                      if (res.ok) {
                        setMessage({ text: `Connected successfully! Sheet: ${data.title}`, type: 'success' });
                        fetchAdminData(); // Refresh status to enable sync buttons
                      } else {
                        throw new Error(data.error || 'Connection failed');
                      }
                    } catch (err: any) {
                      setMessage({ text: 'Connection failed: ' + err.message, type: 'error' });
                    } finally {
                      setIsSyncing(false);
                      setTimeout(() => setMessage(null), 3000);
                    }
                  }}
                  disabled={isSyncing}
                  className="btn-clean bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] flex items-center justify-center gap-2"
                >
                  {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                  Test Connection
                </button>
              </div>
            </div>
            <div className="card-clean p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Holidays</h3>
                <div className="text-[8px] text-slate-400 italic">Comma separated dates (YYYY-MM-DD)</div>
              </div>
              <textarea 
                placeholder="e.g. 2026-03-20, 2026-03-21"
                value={appConfig.holidays || ''} 
                onChange={(e) => updateConfig('holidays', e.target.value)}
                className="input-clean w-full h-20 text-[10px] font-mono"
              />
            </div>



            <div className="card-clean p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Entry Rules</h3>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-slate-700">Allow Past Entries Editing</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">Select who can edit their past entries</div>
                  </div>
                  <select
                    value={appConfig.allow_past_editing === 'true' ? 'ALL' : (appConfig.allow_past_editing === 'false' || !appConfig.allow_past_editing ? 'NONE' : 'SELECTED')}
                    onChange={(e) => {
                      if (e.target.value === 'ALL') updateConfig('allow_past_editing', 'true');
                      else if (e.target.value === 'NONE') updateConfig('allow_past_editing', 'false');
                      else updateConfig('allow_past_editing', '[]'); // Initialize empty array for selected
                    }}
                    className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded px-2 py-1"
                  >
                    <option value="NONE">No One (Admins Only)</option>
                    <option value="ALL">All Users</option>
                    <option value="SELECTED">Selected Users</option>
                  </select>
                </div>
                
                {appConfig.allow_past_editing !== 'true' && appConfig.allow_past_editing !== 'false' && appConfig.allow_past_editing && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[9px] font-bold text-slate-500 mb-2">Select Users:</div>
                    <div className="max-h-32 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded p-2">
                      {users.filter(u => u.role === 'TSM' || u.role === 'ASM' || u.role === 'OB').map(u => {
                        let selectedUsers: string[] = [];
                        try { selectedUsers = JSON.parse(appConfig.allow_past_editing); } catch(e) {}
                        const isSelected = selectedUsers.includes(u.email);
                        return (
                          <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={(e) => {
                                let newSelected = [...selectedUsers];
                                if (e.target.checked) newSelected.push(u.email);
                                else newSelected = newSelected.filter(email => email !== u.email);
                                updateConfig('allow_past_editing', JSON.stringify(newSelected));
                              }}
                              className="rounded border-slate-300 text-seablue focus:ring-seablue w-3 h-3"
                            />
                            <span className="text-[10px] font-medium text-slate-700">{u.name} ({u.email})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card-clean p-4 space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Bulk Upload (Single CSV)</h3>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      const headers = ['Director', 'NSM', 'RSM', 'SC', 'ASM/TSM', 'Town', 'Distributor', 'OB Name', 'OB ID', 'Zone', 'Region', 'Total Shops', 'Routes', 'Kite Glow Target', 'Burq Action Target', 'Vero Target', 'DWB Target', 'Match Target'];
                      const csvContent = headers.join(",") + "\n" + 
                        "Director Name,NSM Name,RSM Name,SC Name,TSM Name,Town Name,Distributor Name,OB Name,03001234567,Zone Name,Region Name,50,\"Route 1, Route 2\",10,10,10,10,10";
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'SalesPulse_Bulk_Template.csv';
                      a.click();
                    }}
                    className="text-[9px] font-bold text-seablue hover:underline flex items-center justify-center gap-1 border border-seablue/20 py-1.5 rounded"
                  >
                    <Download className="w-3 h-3" /> Template
                  </button>
                  <label className="btn-seablue w-full text-[9px] flex items-center justify-center gap-2 cursor-pointer py-1.5">
                    <Upload className="w-3 h-3" />
                    Upload CSV
                    <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
                  </label>
                </div>
                <p className="text-[8px] text-slate-400 uppercase font-bold text-center">
                  One sheet for Team, Hierarchy, Targets & Distributors
                </p>
              </div>
            </div>
            <div className="card-clean p-6 bg-white space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Cloud Synchronization</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Two-Way Google Sheets Sync</p>
                </div>
              </div>

              <button 
                onClick={syncEverything}
                disabled={isSyncingGlobal || !appConfig.google_spreadsheet_id}
                className="btn-seablue py-6 flex flex-col items-center justify-center gap-2 group relative overflow-hidden w-full"
              >
                <div className="flex items-center gap-3 z-10">
                  <RefreshCw className={`w-8 h-8 ${isSyncingGlobal ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                  <div className="text-left">
                    <div className="text-lg font-black uppercase tracking-tight">Master Sync Now</div>
                    <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Pushes Sales & Stocks | Pulls Team & Targets</div>
                  </div>
                </div>
                {isSyncingGlobal && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-1 bg-white/30"
                  />
                )}
              </button>

              {appConfig.last_sync_at && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Successful Sync</div>
                  <div className="text-xs font-bold text-emerald-600">{appConfig.last_sync_at}</div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center gap-1">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-1">
                    <Upload className="w-3 h-3" />
                  </div>
                  <div className="text-[9px] font-black uppercase text-slate-600">Push Data</div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">Sales, Stocks & Summaries</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center gap-1">
                  <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-1">
                    <Download className="w-3 h-3" />
                  </div>
                  <div className="text-[9px] font-black uppercase text-slate-600">Pull Team</div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">Hierarchy & Targets</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center gap-1">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-1">
                    <History className="w-3 h-3" />
                  </div>
                  <div className="text-[9px] font-black uppercase text-slate-600">Sync History</div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">Import missing records</p>
                </div>
              </div>
            </div>

            <div className="card-clean p-6 bg-white space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Backup & Data Security</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Automated Daily Backups (09:00 AM)</p>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-indigo-900 uppercase tracking-tight">System Protection</h3>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Full Database & App Config Backups</p>
                  </div>
                  <button 
                    onClick={runManualBackup}
                    disabled={isBackingUp || !googleStatus.connected}
                    className="btn-seablue px-4 py-2 flex items-center gap-2 text-[10px]"
                  >
                    {isBackingUp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Backup Now
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white/60 p-3 rounded-xl border border-indigo-100">
                    <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Backup Location</div>
                    <div className="text-[10px] font-bold text-indigo-900 truncate flex items-center gap-2">
                      <Link2 className="w-3 h-3" />
                      <a href="https://drive.google.com/drive/folders/1obtuVTe100g6jrvS6ST8-KVUtXYvQVDY" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Google Drive Folder
                      </a>
                    </div>
                  </div>
                  <div className="bg-white/60 p-3 rounded-xl border border-indigo-100">
                    <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Security Level</div>
                    <div className="text-[10px] font-bold text-indigo-900 flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      AES-256 Encrypted Config
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[9px] font-black text-indigo-900 uppercase tracking-widest">Recent Backup Audit Log</h4>
                  <div className="bg-white rounded-xl border border-indigo-100 overflow-hidden">
                    <table className="w-full text-left text-[9px]">
                      <thead className="bg-indigo-50/50 text-indigo-400 font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-3 py-2">Date & Time</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-50">
                        {backupLogs.slice(0, 5).map((log, i) => (
                          <tr key={i} className="hover:bg-indigo-50/30">
                            <td className="px-3 py-2 font-bold text-indigo-900">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded-full font-black uppercase text-[7px] ${log.action === 'BACKUP_SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {log.action === 'BACKUP_SUCCESS' ? 'Success' : 'Failed'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-indigo-600 truncate max-w-[120px]">
                              {JSON.parse(log.details || '{}').file || JSON.parse(log.details || '{}').error || '-'}
                            </td>
                          </tr>
                        ))}
                        {backupLogs.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-3 py-4 text-center text-indigo-400 italic">No backup logs found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
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
            <div className="bg-slate-800 text-white px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <h2 className="text-sm font-bold uppercase tracking-widest">User Management (Login Accounts)</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={autoGenerateUsersFromTeam}
                  className="text-[9px] font-black bg-emerald-500/20 px-2 py-1 rounded hover:bg-emerald-500/40 text-emerald-100 uppercase tracking-widest flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-Generate from Team
                </button>
                <button onClick={fetchUsers} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <RefreshCw className={`w-3 h-3 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <form onSubmit={handleRegisterUser} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input type="text" placeholder="Username" value={newUser.username || ''} onChange={e => setNewUser({...newUser, username: e.target.value})} className="input-clean text-[10px]" required />
                <input type="text" placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="input-clean text-[10px]" required />
                <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="input-clean text-[10px]" required />
                <input type="text" placeholder="Contact/ID" value={newUser.contact} onChange={e => setNewUser({...newUser, contact: e.target.value})} className="input-clean text-[10px]" />
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="input-clean text-[10px]">
                    <option value="OB">Order Booker (OB)</option>
                    <option value="TSM">Territory Sales Manager (TSM)</option>
                    <option value="ASM">Area Sales Manager (ASM)</option>
                    <option value="RSM">Regional Sales Manager (RSM)</option>
                    <option value="NSM">National Sales Manager (NSM)</option>
                    <option value="Director">Director</option>
                    <option value="SC">Sales Coordinator (SC)</option>
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                <input type="text" placeholder="Region" value={newUser.region} onChange={e => setNewUser({...newUser, region: e.target.value})} className="input-clean text-[10px]" />
                <input type="text" placeholder="TSM Name" value={newUser.tsm} onChange={e => setNewUser({...newUser, tsm: e.target.value})} className="input-clean text-[10px]" />
                <input type="text" placeholder="OB Name" value={newUser.ob} onChange={e => setNewUser({...newUser, ob: e.target.value})} className="input-clean text-[10px]" />
                <button type="submit" disabled={isRegisteringUser} className="btn-seablue text-[10px] py-1">
                  {isRegisteringUser ? '...' : '+ Register'}
                </button>
              </form>

              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase">
                      <th className="py-2">Name / Username</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Contact/ID</th>
                      <th className="py-2">Region / Town</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-2">
                          <div className="font-bold text-slate-700">{u.name}</div>
                          <div className="text-[8px] text-slate-400">@{u.username}</div>
                        </td>
                        <td className="py-2">
                          <span className={`px-1.5 py-0.5 rounded-full font-bold text-[8px] uppercase ${
                            u.role === 'Super Admin' ? 'bg-indigo-100 text-indigo-700' :
                            u.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                            (u.role === 'TSM' || u.role === 'ASM') ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {u.role === 'RSM' ? 'Regional Sales Manager' : 
                             u.role === 'SC' ? 'Sales Coordinator' : 
                             u.role === 'NSM' ? 'National Sales Manager' : 
                             u.role === 'TSM' ? 'Territory Sales Manager' : 
                             u.role === 'ASM' ? 'Area Sales Manager' : 
                             u.role === 'OB' ? 'Order Booker' : 
                             u.role}
                          </span>
                        </td>
                        <td className="py-2 text-slate-500">{u.contact}</td>
                        <td className="py-2 text-slate-500">
                          {u.region}{u.town ? ` / ${u.town}` : ''}
                        </td>
                        <td className="py-2 text-right space-x-1">
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                            disabled={u.username === 'admin' || u.username === 'amjid.admin'} // Protect default admins
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="card-clean overflow-hidden">
            <div className="bg-seablue text-white px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Stock Reports History</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    window.open('/api/stocks/export', '_blank');
                  }}
                  className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded hover:bg-white/30 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
                <button onClick={fetchAdminData} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <RefreshCw className={`w-3 h-3 ${isLoadingAdmin ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase">
                      <th className="py-2">Date</th>
                      <th className="py-2">TSM</th>
                      <th className="py-2">Town</th>
                      <th className="py-2">Distributor</th>
                      <th className="py-2 text-right">Total Stock (Ctn)</th>
                      <th className="py-2 text-right">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stockHistory.map(report => {
                      const stockData = typeof report.stock_data === 'string' ? JSON.parse(report.stock_data) : (report.stock_data || {});
                      const totalCtn = Object.values(stockData).reduce((sum: number, item: any) => sum + (Number(item.ctn) || 0), 0) as number;
                      return (
                        <tr key={report.id} className="hover:bg-slate-50">
                          <td className="py-2 font-bold text-slate-700">{report.date}</td>
                          <td className="py-2 text-slate-500">{report.tsm}</td>
                          <td className="py-2 text-slate-500">{report.town}</td>
                          <td className="py-2 text-slate-500 font-bold">{report.distributor}</td>
                          <td className="py-2 text-right font-black text-seablue">{totalCtn.toFixed(1)}</td>
                          <td className="py-2 text-right text-slate-400">{report.submitted_at}</td>
                        </tr>
                      );
                    })}
                    {stockHistory.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">No stock reports found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>



          <section className="card-clean overflow-hidden">
            <div className="bg-emerald-600 text-white px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold uppercase tracking-widest">Distributors (Independent)</h2>
                <select 
                  value={selectedAdminTSM} 
                  onChange={(e) => setSelectedAdminTSM(e.target.value)}
                  className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 focus:outline-none"
                >
                  <option value="" className="text-slate-900">All TSMs</option>
                  {tsmList.map(tsm => (
                    <option key={tsm} value={tsm} className="text-slate-900">{tsm}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={async () => {
                    if (confirm("Are you sure you want to DELETE ALL distributors? This cannot be undone.")) {
                      await apiFetch('/api/admin/distributors/clear', { method: 'POST' });
                      fetchAdminData();
                    }
                  }}
                  className="text-[9px] font-black bg-red-500/20 px-2 py-1 rounded hover:bg-red-500/40 text-red-100 uppercase tracking-widest"
                >
                  Clear All
                </button>
                <button onClick={async () => { 
                  const name = prompt("Distributor Name:"); 
                  const town = prompt("Town:"); 
                  const tsm = prompt("TSM:"); 
                  const zone = prompt("Zone (Optional):");
                  const region = prompt("Region (Optional):");
                  if (name && town) { 
                    await apiFetch('/api/admin/distributors', { 
                      method: 'POST', 
                      body: JSON.stringify({ name, town, tsm, zone, region }) 
                    }); 
                    fetchAdminData(); 
                  } 
                }} className="text-xs font-bold bg-white/20 px-2 py-1 rounded hover:bg-white/30">+ Add</button>
              </div>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {distributors
                .filter(dist => !selectedAdminTSM || dist.tsm === selectedAdminTSM)
                .map(dist => (
                <div key={dist.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Distributor Name</label>
                      <input type="text" defaultValue={dist.name} onBlur={async (e) => { await apiFetch('/api/admin/distributors', { method: 'POST', body: JSON.stringify({ ...dist, name: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Town</label>
                      <input type="text" defaultValue={dist.town} onBlur={async (e) => { await apiFetch('/api/admin/distributors', { method: 'POST', body: JSON.stringify({ ...dist, town: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">TSM</label>
                      <select 
                        defaultValue={dist.tsm} 
                        onChange={async (e) => { await apiFetch('/api/admin/distributors', { method: 'POST', body: JSON.stringify({ ...dist, tsm: e.target.value }) }); fetchAdminData(); }} 
                        className="input-clean w-full text-[10px] py-1"
                      >
                        <option value="">Select TSM</option>
                        {tsmList.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Zone</label>
                      <input type="text" defaultValue={dist.zone} onBlur={async (e) => { await apiFetch('/api/admin/distributors', { method: 'POST', body: JSON.stringify({ ...dist, zone: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Region</label>
                      <input type="text" defaultValue={dist.region} onBlur={async (e) => { await apiFetch('/api/admin/distributors', { method: 'POST', body: JSON.stringify({ ...dist, region: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">OB ID</label>
                      <input type="text" defaultValue={dist.ob_id || ''} onBlur={async (e) => { await apiFetch('/api/admin/distributors', { method: 'POST', body: JSON.stringify({ ...dist, ob_id: e.target.value }) }); }} className="input-clean w-full" placeholder="Optional" />
                    </div>
                  </div>
                  <button onClick={async () => { if (confirm("Delete?")) { await apiFetch(`/api/admin/distributors/${dist.id}`, { method: 'DELETE' }); fetchAdminData(); } }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash className="w-4 h-4" /></button>
                </div>
              ))}
              {distributors.length === 0 && <div className="p-8 text-center text-slate-400 text-xs italic">No independent distributors added yet. They will appear in the Stocks Report.</div>}
            </div>
          </section>

          <section className="card-clean overflow-hidden">
            <div className="bg-seablue text-white px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold uppercase tracking-widest">OB Assignments</h2>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-white/60 uppercase tracking-widest">Filter:</label>
                  <select 
                    value={selectedAdminTSM} 
                    onChange={(e) => setSelectedAdminTSM(e.target.value)}
                    className="bg-white/10 border border-white/20 text-white text-[10px] font-bold px-2 py-1 rounded outline-none focus:bg-white/20"
                  >
                    <option value="" className="text-slate-900">All TSMs</option>
                    {tsmList.map(tsm => (
                      <option key={tsm} value={tsm} className="text-slate-900">{tsm}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={async () => { 
                const name = prompt("Name:"); 
                const contact = prompt("ID:"); 
                const zone = prompt("Zone (Optional):");
                const region = prompt("Region (Optional):");
                if (name && contact) { 
                  await apiFetch('/api/admin/obs', { 
                    method: 'POST', 
                    body: JSON.stringify({ name, contact, town: '', distributor: '', routes: [], zone, region }) 
                  }); 
                  fetchAdminData(); 
                } 
              }} className="text-xs font-bold bg-white/20 px-2 py-1 rounded hover:bg-white/30">+ Add</button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {obAssignments
                .filter(ob => (!selectedAdminTSM || ob.tsm === selectedAdminTSM) && ob.name)
                .map(ob => (
                <div key={ob.id} className="p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Name</label>
                      <input type="text" defaultValue={ob.name} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, name: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">ID/Contact</label>
                      <input type="text" defaultValue={ob.contact} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, contact: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Town</label>
                      <input type="text" defaultValue={ob.town} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, town: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Distributor</label>
                      <input type="text" defaultValue={ob.distributor} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, distributor: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">TSM</label>
                      <select 
                        defaultValue={ob.tsm} 
                        onChange={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, tsm: e.target.value }) }); fetchAdminData(); }} 
                        className="input-clean w-full text-[10px] py-1"
                      >
                        <option value="">Select TSM</option>
                        {tsmList.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Zone</label>
                      <input type="text" defaultValue={ob.zone} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, zone: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Region</label>
                      <input type="text" defaultValue={ob.region} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, region: e.target.value }) }); }} className="input-clean w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Total Shops in Route</label>
                      <input type="number" defaultValue={ob.total_shops || 50} onBlur={async (e) => { await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify({ ...ob, total_shops: parseInt(e.target.value) || 50 }) }); }} className="input-clean w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Routes (comma separated)</label>
                      <input type="text" defaultValue={ob.routes.join(", ")} onBlur={async (e) => { 
                        const routes = e.target.value.split(",").map(r => r.trim()).filter(r => r); 
                        const updatedOb = { ...ob, routes };
                        setObAssignments(prev => prev.map(a => a.contact === ob.contact ? updatedOb : a));
                        await apiFetch('/api/admin/obs', { method: 'POST', body: JSON.stringify(updatedOb) }); 
                      }} className="input-clean w-full" />
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
                    <button onClick={async () => { if (confirm("Delete?")) { await apiFetch(`/api/admin/obs/delete/${ob.id}`, { method: 'DELETE' }); fetchAdminData(); } }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash className="w-4 h-4" /></button>
                  </div>

                  {selectedOBForTargets === ob.contact && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-seablue uppercase tracking-widest">Brand Targets for {ob.name} (Ctn)</h4>
                        <div className="flex items-center gap-2">
                          <label className="text-[8px] font-bold text-slate-400 uppercase">Month:</label>
                          <input 
                            type="month" 
                            value={targetMonth} 
                            onChange={(e) => {
                              setTargetMonth(e.target.value);
                              fetchTargetsForOBEdit(ob.contact, e.target.value);
                            }}
                            className="input-clean text-[10px] py-0.5 px-2"
                          />
                        </div>
                      </div>
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

          <section className="card-clean overflow-hidden">
            <div className="bg-emerald-600 text-white px-4 py-2 flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-widest">National Sales Hierarchy</h2>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded hover:bg-white/30 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Upload Hierarchy CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleHierarchyBulkUpload} />
                </label>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-2 font-bold uppercase text-slate-400">NSM</th>
                    <th className="p-2 font-bold uppercase text-slate-400">RSM</th>
                    <th className="p-2 font-bold uppercase text-slate-400">TSM</th>
                    <th className="p-2 font-bold uppercase text-slate-400">Town</th>
                    <th className="p-2 font-bold uppercase text-slate-400">Distributor</th>
                    <th className="p-2 font-bold uppercase text-slate-400">OB Name</th>
                    <th className="p-2 font-bold uppercase text-slate-400">OB ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hierarchy.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2">{row.nsm_name}</td>
                      <td className="p-2">{row.rsm_name}</td>
                      <td className="p-2">{row.asm_tsm_name}</td>
                      <td className="p-2">{row.town_name}</td>
                      <td className="p-2">{row.distributor_name}</td>
                      <td className="p-2 font-bold">{row.ob_name}</td>
                      <td className="p-2 text-slate-400">{row.ob_id}</td>
                    </tr>
                  ))}
                  {hierarchy.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">No hierarchy data uploaded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (view === 'help') {
    const helpContent = [
      {
        id: 'entry',
        title: 'Entry (Daily Sales)',
        roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'SC', 'RSM', 'NSM', 'Director'],
        color: 'border-emerald-500',
        content: (
          <>
            <p className="text-sm text-slate-600 mb-2">This is where you enter your daily sales data.</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li><strong>Date & Location:</strong> Select the date, your town, and distributor.</li>
              <li><strong>Shops Data:</strong> Enter Total Shops, Visited Shops, and Productive Shops.</li>
              <li><strong>Sales Quantities:</strong> For each product, enter the number of Cartons (Ctn), Dozens (Dzn), or Packs (Pks) sold.</li>
              <li><strong>Save as Draft:</strong> If you don't have internet, click "Save as Draft". It will be saved on your phone.</li>
              <li><strong>Submit:</strong> When you have internet, click "Submit" to send the data to the server.</li>
            </ul>
          </>
        )
      },
      {
        id: 'dashboard',
        title: 'Dashboard',
        roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'],
        color: 'border-seablue',
        content: (
          <>
            <p className="text-sm text-slate-600 mb-2">View your performance and sales statistics at a glance.</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li><strong>Overview:</strong> Shows a summary of your sales, targets, and achievements.</li>
              <li><strong>KPIs:</strong> Track key metrics like Productivity %, Drop Size, and Avg Sales.</li>
              <li><strong>Filters:</strong> Use the breadcrumb navigation to drill down from National to Region, TSM, Town, and OB levels (depending on your role).</li>
            </ul>
          </>
        )
      },
      {
        id: 'command_center',
        title: 'SalesPulse',
        roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'],
        color: 'border-indigo-500',
        content: (
          <>
            <p className="text-sm text-slate-600 mb-2">Detailed performance tracking for TSMs and above.</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li><strong>OB Performance:</strong> View detailed metrics for each Order Booker under your supervision.</li>
              <li><strong>Target vs Achievement:</strong> Compare actual sales against set targets for different brands.</li>
              <li><strong>Productivity:</strong> Monitor visited vs productive shops for your team.</li>
            </ul>
          </>
        )
      },
      {
        id: 'tsm_performance',
        title: 'Target vs Achievement',
        roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC'],
        color: 'border-violet-500',
        content: (
          <>
            <p className="text-sm text-slate-600 mb-2">High-level overview of TSM performance for regional and national managers.</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li><strong>Summary Table:</strong> Compare all TSMs based on achievement %, productivity, and active OBs.</li>
              <li><strong>Drill Down:</strong> Click on any TSM row to open their specific SalesPulse view.</li>
              <li><strong>Sorting:</strong> Click column headers to sort by different metrics (e.g., lowest achievement to highest).</li>
            </ul>
          </>
        )
      },
      {
        id: 'insights',
        title: 'Insights',
        roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'],
        color: 'border-fuchsia-500',
        content: (
          <>
            <p className="text-sm text-slate-600 mb-2">Advanced analytics and trends.</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li><strong>Route Analysis:</strong> Analyze performance by specific routes over the last 3 months.</li>
              <li><strong>Brand Trends:</strong> View sales trends for different brands and categories.</li>
              <li><strong>WhatsApp Reporting:</strong> Generate formatted text reports to easily share via WhatsApp.</li>
            </ul>
          </>
        )
      },
      {
        id: 'stats',
        title: 'Stats',
        roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'],
        color: 'border-pink-500',
        content: (
          <>
            <p className="text-sm text-slate-600 mb-2">Detailed statistical breakdown of sales data.</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li><strong>Category Breakdown:</strong> See sales distribution across different product categories.</li>
              <li><strong>SKU Performance:</strong> Identify top-selling and low-performing SKUs.</li>
            </ul>
          </>
        )
      },
      {
        id: 'reports',
        title: 'Reports',
        roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'],
        color: 'border-rose-500',
        content: (
          <>
            <p className="text-sm text-slate-600 mb-2">Comprehensive tabular reports for deep data analysis.</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li><strong>Data Tables:</strong> View raw data organized by date, region, TSM, and OB.</li>
              <li><strong>Export:</strong> Use these tables to verify data accuracy and track daily submissions.</li>
            </ul>
          </>
        )
      },
      {
        id: 'history',
        title: 'History',
        roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'],
        color: 'border-amber-500',
        content: (
          <>
            <p className="text-sm text-slate-600 mb-2">View your previously submitted orders and drafts.</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li><strong>Drafts:</strong> Orders saved without internet appear here. They will automatically sync when you connect to the internet.</li>
              <li><strong>Submitted Orders:</strong> View all orders you have successfully sent.</li>
              <li><strong>Filters:</strong> Use the quick filters (Today, Yesterday, This Week) to find specific entries.</li>
              <li><strong>Delete:</strong> You can delete drafts if you made a mistake.</li>
            </ul>
          </>
        )
      },
      {
        id: 'stocks',
        title: 'Stocks',
        roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'],
        color: 'border-orange-500',
        content: (
          <>
            <p className="text-sm text-slate-600 mb-2">Manage and track distributor stock levels.</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li><strong>Stock Entry:</strong> Enter current stock levels (in Cartons) for each SKU at the distributor level.</li>
              <li><strong>Submission:</strong> Submit stock data to keep the central system updated.</li>
            </ul>
          </>
        )
      },
      {
        id: 'admin',
        title: 'Admin',
        roles: ['Super Admin', 'Admin'],
        color: 'border-slate-800',
        content: (
          <>
            <p className="text-sm text-slate-600 mb-2">System configuration and data management.</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li><strong>Data Sync:</strong> Manually trigger sync with Google Sheets.</li>
              <li><strong>Configuration:</strong> Manage users, hierarchy, targets, and product configurations.</li>
            </ul>
          </>
        )
      }
    ];

    const visibleHelpContent = helpContent.filter(item => {
      if (!userRole) return false;
      const normalizedRole = userRole.toUpperCase();
      const isAdmin = ['amjid.bisconni@gmail.com', 'Amjid.psh@gmail.com'].includes((userEmail || '').toLowerCase());
      return item.roles.map(r => r.toUpperCase()).includes(normalizedRole) || isAdmin;
    });

    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
        <main className="max-w-4xl mx-auto p-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h1 className="text-2xl font-black text-seablue uppercase tracking-tight mb-2">User Manual</h1>
            <p className="text-sm text-slate-500 mb-6">A detailed guide to using the SalesPulse application based on your role ({userRole}).</p>
            
            <div className="space-y-6">
              <div className="border-l-4 border-slate-400 pl-4">
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-widest mb-2">Getting Started</h2>
                <p className="text-sm text-slate-600">
                  Open the app and click the <strong>"Sign in with Google"</strong> button. Use your official company email address. If you are not registered, contact your admin.
                  To log out, use the <strong>Logout</strong> button in the navigation bar.
                </p>
              </div>

              {visibleHelpContent.map((item, index) => (
                <div key={item.id} className={`border-l-4 ${item.color} pl-4`}>
                  <h2 className="text-lg font-bold text-slate-800 uppercase tracking-widest mb-2">{item.title}</h2>
                  {item.content}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'primary_orders') {
    const [primarySubView, setPrimarySubView] = useState<'matrix' | 'history'>('matrix');

    const handlePrimaryChange = (distributor: string, skuId: string, val: number) => {
      setPrimaryOrdersEntry(prev => ({
        ...prev,
        [distributor]: {
          ...(prev[distributor] || {}),
          [skuId]: val
        }
      }));
    };

    const handleRemarksChange = (distributor: string, val: string) => {
      setPrimaryRemarks(prev => ({
        ...prev,
        [distributor]: val
      }));
    };

    const handleSubmitPrimaryOrders = async () => {
      if (!selectedPrimaryTSM && userRole !== 'TSM' && userRole !== 'TSM Entry') {
          // If no TSM selected and not a TSM, use current user name but confirm
      }
      setIsSubmittingPrimary(true);
      try {
        const promises = Object.entries(primaryOrdersEntry).map(([distributor, items]) => {
          const distInfo = allDistributors.find(d => d.distributor === distributor);
          // Calculate tonnage and gross for the submission if needed (optional since server does it too)
          return apiFetch('/api/primary-orders', {
            method: 'POST',
            body: JSON.stringify({
              date: getPSTDate(),
              tsm: selectedPrimaryTSM || userName,
              town: distInfo?.town || '',
              distributor: distributor,
              region: distInfo?.region || '',
              items: items,
              remarks: primaryRemarks[distributor] || '',
              status: 'Pending'
            })
          });
        });
        await Promise.all(promises);
        setMessage({ text: 'Primary Orders Submitted Successfully!', type: 'success' });
        setPrimaryOrdersEntry({});
        setPrimaryRemarks({});
        fetchPrimaryOrders();
        syncGoogle();
      } catch (e) {
        console.error(e);
        setMessage({ text: 'Error submitting primary orders', type: 'error' });
      } finally {
        setIsSubmittingPrimary(false);
        setTimeout(() => setMessage(null), 3000);
      }
    };

    const handleUpdateStatus = async (orderId: number, status: string, remarks?: string, dispatchedDate?: string) => {
      try {
        const res = await apiFetch(`/api/primary-orders/${orderId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status, remarks, dispatchedDate })
        });
        if (res.ok) {
          setMessage({ text: 'Order status updated!', type: 'success' });
          fetchPrimaryOrders();
          syncGoogle();
        }
      } catch (err) {
        console.error(err);
        setMessage({ text: 'Failed to update order status', type: 'error' });
      } finally {
        setTimeout(() => setMessage(null), 3000);
      }
    };

    const primaryFilteredDists = allDistributors.filter(d => {
      if (selectedPrimaryRegion && d.region !== selectedPrimaryRegion) return false;
      if (selectedPrimaryTSM && d.tsm !== selectedPrimaryTSM) return false;
      if (selectedPrimaryTown && d.town !== selectedPrimaryTown) return false;
      if (primarySearchQuery && !d.distributor.toLowerCase().includes(primarySearchQuery.toLowerCase()) && !d.town.toLowerCase().includes(primarySearchQuery.toLowerCase())) return false;
      return true;
    });

    const primaryRegions = [...new Set(allDistributors.map(d => d.region))].filter(Boolean).sort();
    const primaryTsms = [...new Set(allDistributors.map(d => d.tsm))].filter(Boolean).sort();
    const primaryTowns = [...new Set(allDistributors.map(d => d.town))].filter(Boolean).sort();

    return (
      <div className="min-h-screen bg-slate-50 pb-40">
        <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
        
        <div className="p-4 space-y-6 max-w-[1600px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-black text-seablue uppercase tracking-tight leading-none">Primary Logistics</h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Matrix & Fulfillment Tracking</p>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setPrimarySubView('matrix')}
                    className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${primarySubView === 'matrix' ? 'bg-white text-seablue shadow-sm' : 'text-slate-400'}`}
                  >
                    Entry Matrix
                  </button>
                  <button 
                    onClick={() => setPrimarySubView('history')}
                    className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${primarySubView === 'history' ? 'bg-white text-seablue shadow-sm' : 'text-slate-400'}`}
                  >
                    Order History
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => {
                  const headers = ['Region', 'TSM', 'Town', 'Distributor', ...SKUS.map(s => s.name), 'Total Val', 'Tonnage', 'Gross (Match)'];
                  const rows = primaryFilteredDists.map(d => {
                    const items = primaryOrdersEntry[d.distributor] || {};
                    let totalVal = 0;
                    const itemsArr = SKUS.map(sku => {
                        const qty = items[sku.id] || 0;
                        totalVal += qty * (sku.pricePerCarton || 0);
                        return qty;
                    });
                    const tonnage = calculateTonnage(items, SKUS);
                    const gross = calculateGross(items, SKUS);
                    return [ d.region || '', d.tsm, d.town, d.distributor, ...itemsArr, totalVal, tonnage.toFixed(3), gross ];
                  });
                  const csv = Papa.unparse({ fields: headers, data: rows });
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `Primary_Matrix_${getPSTDate()}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="btn-seablue px-4 py-2 text-[10px] flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 rounded-xl"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              {primarySubView === 'matrix' && (
                <button 
                  onClick={handleSubmitPrimaryOrders}
                  disabled={isSubmittingPrimary || Object.keys(primaryOrdersEntry).length === 0}
                  className="btn-seablue px-4 py-2 text-[10px] flex items-center gap-2 shadow-lg shadow-seablue/20 rounded-xl"
                >
                  {isSubmittingPrimary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Finalize Submission
                </button>
              )}
            </div>
          </motion.div>

          {primarySubView === 'matrix' ? (
            <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
              <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 mr-auto">
                  <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Order Entry Matrix</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">Populate replenishment orders for all towns</p>
                  </div>
                </div>

                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-seablue transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search Town or Distributor..."
                    value={primarySearchQuery}
                    onChange={e => setPrimarySearchQuery(e.target.value)}
                    className="input-clean pl-10 pr-4 py-2 text-[10px] w-64 rounded-xl border-slate-100"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <select 
                    value={selectedPrimaryRegion} 
                    onChange={e => setSelectedPrimaryRegion(e.target.value)}
                    className="input-clean py-1.5 text-[10px] min-w-[120px] rounded-xl border-slate-100"
                  >
                    <option value="">All Regions</option>
                    {primaryRegions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select 
                    value={selectedPrimaryTSM} 
                    onChange={e => setSelectedPrimaryTSM(e.target.value)}
                    className="input-clean py-1.5 text-[10px] min-w-[120px] rounded-xl border-slate-100"
                  >
                    <option value="">All TSMs</option>
                    {primaryTsms.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select 
                    value={selectedPrimaryTown} 
                    onChange={e => setSelectedPrimaryTown(e.target.value)}
                    className="input-clean py-1.5 text-[10px] min-w-[120px] rounded-xl border-slate-100"
                  >
                    <option value="">All Towns</option>
                    {primaryTowns.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin max-h-[65vh]">
                <table className="w-full text-left border-collapse min-w-[1500px]">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-slate-50/95 backdrop-blur-sm text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-4 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-100">Distributor / Town</th>
                      {SKUS.map(sku => (
                        <th key={sku.id} className="px-3 py-4 text-center border-r border-slate-100/50">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full mb-1" style={{ backgroundColor: CATEGORY_COLORS[sku.category] }}></div>
                            <span className="leading-tight whitespace-nowrap">{sku.name}</span>
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-4 text-center border-r border-slate-100 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">Remarks</th>
                      <th className="px-6 py-4 text-right bg-slate-50">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {primaryFilteredDists.map((dist, idx) => {
                      const items = primaryOrdersEntry[dist.distributor] || {};
                      let subVal = 0;
                      SKUS.forEach(s => { subVal += (items[s.id] || 0) * (s.pricePerCarton || 0); });
                      const subTons = calculateTonnage(items, SKUS);
                      const subGross = calculateGross(items, SKUS);

                      return (
                        <tr key={`${dist.distributor}-${idx}`} className="group hover:bg-slate-50/80 transition-all">
                          <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_10px_rgba(0,0,0,0.03)]">
                            <p className="text-xs font-black text-slate-700 leading-none truncate max-w-[200px]">{dist.distributor}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-bold uppercase tracking-tighter">{dist.town}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{dist.tsm}</span>
                            </div>
                          </td>
                          {SKUS.map(sku => (
                            <td key={sku.id} className="px-2 py-3 border-r border-slate-100/30">
                              <input 
                                type="number" 
                                min="0"
                                value={primaryOrdersEntry[dist.distributor]?.[sku.id] || ''}
                                onChange={(e) => handlePrimaryChange(dist.distributor, sku.id, parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-lg px-2 py-1.5 text-xs font-black text-seablue text-center focus:bg-white focus:ring-2 focus:ring-seablue/20 outline-none transition-all placeholder:text-slate-300"
                                placeholder="0"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-3 border-r border-slate-100/30">
                            <textarea 
                              value={primaryRemarks[dist.distributor] || ''}
                              onChange={(e) => handleRemarksChange(dist.distributor, e.target.value)}
                              rows={1}
                              className="w-full bg-slate-50/50 border border-slate-100 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 focus:bg-white focus:ring-2 focus:ring-seablue/20 outline-none transition-all min-w-[200px]"
                              placeholder="Any special reason..."
                            />
                          </td>
                          <td className="px-6 py-4 bg-slate-50/30 whitespace-nowrap">
                             <div className="text-right space-y-0.5">
                               <p className="text-[10px] font-black text-slate-700">Rs {subVal.toLocaleString()}</p>
                               <div className="flex items-center justify-end gap-2">
                                 {subTons > 0 && <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-tighter">{subTons.toFixed(3)} TO</span>}
                                 {subGross > 0 && <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-tighter">{subGross} GR</span>}
                               </div>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="sticky bottom-0 z-20">
                    <tr className="bg-slate-100/95 backdrop-blur-md font-black text-seablue border-t-2 border-seablue/20">
                      <td className="px-6 py-4 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.05)] text-[10px] uppercase tracking-widest">Grand Totals</td>
                      {SKUS.map(sku => {
                        const total = primaryFilteredDists.reduce((sum, dist) => sum + (primaryOrdersEntry[dist.distributor]?.[sku.id] || 0), 0);
                        return (
                          <td key={sku.id} className="px-3 py-4 text-center text-xs border-r border-slate-200/30">
                            {total > 0 ? total.toLocaleString() : '-'}
                          </td>
                        );
                      })}
                      <td colSpan={2} className="px-6 py-4 text-right">
                         {(() => {
                           let gVal = 0, gTons = 0, gGross = 0;
                           primaryFilteredDists.forEach(d => {
                             const items = primaryOrdersEntry[d.distributor] || {};
                             SKUS.forEach(sku => {
                               const qty = items[sku.id] || 0;
                               gVal += qty * (sku.pricePerCarton || 0);
                               if (sku.category === 'DWB' || ['Kite Glow', 'Burq Action', 'Vero'].includes(sku.category)) {
                                  gTons += (qty * (sku.weight_gm_per_pack * (sku.unitsPerCarton || 0))) / 1000000;
                               }
                               if (sku.category === 'Match') gGross += qty * (sku.grossPerCarton || 0);
                             });
                           });
                           return (
                             <div className="flex items-baseline justify-end gap-6 h-full">
                               <div className="text-right">
                                 <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                                 <p className="text-sm font-black text-seablue">Rs {gVal.toLocaleString()}</p>
                               </div>
                               <div className="text-right">
                                 <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">Total Tonnage</p>
                                 <p className="text-sm font-black text-emerald-600">{gTons.toFixed(3)} <span className="text-[10px]">TO</span></p>
                               </div>
                               <div className="text-right">
                                 <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">Match Gross</p>
                                 <p className="text-sm font-black text-indigo-600">{gGross} <span className="text-[10px]">GR</span></p>
                               </div>
                             </div>
                           )
                         })()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <History className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Fulfillment History</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">Month Filter:</span>
                    <input 
                       type="month"
                       value={selectedMonth}
                       onChange={e => setSelectedMonth(e.target.value)}
                       className="input-clean py-1.5 px-3 text-[10px] rounded-xl border-slate-100"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-4 py-4">Status / Age</th>
                        <th className="px-4 py-4">Order Details</th>
                        <th className="px-4 py-4">Matrix Summary</th>
                        <th className="px-4 py-4">Logistics Updates</th>
                        {(userRole === 'Admin' || userRole === 'Super Admin') && <th className="px-4 py-4 text-center">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {primaryOrderHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <div className="flex flex-col items-center">
                              <Package className="w-10 h-10 text-slate-200 mb-4" />
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Primary Orders Found</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        primaryOrderHistory.map((item) => {
                          const age = calculateOrderAge(item.date);
                          const isPending = item.status === 'Pending';
                          const items = JSON.parse(item.items || '{}');
                          const tonnage = calculateTonnage(items, SKUS);
                          const gross = calculateGross(items, SKUS);

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-5">
                                <div className="flex flex-col gap-2">
                                  <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase text-center ${
                                    item.status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                                    item.status === 'In Clearance' ? 'bg-blue-100 text-blue-600' :
                                    item.status === 'Dispatched' ? 'bg-emerald-100 text-emerald-600' :
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {item.status}
                                  </span>
                                  {isPending && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100/50">
                                      <Clock className="w-3 h-3 text-amber-500" />
                                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">{age} Days Age</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-5">
                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{item.distributor}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] font-bold text-slate-400 text-nowrap">{item.town}</span>
                                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase">{item.date}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-2 opacity-60">
                                   <User className="w-3 h-3" />
                                   <span className="text-[8px] font-bold uppercase">{item.tsm}</span>
                                </div>
                              </td>
                              <td className="px-4 py-5">
                                 <div className="grid grid-cols-2 gap-3 min-w-[150px]">
                                   <div>
                                      <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Value</p>
                                      <p className="text-[10px] font-black text-slate-800">Rs {Number(item.total_amount || 0).toLocaleString()}</p>
                                   </div>
                                   <div>
                                      <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Volume</p>
                                      <p className="text-[9px] font-bold text-emerald-600 leading-tight">{tonnage.toFixed(2)} TO</p>
                                      <p className="text-[9px] font-bold text-indigo-600 leading-tight">{gross} GR</p>
                                   </div>
                                 </div>
                              </td>
                              <td className="px-4 py-5">
                                 <div className="space-y-2">
                                   {item.remarks && (
                                     <div className="flex gap-2">
                                       <FileText className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                       <p className="text-[10px] text-slate-600 italic leading-snug line-clamp-2 max-w-[200px]">{item.remarks}</p>
                                     </div>
                                   )}
                                   {item.dispatched_date && (
                                      <div className="flex items-center gap-2 text-emerald-600">
                                        <Truck className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase">Dispatched {item.dispatched_date}</span>
                                      </div>
                                   )}
                                 </div>
                              </td>
                              {(userRole === 'Admin' || userRole === 'Super Admin') && (
                                <td className="px-4 py-5">
                                  <div className="flex justify-center gap-2">
                                    <button 
                                      onClick={() => {
                                        const newStatus = window.prompt('Update Status (Pending, In Clearance, Dispatched, Cancelled):', item.status);
                                        const newRemarks = window.prompt('Update Remarks:', item.remarks || '');
                                        let dDate = item.dispatched_date;
                                        if (newStatus === 'Dispatched') {
                                          dDate = window.prompt('Enter Dispatch Date (YYYY-MM-DD):', getPSTDate()) || item.dispatched_date;
                                        }
                                        if (newStatus) handleUpdateStatus(item.id, newStatus, newRemarks || undefined, dDate);
                                      }}
                                      className="p-2 hover:bg-slate-100 rounded-lg text-seablue transition-colors border border-slate-100 flex items-center gap-2"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      <span className="text-[8px] font-black uppercase tracking-widest">Update</span>
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  if (view === 'stocks') {
    const handleStockChange = (distributor: string, skuId: string, val: number) => {
      setStockOrders(prev => ({
        ...prev,
        [distributor]: {
          ...(prev[distributor] || {}),
          [skuId]: { ctn: val }
        }
      }));
    };

    const handleSubmitAllStocks = async () => {
      if (!selectedStockTSM) {
        setMessage({ text: 'Please select a TSM', type: 'error' });
        return;
      }
      setIsSubmittingStocks(true);
      try {
        const promises = Object.entries(stockOrders).map(([distributor, stocks]) => {
          const distInfo = filteredDistributors.find(d => d.distributor === distributor);
          return apiFetch('/api/stocks', {
            method: 'POST',
            body: JSON.stringify({
              date: new Date().toISOString().split('T')[0],
              tsm: selectedStockTSM,
              town: distInfo?.town || '',
              distributor: distributor,
              stocks: stocks
            })
          });
        });
        await Promise.all(promises);
        setMessage({ text: 'All Stock Reports Submitted!', type: 'success' });
        setStockOrders({});
        syncGoogle();
      } catch (e) {
        setMessage({ text: 'Error submitting stocks', type: 'error' });
      } finally {
        setIsSubmittingStocks(false);
        setTimeout(() => setMessage(null), 3000);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 pb-40">
        <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
        
        <div className="p-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-black text-seablue uppercase tracking-tight leading-none">Distributor Stocks</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Inventory Management & Reporting</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => {
                  const headers = ['Director', 'NSM', 'RSM', 'Region', 'TSM', 'Town', 'Distributor', 'OB ID', ...SKUS.map(s => s.name)];
                  const rows = filteredDistributors.map(d => {
                    const stocks = stockOrders[d.distributor] || {};
                    const obInfo = obAssignments.find(ob => ob.distributor === d.distributor) || {} as any;
                    return [
                      obInfo.director || '', obInfo.nsm || '', obInfo.rsm || '', d.region || '', d.tsm, d.town, d.distributor, d.ob_id || '',
                      ...SKUS.map(sku => stocks[sku.id]?.ctn || 0)
                    ];
                  });
                  const csv = Papa.unparse([headers, ...rows]);
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `Stock_Report_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="btn-seablue px-4 py-2 text-[10px] flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button 
                onClick={handleSubmitAllStocks}
                disabled={isSubmittingStocks || Object.keys(stockOrders).length === 0}
                className="btn-seablue px-4 py-2 text-[10px] flex items-center gap-2 shadow-lg shadow-seablue/20"
              >
                {isSubmittingStocks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Submit All
              </button>
            </div>
          </motion.div>
          <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
            <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 mr-auto">
                <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
                  <Store className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Inventory Matrix</h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select 
                  value={selectedStockRegion} 
                  onChange={e => setSelectedStockRegion(e.target.value)}
                  className="input-clean py-1.5 text-[10px] min-w-[120px] rounded-xl"
                >
                  <option value="">All Regions</option>
                  {stockRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select 
                  value={selectedStockTSM} 
                  onChange={e => setSelectedStockTSM(e.target.value)}
                  className="input-clean py-1.5 text-[10px] min-w-[120px] rounded-xl"
                >
                  <option value="">All TSMs</option>
                  {stockTsms.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select 
                  value={selectedStockTown} 
                  onChange={e => setSelectedStockTown(e.target.value)}
                  className="input-clean py-1.5 text-[10px] min-w-[120px] rounded-xl"
                >
                  <option value="">All Towns</option>
                  {stockTowns.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin max-h-[70vh]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-slate-50/90 backdrop-blur-sm text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4 sticky left-0 bg-slate-50/90 z-10 border-r border-slate-100">Distributor</th>
                    <th className="px-6 py-4 border-r border-slate-100/50">Town</th>
                    <th className="px-6 py-4 border-r border-slate-100/50">OB ID</th>
                    {SKUS.map(sku => (
                      <th key={sku.id} className="px-4 py-4 text-center min-w-[100px] border-r border-slate-100/50">{sku.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDistributors.map((dist, idx) => (
                    <tr key={`${dist.distributor}-${idx}`} className="group hover:bg-slate-50/80 transition-all">
                      <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <p className="text-xs font-black text-slate-700">{dist.distributor}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{dist.tsm}</p>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500 border-r border-slate-100/30">{dist.town}</td>
                      <td className="px-6 py-4 text-[10px] font-black text-seablue border-r border-slate-100/30">{dist.ob_id || '-'}</td>
                      {SKUS.map(sku => (
                        <td key={sku.id} className="px-4 py-3 border-r border-slate-100/30">
                          <input 
                            type="number" 
                            min="0"
                            value={stockOrders[dist.distributor]?.[sku.id]?.ctn || ''}
                            onChange={(e) => handleStockChange(dist.distributor, sku.id, parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-50/50 border border-slate-100 rounded-lg px-2 py-1.5 text-xs font-black text-seablue text-center focus:bg-white focus:ring-2 focus:ring-seablue/20 outline-none transition-all"
                            placeholder="0"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-20">
                  <tr className="bg-slate-100 font-black text-seablue border-t-2 border-seablue/20">
                    <td className="px-6 py-3 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-[10px] uppercase tracking-widest">Total Stock (Ctns)</td>
                    <td className="px-6 py-3 border-r border-slate-200/30"></td>
                    {SKUS.map(sku => {
                      const total = filteredDistributors.reduce((sum, dist) => {
                        return sum + (stockOrders[dist.distributor]?.[sku.id]?.ctn || 0);
                      }, 0);
                      return (
                        <td key={sku.id} className="px-4 py-3 text-center text-xs border-r border-slate-200/30">
                          {total > 0 ? total : '-'}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      </div>
    );
  }
  if (view === 'history') {
    if (isLoadingHistory) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
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

    const paginatedHistory = history.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);
    const totalPages = Math.ceil(history.length / itemsPerPage);

    return (
      <div className="min-h-screen bg-slate-50 pb-10">
        <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
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
                  setHistoryFilters(prev => ({ ...prev, tsm: val, ob: '' }));
                  // Auto-fetch on change
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
                  setHistoryFilters(prev => ({ ...prev, ob: val }));
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
                  setHistoryFilters(prev => ({ ...prev, from: val }));
                  setTimeout(() => fetchHistory(), 0);
                }}
                className="input-clean text-[10px] py-1 px-1 min-w-[100px] flex-1"
              />
              <input 
                type="date" 
                value={historyFilters.to} 
                onChange={(e) => {
                  const val = e.target.value;
                  setHistoryFilters(prev => ({ ...prev, to: val }));
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
            <>
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
                          {group.entries.map(h => {
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
                                      const summary = generateWhatsAppMessage(h, true);
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
            </>
          )}
        </main>
      </div>
    );
  }

  if (!token || token === 'null') {
    return (
      <>
        <PWAInstallPrompt />
        <Login onLogin={handleLogin} logo={appLogo} />
      </>
    );
  }

  if (view === 'entry') {
    return (
      <ErrorBoundary>
        <PWAInstallPrompt />
        <div className="min-h-screen bg-slate-50 pb-40">
        <MainNav view={view} setView={setView} role={userRole} userEmail={userEmail} onLogout={handleLogout} logo={appLogo} />
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {appLogo ? (
                <div className="h-8 flex items-center justify-center">
                  <img src={appLogo} alt="Logo" className="h-full w-auto object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white shadow-sm overflow-hidden">
                  <Logo className="w-5 h-5" />
                </div>
              )}
              <div>
                <h1 className="text-sm font-black text-seablue uppercase tracking-tight leading-none">SalesPulse</h1>
                <div className="flex flex-col mt-1">
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    {lastUpdated ? `Updated: ${lastUpdated}` : 'Secondary Sales Intelligence'}
                  </p>
                  {userName && (
                    <p className="text-[7px] font-black text-indigo-600 uppercase tracking-widest leading-none mt-1">
                      Logged in as: {userName}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button 
                onClick={syncEverything}
                disabled={isSyncingGlobal || !appConfig.google_spreadsheet_id}
                className={`p-1.5 rounded-full transition-colors ${isSyncingGlobal ? 'text-emerald-500' : 'text-emerald-600 hover:bg-emerald-50'}`}
                title="Full Sync with Google Sheets"
              >
                <Cloud className={`w-4 h-4 ${isSyncingGlobal ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => { fetchAdminData(); fetchHistory(true); }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-seablue transition-colors"
                title="Refresh Local Data"
              >
                <RefreshCw className={`w-4 h-4 ${(isLoadingAdmin || isLoadingHistory) ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={saveDraft} 
                disabled={isSaving}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-black uppercase text-[9px] tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                <span className="hidden sm:inline">Save as Draft</span>
              </button>
              <button 
                onClick={submitOrder} 
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-seablue text-white rounded-lg font-black uppercase text-[9px] tracking-widest shadow-md shadow-blue-100 hover:bg-seablue-dark transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span className="hidden sm:inline">Submit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 py-3 space-y-3">
        {/* TSM Filter - Restricted by Role */}
        {userRole !== 'OB' && tsmList.length > 0 && (
          <div className="card-clean p-1.5 bg-seablue/5 border-seablue/10 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {['Super Admin', 'Admin', 'Director', 'NSM', 'RSM', 'SC'].includes(userRole || '') && (
                <div className="flex items-center gap-1 flex-1">
                  <label className="text-[7px] font-black text-seablue uppercase tracking-widest whitespace-nowrap">Region:</label>
                  <select 
                    value={selectedEntryRegion} 
                    onChange={(e) => {
                      setSelectedEntryRegion(e.target.value);
                      setSelectedTSM('');
                      setOrder(prev => ({ ...prev, obContact: '', orderBooker: '', route: '', town: '', distributor: '', totalShops: 50 }));
                    }} 
                    className="input-clean flex-1 min-w-[80px] text-[9px] py-0.5 px-1"
                  >
                    <option value="">All Regions</option>
                    {entryRegions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-1 flex-1">
                <label className="text-[7px] font-black text-seablue uppercase tracking-widest whitespace-nowrap">TSM:</label>
                <select 
                  value={selectedTSM} 
                  disabled={(userRole === 'TSM' || userRole === 'ASM')}
                  onChange={(e) => {
                    setSelectedTSM(e.target.value);
                    setOrder(prev => ({ ...prev, obContact: '', orderBooker: '', route: '', town: '', distributor: '', totalShops: 50 }));
                  }} 
                  className="input-clean flex-1 min-w-[80px] text-[9px] py-0.5 px-1"
                >
                  <option value="">All TSMs</option>
                  {filteredEntryTSMList.map(tsm => <option key={tsm} value={tsm}>{tsm}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Meta Info Section */}
        <div className="card-clean p-3 grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Date</label>
            <input type="date" value={order.date} onChange={(e) => handleMetaChange('date', e.target.value)} className="input-clean w-full text-[10px] py-1" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">OB</label>
            <select 
              value={order.obContact} 
              disabled={userRole === 'OB'}
              onChange={(e) => handleMetaChange('obContact', e.target.value)} 
              className="input-clean w-full text-[10px] py-1"
            >
              <option value="">Select OB</option>
              {filteredOBs.map(ob => (
                <option key={ob.contact} value={ob.contact}>
                  {ob.name} ({ob.contact})
                </option>
              ))}
            </select>
          </div>
          {order.obContact?.startsWith('TSM-') && (
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Town</label>
              <select 
                value={order.town} 
                onChange={(e) => handleMetaChange('town', e.target.value)}
                className="input-clean w-full text-[10px] py-1"
              >
                <option value="">Select Town</option>
                {Array.from(new Set(tsmAssignments.filter(t => (t.tsm_name || '').trim().toLowerCase() === (order.tsm || '').trim().toLowerCase()).map(t => t.town))).map(town => (
                  <option key={town} value={town}>{town}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Route</label>
            <select value={order.route} onChange={(e) => handleMetaChange('route', e.target.value)} className="input-clean w-full text-[10px] py-1" disabled={!order.obContact}>
              <option value="">Select Route</option>
              {(() => {
                let routes: string[] = [];
                if (order.obContact?.startsWith('TSM-')) {
                  const tsmAssigns = tsmAssignments.filter(t => (t.tsm_name || '').trim().toLowerCase() === (order.tsm || '').trim().toLowerCase() && t.town === order.town);
                  tsmAssigns.forEach(t => {
                    if (t.routes) routes.push(...t.routes.split(',').map((r:string) => r.trim()));
                  });
                  if (routes.length === 0) routes = ['TSM Route'];
                } else {
                  routes = obAssignments.find(a => a.contact === order.obContact)?.routes || [];
                }
                return Array.from(new Set(routes)).map(r => (
                  <option key={String(r)} value={String(r)}>{String(r)}</option>
                ));
              })()}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Shops</label>
            <input type="number" inputMode="numeric" autoComplete="off" value={order.totalShops || ''} onChange={(e) => handleMetaChange('totalShops', parseInt(e.target.value) || 0)} className="input-clean w-full bg-slate-50 text-[10px] py-1" disabled={order.visitType === 'Absent'} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Visited</label>
            <input type="number" inputMode="numeric" autoComplete="off" value={order.visitType === 'Absent' ? 0 : (order.visitedShops || '')} onChange={(e) => handleMetaChange('visitedShops', parseInt(e.target.value) || 0)} className="input-clean w-full text-[10px] py-1" disabled={order.visitType === 'Absent'} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Prod</label>
            <input type="number" inputMode="numeric" autoComplete="off" value={order.visitType === 'Absent' ? 0 : (order.productiveShops || '')} onChange={(e) => handleMetaChange('productiveShops', parseInt(e.target.value) || 0)} className={`input-clean w-full text-[10px] py-1 ${order.visitType !== 'Absent' && order.visitedShops > 0 && (order.productiveShops / order.visitedShops) < 0.7 ? 'border-red-300' : ''}`} disabled={order.visitType === 'Absent'} />
          </div>
          <div className="md:col-span-6 flex flex-wrap gap-4 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visit Type:</span>
              <div className="flex gap-2">
                {[
                  { id: 'A', label: 'Alone (A)', color: 'bg-slate-100 text-slate-600' },
                  { id: 'V', label: 'Van Sales (V)', color: 'bg-emerald-100 text-emerald-600', tsmOnly: true },
                  { id: 'RR', label: 'Route Riding (RR)', color: 'bg-seablue/10 text-seablue' },
                  { id: 'Absent', label: 'Absent', color: 'bg-red-100 text-red-600' }
                ].filter(type => !type.tsmOnly || (order.obContact && order.obContact.startsWith('TSM-'))).map(type => (
                  <button
                    key={type.id}
                    onClick={() => setOrder(prev => ({ 
                      ...prev, 
                      visitType: type.id as any,
                      visitedShops: type.id === 'Absent' ? 0 : prev.visitedShops,
                      productiveShops: type.id === 'Absent' ? 0 : prev.productiveShops,
                      categoryProductiveShops: type.id === 'Absent' ? {} : prev.categoryProductiveShops,
                      items: type.id === 'Absent' ? {} : prev.items
                    }))}
                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${order.visitType === type.id ? `${type.color} border-current shadow-sm` : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

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
                      onChange={(e) => setOrder(prev => ({ ...prev, categoryProductiveShops: { ...prev.categoryProductiveShops, [category]: parseInt(e.target.value) || 0 } }))} 
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
                            <div className="text-[10px] font-bold text-slate-700 leading-tight">{sku.name}</div>
                            <div className="text-[8px] text-slate-400 font-mono">{sku.unitsPerCarton}u</div>
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
                    const summary = generateWhatsAppMessage(lastSubmittedOrder, false);
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

      {/* Chatbot removed as per user request */}
    </div>
    </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">View Not Found</h2>
        <button 
          onClick={() => setView('home')}
          className="px-6 py-3 bg-seablue text-white rounded-2xl font-black uppercase tracking-widest"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}
