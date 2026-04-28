import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardEdit, 
  LayoutDashboard, 
  Activity, 
  LineChart, 
  PieChart, 
  FileSpreadsheet, 
  History, 
  Box, 
  ShieldCheck, 
  HelpCircle, 
  LogOut,
  Maximize2,
  Minimize2,
  Home,
  ClipboardList,
  ShoppingCart,
  Target,
  Map,
  TrendingUp
} from 'lucide-react';

const SUPER_ADMIN_EMAILS = ['amjid.bisconni@gmail.com', 'Amjid.psh@gmail.com'];

export const APP_TABS = [
  { id: 'entry', label: 'Entry Form', icon: ClipboardEdit, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'SC', 'RSM', 'NSM', 'Director'] },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'mtd_performance', label: 'MTD Target vs Achievement 🎯', icon: Target, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'command_center', label: 'Command Center', icon: Activity, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'insights', label: 'Insights', icon: PieChart, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'stats', label: 'Stats', icon: TrendingUp, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'] },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'] },
  { id: 'sales_trends', label: 'Sales Trends', icon: TrendingUp, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'] },
  { id: 'missing_entries', label: 'Missing Report', icon: ClipboardList, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM', 'OB'] },
  { id: 'history', label: 'History', icon: History, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'stocks', label: 'Stocks', icon: Box, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'primary_orders', label: 'Primary', icon: ShoppingCart, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'target_setting', label: 'Targets', icon: Target, roles: ['Super Admin', 'Admin', 'SC'] },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, roles: ['Super Admin', 'Admin'] },
];

import { Logo } from './Logo';
import { RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface MainNavProps {
  view: string;
  setView: (v: any) => void;
  role: string | null;
  userEmail?: string | null;
  onLogout: () => void;
  logo?: string | null;
  syncStatus?: { text: string; type: 'loading' | 'success' | 'error' | null };
}

export const MainNav: React.FC<MainNavProps> = ({ view, setView, role, userEmail, onLogout, logo, syncStatus }) => {
  const visibleTabs = APP_TABS.filter(tab => {
    const email = (userEmail || '').toLowerCase();
    const isSuperAdmin = SUPER_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email);
    
    // Admin only tabs - strictly for Super Admins in Lock Mode
    if (['admin', 'settings'].includes(tab.id)) {
      return isSuperAdmin;
    }

    // Role-based restrictions
    if (!role) return false;
    const normalizedRole = role.toUpperCase();

    // Users (Non-Super Admin) restrictions
    if (!isSuperAdmin) {
      // Hide Admin panel, Settings
      if (['admin', 'settings'].includes(tab.id)) return false;
      
      // Check if role is allowed for this specific tab
      return tab.roles.map(r => r.toUpperCase()).includes(normalizedRole);
    }

    // Super Admins see everything
    return true;
  });

  const activeTab = APP_TABS.find(t => t.id === view);

  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex flex-col sticky top-0 z-40">
      <AnimatePresence>
        {syncStatus?.type && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`w-full py-1 text-center text-[9px] font-black uppercase tracking-[0.2em] transition-colors border-b shadow-sm ${
              syncStatus.type === 'loading' ? 'bg-amber-500 text-white border-amber-600 animate-pulse' : 
              syncStatus.type === 'success' ? 'bg-emerald-500 text-white border-emerald-600' : 
              'bg-rose-500 text-white border-rose-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {syncStatus.type === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
              {syncStatus.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
              {syncStatus.type === 'error' && <AlertTriangle className="w-3 h-3" />}
              {syncStatus.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <nav className="bg-white border-b border-slate-100 px-4 h-14 flex justify-between items-center shadow-sm overflow-x-auto no-scrollbar gap-2">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 flex items-center justify-center">
          {logo ? (
            <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
          ) : (
            <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white shadow-sm overflow-hidden">
              <Logo className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Back to Home Button */}
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200 group"
          title="Back to Menu"
        >
          <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Back to Menu</span>
        </button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {activeTab && (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-seablue/5 border border-seablue/10 rounded-xl">
            <activeTab.icon className="w-4 h-4 text-seablue" />
            <span className="hidden sm:inline text-xs font-black text-seablue uppercase tracking-widest">{activeTab.label}</span>
          </div>
        )}

        <button 
          onClick={toggleFullscreen}
          className="p-1.5 sm:p-2 text-slate-400 hover:text-seablue transition-all rounded-xl hover:bg-seablue/5"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        <button 
          onClick={onLogout} 
          className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all rounded-xl border border-rose-100 shadow-sm"
          title="Logout"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest sm:hidden">Out</span>
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Logout</span>
        </button>
      </div>
    </nav>
    </div>
  );
};
