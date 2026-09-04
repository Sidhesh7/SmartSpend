import React, { useState, useEffect } from 'react';
import { graphService } from '../services/api';
import { formatINR, formatINRExact, formatIndianNumber } from '../utils/formatters';
import { 
  Network, 
  ShieldAlert, 
  RotateCw, 
  ArrowRight, 
  Lock, 
  Share2, 
  Users,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MuleGraph = () => {
  const { user } = useAuth();
  const [topology, setTopology] = useState(null);
  const [muleRings, setMuleRings] = useState([]);
  const [selectedRing, setSelectedRing] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [freezing, setFreezing] = useState(false);
  const [freezeSuccess, setFreezeSuccess] = useState(null);

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      const [topoRes, ringsRes] = await Promise.all([
        graphService.getTopology(40),
        graphService.getMuleRings()
      ]);
      setTopology(topoRes);
      setMuleRings(ringsRes.rings || []);
      if (ringsRes.rings && ringsRes.rings.length > 0) {
        setSelectedRing(ringsRes.rings[0]);
      }
      if (topoRes?.nodes && topoRes.nodes.length > 0) {
        const ringNode = topoRes.nodes.find(n => n.type === 'RING_MEMBER') || topoRes.nodes[0];
        setSelectedNode(ringNode);
      }
    } catch (err) {
      console.error('Error fetching graph data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  const handleFreezeRing = async (ringId) => {
    try {
      setFreezing(true);
      await graphService.freezeRing(ringId);
      setFreezeSuccess(`Successfully frozen all accounts in this ring!`);
      fetchGraphData();
      setTimeout(() => setFreezeSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to freeze accounts:', err);
    } finally {
      setFreezing(false);
    }
  };

  if (loading && !topology) {
    return (
      <div className="flex items-center justify-center h-96">
        <RotateCw className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const nodes = topology?.nodes || [];
  const edges = topology?.edges || [];

  const centerX = 380;
  const centerY = 260;
  const radius = 190;

  const nodePositions = {};
  nodes.forEach((n, idx) => {
    const angle = (idx / Math.max(1, nodes.length)) * 2 * Math.PI - Math.PI / 2;
    const isRing = selectedRing?.members?.includes(n.id) || n.type === 'RING_MEMBER';
    const r = isRing ? radius * 0.75 : radius;
    nodePositions[n.id] = {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 rounded-2xl border-l-4 border-l-rose-500">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="w-6 h-6 text-rose-400" />
            Fraud Ring Network Tracker
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Visual map showing how suspicious accounts transfer money in circles to hide stolen funds
          </p>
        </div>

        <button
          onClick={fetchGraphData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Map</span>
        </button>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monitored Accounts</span>
          <p className="text-2xl font-extrabold text-white mt-1 font-mono">{topology?.total_nodes || nodes.length}</p>
          <span className="text-[10px] text-slate-500">Active bank accounts</span>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transfers Tracked</span>
          <p className="text-2xl font-extrabold text-indigo-400 mt-1 font-mono">{topology?.total_edges || edges.length}</p>
          <span className="text-[10px] text-slate-500">Between accounts</span>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fraud Rings Found</span>
          <p className="text-2xl font-extrabold text-rose-400 mt-1 font-mono">{muleRings.length}</p>
          <span className="text-[10px] text-rose-400/80">Circular money loops</span>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Frozen Accounts</span>
          <p className="text-2xl font-extrabold text-cyan-400 mt-1 font-mono">{topology?.frozen_accounts_count || 0}</p>
          <span className="text-[10px] text-slate-500">Blocked accounts</span>
        </div>
      </div>

      {/* Visual Canvas (8 cols) + Ring Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Graph Canvas */}
        <div className="lg:col-span-8 glass-card p-5 rounded-2xl relative flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                Live Account Connections
              </h3>
              <p className="text-[11px] text-slate-400">Click any account circle to view details</p>
            </div>

            {/* Simple Legend */}
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-rose-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Fraud Ring
              </span>
              <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Frozen
              </span>
              <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Normal Account
              </span>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="w-full h-[480px] bg-slate-950/70 border border-slate-800/80 rounded-xl relative overflow-hidden flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 760 520" className="cursor-pointer">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366F1" />
                </marker>
                <marker id="arrow-ring" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
                </marker>
                <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle cx={centerX} cy={centerY} r={radius * 0.75 + 30} fill="url(#ringGlow)" />

              {/* Edges */}
              {edges.map((e, idx) => {
                const src = nodePositions[e.source];
                const tgt = nodePositions[e.target];
                if (!src || !tgt) return null;

                const isRing = e.isRingEdge || (selectedRing?.members?.includes(e.source) && selectedRing?.members?.includes(e.target));

                return (
                  <g key={`edge-${idx}`}>
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={isRing ? '#EF4444' : '#334155'}
                      strokeWidth={isRing ? 2.5 : 1}
                      strokeDasharray={isRing ? '4 2' : 'none'}
                      markerEnd={isRing ? 'url(#arrow-ring)' : 'url(#arrow)'}
                      className={isRing ? 'animate-pulse' : ''}
                    />
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 4}
                      fill={isRing ? '#F87171' : '#64748B'}
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      className="font-bold"
                    >
                      {formatINR(e.amount)}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map((n) => {
                const pos = nodePositions[n.id] || { x: centerX, y: centerY };
                const isSelected = selectedNode?.id === n.id;
                const isRingMember = selectedRing?.members?.includes(n.id) || n.type === 'RING_MEMBER';
                const isFrozen = n.status === 'FROZEN' || n.type === 'FROZEN_MULE';

                let fill = '#4F46E5';
                let stroke = '#818CF8';
                if (isFrozen) {
                  fill = '#0891B2';
                  stroke = '#22D3EE';
                } else if (isRingMember) {
                  fill = '#DC2626';
                  stroke = '#F87171';
                } else if (n.type === 'MERCHANT') {
                  fill = '#059669';
                  stroke = '#34D399';
                }

                return (
                  <g
                    key={`node-${n.id}`}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setSelectedNode(n)}
                    className="cursor-pointer"
                  >
                    <circle
                      r={isSelected || isRingMember ? 20 : 14}
                      fill={stroke}
                      fillOpacity={isSelected ? 0.4 : (isRingMember ? 0.25 : 0)}
                      className="transition-all duration-300"
                    />
                    <circle
                      r={isRingMember ? 14 : 11}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                    <text
                      y={22}
                      fill="#E2E8F0"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      className="font-bold pointer-events-none"
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
            💡 <strong>How to read this:</strong> The red arrows show money passing from one account to another in a circle until it returns back to the start.
          </div>
        </div>

        {/* Ring Inspector & Details (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5 rounded-2xl border-l-4 border-l-red-500 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Detected Fraud Ring
              </h3>
              <span className="text-[10px] font-mono bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-bold">
                {selectedRing?.hops || 4} Accounts Involved
              </span>
            </div>

            {selectedRing ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Money Transferred:</span>
                    <span className="font-bold text-red-400 font-mono">{formatINRExact(selectedRing.total_volume)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Average Transfer:</span>
                    <span className="font-bold text-white font-mono">{formatINRExact(selectedRing.avg_amount)}</span>
                  </div>
                </div>

                {/* Path */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider block">
                    Circular Transfer Sequence:
                  </span>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 font-mono text-xs">
                    {selectedRing.path?.map((node, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 text-[10px] flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className={i === selectedRing.path.length - 1 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                          {node}
                        </span>
                        {i < selectedRing.path.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-red-500 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action button: Admin only */}
                {user?.role === 'ADMIN' ? (
                  <button
                    onClick={() => handleFreezeRing(selectedRing.ring_id)}
                    disabled={freezing}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{freezing ? 'Freezing Accounts...' : `Freeze These ${selectedRing.members?.length || 4} Accounts`}</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                    <p className="text-xs text-slate-300 font-semibold flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Freezing Requires Admin Role
                    </p>
                    <p className="text-[10px] text-slate-500">
                      As an Analyst, you can monitor this ring. Switch to "Admin" in top navbar to freeze accounts.
                    </p>
                  </div>
                )}

                {freezeSuccess && (
                  <p className="text-xs text-emerald-400 font-semibold text-center mt-1">
                    ✓ {freezeSuccess}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No fraud rings detected.</p>
            )}
          </div>

          {/* Selected Account Profile */}
          {selectedNode ? (
            <div className="glass-card p-4 rounded-2xl space-y-2.5 text-xs">
              <h4 className="font-bold text-white flex items-center justify-between">
                <span>Account Info:</span>
                <span className="font-mono text-indigo-400">{selectedNode.fullId}</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Total Received:</span>
                  <p className="font-bold text-slate-200 mt-0.5">{formatINRExact(selectedNode.totalIn)}</p>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Total Sent:</span>
                  <p className="font-bold text-slate-200 mt-0.5">{formatINRExact(selectedNode.totalOut)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 text-slate-400 text-[11px]">
                <span>Status: <strong className={selectedNode.status === 'FROZEN' ? 'text-cyan-400' : 'text-emerald-400'}>{selectedNode.status}</strong></span>
                <span>Type: <strong className="text-slate-200">{selectedNode.type}</strong></span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
              Click any circle on the map to see how much money that account received and sent.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MuleGraph;
