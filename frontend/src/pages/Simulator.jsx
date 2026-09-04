import React, { useState } from 'react';
import { modelService, transactionService } from '../services/api';
import { RiskGauge } from '../components/common/RiskGauge';
import { RiskBadge } from '../components/common/RiskBadge';
import { formatINR, formatINRExact, formatIndianNumber } from '../utils/formatters';
import { 
  Play, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  RotateCcw,
  PlusCircle,
  Zap,
  IndianRupee
} from 'lucide-react';

export const Simulator = ({ onTransactionCreated }) => {
  const [formData, setFormData] = useState({
    type: 'TRANSFER',
    amount: 85400,
    oldBalanceOrig: 90000,
    newBalanceOrig: 4600,
    oldBalanceDest: 0,
    newBalanceDest: 85400,
    sender: 'C102938475',
    receiver: 'C993847162',
    step: 14
  });

  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const presets = [
    {
      label: '🔴 High-Risk Account Drain',
      desc: 'Wipes out ₹85,400 balance to zero',
      data: {
        type: 'TRANSFER',
        amount: 85400,
        oldBalanceOrig: 85400,
        newBalanceOrig: 0,
        oldBalanceDest: 0,
        newBalanceDest: 85400,
        sender: 'C884920194',
        receiver: 'C492019482',
        step: 23
      }
    },
    {
      label: '🔴 Money Mule Pass-through',
      desc: 'Rapid cash out of ₹76,000 to empty recipient',
      data: {
        type: 'CASH_OUT',
        amount: 76000,
        oldBalanceOrig: 76000,
        newBalanceOrig: 0,
        oldBalanceDest: 0,
        newBalanceDest: 0,
        sender: 'C394820192',
        receiver: 'C102938475',
        step: 2
      }
    },
    {
      label: '🟢 Merchant UPI / Kirana Payment',
      desc: 'Legitimate ₹850 retail QR payment',
      data: {
        type: 'PAYMENT',
        amount: 850,
        oldBalanceOrig: 12500,
        newBalanceOrig: 11650,
        oldBalanceDest: 0,
        newBalanceDest: 0,
        sender: 'C736192847',
        receiver: 'M102938475',
        step: 14
      }
    },
    {
      label: '🟢 Salary Deposit / Cash-In',
      desc: 'Regular ₹25,000 account credit',
      data: {
        type: 'CASH_IN',
        amount: 25000,
        oldBalanceOrig: 5000,
        newBalanceOrig: 30000,
        oldBalanceDest: 100000,
        newBalanceDest: 75000,
        sender: 'C981273948',
        receiver: 'C482910485',
        step: 11
      }
    }
  ];

  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setSaveSuccess(false);
      const result = await modelService.simulatePredict(formData);
      setPredictionResult(result);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToTransactions = async () => {
    try {
      setLoading(true);
      await transactionService.createTransaction(formData);
      setSaveSuccess(true);
      if (onTransactionCreated) onTransactionCreated();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to persist transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setFormData(preset.data);
    setPredictionResult(null);
    setSaveSuccess(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-indigo-400" />
          Test a Transaction (Simulation)
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Test how the AI evaluates different transactions and see why it approves or flags them
        </p>
      </div>

      {/* Quick Scenario Presets */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
          Quick Test Examples:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="glass-card p-3.5 rounded-xl text-left hover:border-indigo-500/50 hover:bg-slate-800/60 transition group"
            >
              <p className="font-semibold text-xs text-white group-hover:text-indigo-300 transition">
                {p.label}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {p.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form + Live Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Transaction Details (₹ INR)
          </h3>

          <form onSubmit={handleSimulate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="TRANSFER">TRANSFER (IMPS / NEFT)</option>
                  <option value="CASH_OUT">CASH_OUT (ATM Withdrawal)</option>
                  <option value="PAYMENT">PAYMENT (UPI / QR Payment)</option>
                  <option value="CASH_IN">CASH_IN (Deposit / Salary)</option>
                  <option value="DEBIT">DEBIT (Direct Debit)</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              {/* Sender Old Balance */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sender Balance (Before ₹)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.oldBalanceOrig}
                  onChange={(e) => setFormData({ ...formData, oldBalanceOrig: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              {/* Sender New Balance */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sender Balance (After ₹)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.newBalanceOrig}
                  onChange={(e) => setFormData({ ...formData, newBalanceOrig: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              {/* Receiver Old Balance */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Receiver Balance (Before ₹)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.oldBalanceDest}
                  onChange={(e) => setFormData({ ...formData, oldBalanceDest: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              {/* Receiver New Balance */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Receiver Balance (After ₹)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.newBalanceDest}
                  onChange={(e) => setFormData({ ...formData, newBalanceDest: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Sender & Receiver Account IDs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sender Account ID / Phone</label>
                <input
                  type="text"
                  value={formData.sender}
                  onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Receiver Account ID / Merchant</label>
                <input
                  type="text"
                  value={formData.receiver}
                  onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loading ? 'Checking...' : 'Check Fraud Risk'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToTransactions}
                disabled={loading}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center gap-2"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save to Ledger</span>
              </button>
            </div>

            {saveSuccess && (
              <p className="text-xs text-emerald-400 font-semibold text-center mt-2">
                ✓ Transaction saved successfully!
              </p>
            )}
          </form>
        </div>

        {/* Inference Results Column (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              AI Risk Analysis
            </h3>

            {!predictionResult ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Click <strong>"Check Fraud Risk"</strong> to test this transaction with the AI model.
                </p>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                {/* Score Gauge */}
                <div className="flex flex-col items-center">
                  <RiskGauge score={predictionResult.riskScore} size={160} />
                  <p className="text-xs text-slate-400 mt-2 font-mono">
                    Raw Probability: <strong>{(predictionResult.fraudProbability * 100).toFixed(1)}%</strong>
                  </p>
                </div>

                {/* Explainable Reasons */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Attributed Risk Factors:
                  </span>
                  {predictionResult.reasons.map((r, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        r.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : r.severity === 'HIGH'
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : r.severity === 'MEDIUM'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      <span className="font-medium">{r.factor}</span>
                      <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-slate-900/80">
                        {r.severity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Recommendation Box */}
                {predictionResult.recommendedAction && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      {predictionResult.recommendedAction.title}
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      {predictionResult.recommendedAction.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
