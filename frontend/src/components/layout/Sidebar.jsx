import React from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  ShieldAlert, 
  BarChart3, 
  PlayCircle,
  Database,
  FileSpreadsheet,
  Network
} from 'lucide-react';
import { transactionService } from '../../services/api';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'All Transactions', icon: ReceiptText },
    { id: 'investigation', label: 'Investigate Fraud', icon: ShieldAlert },
    { id: 'mulegraph', label: 'Fraud Ring Network', icon: Network },
    { id: 'simulator', label: 'Test a Transaction', icon: PlayCircle },
    { id: 'analytics', label: 'Model Performance', icon: BarChart3 },
  ];

  const handleExport = () => {
    window.open(transactionService.getExportUrl(), '_blank');
  };

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0E1526]/50 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Operations
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Reports
          </p>
          <div className="space-y-1">
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition border border-transparent hover:border-slate-800"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Download Excel / CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Status Card */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            AI Fraud Model
          </span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
            Active
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Real-time transaction risk scoring & money mule detection.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
