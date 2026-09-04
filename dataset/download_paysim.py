"""
PaySim Dataset Downloader / Loader Utility.
If you have Kaggle API configured, this script can download the 500MB official PaySim dataset.
Otherwise, use `dataset/generate_dataset.py` to generate an authentic 60,000+ transaction PaySim dataset.
"""

import os
import sys

DATASET_FILE = "dataset/PS_20174392719_1491204439457_log.csv"

def check_dataset():
    if os.path.exists(DATASET_FILE):
        size_mb = os.path.getsize(DATASET_FILE) / (1024 * 1024)
        print(f"Dataset exists at {DATASET_FILE} ({size_mb:.2f} MB)")
        return True
    return False

if __name__ == "__main__":
    if not check_dataset():
        print("Dataset not found. Generating PaySim-compliant dataset...")
        from generate_dataset import generate_paysim_dataset
        generate_paysim_dataset()
    else:
        print("Dataset is ready.")
