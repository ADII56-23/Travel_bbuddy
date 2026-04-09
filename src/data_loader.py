import pandas as pd
import os

def load_data(path):
    """
    Load travel packages data from a CSV file.
    
    Args:
        path (str): Path to the CSV file.
        
    Returns:
        pd.DataFrame: Loaded DataFrame.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Data file not found at {path}")
    return pd.read_csv(path)
