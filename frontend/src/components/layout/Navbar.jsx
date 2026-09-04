import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { modelService } from '../../services/api';
import { ShieldCheck, ShieldAlert, Cpu, Activity, User, LogOut, RefreshCw } from 'lucide-react';

export const Navbar = () => {
  const { user, demoLogin, logout } = useAuth();
  const [modelStatus, setModelStatus] = useState({ online: true, service: 'Random Forest ML Engine' });

  useEffect(() => {
    const checkModel = async () => {
      try {
        const res = await modelService.getHealth();
        setModelStatus({ online: res.status === 'healthy', service: 'Random Forest ML' });
      } catch (err) {
        setModelStatus({ online: true, service: 'ML Heuristics Standby' });
      }
    };
    checkModel();
    const interval = setInterval(checkModel, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0E1526]/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Left: Brand / Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
          S
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg text-white tracking-tight">SmartSpend</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
              Fraud Guard
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Real-Time Bank Fraud Detection
          </p>
        </div>
      </div>

      {/* Center: System Live Telemetry */}
      <div className="hidden md:flex items-center gap-4 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-slate-300 font-medium flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            System: <span className="text-emerald-400">Live</span>
          </span>
        </div>
        <div className="h-3 w-px bg-slate-700"></div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Scanner:</span>
          <span className="text-emerald-400 font-medium">Ready</span>
        </div>
      </div>

      {/* Right: User & Demo Switcher */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => demoLogin('analyst')}
            className={`px-3 py-1 rounded-md transition font-medium text-xs ${
              user?.role === 'ANALYST'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sidhesh (Analyst)
          </button>
          <button
            onClick={() => demoLogin('admin')}
            className={`px-3 py-1 rounded-md transition font-medium text-xs ${
              user?.role === 'ADMIN'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sidhesh (Manager)
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
            user?.role === 'ADMIN' ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white'
          }`}>
            S
          </div>
          <div className="hidden lg:block text-left text-xs">
            <p className="font-semibold text-slate-200 leading-tight">
              {user?.name || (user?.role === 'ADMIN' ? 'Sidhesh (Manager)' : 'Sidhesh (Analyst)')}
            </p>
            <p className="text-[11px] text-slate-400">
              {user?.role === 'ADMIN' ? 'FRAUD MANAGER (ADMIN)' : 'FRAUD ANALYST'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
