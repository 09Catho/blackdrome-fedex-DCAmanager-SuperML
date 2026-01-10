# ML Model Training Guide

## Overview

The FedEx DCA Platform uses a **logistic regression model** to predict debt recovery probability and prioritize cases. This guide explains how to train the model using synthetic data.

## Quick Start

```bash
cd ml
pip install -r requirements.txt
python train_demo_model.py
```

## What Gets Generated

### Synthetic Data (5,000 cases)

The training script generates realistic debt collection scenarios with:

**Features:**
1. **Ageing** (0-1 normalized): Days overdue, skewed towards newer cases
2. **Log Amount** (9-16): Log-scaled debt amount (₹10K - ₹5M)
3. **Contact Attempts** (0-15): Number of contact attempts in last 30 days
4. **Staleness** (0-1): Days since last case update
5. **Dispute** (binary): Whether case has active dispute
6. **PTP Active** (binary): Whether there's an active payment promise

**Labels:**
- Binary outcome: Recovered (1) or Not Recovered (0)
- ~50% recovery rate (realistic for debt collection)

### Business Logic Incorporated

The synthetic data reflects real-world debt collection dynamics:

- **Newer cases** → Higher recovery rates
- **More contact attempts** → Better engagement → Higher recovery
- **Active PTPs** → Strong positive signal (customers committed)
- **Disputes** → Reduce recovery chances significantly
- **Stale cases** → Harder to recover (customer disengaged)
- **Higher amounts** → Slightly better recovery (more effort invested)

## Model Architecture

**Algorithm:** Logistic Regression
- Simple, interpretable, explainable
- Fast inference (critical for real-time scoring)
- Probability outputs for risk assessment

**Training:**
- 5,000 samples (80/20 train/test split)
- Stratified split to maintain class balance
- L2 regularization (C=1.0)
- LBFGS solver (2000 max iterations)

**Evaluation Metrics:**
- **Accuracy**: ~84% (test set)
- **ROC-AUC**: ~0.91 (excellent discrimination)
- **Confusion Matrix**: Balanced performance
- **Precision/Recall**: For both classes

## Training Output

The script produces:

### 1. Performance Report
```
============================================================
MODEL PERFORMANCE
============================================================

Accuracy:
  Training: 84.2%
  Test:     83.8%

ROC-AUC Score:
  Training: 0.912
  Test:     0.908

Confusion Matrix (Test Set):
  True Negatives:   395  |  False Positives:  82
  False Negatives:  80   |  True Positives:   443

Classification Report (Test Set):
              precision    recall  f1-score   support

Not Recovered       0.83      0.83      0.83       477
    Recovered       0.84      0.85      0.84       523

     accuracy                           0.84      1000
```

### 2. Feature Importance
```
============================================================
FEATURE IMPORTANCE
============================================================

  ptp_active     : +2.347  ↑ increases recovery
  ageing         : -2.834  ↓ decreases recovery
  dispute        : -1.723  ↓ decreases recovery
  staleness      : -1.421  ↓ decreases recovery
  attempts       : +0.234  ↑ increases recovery
  log_amount     : +0.143  ↑ increases recovery

  Intercept (bias): -0.489
```

### 3. Updated model.json
```json
{
  "version": "1.0",
  "trained_on": "2024-01-10",
  "n_samples": 5000,
  "test_accuracy": 0.838,
  "test_auc": 0.908,
  "bias": -0.489,
  "weights": {
    "ageing": -2.834,
    "log_amount": 0.143,
    "attempts": 0.234,
    "staleness": -1.421,
    "dispute": -1.723,
    "ptp_active": 2.347
  },
  "reason_mappings": {
    ...
  }
}
```

## How It's Used in Production

### 1. Scoring Edge Function
When a case is created:
```typescript
// Extract features from case
const features = {
  ageing: case.ageing_days / 365,
  log_amount: Math.log(case.amount),
  attempts: countRecentAttempts(case.id),
  staleness: daysSinceUpdate(case.updated_at) / 365,
  dispute: hasActiveDispute(case.id) ? 1 : 0,
  ptp_active: hasActivePTP(case.id) ? 1 : 0
};

// Calculate probability
const logit = model.bias + 
  model.weights.ageing * features.ageing +
  model.weights.log_amount * features.log_amount +
  // ... (all features)

const probability = 1 / (1 + Math.exp(-logit));

// Calculate priority score
const priority = case.amount * probability * urgencyFactor;
```

### 2. Explainability
Top 3 contributing features are extracted and mapped to human-readable reasons:
- "High ageing reduces recovery significantly"
- "Active PTP significantly increases recovery"
- "Active dispute reduces recovery"

## Customizing the Model

### Change Sample Size
```python
# In train_demo_model.py
X, y = generate_synthetic_data(n_samples=10000)  # More data
```

### Adjust Business Logic
```python
# Modify the logit formula in generate_synthetic_data()
logit = (
    -0.5
    - 4.0 * ageing  # Make ageing even more important
    + 0.3 * log_amount  # Increase amount importance
    # ...
)
```

### Change Model Parameters
```python
model = LogisticRegression(
    random_state=42,
    max_iter=2000,
    C=0.5,  # Stronger regularization
    class_weight='balanced'  # Handle imbalanced classes
)
```

## Validation Best Practices

### Check for Overfitting
- Training accuracy should be close to test accuracy
- If train >> test: increase regularization (lower C)
- If both are low: add more features or use complex model

### ROC-AUC Guidelines
- **0.90-1.00**: Excellent discrimination
- **0.80-0.90**: Good discrimination
- **0.70-0.80**: Fair discrimination
- **< 0.70**: Poor discrimination

### Business Validation
After training, validate predictions make business sense:
```python
# High-priority case (should have high score)
test_case_1 = {
    'ageing': 0.1,      # New case
    'log_amount': 14,   # High amount
    'attempts': 5,      # Active engagement
    'staleness': 0.05,  # Recently updated
    'dispute': 0,       # No dispute
    'ptp_active': 1     # Has PTP
}
# Expected: High recovery probability (>0.7)

# Low-priority case (should have low score)
test_case_2 = {
    'ageing': 0.9,      # Very old
    'log_amount': 10,   # Lower amount
    'attempts': 0,      # No contact
    'staleness': 0.8,   # Stale
    'dispute': 1,       # Has dispute
    'ptp_active': 0     # No PTP
}
# Expected: Low recovery probability (<0.3)
```

## Production Deployment

After training:

1. **Verify model.json** is updated with new weights
2. **Copy to Edge Function**:
   ```bash
   cp ml/model.json supabase/functions/score_case/model.json
   ```
3. **Redeploy Edge Function**:
   ```bash
   supabase functions deploy score_case
   ```
4. **Test with real case**:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/score_case \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"case_id": "uuid-here"}'
   ```
5. **Monitor predictions** in production dashboard

## Continuous Improvement

As you collect real data:

1. **Export historical cases** with outcomes:
   ```sql
   SELECT 
     ageing_days / 365.0 as ageing,
     ln(amount) as log_amount,
     -- ... other features
     CASE WHEN status = 'RECOVERED' THEN 1 ELSE 0 END as recovered
   FROM cases
   WHERE closed_at IS NOT NULL;
   ```

2. **Retrain with real data**:
   ```python
   # Load real data instead of synthetic
   X = np.loadtxt('real_features.csv', delimiter=',')
   y = np.loadtxt('real_labels.csv', delimiter=',')
   
   model.fit(X, y)
   ```

3. **A/B test** new model against current model
4. **Monitor KPIs**: recovery rate, accuracy, business impact

## Troubleshooting

### ImportError: No module named 'sklearn'
```bash
pip install scikit-learn numpy
```

### Poor Model Performance
- Check data quality (realistic distributions?)
- Add more samples (try 10,000+)
- Verify feature engineering logic
- Consider more complex model (Random Forest, XGBoost)

### Model predicts same for everything
- Check class balance (should be ~40-60%)
- Verify feature variance (features should vary)
- Check for data leakage
- Increase model complexity

## Questions?

For issues or improvements, check:
- Main README.md
- Supabase Edge Functions documentation
- scikit-learn LogisticRegression docs

---

**Happy Training! 🚀**
