import React, { useState } from 'react';
import { ClipboardList, ChevronRight, ChevronDown, Calendar, User, Users, RefreshCw, Search, Download } from 'lucide-react';

interface MissingEntry {
  ob_name: string;
  ob_contact: string;
  tsm: string;
  asm: string;
  total_working_days: number;
  entries_count: number;
  missing_days_count: number;
  missing_dates: string[];
}

interface Props {
  report: MissingEntry[];
  onRefresh: (month?: string) => void;
  isLoading: boolean;
  selectedMonth: string;
}

export const MissingEntriesReport: React.FC<Props> = ({ report, onRefresh, isLoading, selectedMonth }) => {
  const [expandedOb, setExpandedOb] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Missing Only'>('Missing Only');

  const filteredReport = report.filter(item => {
    const matchesSearch = 
      item.ob_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tsm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ob_contact.includes(searchTerm);
    
    const matchesFilter = filterType === 'All' || item.missing_days_count > 0;
    
    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    const headers = ['OB Name', 'OB Contact', 'TSM', 'Total Working Days', 'Entries Count', 'Missing Days', 'Missing Dates'];
    const rows = filteredReport.map(item => [
      item.ob_name,
      item.ob_contact,
      item.tsm,
      item.total_working_days,
      item.entries_count,
      item.missing_days_count,
      item.missing_dates.join('; ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Missing_Entries_Report_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summarize by TSM
  interface TsmSummaryItem {
    tsm: string;
    total_missing: number;
    obs: number;
  }

  const tsmSummary = report.reduce((acc, item) => {
    const tsmName = item.tsm || 'Unassigned';
    if (!acc[tsmName]) {
      acc[tsmName] = { tsm: tsmName, total_missing: 0, obs: 0 };
    }
    acc[tsmName].total_missing += item.missing_days_count;
    acc[tsmName].obs += 1;
    return acc;
  }, {} as Record<string, TsmSummaryItem>);

  const sortedTsmSummary = (Object.values(tsmSummary) as TsmSummaryItem[]).sort((a, b) => b.total_missing - a.total_missing);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-seablue uppercase tracking-tight">Missing Entries Report</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tracking OB performance & consistency for {selectedMonth}</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search OB or TSM..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-clean w-full pl-10 py-2 text-xs"
            />
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
          <button 
            onClick={() => onRefresh()} 
            disabled={isLoading}
            className="p-2 bg-white border border-slate-200 rounded-xl text-seablue hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-clean p-4 bg-seablue/5 border-seablue/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-seablue text-white rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total OBs</p>
              <p className="text-xl font-black text-seablue leading-none">{report.length}</p>
            </div>
          </div>
        </div>
        <div className="card-clean p-4 bg-rose-50 border-rose-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500 text-white rounded-lg">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">Total Missing</p>
              <p className="text-xl font-black text-rose-600 leading-none">
                {report.reduce((sum, item) => sum + item.missing_days_count, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="card-clean p-4 bg-emerald-50 border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Avg Consistency</p>
              <p className="text-xl font-black text-emerald-600 leading-none">
                {report.length > 0 ? ((report.reduce((sum, item) => sum + (item.entries_count / item.total_working_days), 0) / report.length) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="card-clean p-4 bg-amber-50 border-amber-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none mb-1">Worst TSM</p>
              <p className="text-sm font-black text-amber-600 leading-none truncate">
                {sortedTsmSummary[0]?.tsm || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TSM Summary Table */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">TSM Summary</h3>
          </div>
          <div className="card-clean overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-4 py-3">TSM</th>
                  <th className="px-4 py-3 text-center">OBs</th>
                  <th className="px-4 py-3 text-right">Missing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedTsmSummary.map(item => (
                  <tr key={item.tsm} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-[10px] font-bold text-slate-700">{item.tsm}</td>
                    <td className="px-4 py-3 text-center text-[10px] font-medium text-slate-500">{item.obs}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.total_missing > 5 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                        {item.total_missing}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed OB Report */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Detailed OB Report</h3>
            <div className="flex gap-2">
              {['All', 'Missing Only'].map(type => (
                <button 
                  key={type}
                  onClick={() => setFilterType(type as any)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-seablue text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filteredReport.length === 0 ? (
              <div className="card-clean p-12 text-center text-slate-400">
                <p className="text-xs font-bold uppercase tracking-widest">No missing entries found for current filters</p>
              </div>
            ) : (
              filteredReport.map(item => (
                <div key={item.ob_contact} className="card-clean overflow-hidden">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedOb(expandedOb === item.ob_contact ? null : item.ob_contact)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs ${item.missing_days_count > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                        {item.ob_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 leading-none mb-1">{item.ob_name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.tsm} • {item.ob_contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Consistency</p>
                        <p className="text-sm font-black text-slate-700 leading-none">
                          {((item.entries_count / item.total_working_days) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">Missing</p>
                        <p className="text-sm font-black text-rose-600 leading-none">{item.missing_days_count} Days</p>
                      </div>
                      {expandedOb === item.ob_contact ? <ChevronDown className="w-5 h-5 text-slate-300" /> : <ChevronRight className="w-5 h-5 text-slate-300" />}
                    </div>
                  </div>
                  {expandedOb === item.ob_contact && item.missing_dates.length > 0 && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-50 bg-slate-50/30">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Missing Dates:</p>
                      <div className="flex flex-wrap gap-2">
                        {item.missing_dates.map(date => (
                          <span key={date} className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm">
                            {date}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
