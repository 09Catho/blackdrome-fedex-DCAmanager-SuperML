#!/usr/bin/env python3
"""
Demo script to generate/update ML model weights for DCA recovery prediction.
This is optional - the system works with fixed weights in model.json.

In a production scenario, you would:
1. Export historical case data with outcomes
2. Train a logistic regression model
3. Export coefficients to model.json
"""

import json
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
import warnings
warnings.filterwarnings('ignore')

# Feature names (must match what Edge Function expects)
FEATURES = ['ageing', 'log_amount', 'attempts', 'staleness', 'dispute', 'ptp_active']

def generate_synthetic_data(n_samples=5000):
    """
    Generate realistic synthetic debt collection cases for training.
    
    Features match EXACTLY the production Edge Function calculations:
    - ageing: normalized (0-1), ageing_days/120, capped at 1
    - log_amount: ln(amount+1)/10
    - attempts: normalized (0-1), attempts_count/10, capped at 1  
    - staleness: normalized (0-1), days_since_update/14, capped at 1
    - dispute: binary (1 if status=DISPUTE or dispute activity exists)
    - ptp_active: binary (1 if active payment promise exists)
    
    Business logic incorporated:
    - Newer cases have higher recovery rates
    - Higher contact attempts correlate with recovery
    - Active PTPs significantly increase recovery probability
    - Disputes reduce recovery chances
    - Stale cases (no recent updates) are harder to recover
    - Higher amounts slightly increase recovery (more effort allocated)
    """
    np.random.seed(42)
    print(f"Generating {n_samples} synthetic debt collection cases...")
    
    # Generate RAW values first (to match production)
    # Ageing in days (0-180 days, skewed towards newer)
    ageing_days_raw = np.random.beta(2, 5, n_samples) * 180
    ageing = np.minimum(ageing_days_raw / 120, 1.0)  # normalize exactly as in production
    
    # Amount (₹10k to ₹5M)
    amount_raw = np.random.lognormal(11.5, 0.8, n_samples)
    amount_raw = np.clip(amount_raw, 10000, 5000000)
    log_amount = np.log(1 + amount_raw) / 10  # EXACT formula from production
    
    # Contact attempts in last 30 days (0-15)
    # More attempts for newer cases
    attempts_raw = np.random.poisson(4 * (1 - ageing**0.5), n_samples)
    attempts_raw = np.clip(attempts_raw, 0, 15)
    attempts = np.minimum(attempts_raw / 10, 1.0)  # normalize exactly as in production
    
    # Days since last update (0-30 days, correlated with ageing)
    staleness_days_raw = ageing_days_raw * 0.3 + np.random.exponential(5, n_samples)
    staleness_days_raw = np.clip(staleness_days_raw, 0, 30)
    staleness = np.minimum(staleness_days_raw / 14, 1.0)  # normalize exactly as in production
    
    # Dispute: binary (20% of cases have disputes)
    # More likely in older cases
    dispute_prob = 0.1 + 0.3 * ageing
    dispute = np.random.binomial(1, dispute_prob, n_samples)
    
    # PTP Active: binary (25% have active payment promises)
    # More likely when there are contact attempts and no dispute
    ptp_prob = 0.15 + 0.1 * attempts - 0.2 * dispute
    ptp_prob = np.clip(ptp_prob, 0, 0.6)
    ptp_active = np.random.binomial(1, ptp_prob, n_samples)
    
    X = np.column_stack([ageing, log_amount, attempts, staleness, dispute, ptp_active])
    
    # Generate recovery labels with realistic business logic
    # Base probability starts at 0.4 (40% base recovery rate)
    logit = (
        -0.5  # intercept (base log-odds)
        - 3.0 * ageing  # strong negative: older cases harder to recover
        + 0.15 * log_amount  # slight positive: higher amounts get more effort
        + 0.25 * attempts  # positive: engagement helps
        - 1.5 * staleness  # negative: stale cases are harder
        - 1.8 * dispute  # strong negative: disputes reduce recovery
        + 2.5 * ptp_active  # strong positive: PTPs are good indicators
    )
    
    # Add realistic noise
    logit += np.random.normal(0, 0.8, n_samples)
    
    # Convert to probability via sigmoid
    prob = 1 / (1 + np.exp(-logit))
    
    # Generate binary outcomes
    y = (np.random.uniform(0, 1, n_samples) < prob).astype(int)
    
    print(f"[OK] Generated {n_samples} cases")
    print(f"  Recovery rate: {y.mean():.1%}")
    print(f"  Avg ageing (norm): {ageing.mean():.2f}")
    print(f"  Avg contact attempts: {attempts.mean():.1f}")
    print(f"  Cases with PTP: {ptp_active.sum()} ({100*ptp_active.mean():.1f}%)")
    print(f"  Cases with disputes: {dispute.sum()} ({100*dispute.mean():.1f}%)")
    
    return X, y

def train_model():
    """Train logistic regression model with validation"""
    print("\n" + "="*60)
    print("FedEx DCA Platform - ML Model Training")
    print("="*60 + "\n")
    
    # Generate data
    X, y = generate_synthetic_data(n_samples=5000)
    
    # Split into train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\nTraining set: {len(X_train)} cases")
    print(f"Test set: {len(X_test)} cases\n")
    
    # Train model
    print("Training logistic regression model...")
    model = LogisticRegression(
        random_state=42,
        max_iter=2000,
        solver='lbfgs',
        C=1.0
    )
    model.fit(X_train, y_train)
    print("[OK] Model trained\n")
    
    # Evaluate
    print("="*60)
    print("MODEL PERFORMANCE")
    print("="*60)
    
    train_acc = model.score(X_train, y_train)
    test_acc = model.score(X_test, y_test)
    
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    y_proba_train = model.predict_proba(X_train)[:, 1]
    y_proba_test = model.predict_proba(X_test)[:, 1]
    
    train_auc = roc_auc_score(y_train, y_proba_train)
    test_auc = roc_auc_score(y_test, y_proba_test)
    
    print(f"\nAccuracy:")
    print(f"  Training: {train_acc:.1%}")
    print(f"  Test:     {test_acc:.1%}")
    print(f"\nROC-AUC Score:")
    print(f"  Training: {train_auc:.3f}")
    print(f"  Test:     {test_auc:.3f}")
    
    print(f"\nConfusion Matrix (Test Set):")
    cm = confusion_matrix(y_test, y_pred_test)
    print(f"  True Negatives:  {cm[0,0]:4d}  |  False Positives: {cm[0,1]:4d}")
    print(f"  False Negatives: {cm[1,0]:4d}  |  True Positives:  {cm[1,1]:4d}")
    
    print(f"\nClassification Report (Test Set):")
    print(classification_report(y_test, y_pred_test, target_names=['Not Recovered', 'Recovered']))
    
    # Brier Score (calibration metric)
    from sklearn.metrics import brier_score_loss
    brier_train = brier_score_loss(y_train, y_proba_train)
    brier_test = brier_score_loss(y_test, y_proba_test)
    
    print(f"\nBrier Score (Probability Calibration):")
    print(f"  Training: {brier_train:.4f}  (lower is better, 0 = perfect)")
    print(f"  Test:     {brier_test:.4f}")
    print(f"  Note: Measures how well predicted probabilities match actual outcomes")
    
    # Feature importance
    print("="*60)
    print("FEATURE IMPORTANCE")
    print("="*60 + "\n")
    
    coefficients = model.coef_[0]
    feature_importance = list(zip(FEATURES, coefficients))
    feature_importance.sort(key=lambda x: abs(x[1]), reverse=True)
    
    for feature, coef in feature_importance:
        direction = "[+] increases" if coef > 0 else "[-] decreases"
        print(f"  {feature:15s}: {coef:+.3f}  {direction} recovery")
    
    print(f"\n  Intercept (bias): {model.intercept_[0]:.3f}")
    
    # Save to model.json
    print("\n" + "="*60)
    print("SAVING MODEL")
    print("="*60 + "\n")
    
    model_data = {
        "version": "1.0",
        "trained_on": "2024-01-10",
        "n_samples": len(X),
        "test_accuracy": float(test_acc),
        "test_auc": float(test_auc),
        "bias": float(model.intercept_[0]),
        "weights": {
            feature: float(weight)
            for feature, weight in zip(FEATURES, model.coef_[0])
        },
        "reason_mappings": {
            "ageing": [
                "Low ageing increases recovery",
                "Medium ageing moderately affects recovery",
                "High ageing reduces recovery significantly"
            ],
            "log_amount": [
                "Low amount case",
                "Medium amount case",
                "High amount increases priority"
            ],
            "attempts": [
                "No recent contact attempts",
                "Some contact attempts made",
                "Active engagement with customer"
            ],
            "staleness": [
                "Recently updated case",
                "Moderate staleness",
                "Stale case needs immediate attention"
            ],
            "dispute": [
                "No active dispute",
                "Active dispute reduces recovery",
                "Active dispute reduces recovery"
            ],
            "ptp_active": [
                "No payment promise",
                "Active PTP significantly increases recovery",
                "Active PTP significantly increases recovery"
            ]
        }
    }
    
    with open('model.json', 'w') as f:
        json.dump(model_data, f, indent=2)
    
    print("[OK] Model saved to model.json")
    print(f"  - Weights: {len(FEATURES)} features")
    print(f"  - Bias: {model.intercept_[0]:.3f}")
    print(f"  - Test Accuracy: {test_acc:.1%}")
    print(f"  - Test AUC: {test_auc:.3f}")
    
    print("\n" + "="*60)
    print("Training Complete! SUCCESS!")
    print("="*60)
    print("\nThe model is ready to use in your Supabase Edge Functions.")
    print("Simply deploy the updated model.json to production.\n")

if __name__ == '__main__':
    try:
        train_model()
    except Exception as e:
        print(f"\n[ERROR] Error during training: {e}")
        import traceback
        traceback.print_exc()
