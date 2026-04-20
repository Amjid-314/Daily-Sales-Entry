import React from 'react';
import { motion } from 'motion/react';
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
  Target
} from 'lucide-react';

const SUPER_ADMIN_EMAILS = ['amjid.bisconni@gmail.com', 'Amjid.psh@gmail.com'];

export const APP_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'entry', label: 'Entry', icon: ClipboardEdit, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'SC', 'RSM', 'NSM', 'Director'] },
  { id: 'stocks', label: 'Stocks', icon: Box, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'primary_orders', label: 'Primary Order', icon: ShoppingCart, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'target_setting', label: 'Target Setting', icon: Target, roles: ['Super Admin', 'Admin', 'SC'] },
  { id: 'stats', label: 'SalesPulse', icon: Activity, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM', 'OB'] },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'] },
  { id: 'history', label: 'History', icon: History, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, roles: ['Super Admin', 'Admin'] },
  { id: 'help', label: 'Help', icon: HelpCircle, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
];

import { Logo } from './Logo';

interface MainNavProps {
  view: string;
  setView: (v: any) => void;
  role: string | null;
  userEmail?: string | null;
  onLogout: () => void;
  logo?: string | null;
}

export const MainNav: React.FC<MainNavProps> = ({ view, setView, role, userEmail, onLogout, logo }) => {
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
    <nav className="bg-white border-b border-slate-100 flex flex-col sticky top-0 z-40 shadow-sm">
      <div className="px-4 h-14 flex justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 flex items-center justify-center">
            {logo ? (
              <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white shadow-sm overflow-hidden">
                <Logo className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="hidden lg:block">
            <h1 className="text-sm font-black text-seablue uppercase tracking-tight leading-none">SalesPulse</h1>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Intelligence System</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
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
            <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </div>

      <div className="px-4 pb-2 border-t border-slate-50 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-1 min-w-max py-2">
          {/* Back to Home if needed, but tabs cover it */}
          <button
            onClick={() => setView('home')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              view === 'home' 
                ? 'bg-slate-800 text-white shadow-md scale-[1.02]' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-seablue'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>
          </button>

          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-seablue text-white shadow-md shadow-seablue/20 scale-[1.02]' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-seablue'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
