# SmartSpend — Presentation Slide Deck
**TSM-TECHNOVA 2026 Presentation Submission**  
**Track:** Fintech, Cybersecurity & AI  
**Presenter:** Sidhesh

---

### Slide 1: Title Slide
* **Title:** SmartSpend
* **Subtitle:** AI-Powered Financial Fraud Detection & Risk Analytics Platform
* **Event:** TSM-TECHNOVA 2026
* **Presenter:** Sidhesh
* **Status:** Fully Functional Working Prototype

---

### Slide 2: The Challenge — The Real-Time Digital Payment Fraud Crisis
* **Sub-Second Settlement Velocity:** Modern instant payment rails (UPI, IMPS) clear transactions in <200ms. Once money is transferred, it leaves the bank perimeter before traditional batch fraud checks can run.
* **Organized Money Mule Rings:** Cybercriminals don't hold stolen funds in one account. They rapidly split and bounce money through 4–6 accounts in circles before ATM cashouts.
* **Legacy Failures:** Static threshold rules trigger false alarms on innocent users, while black-box AI tools fail to explain why transactions were flagged.

---

### Slide 3: The Solution — SmartSpend Pre-Settlement Interception
* **Pre-Settlement Holding Gate:** Sits directly between payment gateways and bank ledgers, evaluating transactions before funds leave.
* **Dual-Stage Intelligence:** Combines individual behavioral classification with global network graph traversal.
* **Dynamic Decision Matrix:**
  * **0–30 (Low Risk):** Instant automated settlement.
  * **31–70 (Medium Risk):** Step-up OTP/Biometric verification.
  * **71–100 (High Risk):** Pre-settlement hold and fraud analyst escalation.

---

### Slide 4: Data Science & AI Model Performance
* **Model:** Random Forest Ensemble Classifier (100 trees, balanced weights).
* **Validation:** Tested on 12,000 unseen test transactions with realistic statistical variance:
  * **Accuracy:** 98.74%
  * **Fraud Recall:** 90.91% (Captures 91 out of 100 fraud attempts)
  * **Precision:** 65.40% (Realistic false positives on legitimate full-balance transfers)
  * **ROC-AUC:** 0.9973
  * **Confusion Matrix:** TN: 11,609 | FP: 127 | FN: 24 | TP: 240

---

### Slide 5: Proprietary Innovation — Fraud Ring Network Tracker
* **The Problem It Solves:** Individual transfers look harmless in isolation. Scammers exploit this by moving funds in circles.
* **In-Memory Graph Traversal:** Pruned temporal graph algorithm finds closed multi-hop cycles ($A \rightarrow B \rightarrow C \rightarrow D \rightarrow A$) in <15 milliseconds.
* **Interactive Canvas:** Visual SVG network map with one-click multi-account freezing.

---

### Slide 6: Operational Governance — Role-Based Banking Workflows
* **Sidhesh (Analyst):**
  * Frontline investigator role.
  * Reviews alerts, verifies customer ledger history.
  * Can **Approve** legitimate transactions or **Request OTP/MFA**.
  * 🔒 *Cannot freeze accounts (governance safeguard).*
* **Sidhesh (Manager):**
  * Executive risk authority.
  * 🔴 **Authorized to permanently Block & Freeze accounts.**
  * 🔴 **Authorized to freeze entire multi-party fraud rings.**
  * Exports compliance audit logs for central bank reporting.

---

### Slide 7: Economic Value, Social Impact & UN SDGs
* **Economic Impact:** Stops irreversible fraud loss before settlement; cuts analyst triage time by 80%; minimizes false positive declines for merchants.
* **Social Impact:** Protects vulnerable consumers and senior citizens from digital fraud; strengthens public trust in cashless infrastructure.
* **UN SDGs:**
  * **SDG 8:** Decent Work & Economic Growth (8.10)
  * **SDG 9:** Industry, Innovation & Infrastructure (9.1)
  * **SDG 16:** Peace, Justice & Strong Institutions (16.4)

---

### Slide 8: Conclusion & Live Working Prototype
* **System Status:** Live & operational on `http://localhost:3000`.
* **Stack:** React, Node.js/Express, Python FastAPI, Scikit-learn, SQLite/Prisma.
* **Ready for Commercial Pilot & Incubation.**
