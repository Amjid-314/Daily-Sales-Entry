import React from 'react';

interface DailyStatusViewProps {
  dailyStatus: any[];
}

export const DailyStatusView: React.FC<DailyStatusViewProps> = ({ dailyStatus }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Submitted</div>
          <div className="text-2xl font-black text-emerald-600">{dailyStatus.filter(s => s.submitted).length}</div>
        </div>
        <div className="p-3 bg-red-50 rounded-xl border border-red-100">
          <div className="text-[10px] font-black text-red-400 uppercase tracking-widest">Absent</div>
          <div className="text-2xl font-black text-red-600">{dailyStatus.filter(s => s.visit_type === 'Absent').length}</div>
        </div>
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pending</div>
          <div className="text-2xl font-black text-amber-600">{dailyStatus.filter(s => !s.submitted).length}</div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 uppercase">
              <th className="py-2">OB Name</th>
              <th className="py-2">TSM</th>
              <th className="py-2 text-center">Status</th>
              <th className="py-2 text-center">Visit Type</th>
              <th className="py-2 text-right">Last Entry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {dailyStatus.map(ob => (
              <tr key={ob.contact} className="hover:bg-slate-50">
                <td className="py-2">
                  <div className="font-bold text-slate-700 text-[11px]">{ob.name}</div>
                  <div className="text-[9px] text-slate-400">{ob.contact}</div>
                </td>
                <td className="py-2 text-slate-500 text-[10px]">{ob.tsm}</td>
                <td className="py-2 text-center">
                  {ob.submitted ? (
                    ob.visit_type === 'Absent' ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-bold text-[9px] uppercase">Absent</span>
                    ) : ob.visit_type === 'RR' ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-white font-bold text-[9px] uppercase">Route Riding</span>
                    ) : ob.visit_type === 'V' ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[9px] uppercase">Van Sales</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-600 font-bold text-[9px] uppercase">Alone</span>
                    )
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 font-bold text-[9px] uppercase">Pending</span>
                  )}
                </td>
                <td className="py-2 text-center">
                  {ob.submitted && ob.visit_type !== 'Absent' ? (
                    <span className="font-bold text-slate-600 text-[10px]">{ob.visit_type}</span>
                  ) : '-'}
                </td>
                <td className="py-2 text-right font-mono text-slate-400 text-[10px]">
                  {ob.submitted_at ? new Date(ob.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
