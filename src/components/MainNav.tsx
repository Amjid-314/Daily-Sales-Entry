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
  EyeOff,
  Target,
  ClipboardList,
  Home
} from 'lucide-react';

const ADMIN_EMAILS = ['amjid.bisconni@gmail.com', 'Amjid.psh@gmail.com'];

export const APP_TABS = [
  { id: 'entry', label: 'Entry', icon: ClipboardEdit, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'SC', 'RSM', 'NSM', 'Director'] },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'command_center', label: 'SalesPulse', icon: Activity, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'insights', label: 'Insights', icon: LineChart, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'stats', label: 'Stats', icon: PieChart, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'] },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'] },
  { id: 'missing_entries', label: 'Missing Entries', icon: ClipboardList, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM', 'OB'] },
  { id: 'history', label: 'History', icon: History, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'stocks', label: 'Stocks', icon: Box, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'] },
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
    const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email);
    
    // Admin only tabs
    if (['admin', 'settings'].includes(tab.id)) {
      return isAdmin;
    }

    // Role-based restrictions
    if (!role) return false;
    const normalizedRole = role.toUpperCase();

    // Users (Non-Admin) restrictions: Allowed: Data entry, Reports, Dashboard, Help
    if (!isAdmin) {
      // Hide Admin panel, Settings, Source (Source is not a tab but we ensure it's not here)
      if (['admin', 'settings'].includes(tab.id)) return false;
      
      // Allowed for all users: Entry, Reports, Dashboard, Help, History
      if (['entry', 'reports', 'dashboard', 'command_center', 'insights', 'help', 'history', 'stocks', 'stats', 'missing_entries'].includes(tab.id)) {
        // Still check if role is allowed for this specific tab
        return tab.roles.map(r => r.toUpperCase()).includes(normalizedRole);
      }
      return false;
    }

    // Admins see everything they are allowed to see by role
    return tab.roles.map(r => r.toUpperCase()).includes(normalizedRole) || isAdmin;
  });

  return (
    <nav className="bg-white border-b border-slate-100 px-4 h-14 flex justify-around items-center sticky top-0 z-40 shadow-sm overflow-x-auto no-scrollbar gap-2">
      <div className="flex-shrink-0 mr-2 flex items-center justify-center">
        {logo ? (
          <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
        ) : (
          <div className="w-8 h-8 bg-seablue rounded-lg flex items-center justify-center text-white shadow-sm overflow-hidden">
            <Logo className="w-5 h-5" />
          </div>
        )}
      </div>
      <button
        onClick={() => setView('home')}
        className={`relative py-2 px-1 flex flex-col items-center gap-1 transition-all min-w-[56px] ${
          view === 'home' ? 'text-seablue' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Home className={`w-5 h-5 transition-transform ${view === 'home' ? 'scale-110' : ''}`} />
        <span className={`text-[9px] font-black uppercase tracking-tight ${view === 'home' ? 'opacity-100' : 'opacity-60'}`}>Home</span>
        {view === 'home' && (
          <motion.div 
            layoutId="nav-indicator" 
            className="absolute -bottom-[1px] h-0.5 w-full bg-seablue rounded-full" 
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </button>
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setView(tab.id as any)}
          className={`relative py-2 px-1 flex flex-col items-center gap-1 transition-all min-w-[56px] ${
            view === tab.id ? 'text-seablue' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <tab.icon className={`w-5 h-5 transition-transform ${view === tab.id ? 'scale-110' : ''}`} />
          <span className={`text-[9px] font-black uppercase tracking-tight ${view === tab.id ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
          {view === tab.id && (
            <motion.div 
              layoutId="nav-indicator" 
              className="absolute -bottom-[1px] h-0.5 w-full bg-seablue rounded-full" 
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      ))}
      <button 
        onClick={onLogout} 
        className="py-2 px-1 flex flex-col items-center gap-1 text-slate-400 hover:text-rose-500 transition-all min-w-[56px]"
      >
        <EyeOff className="w-5 h-5" />
        <span className="text-[9px] font-black uppercase tracking-tight opacity-60">Logout</span>
      </button>
    </nav>
  );
};
