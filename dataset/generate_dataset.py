"""
PaySim Financial Dataset Generator — Realistic Real-World Statistical Distribution.
Models genuine financial transactions with natural statistical overlap, subtle fraud patterns, 
and legitimate edge cases (e.g., normal full account drains, new recipient accounts).
"""

import csv
import random
import os

def generate_paysim_dataset(output_path="dataset/PS_20174392719_1491204439457_log.csv", num_records=60000):
    print(f"Generating {num_records} realistic financial transactions...")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    random.seed(42)
    
    txn_types = ["PAYMENT", "TRANSFER", "CASH_OUT", "CASH_IN", "DEBIT"]
    type_weights = [0.35, 0.25, 0.22, 0.15, 0.03]
    
    headers = [
        "step", "type", "amount", "nameOrig", "oldbalanceOrg", "newbalanceOrig",
        "nameDest", "oldbalanceDest", "newbalanceDest", "isFraud", "isFlaggedFraud"
    ]
    
    records = []
    fraud_count = 0
    # ~2.2% realistic fraud prevalence
    target_fraud_indices = set(random.sample(range(num_records), int(num_records * 0.022)))
    
    for i in range(num_records):
        step = random.randint(1, 744)
        is_target_fraud = i in target_fraud_indices
        orig_id = f"C{random.randint(100000000, 999999999)}"
        
        if is_target_fraud:
            is_fraud = 1
            fraud_count += 1
            dest_id = f"C{random.randint(100000000, 999999999)}"
            
            # Fraud type distribution (mostly TRANSFER and CASH_OUT, but occasionally DEBIT)
            txn_type = random.choices(["TRANSFER", "CASH_OUT", "DEBIT"], weights=[0.60, 0.35, 0.05])[0]
            
            scenario = random.choices(
                ["full_drain", "partial_stealth", "micro_probe", "mule_funnel"],
                weights=[0.40, 0.35, 0.15, 0.10]
            )[0]
            
            if scenario == "full_drain":
                # Takes 92% to 100% of balance
                oldbalanceOrg = round(random.uniform(40000, 2500000), 2)
                drain_ratio = random.uniform(0.92, 1.0)
                amount = round(oldbalanceOrg * drain_ratio, 2)
                newbalanceOrig = round(max(0.0, oldbalanceOrg - amount), 2)
                oldbalanceDest = round(random.choice([0.0, random.uniform(0, 30000)]), 2)
                newbalanceDest = round(oldbalanceDest + amount, 2)
                
            elif scenario == "partial_stealth":
                # Sneaky fraud: steals 25% to 70% so user does not get zero-balance alert
                oldbalanceOrg = round(random.uniform(60000, 1500000), 2)
                steal_ratio = random.uniform(0.25, 0.70)
                amount = round(oldbalanceOrg * steal_ratio, 2)
                newbalanceOrig = round(oldbalanceOrg - amount, 2)
                oldbalanceDest = round(random.choice([0.0, random.uniform(1000, 50000)]), 2)
                newbalanceDest = round(oldbalanceDest + amount, 2)
                
            elif scenario == "micro_probe":
                # Micro fraud: test charges that mimic ordinary payments
                oldbalanceOrg = round(random.uniform(15000, 300000), 2)
                amount = round(random.uniform(1200, 18000), 2)
                newbalanceOrig = round(max(0.0, oldbalanceOrg - amount), 2)
                oldbalanceDest = round(random.uniform(0, 25000), 2)
                newbalanceDest = round(oldbalanceDest + amount, 2)
                
            else: # mule_funnel
                oldbalanceOrg = round(random.uniform(80000, 800000), 2)
                amount = round(random.uniform(50000, oldbalanceOrg), 2)
                newbalanceOrig = round(max(0.0, oldbalanceOrg - amount), 2)
                oldbalanceDest = 0.0
                newbalanceDest = 0.0 # Rapid withdrawal
                
            is_flagged = 1 if (amount > 200000 and txn_type == "TRANSFER") else 0
            
        else:
            # Genuine legitimate transaction
            is_fraud = 0
            is_flagged = 0
            txn_type = random.choices(txn_types, weights=type_weights, k=1)[0]
            
            if txn_type == "PAYMENT":
                dest_id = f"M{random.randint(100000000, 999999999)}"
                amount = round(min(random.expovariate(1/2500) + 15, 65000), 2)
                oldbalanceOrg = round(random.uniform(amount * 0.8, amount * 12 + 5000), 2)
                newbalanceOrig = round(max(0.0, oldbalanceOrg - amount), 2)
                oldbalanceDest = 0.0
                newbalanceDest = 0.0
                
            elif txn_type == "CASH_OUT":
                dest_id = f"C{random.randint(100000000, 999999999)}"
                amount = round(random.expovariate(1/30000) + 100, 2)
                # Realistic edge case: 4% of legitimate people withdraw ALL remaining cash
                legit_drain = random.random() < 0.04
                if legit_drain:
                    oldbalanceOrg = amount
                    newbalanceOrig = 0.0
                else:
                    oldbalanceOrg = round(random.uniform(amount, amount * 3.5 + 20000), 2)
                    newbalanceOrig = round(oldbalanceOrg - amount, 2)
                oldbalanceDest = round(random.choice([0.0, random.uniform(10000, 300000)]), 2)
                newbalanceDest = round(oldbalanceDest + amount, 2)
                
            elif txn_type == "TRANSFER":
                dest_id = f"C{random.randint(100000000, 999999999)}"
                amount = round(random.expovariate(1/45000) + 500, 2)
                # Realistic edge cases:
                # 1. 6% of legitimate users transfer their entire balance (college fee, car, rent)
                # 2. 12% of legitimate users send money to a brand new account with ₹0 balance
                legit_drain = random.random() < 0.06
                dest_is_new = random.random() < 0.12
                
                if legit_drain:
                    oldbalanceOrg = amount
                    newbalanceOrig = 0.0
                else:
                    oldbalanceOrg = round(random.uniform(amount * 1.1, amount * 4 + 30000), 2)
                    newbalanceOrig = round(oldbalanceOrg - amount, 2)
                    
                oldbalanceDest = 0.0 if dest_is_new else round(random.uniform(5000, 250000), 2)
                newbalanceDest = round(oldbalanceDest + amount, 2)
                
            elif txn_type == "CASH_IN":
                dest_id = f"C{random.randint(100000000, 999999999)}"
                amount = round(random.expovariate(1/30000) + 50, 2)
                oldbalanceOrg = round(random.uniform(1000, 250000), 2)
                newbalanceOrig = round(oldbalanceOrg + amount, 2)
                oldbalanceDest = round(random.uniform(5000, 500000), 2)
                newbalanceDest = round(max(0.0, oldbalanceDest - amount), 2)
                
            else: # DEBIT
                dest_id = f"C{random.randint(100000000, 999999999)}"
                amount = round(random.expovariate(1/6000) + 25, 2)
                oldbalanceOrg = round(random.uniform(amount, amount * 5 + 15000), 2)
                newbalanceOrig = round(oldbalanceOrg - amount, 2)
                oldbalanceDest = round(random.uniform(2000, 50000), 2)
                newbalanceDest = round(oldbalanceDest + amount, 2)

        records.append({
            "step": step,
            "type": txn_type,
            "amount": amount,
            "nameOrig": orig_id,
            "oldbalanceOrg": oldbalanceOrg,
            "newbalanceOrig": newbalanceOrig,
            "nameDest": dest_id,
            "oldbalanceDest": oldbalanceDest,
            "newbalanceDest": newbalanceDest,
            "isFraud": is_fraud,
            "isFlaggedFraud": is_flagged
        })
        
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(records)
        
    print(f"Generated {len(records)} realistic records ({fraud_count} fraud instances: {(fraud_count/len(records))*100:.2f}%) to {output_path}")

if __name__ == "__main__":
    generate_paysim_dataset()
