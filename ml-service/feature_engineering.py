import numpy as np

TRANSACTION_TYPES = ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"]

FEATURE_COLUMNS = [
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "hour_of_day",
    "orig_balance_diff",
    "dest_balance_diff",
    "amount_to_oldbalance_orig",
    "orig_balance_cleared",
    "dest_balance_zero_initial",
    "dest_is_merchant",
    "type_CASH_IN",
    "type_CASH_OUT",
    "type_DEBIT",
    "type_PAYMENT",
    "type_TRANSFER"
]

def extract_features_from_dict(row: dict) -> list:
    """
    Extracts numerical feature vector from a single transaction dictionary.
    """
    amount = float(row.get("amount", 0.0))
    oldbalanceOrg = float(row.get("oldbalanceOrg", row.get("old_balance", 0.0)))
    newbalanceOrig = float(row.get("newbalanceOrig", row.get("new_balance", 0.0)))
    oldbalanceDest = float(row.get("oldbalanceDest", 0.0))
    newbalanceDest = float(row.get("newbalanceDest", 0.0))
    
    step = int(row.get("step", 12))
    hour_of_day = step % 24
    
    orig_balance_diff = (oldbalanceOrg - amount) - newbalanceOrig
    dest_balance_diff = (oldbalanceDest + amount) - newbalanceDest
    amount_to_oldbalance_orig = amount / (oldbalanceOrg + 1.0)
    orig_balance_cleared = 1.0 if (oldbalanceOrg > 0 and newbalanceOrig == 0.0) else 0.0
    dest_balance_zero_initial = 1.0 if (oldbalanceDest == 0.0 and amount > 0) else 0.0
    
    nameDest = str(row.get("nameDest", row.get("receiver", "")))
    dest_is_merchant = 1.0 if nameDest.startswith("M") else 0.0
    
    txn_type = str(row.get("type", "TRANSFER")).upper()
    type_cash_in = 1.0 if txn_type == "CASH_IN" else 0.0
    type_cash_out = 1.0 if txn_type == "CASH_OUT" else 0.0
    type_debit = 1.0 if txn_type == "DEBIT" else 0.0
    type_payment = 1.0 if txn_type == "PAYMENT" else 0.0
    type_transfer = 1.0 if txn_type == "TRANSFER" else 0.0
    
    return [
        amount,
        oldbalanceOrg,
        newbalanceOrig,
        oldbalanceDest,
        newbalanceDest,
        float(hour_of_day),
        orig_balance_diff,
        dest_balance_diff,
        amount_to_oldbalance_orig,
        orig_balance_cleared,
        dest_balance_zero_initial,
        dest_is_merchant,
        type_cash_in,
        type_cash_out,
        type_debit,
        type_payment,
        type_transfer
    ]

def extract_single_features(data: dict) -> np.ndarray:
    """
    Returns a (1, N) 2D numpy array of engineered features for inference.
    """
    vector = extract_features_from_dict(data)
    return np.array([vector], dtype=np.float64)

def engineer_features_from_records(records: list) -> tuple:
    """
    Extracts X (feature matrix) and y (labels) from list of record dicts.
    """
    X_list = []
    y_list = []
    
    for r in records:
        X_list.append(extract_features_from_dict(r))
        if "isFraud" in r:
            y_list.append(int(r["isFraud"]))
            
    X = np.array(X_list, dtype=np.float64)
    y = np.array(y_list, dtype=np.int64) if y_list else None
    return X, y
