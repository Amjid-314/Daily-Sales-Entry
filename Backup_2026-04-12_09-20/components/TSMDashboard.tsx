import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Package, 
  BarChart3, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ChevronRight
} from 'lucide-react';

interface TSMDashboardProps {
  stats: any;
  obPerformance: any[];
  recentVisits: any[];
  weakestRoutes: any[];
  userName: string | null;
}

export const TSMDashboard: React.FC<TSMDashboardProps> = ({
  stats,
  obPerformance,
  recentVisits,
  weakestRoutes,
  userName,
}) => {
  return (
    <div className="space-y-8">
      {/* TSM Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'My MTD Volume', value: stats.mtdVolume.toFixed(0), icon: Package, color: 'bg-seablue', trend: '+8.2%', unit: 'Bags' },
          { label: 'My Active OBs', value: stats.activeOBs, icon: Users, color: 'bg-emerald-500', trend: '100%', unit: 'Users' },
          { label: 'My Productivity', value: stats.productivity.toFixed(1) + '%', icon: Target, color: 'bg-indigo-500', trend: 'Target: 90%', unit: 'Avg' },
          { label: 'Today Sales', value: stats.dailySales.toFixed(0), icon: TrendingUp, color: 'bg-amber-500', trend: 'Today', unit: 'Bags' },
        ].map((card, i) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-clean p-6 bg-white rounded-[2.5rem] border-none shadow-xl shadow-slate-200/40 group hover:shadow-2xl hover:shadow-slate-200/60 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${card.color.split('-')[1]}/20 transform group-hover:rotate-6 transition-transform`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest">{card.trend}</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{card.label}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800 tracking-tight">{card.value}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{card.unit}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* OB Performance Table */}
        <div className="card-clean bg-white p-8 rounded-[3rem] border-none shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-seablue/10 rounded-2xl flex items-center justify-center text-seablue">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">OB Performance</h3>
            </div>
          </div>
          <div className="space-y-4">
            {obPerformance.map((ob, i) => (
              <div key={ob.name} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl group hover:bg-seablue/5 transition-colors">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[10px] font-black text-seablue shadow-sm">
                  0{i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-black text-slate-700 uppercase">{ob.name}</span>
                    <span className="text-[10px] font-black text-seablue">{ob.achievement.toFixed(0)} Bags</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (ob.achievement / (ob.target || 1000)) * 100)}%` }}
                      className="h-full bg-seablue rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Visits */}
        <div className="card-clean bg-white p-8 rounded-[3rem] border-none shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Recent Visits</h3>
            </div>
          </div>
          <div className="space-y-4">
            {recentVisits.map((visit, i) => (
              <div key={visit.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-emerald-600 shadow-sm">
                    {visit.date.slice(8)}
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-700 uppercase">{visit.order_booker}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{visit.route}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black text-slate-800">{visit.total_achievement.toFixed(1)} Bags</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{visit.productive_shops} Prod.</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weakest Routes */}
      <div className="card-clean bg-white p-8 rounded-[3rem] border-none shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Weakest Routes (Low Productivity)</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {weakestRoutes.map((route, i) => (
            <div key={route.name} className="p-6 bg-red-50/50 rounded-[2rem] border border-red-100/50 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Route #{i + 1}</span>
                <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-1 rounded-lg uppercase tracking-widest">{route.productivity.toFixed(1)}%</span>
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{route.name}</h4>
              <div className="flex justify-between items-center pt-2 border-t border-red-100/50">
                <div className="text-center">
                  <div className="text-[10px] font-black text-slate-800">{route.avgSales.toFixed(1)}</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Avg Bags</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-slate-800">{route.visits}</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Visits</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-slate-800">{route.ob}</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">OB</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
