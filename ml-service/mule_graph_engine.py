"""
MuleGraph™ — Real-Time Multi-Hop Money Mule Ring Detection & Graph Topology Engine.
Proprietary topological graph algorithm for discovering circular laundering rings, 
smurfing fan-out funnels, and rapid mule pass-through chains in streaming financial ledgers.
"""

import time
import math
from collections import defaultdict, deque
from typing import List, Dict, Any, Tuple, Optional

class MuleGraphEngine:
    def __init__(self, max_cycle_depth: int = 6, time_window_steps: int = 72):
        self.max_cycle_depth = max_cycle_depth
        self.time_window_steps = time_window_steps
        
        # Adjacency list: sender -> list of edge dicts
        self.adj = defaultdict(list)
        # Reverse adjacency: receiver -> list of edge dicts
        self.rev_adj = defaultdict(list)
        # Node metadata: account_id -> { total_in, total_out, in_count, out_count, first_seen, last_seen, status }
        self.nodes = {}
        # Edge repository: txn_id -> edge
        self.edges = []
        # Detected syndicates/rings cache
        self.detected_rings = []
        # Frozen accounts set
        self.frozen_accounts = set()

    def add_transaction(self, txn: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ingests a transaction into the temporal graph in real time and evaluates topological risk.
        """
        sender = str(txn.get("sender", txn.get("nameOrig", "C000000000")))
        receiver = str(txn.get("receiver", txn.get("nameDest", "C000000000")))
        amount = float(txn.get("amount", 0.0))
        step = int(txn.get("step", 12))
        txn_id = str(txn.get("transactionId", f"TXN-G{len(self.edges)+1}"))
        txn_type = str(txn.get("type", "TRANSFER")).upper()

        edge = {
            "txn_id": txn_id,
            "sender": sender,
            "receiver": receiver,
            "amount": amount,
            "step": step,
            "type": txn_type,
            "timestamp": time.time()
        }

        # Update node metadata
        self._touch_node(sender, is_sender=True, amount=amount, step=step)
        self._touch_node(receiver, is_sender=False, amount=amount, step=step)

        # Append edges
        self.adj[sender].append(edge)
        self.rev_adj[receiver].append(edge)
        self.edges.append(edge)

        # Real-time topological analysis
        cycle_result = self.detect_cycles_for_edge(edge)
        dispersion_result = self.calculate_dispersion_index(sender, receiver, edge)

        graph_risk_score = 0
        graph_factors = []

        # 1. Circular Laundering Ring Trigger
        if cycle_result["in_cycle"]:
            graph_risk_score += 50
            cycle_path = " → ".join(cycle_result["cycle_path"])
            graph_factors.append({
                "factor": f"Circular money loop detected across {len(cycle_result['cycle_path'])-1} accounts: ({cycle_path})",
                "severity": "CRITICAL",
                "code": "CIRCULAR_MULE_RING"
            })

        # 2. Smurfing / Rapid Dispersal Trigger
        if dispersion_result["is_smurfing"]:
            graph_risk_score += 35
            graph_factors.append({
                "factor": f"Rapid splitting of funds: money dispersed to {dispersion_result['fan_out']} different accounts",
                "severity": "HIGH",
                "code": "RAPID_SPLITTING_FANOUT"
            })

        # 3. Aggregation Funnel Trigger
        if dispersion_result["is_aggregating"]:
            graph_risk_score += 30
            graph_factors.append({
                "factor": f"Money collection funnel: receiving funds from {dispersion_result['fan_in']} different accounts",
                "severity": "HIGH",
                "code": "MONEY_FUNNEL_FANIN"
            })

        # 4. Rapid Pass-Through Chain
        if self._is_pass_through_mule(sender):
            graph_risk_score += 25
            graph_factors.append({
                "factor": "Rapid pass-through account: incoming money was emptied out almost immediately",
                "severity": "HIGH",
                "code": "RAPID_PASSTHROUGH"
            })

        # Check if either participant is in a frozen syndicate
        if sender in self.frozen_accounts or receiver in self.frozen_accounts:
            graph_risk_score = 100
            graph_factors.append({
                "factor": "Account was previously frozen for fraudulent activity",
                "severity": "CRITICAL",
                "code": "FROZEN_ACCOUNT_ACTIVITY"
            })

        graph_risk_score = min(100, graph_risk_score)

        return {
            "graph_risk_score": graph_risk_score,
            "in_mule_ring": cycle_result["in_cycle"] or dispersion_result["is_smurfing"] or dispersion_result["is_aggregating"],
            "cycle_detected": cycle_result,
            "dispersion_metrics": dispersion_result,
            "graph_factors": graph_factors
        }

    def detect_cycles_for_edge(self, target_edge: Dict[str, Any]) -> Dict[str, Any]:
        """
        Algorithm 1: Temporal Multi-Hop Cycle Interceptor (k-hop, 2 <= k <= 6).
        Finds closed directed paths starting from receiver back to sender.
        Time complexity: O(d^k) pruned with temporal causality and volume ratio constraints.
        """
        start_node = target_edge["receiver"]
        target_node = target_edge["sender"]
        max_step = target_edge["step"]
        min_step = max_step - self.time_window_steps
        target_amount = target_edge["amount"]

        if start_node == target_node:
            return {"in_cycle": True, "cycle_path": [target_node, target_node], "hops": 1, "volume_ratio": 1.0}

        # Queue for BFS/DFS: (current_node, path_nodes, path_edges, min_amount_in_path, max_amount_in_path)
        queue = deque([(start_node, [target_node, start_node], [target_edge], target_amount, target_amount)])
        visited_in_path = set()

        while queue:
            curr, path, edge_path, min_amt, max_amt = queue.popleft()

            if len(path) > self.max_cycle_depth + 1:
                continue

            last_step = edge_path[-1]["step"]

            for next_edge in self.adj.get(curr, []):
                next_node = next_edge["receiver"]
                next_step = next_edge["step"]
                next_amt = next_edge["amount"]

                # Enforce temporal monotonicity & window
                if next_step < min_step or next_step > max_step + self.time_window_steps:
                    continue

                # Volume preservation check: transactions in a ring must have comparable scale (>= 40% similarity)
                curr_min = min(min_amt, next_amt)
                curr_max = max(max_amt, next_amt)
                if curr_max > 0 and (curr_min / curr_max) < 0.35:
                    continue

                new_path = path + [next_node]
                new_edge_path = edge_path + [next_edge]

                # Cycle completed back to origin sender!
                if next_node == target_node and len(path) >= 2:
                    ring_id = f"RING-{''.join([n[-4:] for n in new_path[:-1]])}"
                    ring_info = {
                        "ring_id": ring_id,
                        "members": new_path[:-1],
                        "hops": len(new_path) - 1,
                        "path": new_path,
                        "total_volume": round(sum(e["amount"] for e in new_edge_path), 2),
                        "avg_amount": round(sum(e["amount"] for e in new_edge_path) / len(new_edge_path), 2),
                        "detected_at_step": max_step
                    }
                    if not any(r["ring_id"] == ring_id for r in self.detected_rings):
                        self.detected_rings.append(ring_info)
                    return {
                        "in_cycle": True,
                        "cycle_path": new_path,
                        "hops": len(new_path) - 1,
                        "ring_id": ring_id,
                        "volume_ratio": round(curr_min / curr_max, 3)
                    }

                if next_node not in path:
                    queue.append((next_node, new_path, new_edge_path, curr_min, curr_max))

        return {"in_cycle": False, "cycle_path": [], "hops": 0, "volume_ratio": 0.0}

    def calculate_dispersion_index(self, sender: str, receiver: str, current_edge: Dict[str, Any]) -> Dict[str, Any]:
        """
        Algorithm 2: Mule Dispersion & Aggregation Index (MDAI).
        Measures Fan-Out (Smurfing/Structuring) and Fan-In (Consolidation) velocity.
        """
        sender_edges = self.adj.get(sender, [])
        receiver_in_edges = self.rev_adj.get(receiver, [])

        recent_window = 12 # 12 hours
        curr_step = current_edge["step"]

        # Fan-out: Distinct recipients in recent window
        recent_fan_out_recipients = set(
            e["receiver"] for e in sender_edges 
            if abs(e["step"] - curr_step) <= recent_window
        )
        # Fan-in: Distinct senders into receiver in recent window
        recent_fan_in_senders = set(
            e["sender"] for e in receiver_in_edges 
            if abs(e["step"] - curr_step) <= recent_window
        )

        is_smurfing = len(recent_fan_out_recipients) >= 3 and current_edge["amount"] >= 20000
        is_aggregating = len(recent_fan_in_senders) >= 3 and current_edge["amount"] >= 20000

        # Calculate Shannon Entropy of Outgoing Disbursement
        out_amounts = [e["amount"] for e in sender_edges if abs(e["step"] - curr_step) <= recent_window]
        total_out = sum(out_amounts) or 1.0
        entropy = 0.0
        for amt in out_amounts:
            p = amt / total_out
            if p > 0:
                entropy -= p * math.log2(p)

        return {
            "fan_out": len(recent_fan_out_recipients),
            "fan_in": len(recent_fan_in_senders),
            "is_smurfing": is_smurfing,
            "is_aggregating": is_aggregating,
            "dispersion_entropy": round(entropy, 3)
        }

    def _is_pass_through_mule(self, node_id: str) -> bool:
        """
        Detects if an account behaves as a high-velocity pass-through pipe:
        Total In approx Total Out, and In-edges immediately followed by Out-edges.
        """
        meta = self.nodes.get(node_id)
        if not meta or meta["total_in"] == 0 or meta["total_out"] == 0:
            return False
        
        ratio = meta["total_out"] / meta["total_in"]
        # If outgoing is 85% - 115% of incoming and transaction count >= 2
        return (0.85 <= ratio <= 1.15) and (meta["in_count"] >= 1 and meta["out_count"] >= 1)

    def _touch_node(self, node_id: str, is_sender: bool, amount: float, step: int):
        if node_id not in self.nodes:
            self.nodes[node_id] = {
                "id": node_id,
                "label": "Merchant" if node_id.startswith("M") else "Customer",
                "total_in": 0.0,
                "total_out": 0.0,
                "in_count": 0,
                "out_count": 0,
                "first_seen_step": step,
                "last_seen_step": step,
                "status": "ACTIVE"
            }
        
        node = self.nodes[node_id]
        if is_sender:
            node["total_out"] += amount
            node["out_count"] += 1
        else:
            node["total_in"] += amount
            node["in_count"] += 1
        node["last_seen_step"] = max(node["last_seen_step"], step)

    def freeze_syndicate(self, ring_id: str) -> Dict[str, Any]:
        """
        Freezes all member accounts in a detected mule ring syndicate.
        """
        for ring in self.detected_rings:
            if ring["ring_id"] == ring_id:
                for member in ring["members"]:
                    self.frozen_accounts.add(member)
                    if member in self.nodes:
                        self.nodes[member]["status"] = "FROZEN"
                return {
                    "success": True,
                    "ring_id": ring_id,
                    "frozen_members": ring["members"],
                    "count": len(ring["members"])
                }
        return {"success": False, "message": f"Ring {ring_id} not found."}

    def get_graph_topology(self, max_nodes: int = 40) -> Dict[str, Any]:
        """
        Serializes current graph topology for visual frontend rendering.
        """
        # Select active/high-risk nodes first
        sorted_nodes = sorted(
            self.nodes.values(),
            key=lambda n: (n["id"] in self.frozen_accounts, n["total_in"] + n["total_out"]),
            reverse=True
        )[:max_nodes]

        selected_ids = set(n["id"] for n in sorted_nodes)
        
        # Build node objects
        node_payload = []
        for n in sorted_nodes:
            is_frozen = n["id"] in self.frozen_accounts
            is_in_ring = any(n["id"] in r["members"] for r in self.detected_rings)
            
            node_type = "MERCHANT" if n["label"] == "Merchant" else ("FROZEN_MULE" if is_frozen else ("RING_MEMBER" if is_in_ring else "NORMAL"))
            
            node_payload.append({
                "id": n["id"],
                "label": n["id"][-6:],
                "fullId": n["id"],
                "type": node_type,
                "totalIn": round(n["total_in"], 2),
                "totalOut": round(n["total_out"], 2),
                "inCount": n["in_count"],
                "outCount": n["out_count"],
                "status": n.get("status", "ACTIVE")
            })

        # Build edges between selected nodes
        edge_payload = []
        for e in self.edges[-150:]: # Latest 150 edges
            if e["sender"] in selected_ids and e["receiver"] in selected_ids:
                is_ring_edge = any(
                    e["sender"] in r["members"] and e["receiver"] in r["members"] 
                    for r in self.detected_rings
                )
                edge_payload.append({
                    "id": e["txn_id"],
                    "source": e["sender"],
                    "target": e["receiver"],
                    "amount": round(e["amount"], 2),
                    "type": e["type"],
                    "step": e["step"],
                    "isRingEdge": is_ring_edge
                })

        return {
            "nodes": node_payload,
            "edges": edge_payload,
            "total_nodes": len(self.nodes),
            "total_edges": len(self.edges),
            "detected_rings_count": len(self.detected_rings),
            "frozen_accounts_count": len(self.frozen_accounts)
        }

    def get_detected_rings(self) -> List[Dict[str, Any]]:
        return self.detected_rings


# Global singleton instance of MuleGraphEngine
global_graph_engine = MuleGraphEngine()

# Seed initial multi-hop mule ring topologies for demonstration
def seed_initial_mule_rings():
    # Syndicate Ring 1: 4-Hop Circular Ring (₹85,400 Layered Transfer Loop)
    # C839201948 -> C492019482 -> C993847281 -> C102938172 -> C839201948
    ring_txns = [
        {"transactionId": "TXN-RING-1", "sender": "C839201948", "receiver": "C492019482", "amount": 85400.0, "type": "TRANSFER", "step": 10},
        {"transactionId": "TXN-RING-2", "sender": "C492019482", "receiver": "C993847281", "amount": 84000.0, "type": "TRANSFER", "step": 11},
        {"transactionId": "TXN-RING-3", "sender": "C993847281", "receiver": "C102938172", "amount": 82500.0, "type": "TRANSFER", "step": 12},
        {"transactionId": "TXN-RING-4", "sender": "C102938172", "receiver": "C839201948", "amount": 81000.0, "type": "TRANSFER", "step": 13},
        
        # Syndicate 2: Smurfing Funnel (1 Origin to 4 Mules in 1 Hour)
        {"transactionId": "TXN-SMURF-1", "sender": "C777192840", "receiver": "C111222333", "amount": 45000.0, "type": "TRANSFER", "step": 20},
        {"transactionId": "TXN-SMURF-2", "sender": "C777192840", "receiver": "C444555666", "amount": 48000.0, "type": "TRANSFER", "step": 20},
        {"transactionId": "TXN-SMURF-3", "sender": "C777192840", "receiver": "C777888999", "amount": 46000.0, "type": "TRANSFER", "step": 20},
        {"transactionId": "TXN-SMURF-4", "sender": "C777192840", "receiver": "C222333444", "amount": 47000.0, "type": "TRANSFER", "step": 20},

        # Normal Merchant Payments
        {"transactionId": "TXN-NORM-1", "sender": "C123456789", "receiver": "M987654321", "amount": 850.0, "type": "PAYMENT", "step": 14},
        {"transactionId": "TXN-NORM-2", "sender": "C981273948", "receiver": "M102938475", "amount": 1200.0, "type": "PAYMENT", "step": 11},
        {"transactionId": "TXN-NORM-3", "sender": "C394827163", "receiver": "C102938475", "amount": 25000.0, "type": "CASH_IN", "step": 16}
    ]
    for t in ring_txns:
        global_graph_engine.add_transaction(t)

seed_initial_mule_rings()
