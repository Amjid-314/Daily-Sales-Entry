import React from 'react';
import { motion } from 'motion/react';
import { 
  RefreshCw, 
  User, 
  Mail, 
  Target, 
  History, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  LayoutDashboard,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { APP_TABS } from './MainNav';

interface PostLoginDashboardProps {
  user: any;
  data: any;
  setView: (v: any) => void;
  onRefresh?: () => void;
  isSyncing?: boolean;
  role: string | null;
}

export const PostLoginDashboard: React.FC<PostLoginDashboardProps> = ({ 
  user, 
  data, 
  setView, 
  onRefresh, 
  isSyncing, 
  role 
}) => {
  if (!user || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="w-8 h-8 text-seablue animate-spin" />
    </div>
  );

  const CATEGORY_COLORS: Record<string, string> = {
    "Kite Glow": "#38bdf8",
    "Burq Action": "#f97316",
    "Vero": "#eab308",
    "DWB": "#22c55e",
    "Match": "#1e3a8a"
  };

  const CATEGORIES = ["Kite Glow", "Burq Action", "Vero", "DWB", "Match"];

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen pb-40">
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-white flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <button 
            onClick={onRefresh}
            disabled={isSyncing}
            className={`p-2 rounded-full bg-slate-50 text-slate-400 hover:text-seablue transition-all ${isSyncing ? 'animate-spin' : ''}`}
            title="Sync Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="w-16 h-16 bg-seablue/10 rounded-2xl flex items-center justify-center text-seablue">
          <User className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">{user.name}</h1>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="px-2 py-0.5 bg-seablue/10 text-seablue text-[8px] font-black uppercase tracking-widest rounded-full">{user.role}</span>
            {user.region && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-full">{user.region}</span>}
            {user.town && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-full">{user.town}</span>}
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1">
            <Mail className="w-3 h-3" /> {user.email}
          </p>
        </div>
      </div>

      {/* Brand Achievement (MTD) with RPD */}
      <section className="card-clean bg-white p-6 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-seablue" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Brand Performance</h3>
          </div>
          <div className="flex gap-2">
            <div className="text-right">
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Days Gone</div>
              <div className="text-[10px] font-black text-slate-700">{data.workingDaysPassed} / {data.totalWorkingDays}</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Remaining</div>
              <div className="text-[10px] font-black text-amber-600">{data.remainingWorkingDays} Days</div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {data.brandPerformance.map((bp: any, idx: number) => (
            <motion.div 
              key={bp.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="space-y-3"
            >
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[bp.category] }} />
                  <span className="text-[11px] font-black text-slate-700 uppercase">{bp.category}</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] font-black text-seablue">{bp.achievement.toFixed(1)}</span>
                    <span className="text-[9px] font-bold text-slate-400">/</span>
                    <span className="text-[12px] font-black text-slate-400">{bp.target.toFixed(1)}</span>
                    <span className={`ml-2 text-[11px] font-black ${bp.percentage >= 100 ? 'text-emerald-600' : bp.percentage >= 80 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {bp.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {bp.achTons.toFixed(2)} Tons
                  </div>
                </div>
              </div>
              
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, bp.percentage)}%` }}
                  transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                  className="h-full rounded-full shadow-sm"
                  style={{ backgroundColor: CATEGORY_COLORS[bp.category] }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Daily</div>
                  <div className="text-[10px] font-black text-slate-700">{bp.avgDailySales.toFixed(1)}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
                  <div className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">Target (RPD)</div>
                  <div className="text-[10px] font-black text-amber-600">{bp.rpd.toFixed(1)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining</div>
                  <div className="text-[10px] font-black text-slate-700">{bp.remainingTarget.toFixed(1)}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-clean p-5 bg-gradient-to-br from-seablue to-blue-700 text-white shadow-xl shadow-blue-100"
        >
          <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Today's Sales</div>
          <div className="text-3xl font-black">{data.todaySales.toFixed(1)}</div>
          <div className="text-[8px] font-bold opacity-60 mt-2 uppercase">Bags / Cartons</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-clean p-5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-xl shadow-emerald-100"
        >
          <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">MTD Volume</div>
          <div className="text-3xl font-black">{data.mtdVolumeTons.toFixed(1)} <span className="text-sm font-normal opacity-70">Tons</span></div>
          <div className="text-[8px] font-bold opacity-60 mt-2 uppercase">{data.mtdSales.toFixed(0)} Total Bags</div>
        </motion.div>
      </div>

      {/* Last 8 Visits Brand Wise Sales */}
      <section className="card-clean bg-white overflow-hidden rounded-3xl border-none shadow-xl shadow-slate-200/40">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
          <div className="w-8 h-8 bg-seablue/10 rounded-xl flex items-center justify-center text-seablue">
            <History className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Last 8 Visits (Brand-wise)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4 whitespace-nowrap">Date / Route</th>
                {CATEGORIES.map(cat => (
                  <th key={cat} className="px-4 py-4 text-right whitespace-nowrap">{cat}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.last8Visits.map((v: any, idx: number) => (
                <tr key={idx} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs font-black text-slate-700">{v.date}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{v.route}</div>
                  </td>
                  {CATEGORIES.map(cat => (
                    <td key={cat} className="px-4 py-4 text-right whitespace-nowrap">
                      <span className={`text-xs font-black ${v.brands[cat] > 0 ? 'text-seablue' : 'text-slate-200'}`}>
                        {(v.brands[cat] || 0).toFixed(1)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Brand-wise Active OBs & Volume */}
      <section className="card-clean bg-white p-6 shadow-xl shadow-slate-200/40">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-4 h-4 text-seablue" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Active OBs & Volume (Brand-wise)</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">
            <div>Brand</div>
            <div className="text-center">Active OBs</div>
            <div className="text-right">MTD Volume (Tons)</div>
          </div>
          {CATEGORIES.map(cat => (
            <div key={cat} className="grid grid-cols-3 gap-2 items-center">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                <span className="text-[10px] font-bold text-slate-700">{cat}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black text-seablue bg-seablue/5 px-2 py-0.5 rounded-full">
                  {data.activeOBsBrandWise[cat] || 0}
                </span>
              </div>
              <div className="text-right text-[10px] font-black text-slate-600">
                {(data.mtdVolumeBrandWise[cat] || 0).toFixed(2)}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2 items-center pt-2 border-t border-dashed">
            <div className="text-[10px] font-black text-slate-800">Total</div>
            <div className="text-center">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {data.totalActiveOBs}
              </span>
            </div>
            <div className="text-right text-[10px] font-black text-slate-800">
              {data.mtdVolumeTons.toFixed(2)}
            </div>
          </div>
        </div>
      </section>

      {/* Sales Trend (Last 7 Days) */}
      <section className="card-clean bg-white p-6 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Last 7 Days Sales</h3>
          </div>
        </div>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.last7DaysSales}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                labelStyle={{ display: 'none' }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#0ea5e9" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-2">
          {data.last7DaysSales.map((d: any, i: number) => (
            <span key={i} className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">
              {d.day}
            </span>
          ))}
        </div>
      </section>

      {/* OB Target vs Achievement (Brand wise) */}
      {data.obPerformance && data.obPerformance.length > 0 && (
        <section className="card-clean bg-white p-6 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Team Performance (Brand wise)</h3>
            </div>
          </div>
          <div className="space-y-6">
            {data.obPerformance.map((ob: any, idx: number) => (
              <div key={ob.name} className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight border-b pb-2 flex justify-between">
                  <span>{ob.name}</span>
                  <span className="text-[8px] text-slate-400">MTD Achievement</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {ob.brands.map((b: any) => (
                    <div key={b.category} className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase">{b.category}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-slate-700">{b.achievement.toFixed(1)}</span>
                        <span className="text-[8px] text-slate-400">/</span>
                        <span className="text-[10px] font-bold text-slate-400">{b.target.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Brand wise Sales (Last 8 Visits) */}
      <section className="card-clean bg-white p-6 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Last 8 Visits Brand Sales</h3>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="py-2 pr-2">Date / Info</th>
                {CATEGORIES.map(cat => (
                  <th key={cat} className="py-2 px-2 text-center">{cat}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.last8Visits.map((v: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-2 pr-2">
                    <div className="text-[9px] font-black text-slate-700">{v.date}</div>
                    <div className="text-[7px] font-bold text-slate-400 uppercase">{v.route}</div>
                    {role !== 'OB' && <div className="text-[7px] font-black text-seablue uppercase truncate max-w-[80px]">{v.obName}</div>}
                  </td>
                  {CATEGORIES.map(cat => (
                    <td key={cat} className="py-2 px-2 text-center">
                      <span className={`text-[10px] font-black ${v.brands[cat] > 0 ? 'text-seablue' : 'text-slate-300'}`}>
                        {v.brands[cat].toFixed(1)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              {data.last8Visits.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[10px] font-black text-slate-400 uppercase">No recent visits found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Weakest Routes (Bottom to Top) */}
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

      {/* Action Buttons */}
      <section className="card-clean bg-white p-6 shadow-xl shadow-slate-200/40">
        <div className="flex items-center gap-2 mb-6">
          <LayoutDashboard className="w-4 h-4 text-seablue" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Quick Navigation</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {APP_TABS.filter(tab => !role || tab.roles.includes(role)).map((tab) => {
            return (
              <button 
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm hover:bg-seablue/5 hover:border-seablue/20 transition-all group"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-seablue mb-2 shadow-sm group-hover:scale-110 transition-transform">
                  <tab.icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest text-center">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
