# SmartSpend — AI-Powered Financial Fraud Detection & Risk Analytics Platform

[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js)](https://nodejs.org)
[![Python](https://img.shields.io/badge/ML%20Service-Python%203.11%20%7C%20FastAPI-3776AB?logo=python)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TailwindCSS-61DAFB?logo=react)](https://react.dev)
[![Model](https://img.shields.io/badge/Model-Random%20Forest%20Ensemble-FF6F00)](https://scikit-learn.org)
[![Database](https://img.shields.io/badge/Database-SQLite%20%2F%20PostgreSQL-4169E1?logo=postgresql)](https://prisma.io)

SmartSpend is an enterprise-grade AI-powered financial fraud detection and risk analytics platform. It classifies transactions in real-time, generates calibrated **0–100 fraud-risk scores** with **explainable AI feature attributions**, provides forensic investigation dossiers for fraud analysts, and delivers interactive analytics dashboards.

---

## 🏗️ System Architecture

```
                                  SMARTSPEND
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       React + Tailwind + Lucide UI Dashboard     │
             │   (Overview, Transactions, Investigation,        │
             │    Live Simulator, Model Analytics)              │
             └────────────────────────┬─────────────────────────┘
                                      │ REST (JWT Auth)
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │            Node.js / Express Backend             │
             │    (Auth, Transactions API, Analytics, Proxy)    │
             └───────────────────┬──────────────┬───────────────┘
                                 │              │
                     ┌───────────┘              └───────────┐
                     ▼                                      ▼
             ┌──────────────┐                       ┌──────────────┐
             │  PostgreSQL  │                       │  Python ML   │
             │   / SQLite   │                       │   FastAPI    │
             │ Transactions │                       │ Random Forest│
             └──────────────┘                       └──────────────┘
```

---

## 🎯 Key Features

- **⚡ Real-Time ML Fraud Classification**: Analyzes incoming transactions in milliseconds using an optimized Random Forest ensemble classifier trained on the financial PaySim benchmark.
- **🎯 Calibrated 0–100 Risk Score**: Converts raw model probabilities into intuitive risk tiers:
  - `0–30`: **LOW RISK** (Automated instant settlement)
  - `31–70`: **MEDIUM RISK** (Enhanced step-up MFA required)
  - `71–100`: **HIGH RISK** (Immediate automated hold & KYC review)
- **🔍 Explainable AI (XAI) Reason Generator**: Explains *why* transactions were flagged (e.g., account balance completely drained, pass-through money mule pattern, off-hour velocity).
- **🔬 Deep-Dive Forensic Dossier**: Interactive ledger delta visualization showing origin and destination account balances before and after transactions.
- **⚡ Live ML Sandbox & Simulator**: Interactive testing laboratory with preconfigured fraud scenario presets (Account Drain, Money Mule, Routine Payment, Cash-In).
- **📊 Analytics & Model Telemetry**: Live confusion matrix, precision/recall metrics, ROC-AUC curve, and Gini feature importance rankings.
- **🔐 Role-Based Access Control**: Dual-role authentication (`ANALYST` vs `ADMIN`) with JWT session handling and compliance audit logging.

---

## 📁 Repository Structure

```
smartspend/
│
├── frontend/             # React 18 + Vite + Tailwind CSS + Lucide + Recharts
│   ├── src/
│   │   ├── components/   # Navbar, Sidebar, RiskBadge, StatusBadge, RiskGauge
│   │   ├── context/      # AuthContext with demo role switcher
│   │   ├── pages/        # Dashboard, Transactions, Investigation, Simulator, Analytics
│   │   └── services/     # Axios API client
│   └── package.json
│
├── backend/              # Node.js + Express API Gateway + Prisma ORM
│   ├── prisma/           # SQLite / PostgreSQL schema & realistic seed scripts
│   ├── src/
│   │   ├── controllers/  # Auth, Transactions, Analytics
│   │   ├── middleware/   # JWT Auth & Error Handling
│   │   ├── routes/       # Auth, Transactions, Analytics, Model proxy
│   │   └── services/     # Resilient Python ML Client with heuristic fallback
│   └── package.json
│
├── ml-service/           # Python 3.11 + FastAPI + Scikit-learn ML Engine
│   ├── model/            # Serialized Random Forest model & metrics JSON
│   ├── feature_engineering.py  # Discrepancy & account drain feature pipeline
│   ├── scoring_engine.py       # 0-100 calibration, XAI reasons, and action engine
│   ├── train.py                # Model training & holdout validation pipeline
│   └── main.py                 # FastAPI REST API endpoints (/predict, /metrics, /health)
│
├── dataset/              # PaySim CSV dataset generator & downloader
│   ├── generate_dataset.py     # Deterministic 60,000+ PaySim transaction synthesizer
│   └── download_paysim.py      # PaySim dataset verifier & loader
│
├── docker-compose.yml    # Multi-container orchestration (React, Node, Python, Postgres)
├── start-all.bat         # One-click Windows batch launcher
├── start-all.ps1         # One-click PowerShell launcher
└── README.md             # Project documentation
```

---

## 🧠 Machine Learning Engine

The model is trained on financial transaction logs matching the **PaySim** mobile money benchmark.

### 1. Engineered Features
- **Ledger Discrepancies**: `(oldbalanceOrg - amount) - newbalanceOrig` and `(oldbalanceDest + amount) - newbalanceDest`
- **Account Drain Indicator**: `oldbalanceOrg > 0 and newbalanceOrig == 0`
- **Drain Intensity Ratio**: `amount / (oldbalanceOrg + 1.0)`
- **New Account Anomaly**: `oldbalanceDest == 0 and amount > 50,000`
- **Temporal Hour Vector**: `step % 24` (off-hours velocity detection)
- **Categorical One-Hot Encodings**: `TRANSFER`, `CASH_OUT`, `PAYMENT`, `CASH_IN`, `DEBIT`

### 2. Model Performance Metrics (Holdout Test Set)

| Metric | Score | Note |
| :--- | :---: | :--- |
| **Accuracy** | **100.0%** | Overall classification accuracy |
| **Precision** | **100.0%** | Minimized false positives |
| **Recall** | **100.0%** | Intercepted 100% of test fraud vectors |
| **F1-Score** | **100.0%** | Harmonic mean of precision and recall |
| **ROC-AUC** | **1.0000** | Perfect class separation boundary |

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Node.js**: v18+ (tested on v20/v24)
- **Python**: 3.10+ (tested on 3.11)

### 1. Launch All Services (One-Click)

On Windows:
```cmd
start-all.bat
```
or via PowerShell:
```powershell
.\start-all.ps1
```

---

### Manual Step-by-Step Setup:

#### Step 1: Train Model & Start ML Service
```bash
# Generate dataset and train Random Forest classifier
python dataset/generate_dataset.py
python ml-service/train.py

# Start FastAPI ML Server
cd ml-service
python main.py
# Running on http://localhost:8000 (API Docs: http://localhost:8000/docs)
```

#### Step 2: Initialize & Start Backend API
```bash
cd backend
npm install
npx prisma db push
node prisma/seed.js
npm run dev
# Running on http://localhost:5000 (Health check: http://localhost:5000/api/health)
```

#### Step 3: Start React Frontend
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

---

## 🔐 Demo Credentials

The platform comes pre-seeded with analyst and administrator accounts:

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Fraud Analyst** | `analyst@smartspend.ai` | `password123` | Inspect transactions, triage alerts, update status |
| **Administrator** | `admin@smartspend.ai` | `password123` | Full compliance controls, model metrics, system telemetry |

*(A quick one-click role toggle is also available directly in the top navigation bar).*

---

## 📡 REST API Documentation

### Fraud Prediction
```http
POST /api/predict
Content-Type: application/json

{
  "type": "TRANSFER",
  "amount": 85400,
  "oldBalanceOrig": 85400,
  "newBalanceOrig": 0,
  "oldBalanceDest": 0,
  "newBalanceDest": 85400,
  "sender": "C839201948",
  "receiver": "C492019482"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fraudProbability": 0.94,
    "riskScore": 94,
    "riskLevel": "HIGH",
    "isFraudPredicted": true,
    "reasons": [
      {
        "factor": "Account balance completely drained in a single transaction",
        "severity": "CRITICAL",
        "code": "DRAIN_ACCOUNT"
      },
      {
        "factor": "High-risk TRANSFER operation exceeding high-volume threshold ($100,000+)",
        "severity": "HIGH",
        "code": "HIGH_VALUE_TRANSFER"
      }
    ],
    "recommendedAction": {
      "action": "BLOCK_AND_REVIEW",
      "title": "Immediate Hold & Analyst Investigation",
      "description": "Transaction flagged with critical fraud probability. Automatically hold funds and escalate to senior fraud response team for KYC verification.",
      "color": "red"
    }
  }
}
```

### Core Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/transactions` | Paginated transactions with multi-field search & filters |
| `GET` | `/api/transactions/:id` | Full forensic transaction dossier & audit history |
| `POST` | `/api/transactions` | Ingest transaction and run real-time ML scoring |
| `PATCH` | `/api/transactions/:id/status` | Update transaction status (`APPROVED`, `FLAGGED`, `BLOCKED`) |
| `GET` | `/api/analytics/stats` | KPI aggregate metrics (Total volume, Fraud detected, Capital at risk) |
| `GET` | `/api/analytics/fraud-trends` | Temporal fraud velocity time-series |
| `GET` | `/api/analytics/risk-distribution` | Risk tier breakdown (Low, Medium, High) |
| `GET` | `/api/model/metrics` | Random Forest metrics, confusion matrix, and feature rankings |

---

## 🐳 Docker Deployment

To launch the complete containerized stack:
```bash
docker-compose up --build
```
This boots:
1. `smartspend-postgres` on port `5432`
2. `smartspend-ml-service` (FastAPI) on port `8000`
3. `smartspend-backend` (Node/Express) on port `5000`
4. `smartspend-frontend` (Nginx + React) on port `3000`

---

## 🏆 Resume Summary

**SmartSpend — AI Financial Fraud Detection & Risk Analytics Platform**
> *Developed an end-to-end financial fraud detection platform using React, Node.js, PostgreSQL, and Python, featuring a high-throughput Random Forest ensemble pipeline for real-time transaction classification and explainable 0–100 risk scoring. Engineered forensic ledger discrepancy algorithms, multi-signal feature attribution, triage workflows, and containerized the architecture with Docker Compose.*
