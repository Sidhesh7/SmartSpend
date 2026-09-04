import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/api';
import { RiskGauge } from '../components/common/RiskGauge';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatINR, formatINRExact, formatIndianNumber } from '../utils/formatters';
import { 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  DollarSign, 
  HelpCircle,
  FileCheck,
  AlertTriangle,
  History,
  Send,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Investigation = ({ selectedTxnId, onBack }) => {
  const { user } = useAuth();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState('');
  const [actionStatus, setActionStatus] = useState(null);

  const fetchTransactionDetails = async (id) => {
    try {
      setLoading(true);
      const data = await transactionService.getTransactionById(id || 'TXN-1002');
      setTransaction(data);
    } catch (err) {
      console.error('Error fetching transaction for investigation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionDetails(selectedTxnId);
  }, [selectedTxnId]);

  const handleUpdateStatus = async (newStatus) => {
    if (!transaction) return;
    try {
      setActionStatus('updating');
      const updated = await transactionService.updateStatus(
        transaction.id, 
        newStatus, 
        actionNotes || `Analyst manual decision: ${newStatus}`
      );
      setTransaction(updated);
      setActionNotes('');
      setActionStatus('success');
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
      setActionStatus('error');
    }
  };

  if (loading || !transaction) {
    return (
      <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center text-center">
        <Clock className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <h3 className="text-lg font-bold text-white">Loading Transaction Details...</h3>
        <p className="text-xs text-slate-400 mt-1">Retrieving AI risk evaluation and account history</p>
      </div>
    );
  }

  const senderDiff = (transaction.oldBalanceOrig - transaction.amount) - transaction.newBalanceOrig;
  const isDrain = transaction.oldBalanceOrig > 0 && transaction.newBalanceOrig === 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 rounded-2xl border-l-4 border-l-indigo-500">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30">
              {transaction.transactionId}
            </span>
            <StatusBadge status={transaction.status} />
            <span className="text-xs text-slate-400">
              Logged: {new Date(transaction.createdAt).toLocaleString()}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            Investigate Transaction
          </h2>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            ← Back to Transactions
          </button>
        )}
      </div>

      {/* Main Grid: Gauge & Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score Radial Gauge Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Risk Score
          </h3>
          <RiskGauge score={transaction.riskScore} size={190} />
          <div className="mt-4 text-xs text-slate-300">
            <p>
              Probability: <span className="font-mono font-bold text-white">{(transaction.fraudProbability * 100).toFixed(1)}%</span>
            </p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              AI Fraud Scanner
            </p>
          </div>
        </div>

        {/* Transaction Summary Card */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Transaction Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Amount</span>
                <p className="text-2xl font-extrabold text-white mt-0.5">
                  {formatINRExact(transaction.amount)}
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Operation Type</span>
                <p className="text-2xl font-extrabold text-indigo-400 mt-0.5">
                  {transaction.type}
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Risk Band</span>
                <p className={`text-2xl font-extrabold mt-0.5 ${
                  transaction.riskLevel === 'HIGH' ? 'text-red-400' : transaction.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {transaction.riskLevel}
                </p>
              </div>
            </div>
          </div>

          {/* Forensic Balance Transition Matrix */}
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Balance Ledger Movement (INR ₹)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Origin Account */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                <span className="text-slate-400 flex items-center justify-between">
                  <span>Sender Account:</span>
                  <span className="font-mono text-indigo-300">{transaction.sender}</span>
                </span>
                <div className="mt-2 flex items-center justify-between font-mono">
                  <div>
                    <p className="text-[10px] text-slate-400">Before Txn</p>
                    <p className="font-bold text-slate-200">{formatINRExact(transaction.oldBalanceOrig)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">After Txn</p>
                    <p className={`font-bold ${isDrain ? 'text-red-400' : 'text-slate-200'}`}>
                      {formatINRExact(transaction.newBalanceOrig)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Destination Account */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                <span className="text-slate-400 flex items-center justify-between">
                  <span>Receiver Account:</span>
                  <span className="font-mono text-indigo-300">{transaction.receiver}</span>
                </span>
                <div className="mt-2 flex items-center justify-between font-mono">
                  <div>
                    <p className="text-[10px] text-slate-400">Before Txn</p>
                    <p className="font-bold text-slate-200">{formatINRExact(transaction.oldBalanceDest)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">After Txn</p>
                    <p className="font-bold text-slate-200">{formatINRExact(transaction.newBalanceDest)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: "WHY FLAGGED?" Explainable AI & Recommended Action */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WHY WAS THIS FLAGGED? */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-bold text-white">Why Was This Flagged?</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Algorithmic risk triggers and explainable behavioral heuristics detected:
          </p>

          <div className="space-y-2.5">
            {(!transaction.riskFactors || transaction.riskFactors.length === 0) ? (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                No critical anomalies triggered. Transaction evaluated as low risk.
              </div>
            ) : (
              transaction.riskFactors.map((rf, idx) => {
                let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                let dot = 'bg-emerald-400';
                if (rf.severity === 'CRITICAL') {
                  badgeStyle = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                  dot = 'bg-rose-500';
                } else if (rf.severity === 'HIGH') {
                  badgeStyle = 'bg-red-500/15 text-red-300 border-red-500/30';
                  dot = 'bg-red-500';
                } else if (rf.severity === 'MEDIUM') {
                  badgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                  dot = 'bg-amber-500';
                }

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-start gap-3 text-xs transition ${badgeStyle}`}
                  >
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${dot}`}></span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-100">{rf.factor}</p>
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-950/60">
                          {rf.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RECOMMENDED ACTION & ANALYST DECISION */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Recommended Action Engine</h3>
            </div>

            {/* Recommendation Box */}
            <div className={`p-4 rounded-xl border mb-5 ${
              transaction.riskLevel === 'HIGH'
                ? 'bg-red-950/30 border-red-800/60 text-red-200'
                : transaction.riskLevel === 'MEDIUM'
                ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {transaction.riskLevel === 'HIGH' ? (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>
                  {transaction.riskLevel === 'HIGH'
                    ? 'Immediate Hold & Analyst KYC Review Recommended'
                    : transaction.riskLevel === 'MEDIUM'
                    ? 'Enhanced Step-up MFA Verification Recommended'
                    : 'Clear for Automated Instant Settlement'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {transaction.riskLevel === 'HIGH'
                  ? 'High probability of balance draining or mule pass-through. Escalate to senior fraud officer.'
                  : transaction.riskLevel === 'MEDIUM'
                  ? 'Elevated off-hour velocity. Request user biometric confirmation before release.'
                  : 'Low risk footprint matching historical recipient behavior.'}
              </p>
            </div>

            {/* Analyst Decision Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Compliance Decision
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  user?.role === 'ADMIN' 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {user?.role === 'ADMIN' ? '👑 Admin Authority' : '👤 Analyst Review'}
                </span>
              </div>

              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  user?.role === 'ADMIN'
                    ? "Admin decision notes for audit log..."
                    : "Analyst investigation findings (e.g. called customer, OTP requested)..."
                }
                rows={2}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />

              <div className="grid grid-cols-3 gap-2">
                {/* Approve: Available to both */}
                <button
                  onClick={() => handleUpdateStatus('APPROVED')}
                  className="px-3 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-semibold border border-emerald-500/30 transition text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </button>

                {/* Request MFA: Available to both */}
                <button
                  onClick={() => handleUpdateStatus('UNDER_REVIEW')}
                  className="px-3 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white font-semibold border border-amber-500/30 transition text-xs flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Request OTP / MFA
                </button>

                {/* Block & Freeze: ADMIN ONLY */}
                {user?.role === 'ADMIN' ? (
                  <button
                    onClick={() => handleUpdateStatus('BLOCKED')}
                    className="px-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-600/30 transition text-xs flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Block & Freeze
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus('UNDER_REVIEW')}
                    title="Only Admins have the legal authority to freeze bank accounts"
                    className="px-3 py-2.5 rounded-xl bg-slate-800/80 text-slate-400 font-medium border border-slate-700 transition text-xs flex flex-col items-center justify-center cursor-not-allowed opacity-75"
                  >
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Freeze (Admin Only)
                    </span>
                    <span className="text-[9px] text-slate-500">Switch role to Admin</span>
                  </button>
                )}
              </div>

              {actionStatus === 'success' && (
                <p className="text-xs text-emerald-400 font-medium text-center">
                  ✓ Decision logged and transaction status updated!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Audit Trail Log */}
      {transaction.auditLogs && transaction.auditLogs.length > 0 && (
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Compliance Audit Trail</h3>
          </div>
          <div className="space-y-2">
            {transaction.auditLogs.map((log, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-200">{log.action}</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">{log.notes}</p>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Investigation;
