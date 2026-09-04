import os
import csv
import json
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)

from feature_engineering import engineer_features_from_records, FEATURE_COLUMNS

def load_csv_records(file_path):
    records = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)
    return records

def train_model(dataset_path="dataset/PS_20174392719_1491204439457_log.csv", model_dir="ml-service/model"):
    print("=" * 60)
    print("SmartSpend ML Training Pipeline - Random Forest Classifier")
    print("=" * 60)
    
    # 1. Check if dataset exists, if not generate it
    if not os.path.exists(dataset_path):
        print(f"Dataset not found at {dataset_path}. Generating dataset...")
        import sys
        sys.path.append("dataset")
        from generate_dataset import generate_paysim_dataset
        generate_paysim_dataset(output_path=dataset_path, num_records=60000)

    print(f"Loading dataset from {dataset_path}...")
    records = load_csv_records(dataset_path)
    total_records = len(records)
    fraud_count = sum(1 for r in records if int(r.get("isFraud", 0)) == 1)
    print(f"Loaded {total_records} records. Fraud count: {fraud_count} ({(fraud_count/total_records)*100:.2f}%)")

    # 2. Feature Engineering
    print("\nExecuting feature engineering pipeline...")
    X, y = engineer_features_from_records(records)
    print(f"Engineered feature matrix shape: {X.shape}, labels shape: {y.shape}")
    print(f"Features: {FEATURE_COLUMNS}")

    # 3. Train-Test Split (80/20 stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train split: {len(X_train)} samples, Test split: {len(X_test)} samples")

    # 4. Train Random Forest Classifier with class balancing
    print("\nTraining RandomForestClassifier (100 estimators, max_depth=12)...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42
    )
    clf.fit(X_train, y_train)

    # 5. Evaluate
    print("\nEvaluating model performance on test set...")
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)

    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print("\nConfusion Matrix:")
    print(f"TN: {cm[0][0]}, FP: {cm[0][1]}")
    print(f"FN: {cm[1][0]}, TP: {cm[1][1]}")

    # Feature Importance
    importances = clf.feature_importances_
    feat_imp = sorted(zip(FEATURE_COLUMNS, importances), key=lambda x: x[1], reverse=True)
    print("\nTop 7 Feature Importances:")
    for feat, imp in feat_imp[:7]:
        print(f"  {feat:30s}: {imp:.4f}")

    # 6. Save Model & Metrics
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "fraud_detector.joblib")
    metrics_path = os.path.join(model_dir, "metrics.json")

    joblib.dump(clf, model_path)
    print(f"\nModel saved successfully to {model_path}")

    metrics_payload = {
        "model_name": "RandomForestClassifier",
        "parameters": {
            "n_estimators": 100,
            "max_depth": 12,
            "class_weight": "balanced"
        },
        "metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc_auc), 4),
            "confusion_matrix": {
                "tn": int(cm[0][0]),
                "fp": int(cm[0][1]),
                "fn": int(cm[1][0]),
                "tp": int(cm[1][1])
            }
        },
        "feature_importances": [
            {"feature": feat, "importance": round(float(imp), 4)}
            for feat, imp in feat_imp
        ],
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "features": FEATURE_COLUMNS
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    print(f"Metrics saved to {metrics_path}")
    print("=" * 60)
    return metrics_payload

if __name__ == "__main__":
    train_model()
