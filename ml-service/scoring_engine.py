"""
SmartSpend Fraud Risk Scoring & Explainability Engine.
Transforms raw ML probabilities into a calibrated 0-100 score, provides human-readable
reasons with severity markers, and generates contextual recommended actions.
"""

from typing import List, Dict, Any

class ScoringEngine:
    @staticmethod
    def calculate_risk_score(raw_probability: float) -> int:
        """
        Calibrates model probability into an intuitive 0-100 integer score.
        """
        score = int(round(raw_probability * 100))
        return max(0, min(100, score))

    @staticmethod
    def get_risk_level(risk_score: int) -> str:
        """
        Determines the risk classification tier based on standard banking risk bands:
        - 0-30: LOW
        - 31-70: MEDIUM
        - 71-100: HIGH
        """
        if risk_score <= 30:
            return "LOW"
        elif risk_score <= 70:
            return "MEDIUM"
        else:
            return "HIGH"

    @staticmethod
    def generate_reasons(data: Dict[str, Any], raw_probability: float, risk_score: int) -> List[Dict[str, Any]]:
        """
        Generates explainable, evidence-backed fraud risk factors with severity weights.
        """
        reasons = []
        
        amount = float(data.get("amount", 0.0))
        txn_type = str(data.get("type", "TRANSFER")).upper()
        oldbalanceOrg = float(data.get("oldbalanceOrg", data.get("old_balance", 0.0)))
        newbalanceOrig = float(data.get("newbalanceOrig", data.get("new_balance", 0.0)))
        oldbalanceDest = float(data.get("oldbalanceDest", 0.0))
        newbalanceDest = float(data.get("newbalanceDest", 0.0))
        receiver = str(data.get("nameDest", data.get("receiver", "")))
        hour = int(data.get("step", 12)) % 24
        
        # 1. Complete Balance Drain
        if oldbalanceOrg > 0 and newbalanceOrig == 0 and amount >= (oldbalanceOrg * 0.95):
            reasons.append({
                "factor": "Account balance completely drained in a single transaction",
                "severity": "CRITICAL",
                "code": "DRAIN_ACCOUNT"
            })
            
        # 2. High-Risk Transaction Type Velocity (PaySim TRANSFER & CASH_OUT)
        if txn_type in ["TRANSFER", "CASH_OUT"]:
            if amount > 100000:
                reasons.append({
                    "factor": f"High-risk {txn_type} operation exceeding high-volume threshold (₹1,00,000+)",
                    "severity": "HIGH",
                    "code": "HIGH_VALUE_TRANSFER"
                })
        elif txn_type == "PAYMENT" and amount < 5000:
            reasons.append({
                "factor": "Routine commercial payment to registered merchant",
                "severity": "LOW",
                "code": "ROUTINE_PAYMENT"
            })
            
        # 3. Destination Zero-Balance Anomaly (Mule account pattern)
        if oldbalanceDest == 0.0 and amount > 50000 and not receiver.startswith("M"):
            if newbalanceDest == 0.0:
                reasons.append({
                    "factor": "Rapid pass-through: recipient balance immediately cleared (potential money mule)",
                    "severity": "CRITICAL",
                    "code": "RAPID_PASSTHROUGH"
                })
            else:
                reasons.append({
                    "factor": "Destination account had zero previous transaction history/balance",
                    "severity": "MEDIUM",
                    "code": "NEW_DESTINATION_ACCOUNT"
                })
                
        # 4. Large Transaction relative to sender history
        if oldbalanceOrg > 0 and (amount > oldbalanceOrg * 2):
            reasons.append({
                "factor": "Transfer amount significantly exceeds sender historical average balance",
                "severity": "HIGH",
                "code": "EXCEEDS_HISTORICAL_AVG"
            })
            
        # 5. Night-time or odd-hour execution
        if hour in [1, 2, 3, 4, 5]:
            reasons.append({
                "factor": f"Off-hours transaction executed during low-activity window ({hour:02d}:00 UTC)",
                "severity": "LOW",
                "code": "ODD_HOURS"
            })
            
        # 6. Balance math discrepancy (Forged state indicator)
        expected_remaining = oldbalanceOrg - amount
        if txn_type in ["TRANSFER", "CASH_OUT"] and abs(expected_remaining - newbalanceOrig) > 1.0:
            reasons.append({
                "factor": "Ledger discrepancy detected between reported balance and transaction delta",
                "severity": "HIGH",
                "code": "LEDGER_DISCREPANCY"
            })

        # 7. Model Statistical Confidence Alert
        if raw_probability > 0.85 and not any(r["severity"] == "CRITICAL" for r in reasons):
            reasons.append({
                "factor": "Machine learning ensemble detected anomalous multivariate pattern",
                "severity": "HIGH",
                "code": "ML_ANOMALY_CONFIDENCE"
            })
            
        if not reasons:
            if risk_score < 30:
                reasons.append({
                    "factor": "Transaction matches standard verified user behavioral patterns",
                    "severity": "LOW",
                    "code": "NORMAL_BEHAVIOR"
                })
            else:
                reasons.append({
                    "factor": "Elevated risk factors detected by random forest ensemble classifier",
                    "severity": "MEDIUM",
                    "code": "GENERAL_RISK"
                })
                
        return reasons

    @staticmethod
    def get_recommended_action(risk_level: str, risk_score: int) -> Dict[str, str]:
        """
        Determines actionable recommendations for compliance & fraud analysts.
        """
        if risk_level == "HIGH":
            return {
                "action": "BLOCK_AND_REVIEW",
                "title": "Immediate Hold & Analyst Investigation",
                "description": "Transaction flagged with critical fraud probability. Automatically hold funds and escalate to senior fraud response team for KYC verification.",
                "color": "red"
            }
        elif risk_level == "MEDIUM":
            return {
                "action": "ENHANCED_MFA",
                "title": "Step-up Verification Recommended",
                "description": "Unusual characteristics detected. Trigger biometric or step-up SMS OTP verification prior to settlement.",
                "color": "amber"
            }
        else:
            return {
                "action": "AUTO_APPROVE",
                "title": "Clear for Instant Settlement",
                "description": "Standard risk profile. Transaction is clear for automated instant processing.",
                "color": "green"
            }
