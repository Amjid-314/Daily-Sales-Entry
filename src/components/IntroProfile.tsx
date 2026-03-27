import React from 'react';
import { motion } from 'motion/react';
import { User, MapPin, Phone, Shield, LogOut } from 'lucide-react';

interface IntroProfileProps {
  userName: string | null;
  userRole: string | null;
  userRegion: string | null;
  userContact: string | null;
  onLogout: () => void;
}

export const IntroProfile: React.FC<IntroProfileProps> = ({
  userName,
  userRole,
  userRegion,
  userContact,
  onLogout,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 rounded-[3rem] border border-white/60 shadow-2xl shadow-slate-200/50 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-seablue/5 rounded-full -mr-20 -mt-20 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full -ml-16 -mb-16 blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-seablue to-emerald-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center text-seablue shadow-xl border-4 border-white">
            <User className="w-12 h-12" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h1 className="text-3xl font-black text-seablue uppercase tracking-tight leading-none">{userName}</h1>
            <span className="inline-flex px-3 py-1 bg-seablue/10 text-seablue text-[10px] font-black uppercase tracking-widest rounded-full border border-seablue/20">
              {userRole}
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{userRegion || 'National'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{userContact || 'N/A'}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="group flex items-center gap-3 bg-white border border-slate-100 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm hover:shadow-xl hover:shadow-red-500/10"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          Sign Out
        </button>
      </div>
    </motion.div>
  );
};
