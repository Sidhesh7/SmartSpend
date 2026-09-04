import os
import json
import joblib
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from feature_engineering import extract_single_features, engineer_features_from_records, extract_features_from_dict
from scoring_engine import ScoringEngine
from mule_graph_engine import global_graph_engine

app = FastAPI(
    title="SmartSpend ML & MuleGraph™ Fraud Detection Service",
    description="Real-time Dual-Stage AI Fraud Scoring & Multi-Hop Money Mule Ring Topological Interceptor",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "fraud_detector.joblib")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "model", "metrics.json")

model = None
metrics_cache = None

def load_model():
    global model, metrics_cache
    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            print(f"Loaded ML model from {MODEL_PATH}")
        except Exception as e:
            print(f"Error loading model: {e}")
            model = None
            
    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                metrics_cache = json.load(f)
        except Exception as e:
            print(f"Error loading metrics: {e}")
            metrics_cache = None

@app.on_event("startup")
def startup_event():
    load_model()
    if model is None:
        print("Model file not found on startup. Training model now...")
        try:
            from train import train_model
            train_model()
            load_model()
        except Exception as e:
            print(f"Failed to auto-train model: {e}")

class TransactionInput(BaseModel):
    step: Optional[int] = Field(default=12, description="Hour step (1-744)")
    type: str = Field(..., description="Transaction type: TRANSFER, CASH_OUT, PAYMENT, CASH_IN, DEBIT")
    amount: float = Field(..., description="Transaction amount in INR")
    oldbalanceOrg: Optional[float] = Field(default=0.0, description="Sender balance before transaction")
    newbalanceOrig: Optional[float] = Field(default=0.0, description="Sender balance after transaction")
    oldbalanceDest: Optional[float] = Field(default=0.0, description="Receiver balance before transaction")
    newbalanceDest: Optional[float] = Field(default=0.0, description="Receiver balance after transaction")
    nameOrig: Optional[str] = Field(default="C000000000", description="Sender Account ID")
    nameDest: Optional[str] = Field(default="C000000000", description="Receiver Account ID")
    sender: Optional[str] = None
    receiver: Optional[str] = None
    transactionId: Optional[str] = None

class RiskFactor(BaseModel):
    factor: str
    severity: str
    code: str

class RecommendedAction(BaseModel):
    action: str
    title: str
    description: str
    color: str

class PredictionResponse(BaseModel):
    fraudProbability: float
    riskScore: int
    riskLevel: str
    isFraudPredicted: bool
    reasons: List[RiskFactor]
    recommendedAction: RecommendedAction
    muleGraphMetrics: Optional[Dict[str, Any]] = None

class BatchTransactionInput(BaseModel):
    transactions: List[TransactionInput]

class FreezeRingInput(BaseModel):
    ringId: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy" if model is not None else "degraded",
        "model_loaded": model is not None,
        "metrics_loaded": metrics_cache is not None,
        "service": "SmartSpend Python ML & MuleGraph™ Engine",
        "graph_nodes": len(global_graph_engine.nodes),
        "graph_edges": len(global_graph_engine.edges),
        "mule_rings_detected": len(global_graph_engine.detected_rings)
    }

@app.get("/metrics")
def get_metrics():
    if metrics_cache:
        return metrics_cache
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Model metrics not found.")

@app.post("/predict", response_model=PredictionResponse)
def predict_transaction(data: TransactionInput):
    txn_dict = data.dict()
    # Normalize sender and receiver IDs
    sender = txn_dict.get("sender") or txn_dict.get("nameOrig") or "C000000000"
    receiver = txn_dict.get("receiver") or txn_dict.get("nameDest") or "C000000000"
    txn_dict["sender"] = sender
    txn_dict["receiver"] = receiver
    txn_dict["nameOrig"] = sender
    txn_dict["nameDest"] = receiver

    # --- STAGE 1: Random Forest Classifier ---
    if model is not None:
        X = extract_single_features(txn_dict)
        raw_prob = float(model.predict_proba(X)[0][1])
    else:
        amount = float(txn_dict.get("amount", 0))
        txn_type = str(txn_dict.get("type", "PAYMENT")).upper()
        if txn_type in ["TRANSFER", "CASH_OUT"] and amount > 50000:
            raw_prob = 0.85
        else:
            raw_prob = 0.05
            
    ml_risk_score = ScoringEngine.calculate_risk_score(raw_prob)
    base_reasons = ScoringEngine.generate_reasons(txn_dict, raw_prob, ml_risk_score)

    # --- STAGE 2: MuleGraph™ Topological Ingestion & Ring Interceptor ---
    graph_res = global_graph_engine.add_transaction(txn_dict)
    graph_score = graph_res["graph_risk_score"]
    graph_factors = graph_res["graph_factors"]

    # --- DUAL-STAGE COMPOSITE FUSION ---
    composite_score = min(100, max(ml_risk_score, round(0.65 * ml_risk_score + 0.35 * graph_score)))
    if graph_res.get("in_mule_ring") and composite_score < 75:
        composite_score = max(composite_score, 82) # Elevated threshold for graph-ring matches

    risk_level = ScoringEngine.get_risk_level(composite_score)
    
    # Merge ML reasons with Graph topological reasons
    combined_reasons = graph_factors + base_reasons
    recommended_action = ScoringEngine.get_recommended_action(risk_level, composite_score)

    return {
        "fraudProbability": round(max(raw_prob, composite_score / 100.0), 4),
        "riskScore": composite_score,
        "riskLevel": risk_level,
        "isFraudPredicted": composite_score >= 50,
        "reasons": combined_reasons,
        "recommendedAction": recommended_action,
        "muleGraphMetrics": {
            "graphScore": graph_score,
            "inMuleRing": graph_res["in_mule_ring"],
            "fanOut": graph_res["dispersion_metrics"]["fan_out"],
            "fanIn": graph_res["dispersion_metrics"]["fan_in"],
            "cycleDetected": graph_res["cycle_detected"]["in_cycle"],
            "cycleHops": graph_res["cycle_detected"]["hops"]
        }
    }

@app.post("/batch-predict")
def batch_predict(batch: BatchTransactionInput):
    results = []
    for txn in batch.transactions:
        results.append(predict_transaction(txn))
    return {"predictions": results, "total": len(results)}

# --- MuleGraph™ Topological API Endpoints ---

@app.get("/graph/topology")
def get_graph_topology(limit: int = 40):
    return global_graph_engine.get_graph_topology(max_nodes=limit)

@app.get("/graph/mule-rings")
def get_mule_rings():
    rings = global_graph_engine.get_detected_rings()
    return {
        "rings": rings,
        "count": len(rings),
        "frozen_accounts": list(global_graph_engine.frozen_accounts)
    }

@app.post("/graph/freeze-ring")
def freeze_ring(payload: FreezeRingInput):
    result = global_graph_engine.freeze_syndicate(payload.ringId)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("message", "Ring not found"))
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
