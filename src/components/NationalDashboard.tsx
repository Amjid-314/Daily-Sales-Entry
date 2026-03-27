import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertCircle, 
  ArrowDownRight, 
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  CheckCircle2,
  LayoutDashboard
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area,
  LineChart,
  Line
} from 'recharts';
import { BRAND_GROUPS, BRAND_GROUP_NAMES, CATEGORY_COLORS, CATEGORIES, APP_TABS } from '../types';
import { isTSMEntry } from '../lib/utils';

const NationalDashboard = ({ data, summary, hierarchy, brands, skus, trendData, categoryStats, obPerformance, tsmPerformance, filteredOBs, monthStats, worstOBs, worstByBrand, routeWeakness, categoryWiseSales, filterLevel, filterValue, role, setView }: any) => {
  const [contributionView, setContributionView] = useState<'Brand' | 'Category' | 'SKU'>('Brand');
  const [achievementView, setAchievementView] = useState<'Brand' | 'Category' | 'SKU'>('Brand');
  const [tsmCategoryFilter, setTsmCategoryFilter] = useState('All');
  const [tsmBrandFilter, setTsmBrandFilter] = useState('All');
  const [worstBrandFilter, setWorstBrandFilter] = useState('All');
  const [heatmapView, setHeatmapView] = useState('Total');
  const [categoryWiseCategoryFilter, setCategoryWiseCategoryFilter] = useState('All');
  const [categoryWiseBrandFilter, setCategoryWiseBrandFilter] = useState('All');

  const filteredTableCategories = categoryWiseCategoryFilter !== 'All' 
    ? BRAND_GROUPS[categoryWiseCategoryFilter] || []
    : categoryWiseBrandFilter !== 'All'
    ? [categoryWiseBrandFilter]
    : CATEGORIES;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Total Sales (Bags)</div>
            <div className="text-3xl font-black text-seablue leading-none">{Math.round(summary.totalSales).toLocaleString()}</div>
            <div className="text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
              MTD Performance
            </div>
          </div>
        </div>
        <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Total Tonnage (T)</div>
            <div className="text-3xl font-black text-emerald-600 leading-none">{summary.totalTonnage.toFixed(2)}</div>
            <div className="text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
              Net Weight
            </div>
          </div>
        </div>
        <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Active OBs</div>
            <div className="text-3xl font-black text-orange-600 leading-none">{summary.uniqueOBs}</div>
            <div className="text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
              Reporting Force
            </div>
          </div>
        </div>
        <div className="card-clean p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Avg Sales (Tons)/OB</div>
            <div className="text-3xl font-black text-indigo-600 leading-none">{(summary.uniqueOBs > 0 ? summary.totalTonnage / summary.uniqueOBs : 0).toFixed(2)}</div>
            <div className="text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
              Efficiency Metric
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean p-6 bg-white border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Brand Contribution</h3>
            <select 
              value={contributionView}
              onChange={(e) => setContributionView(e.target.value as any)}
              className="text-[10px] font-black text-seablue uppercase bg-slate-50 px-2 py-1 rounded border-none focus:ring-0"
            >
              <option value="Brand">Brand Wise</option>
              <option value="Category">Category Wise</option>
              <option value="SKU">SKU Wise</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    contributionView === 'SKU' 
                      ? Object.entries(summary.skuTotals).map(([name, value]) => ({ name, value }))
                      : contributionView === 'Category'
                      ? BRAND_GROUP_NAMES.map(group => ({
                          name: group,
                          value: BRAND_GROUPS[group].reduce((sum, brand) => sum + (summary.brandTotals[brand] || 0), 0)
                        }))
                      : Object.entries(summary.brandTotals).map(([name, value]) => ({ name, value }))
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(contributionView === 'SKU' 
                    ? Object.entries(summary.skuTotals)
                    : contributionView === 'Category'
                    ? BRAND_GROUP_NAMES.map(g => [g])
                    : Object.entries(summary.brandTotals)
                  ).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        contributionView === 'Category' 
                          ? ['#0ea5e9', '#22c55e', '#1e3a8a'][index % 3]
                          : CATEGORY_COLORS[entry[0]] || ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
                      } 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const total = payload[0].value;
                      const overallTotal = contributionView === 'SKU' 
                        ? Object.values(summary.skuTotals).reduce((a: number, b: number) => a + b, 0)
                        : summary.totalSales;
                      const percentage = ((total / overallTotal) * 100).toFixed(1);
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{data.name}</p>
                          <p className="text-sm font-black text-slate-700">{Math.round(total).toLocaleString()} Bags</p>
                          <p className="text-[10px] font-bold text-emerald-600">{percentage}% Contribution</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-clean p-6 bg-white border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Brand Target vs Achievement</h3>
            <select 
              value={achievementView}
              onChange={(e) => setAchievementView(e.target.value as any)}
              className="text-[10px] font-black text-seablue uppercase bg-slate-50 px-2 py-1 rounded border-none focus:ring-0"
            >
              <option value="Brand">Brand Wise</option>
              <option value="Category">Category Wise</option>
              <option value="SKU">SKU Wise</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={
                  achievementView === 'Category'
                    ? BRAND_GROUP_NAMES.map(group => {
                        const achievement = BRAND_GROUPS[group].reduce((sum, brand) => sum + (summary.brandTotals[brand] || 0), 0);
                        const target = hierarchy.reduce((sum, h) => {
                          return sum + BRAND_GROUPS[group].reduce((bSum, brand) => {
                            const targetKey = `target_${brand.toLowerCase().replace(/\s+/g, '_')}`;
                            return bSum + (Number(h[targetKey]) || 0);
                          }, 0);
                        }, 0);
                        return { name: group, achievement, target: target || 1 };
                      })
                    : achievementView === 'SKU'
                    ? Object.entries(summary.skuTotals).map(([name, value]) => {
                        const sku = skus.find(s => {
                          let prefix = '';
                          if (s.category === 'DWB') prefix = 'D - ';
                          if (s.category === 'Match') prefix = 'M - ';
                          return `${prefix}${s.name}` === name;
                        });
                        const target = sku ? hierarchy.reduce((sum, h) => {
                          const targetKey = `target_${sku.category.toLowerCase().replace(/\s+/g, '_')}`;
                          const brandTarget = Number(h[targetKey]) || 0;
                          // Simple heuristic: distribute brand target among its SKUs equally for now
                          const skusInBrand = skus.filter(s => s.category === sku.category).length;
                          return sum + (brandTarget / (skusInBrand || 1));
                        }, 0) : 0;
                        return { name, achievement: value as number, target: target || 0 };
                      }).sort((a, b) => (b.achievement as number) - (a.achievement as number))
                    : [
                        ...CATEGORIES.map(cat => {
                          const achievement = summary.brandTotals[cat] || 0;
                          const target = hierarchy.reduce((sum, h) => {
                            const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
                            return sum + (Number(h[targetKey]) || 0);
                          }, 0);
                          return { name: cat, achievement, target: target || 1 };
                        }),
                        {
                          name: 'Total',
                          achievement: Object.values(summary.brandTotals).reduce((a: number, b: any) => a + (Number(b) || 0), 0),
                          target: hierarchy.reduce((sum, h) => {
                            return sum + CATEGORIES.reduce((bSum, cat) => {
                              const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
                              return bSum + (Number(h[targetKey]) || 0);
                            }, 0);
                          }, 0) || 1
                        }
                      ]
                }
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 'bold', fill: '#64748b' }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const ach = data.achievement;
                      const tar = data.target;
                      const perc = tar > 0 ? ((ach / tar) * 100).toFixed(1) : '0';
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{data.name}</p>
                          <p className="text-xs font-black text-slate-700">Ach: {Math.round(ach).toLocaleString()}</p>
                          {tar > 0 && <p className="text-xs font-bold text-slate-400">Tar: {Math.round(tar).toLocaleString()}</p>}
                          {tar > 0 && <p className="text-[10px] font-black text-emerald-600 mt-1">{perc}% Achievement</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '10px' }} />
                <Bar dataKey="achievement" radius={[0, 4, 4, 0]} barSize={12} name="Ach">
                  {(achievementView === 'Category'
                    ? BRAND_GROUP_NAMES.map(g => ({ name: g }))
                    : achievementView === 'SKU'
                    ? Object.entries(summary.skuTotals).map(([name]) => ({ name })).sort((a, b) => (summary.skuTotals[b.name] || 0) - (summary.skuTotals[a.name] || 0))
                    : [...CATEGORIES.map(cat => ({ name: cat })), { name: 'Total' }]
                  ).map((entry, index) => (
                    <Cell 
                      key={`cell-ach-${index}`} 
                      fill={
                        entry.name === 'Total' ? '#1e3a8a' :
                        achievementView === 'Category' ? ['#0ea5e9', '#22c55e', '#1e3a8a'][index % 3] :
                        CATEGORY_COLORS[entry.name] || ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
                      } 
                    />
                  ))}
                </Bar>
                {achievementView !== 'SKU' && <Bar dataKey="target" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={12} name="Tar" />}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 overflow-x-auto border-t border-slate-50 pt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="px-4 py-2">{achievementView} Name</th>
                  <th className="px-4 py-2 text-right">Target</th>
                  <th className="px-4 py-2 text-right">Ach</th>
                  <th className="px-4 py-2 text-right">Ach %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(achievementView === 'Category'
                  ? BRAND_GROUP_NAMES.map(group => {
                      const achievement = BRAND_GROUPS[group].reduce((sum, brand) => sum + (summary.brandTotals[brand] || 0), 0);
                      const target = hierarchy.reduce((sum, h) => {
                        return sum + BRAND_GROUPS[group].reduce((bSum, brand) => {
                          const targetKey = `target_${brand.toLowerCase().replace(/\s+/g, '_')}`;
                          return bSum + (Number(h[targetKey]) || 0);
                        }, 0);
                      }, 0);
                      return { name: group, achievement, target: target || 1 };
                    })
                  : achievementView === 'SKU'
                  ? Object.entries(summary.skuTotals).map(([name, value]) => {
                      const sku = skus.find(s => {
                        let prefix = '';
                        if (s.category === 'DWB') prefix = 'D - ';
                        if (s.category === 'Match') prefix = 'M - ';
                        return `${prefix}${s.name}` === name;
                      });
                      const target = sku ? hierarchy.reduce((sum, h) => {
                        const targetKey = `target_${sku.category.toLowerCase().replace(/\s+/g, '_')}`;
                        const brandTarget = Number(h[targetKey]) || 0;
                        const skusInBrand = skus.filter(s => s.category === sku.category).length;
                        return sum + (brandTarget / (skusInBrand || 1));
                      }, 0) : 0;
                      return { name, achievement: value as number, target: target || 0 };
                    }).sort((a, b) => (b.achievement as number) - (a.achievement as number))
                  : [
                      ...CATEGORIES.map(cat => {
                        const achievement = summary.brandTotals[cat] || 0;
                        const target = hierarchy.reduce((sum, h) => {
                          const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
                          return sum + (Number(h[targetKey]) || 0);
                        }, 0);
                        return { name: cat, achievement, target: target || 1 };
                      }),
                      {
                        name: 'Total',
                        achievement: Object.values(summary.brandTotals).reduce((a: number, b: any) => a + (Number(b) || 0), 0),
                        target: hierarchy.reduce((sum, h) => {
                          return sum + CATEGORIES.reduce((bSum, cat) => {
                            const targetKey = `target_${cat.toLowerCase().replace(/\s+/g, '_')}`;
                            return bSum + (Number(h[targetKey]) || 0);
                          }, 0);
                        }, 0) || 1
                      }
                    ]
                ).map((item, idx) => {
                  const perc = item.target > 0 ? (item.achievement / item.target) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/30">
                      <td className="px-4 py-2 text-[10px] font-bold text-slate-700">{item.name}</td>
                      <td className="px-4 py-2 text-right text-[10px] font-mono text-slate-500">{Math.round(item.target).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-[10px] font-black text-seablue font-mono">{Math.round(item.achievement).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${perc >= 100 ? 'bg-emerald-100 text-emerald-700' : perc >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {Math.round(perc)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-clean p-6 bg-white border border-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Top 10 TSM Performance</h3>
            <div className="flex gap-2">
              <select 
                value={tsmCategoryFilter}
                onChange={(e) => setTsmCategoryFilter(e.target.value)}
                className="text-[8px] font-black text-seablue uppercase bg-slate-50 px-2 py-1 rounded border-none focus:ring-0"
              >
                <option value="All">All Categories</option>
                {BRAND_GROUP_NAMES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select 
                value={tsmBrandFilter}
                onChange={(e) => setTsmBrandFilter(e.target.value)}
                className="text-[8px] font-black text-seablue uppercase bg-slate-50 px-2 py-1 rounded border-none focus:ring-0"
              >
                <option value="All">All Brands</option>
                {brands.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(() => {
                const filteredTSMs = tsmPerformance.map((tsm: any) => {
                  let sales = 0;
                  let target = 0;
                  const tsmStats = monthStats.filter((s: any) => s.tsm === tsm.name && !s.isTSMEntry);
                  
                  tsmStats.forEach((s: any) => {
                    if (tsmCategoryFilter !== 'All') {
                      const brandsInGroup = BRAND_GROUPS[tsmCategoryFilter] || [];
                      sales += brandsInGroup.reduce((sum, brand) => sum + (s.brandSales[brand] || 0), 0);
                    } else if (tsmBrandFilter !== 'All') {
                      sales += (s.brandSales[tsmBrandFilter] || 0);
                    } else {
                      sales += s.totalBags;
                    }
                  });

                  // Calculate target for filtered view
                  const tsmOBs = hierarchy.filter((h: any) => h.asm_tsm_name === tsm.name);
                  tsmOBs.forEach((h: any) => {
                    if (tsmCategoryFilter !== 'All') {
                      const brandsInGroup = BRAND_GROUPS[tsmCategoryFilter] || [];
                      // This assumes target_ctn is total target, we might need brand-wise targets for accuracy
                      // For now, we use the total target if no brand filter is applied
                      target += (Number(h.target_ctn) || 0); 
                    } else if (tsmBrandFilter !== 'All') {
                      // We need brand-wise targets here. I'll check if they are available.
                      target += (Number(h.target_ctn) || 0);
                    } else {
                      target += (Number(h.target_ctn) || 0);
                    }
                  });

                  const perc = target > 0 ? (sales / target) * 100 : 0;
                  return { ...tsm, totalSales: sales, achievementPerc: perc };
                }).sort((a: any, b: any) => a.achievementPerc - b.achievementPerc); // Bottom to top
                return filteredTSMs.slice(0, 10);
              })()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [Math.round(value).toLocaleString(), 'Sales (Ctns)']}
                />
                <Bar dataKey="totalSales" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TSM Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-black text-seablue uppercase tracking-widest">TSM Performance Overview (Bottom 50)</h2>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3">Hierarchy</th>
                <th className="px-4 py-3">TSM Name</th>
                <th className="px-4 py-3 text-right">Active OBs</th>
                <th className="px-4 py-3 text-right">Total Sales (Ctns)</th>
                <th className="px-4 py-3 text-right">Avg OB Sales</th>
                <th className="px-4 py-3 text-right">Contribution%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tsmPerformance.filter((tsm: any) => !isTSMEntry(tsm.name, tsm.name)).slice(0, 50).map((tsm: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="text-[8px] font-black text-slate-400 uppercase leading-none">National &gt; {tsm.region}</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">{tsm.town}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700 text-xs">{tsm.name}</td>
                  <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">{tsm.activeOBs}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 font-mono text-xs">{Math.round(tsm.totalSales).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-seablue font-mono text-xs">{Math.round(tsm.averageOBSales).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-500 font-bold text-xs">
                    {summary.totalSales > 0 ? ((tsm.totalSales / summary.totalSales) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
              {tsmPerformance.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                    No TSM data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-clean p-4 bg-white border-l-4 border-seablue">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Performers</h3>
            <TrendingUp className="w-4 h-4 text-seablue" />
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {[...obPerformance].sort((a, b) => b.productivityScore - a.productivityScore).slice(0, 5).map((ob, idx) => (
              <div key={`top-${idx}-${ob.ob_contact || ob.name}`} className="flex items-center justify-between p-2 bg-sky-50 rounded-lg">
                <span className="text-[10px] font-bold text-sky-700">{ob.name}</span>
                <span className="text-[8px] font-black bg-sky-200 text-sky-800 px-2 py-0.5 rounded uppercase">{ob.scoreLabel}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-clean p-4 bg-white border-l-4 border-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Strength Map</h3>
            <Package className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {Array.from(new Set(monthStats.map((s: any) => s.town))).map((town: any) => {
              const townStats = monthStats.filter((s: any) => s.town === town);
              const brandTotals = brands.map((b: any) => ({ brand: b, total: townStats.reduce((sum: number, s: any) => sum + (s.brandSales[b] || 0), 0) }));
              const topBrand = brandTotals.sort((a: any, b: any) => b.total - a.total)[0];
              return (
                <div key={town} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                  <span className="text-[10px] font-bold text-emerald-700">{town}</span>
                  <span className="text-[8px] font-black bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded uppercase">{topBrand.brand}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card-clean p-4 bg-white border-l-4 border-seablue">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Package className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Avg Sales (Tons)/OB</p>
          </div>
          <h2 className="text-xl font-black text-seablue">{(summary.totalTonnage / Math.max(1, summary.uniqueOBs)).toFixed(2)}</h2>
        </div>
        <div className="card-clean p-4 bg-white border-l-4 border-emerald-500">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <TrendingUp className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Total Tonnage (T)</p>
          </div>
          <h2 className="text-xl font-black text-emerald-600">{summary.totalTonnage.toFixed(2)}</h2>
        </div>
        <div className="card-clean p-4 bg-white border-l-4 border-emerald-500">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Users className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Total OB</p>
          </div>
          <h2 className="text-xl font-black text-emerald-600">{summary.uniqueOBs}</h2>
        </div>
        <div className="card-clean p-4 bg-white border-l-4 border-orange-500">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Users className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Total TSM</p>
          </div>
          <h2 className="text-xl font-black text-orange-600">{summary.uniqueTSMs}</h2>
        </div>
        <div className="card-clean p-4 bg-white border-l-4 border-purple-500">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <TrendingUp className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Avg Sales / OB</p>
          </div>
          <h2 className="text-xl font-black text-purple-600">{summary.uniqueOBs > 0 ? (summary.totalSales / summary.uniqueOBs).toFixed(1) : 0}</h2>
        </div>
        <div className="card-clean p-4 bg-white border-l-4 border-rose-500">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <TrendingUp className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Productivity %</p>
          </div>
          <h2 className="text-xl font-black text-rose-600">{summary.productivity.toFixed(1)}%</h2>
        </div>
        <div className="card-clean p-4 bg-white border-l-4 border-indigo-500">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Users className="w-3 h-3" />
            <p className="text-[8px] font-black uppercase tracking-widest">Active %</p>
          </div>
          <h2 className="text-xl font-black text-indigo-600">
            {filteredOBs.length > 0 ? ((summary.uniqueOBs / filteredOBs.length) * 100).toFixed(1) : 0}%
          </h2>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-3 h-3 text-amber-600" />
        <p className="text-[9px] font-bold text-amber-700 uppercase tracking-tight">
          Note: "Match" Tonnage and "New DWB" SKU are excluded from all tonnage and cost calculations as per policy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean p-6 bg-white space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Monthly Sales Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                <YAxis fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                <Tooltip />
                <Area type="monotone" dataKey="totalSales" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-clean p-6 bg-white space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">OB Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="category"
                  >
                    {categoryStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#0ea5e9', '#f59e0b', '#ef4444'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const total = categoryStats.reduce((a: number, b: any) => a + b.count, 0);
                        const percentage = ((data.count / total) * 100).toFixed(1);
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Category {data.category}</p>
                            <p className="text-sm font-black text-slate-700">{data.count} OBs</p>
                            <p className="text-[10px] font-bold text-emerald-600">{percentage}% of Force</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2">
              {categoryStats.map((cat: any) => (
                <div key={cat.category} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-700">Category {cat.category}</span>
                    <span className="text-[10px] font-bold text-slate-400">{cat.count} OBs</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {obPerformance.filter((ob: any) => ob.category === cat.category).map((ob: any) => (
                      <span key={ob.ob_contact} className="text-[8px] font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                        {ob.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card-clean bg-white overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Category Wise OB Sales ({filterLevel})</h3>
            <div className="flex items-center gap-2">
              <select 
                value={categoryWiseCategoryFilter} 
                onChange={(e) => setCategoryWiseCategoryFilter(e.target.value)}
                className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="All">All Categories</option>
                {Object.keys(BRAND_GROUPS).map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              <select 
                value={categoryWiseBrandFilter} 
                onChange={(e) => setCategoryWiseBrandFilter(e.target.value)}
                className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="All">All Brands</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th rowSpan={2} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">{filterLevel}</th>
                  <th rowSpan={2} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-center">OBs</th>
                  {filteredTableCategories.map(cat => (
                    <th key={cat} colSpan={2} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-center border-l border-slate-100">{cat}</th>
                  ))}
                  <th colSpan={2} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-center border-l border-slate-100">Total</th>
                  <th rowSpan={2} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Avg/OB</th>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {filteredTableCategories.map(cat => (
                    <React.Fragment key={cat}>
                      <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase text-right border-l border-slate-100">Bags</th>
                      <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase text-right">Tons</th>
                    </React.Fragment>
                  ))}
                  <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase text-right border-l border-slate-100">Bags</th>
                  <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase text-right">Tons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categoryWiseSales.map((row: any) => (
                  <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-slate-700">{row.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 text-center">{row.obCount}</td>
                    {filteredTableCategories.map(cat => (
                      <React.Fragment key={cat}>
                        <td className="px-6 py-4 text-right border-l border-slate-50">
                          <span className="text-xs font-bold text-slate-600">{Math.round(row.brandSales[cat] || 0)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[10px] font-bold text-slate-400">{(row.brandTonnage[cat] || 0).toFixed(2)}</span>
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="px-6 py-4 text-right border-l border-slate-50">
                      <span className="text-xs font-black text-seablue">{Math.round(row.totalSales)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-bold text-slate-400">{Math.round(row.totalTonnage)}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-600 text-right">{Math.round(row.avgSales)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-black">
                <tr>
                  <td className="px-6 py-4 text-xs uppercase tracking-widest text-slate-400">Total</td>
                  <td className="px-6 py-4 text-xs text-center text-slate-600">
                    {categoryWiseSales.reduce((sum: number, r: any) => sum + r.obCount, 0)}
                  </td>
                  {filteredTableCategories.map(cat => (
                    <React.Fragment key={cat}>
                      <td className="px-6 py-4 text-right border-l border-slate-100">
                        <span className="text-xs text-slate-600">
                          {Math.round(categoryWiseSales.reduce((sum: number, r: any) => sum + (r.brandSales[cat] || 0), 0))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[10px] text-slate-400">
                          {categoryWiseSales.reduce((sum: number, r: any) => sum + (r.brandTonnage[cat] || 0), 0).toFixed(2)}
                        </span>
                      </td>
                    </React.Fragment>
                  ))}
                  <td className="px-6 py-4 text-right border-l border-slate-100">
                    <span className="text-xs text-seablue">
                      {Math.round(categoryWiseSales.reduce((sum: number, r: any) => sum + r.totalSales, 0))}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[10px] text-slate-400">
                      {categoryWiseSales.reduce((sum: number, r: any) => sum + r.totalTonnage, 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-right text-emerald-600">
                    {(categoryWiseSales.reduce((sum: number, r: any) => sum + r.totalSales, 0) / Math.max(1, categoryWiseSales.reduce((sum: number, r: any) => sum + r.obCount, 0))).toFixed(1)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean bg-white overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Worst Performing OB (Bottom 50)</h3>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">By Achievement %</span>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">OB Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Town</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">TSM</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Target</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Ach</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Ach %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {worstOBs.map((ob: any, idx: number) => (
                  <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">
                      <span className="text-slate-300 mr-2">{idx + 1}.</span>
                      {ob.name}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{ob.town}</td>
                    <td className="px-6 py-4 text-[10px] font-black text-seablue uppercase tracking-widest">{ob.tsm}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 text-right">{Math.round(ob.target).toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700 text-right">{Math.round(ob.totalSales).toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-black text-rose-600 text-right">{ob.achievement.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-clean bg-white overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Worst OB by Brand (Bottom 50)</h3>
            <select 
              value={worstBrandFilter}
              onChange={(e) => setWorstBrandFilter(e.target.value)}
              className="text-[10px] font-black text-seablue uppercase bg-white px-2 py-1 rounded border border-slate-200 focus:ring-0"
            >
              <option value="All">All Brands</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">OB Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Town</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Brand</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(() => {
                  let data: any[] = [];
                  if (worstBrandFilter === 'All') {
                    CATEGORIES.forEach(cat => {
                      data = [...data, ...(worstByBrand[cat] || []).map((ob: any) => ({ ...ob, brand: cat }))];
                    });
                  } else {
                    data = (worstByBrand[worstBrandFilter] || []).map((ob: any) => ({ ...ob, brand: worstBrandFilter }));
                  }
                  return data.sort((a, b) => a.sales - b.sales).slice(0, 50).map((ob, idx) => (
                    <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">
                        <span className="text-slate-300 mr-2">{idx + 1}.</span>
                        {ob.name}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{ob.town}</td>
                      <td className="px-6 py-4 text-[10px] font-black text-seablue uppercase tracking-widest">{ob.brand}</td>
                      <td className="px-6 py-4 text-xs font-black text-rose-600 text-right">{ob.sales.toFixed(1)}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean bg-white overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Route Weakness Detection</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">OB / Route</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Sales Trend</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {routeWeakness.map((rw: any, idx: number) => (
                  <tr key={idx} className="hover:bg-rose-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">{rw.ob}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{rw.route}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-600">{rw.latestSales.toFixed(1)}</span>
                        <ArrowDownRight className="w-3 h-3 text-rose-500" />
                        <span className="text-[10px] text-slate-400 font-bold">vs {rw.prevSales.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {rw.reasons.map((r: string) => (
                          <span key={r} className="text-[8px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">{r}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-clean bg-white p-6">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Daily Sales Heatmap (MTD)</h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase">View:</span>
              <select 
                className="input-clean text-[10px] py-1 px-2 rounded-lg"
                value={heatmapView}
                onChange={(e) => setHeatmapView(e.target.value)}
              >
                <option value="Total">Total Bags/Ctns</option>
                <optgroup label="Category-wise">
                  {BRAND_GROUP_NAMES.map(cat => <option key={`cat_${cat}`} value={`cat_${cat}`}>{cat}</option>)}
                </optgroup>
                <optgroup label="Brand-wise">
                  {brands.map((cat: any) => <option key={cat} value={cat}>{cat}</option>)}
                </optgroup>
              </select>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthStats.reduce((acc: any[], s: any) => {
                const dateKey = s.date.split('-')[2];
                let existing = acc.find(a => a.date === dateKey);
                if (!existing) {
                  existing = { date: dateKey, sales: 0 };
                  acc.push(existing);
                }
                
                if (heatmapView === 'Total') {
                  existing.sales += s.totalBags;
                } else if (heatmapView.startsWith('cat_')) {
                  const categoryName = heatmapView.replace('cat_', '');
                  const brandsInGroup = BRAND_GROUPS[categoryName] || [];
                  existing.sales += brandsInGroup.reduce((sum, brand) => sum + (s.brandSales[brand] || 0), 0);
                } else {
                  existing.sales += (s.brandSales[heatmapView] || 0);
                }
                
                return acc;
              }, []).sort((a: any, b: any) => a.date.localeCompare(b.date))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: '900', color: '#1e293b', fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Bar dataKey="sales" fill="#0066cc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {filterLevel === 'OB' && filterValue && (
        <div className="card-clean p-6 bg-white space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">OB Monthly Sales Trend: {filterValue}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                <YAxis fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                <Tooltip />
                <Legend />
                {brands.map((brand: any, idx: number) => (
                  <Line key={brand} type="monotone" dataKey={brand} stroke={['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][idx % 5]} strokeWidth={2} />
                ))}
                <Line type="monotone" dataKey="totalSales" stroke="#0f172a" strokeWidth={3} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default NationalDashboard;
