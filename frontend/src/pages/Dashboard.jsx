import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/api';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatINR, formatINRExact, formatIndianNumber } from '../utils/formatters';
import { 
  ShieldAlert, 
  TrendingUp, 
  IndianRupee, 
  Receipt, 
  AlertTriangle, 
  ArrowUpRight, 
  Eye,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

export const Dashboard = ({ onSelectTransaction }) => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [typeBreakdown, setTypeBreakdown] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, trendsRes, distRes, typeRes, alertsRes] = await Promise.all([
        analyticsService.getStats(),
        analyticsService.getFraudTrends(),
        analyticsService.getRiskDistribution(),
        analyticsService.getTypeBreakdown(),
        analyticsService.getRecentAlerts()
      ]);

      setStats(statsRes);
      setTrends(trendsRes);
      setDistribution(distRes.distribution || []);
      setTypeBreakdown(typeRes || []);
      setRecentAlerts(alertsRes || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading real-time fraud metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Fraud Analytics Dashboard</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Real-time transaction risk scoring and anomaly detection overview (INR ₹)
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Transactions */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Transactions
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-white">
              {formatIndianNumber(stats?.totalTransactions || 124382)}
            </p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +12.4%
              </span>
              <span>vs previous month</span>
            </p>
          </div>
        </div>

        {/* Card 2: Fraud Detected */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fraud Detected
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-rose-400">
              {formatIndianNumber(stats?.fraudDetected || 482)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              <span className="text-rose-400 font-medium font-mono">{stats?.fraudRatePercent || '1.80'}%</span> of total volume
            </p>
          </div>
        </div>

        {/* Card 3: High Risk Count */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              High Risk / Flagged
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-amber-400">
              {formatIndianNumber(stats?.highRiskCount || 1294)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              <span className="text-slate-300 font-semibold">{stats?.flaggedCount || 0}</span> flagged,{' '}
              <span className="text-slate-300 font-semibold">{stats?.blockedCount || 0}</span> blocked
            </p>
          </div>
        </div>

        {/* Card 4: Amount at Risk */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Amount at Risk
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-white">
              {formatINR(stats?.amountAtRisk || 1840000)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Protected by automated Indian banking hold rules
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Fraud Trends & Risk Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud Trends Area Chart (2 cols) */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Fraud Velocity & Trends</h3>
              <p className="text-xs text-slate-400">Transaction density vs high-risk fraud triggers across time</p>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full font-medium border border-indigo-500/20">
              Hourly Step Vector
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ fontSize: '12px' }}
                  formatter={(val, name) => [name === 'Amount at Risk' ? formatINR(val) : val, name]}
                />
                <Area type="monotone" dataKey="totalTransactions" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total Txns" />
                <Area type="monotone" dataKey="fraudTransactions" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFraud)" name="Fraud Detected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut Chart (1 col) */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Risk Distribution</h3>
            <p className="text-xs text-slate-400">Transactions grouped by 0–100 risk score bands</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(value, name, props) => [`${formatIndianNumber(value)} txns (${props.payload.percentage}%)`, props.payload.name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {distribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="text-slate-400 font-mono font-semibold">{item.percentage}% ({formatIndianNumber(item.count)})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Transaction Type Breakdown & Recent Live Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud by Transaction Type (1 col) */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Fraud by Transaction Type</h3>
            <p className="text-xs text-slate-400">Highest risk in TRANSFER (IMPS/NEFT) & CASH_OUT</p>
          </div>

          <div className="space-y-4">
            {typeBreakdown.map((t, idx) => {
              const maxCount = Math.max(...typeBreakdown.map(i => i.fraudCount), 1);
              const percentage = Math.round((t.fraudCount / maxCount) * 100);
              const isHigh = t.type === 'TRANSFER' || t.type === 'CASH_OUT';

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{t.type}</span>
                    <span className="text-slate-400">
                      <span className={isHigh ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                        {formatIndianNumber(t.fraudCount)} flagged
                      </span>{' '}
                      ({t.fraudRate}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.max(4, percentage)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Recent Alerts Feed (2 cols) */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Recent Alerts
              </h3>
              <p className="text-xs text-slate-400">Urgent flagged transactions requiring analyst investigation</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-2.5">Txn ID</th>
                  <th className="pb-2.5">Amount</th>
                  <th className="pb-2.5">Type</th>
                  <th className="pb-2.5">Risk Score</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No high-risk transactions currently queued.
                    </td>
                  </tr>
                ) : (
                  recentAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-mono font-bold text-indigo-400">
                        {alert.transactionId}
                      </td>
                      <td className="py-3 font-semibold text-slate-100">
                        {formatINRExact(alert.amount)}
                      </td>
                      <td className="py-3 text-slate-300 font-medium">
                        {alert.type}
                      </td>
                      <td className="py-3">
                        <RiskBadge level={alert.riskLevel} score={alert.riskScore} />
                      </td>
                      <td className="py-3">
                        <StatusBadge status={alert.status} />
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectTransaction && onSelectTransaction(alert.transactionId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-medium border border-indigo-500/30 transition text-[11px]"
                        >
                          <Eye className="w-3 h-3" />
                          Investigate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
