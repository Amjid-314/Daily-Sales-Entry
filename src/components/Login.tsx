import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Loader2, ChevronRight, AlertCircle, Waves } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
  logo: string | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin, logo }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestedRole, setRequestedRole] = useState<string>('Super Admin');

  const isAmjid = username.toLowerCase() === 'amjid.bisconni@gmail.com' || username.toLowerCase() === 'amjid';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, requestedRole: isAmjid ? requestedRole : undefined })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-100"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-slate-200/20 overflow-hidden border border-slate-50 relative group">
            {logo ? (
              <img src={logo} alt="App Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-seablue to-indigo-600 flex items-center justify-center relative overflow-hidden">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative z-10"
                >
                  <Waves className="text-white w-12 h-12 drop-shadow-lg" />
                </motion.div>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <motion.div 
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-full blur-2xl"
                />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">SalesPulse</h1>
          <p className="text-slate-400 text-xs mt-2 font-bold uppercase tracking-widest">Intelligent Sales Execution Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username or ID</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-seablue transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-seablue/20 focus:border-seablue outline-none transition-all text-sm font-bold"
                placeholder="Enter your username or ID"
                required
              />
            </div>
          </div>

          {isAmjid && (
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Select Role</label>
              <select
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-seablue/20 focus:border-seablue outline-none transition-all text-sm font-bold"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="RSM North">RSM North</option>
              </select>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-seablue hover:bg-seablue-light disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-lg shadow-seablue/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
            Authorized Personnel Only • v2.5.0
          </p>
        </div>
      </motion.div>
    </div>
  );
};
