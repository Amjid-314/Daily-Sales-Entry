import React from 'react';
import { motion } from 'motion/react';
import { 
  ClipboardList, 
  LayoutDashboard, 
  Waves, 
  History, 
  Store, 
  Settings, 
  HelpCircle, 
  EyeOff 
} from 'lucide-react';

export const APP_TABS = [
  { id: 'entry', label: 'Entry', icon: ClipboardList, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'SC', 'RSM', 'NSM', 'Director'] },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'stats', label: 'Stats', icon: Waves, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'] },
  { id: 'reports', label: 'Reports', icon: ClipboardList, roles: ['Super Admin', 'Admin', 'RSM', 'NSM', 'Director', 'SC', 'TSM', 'ASM'] },
  { id: 'history', label: 'History', icon: History, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'stocks', label: 'Stocks', icon: Store, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC'] },
  { id: 'admin', label: 'Admin', icon: Settings, roles: ['Super Admin', 'Admin'] },
  { id: 'help', label: 'Help', icon: HelpCircle, roles: ['Super Admin', 'Admin', 'TSM', 'ASM', 'OB', 'RSM', 'NSM', 'Director', 'SC'] },
];

interface MainNavProps {
  view: string;
  setView: (v: any) => void;
  role: string | null;
  onLogout: () => void;
}

export const MainNav: React.FC<MainNavProps> = ({ view, setView, role, onLogout }) => {
  const visibleTabs = APP_TABS.filter(tab => !role || tab.roles.includes(role));

  return (
    <nav className="bg-white border-b border-slate-100 px-4 h-14 flex justify-around items-center sticky top-0 z-40 shadow-sm overflow-x-auto no-scrollbar gap-2">
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
