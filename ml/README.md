# ML Module - FedEx DCA Platform

## 📁 Contents

This directory contains the complete ML/AI solution for debt recovery prediction and case prioritization.

### Files

- **`model.json`** - Pre-trained logistic regression model (ready to use)
- **`train_demo_model.py`** - Training script with synthetic data generation
- **`requirements.txt`** - Python dependencies
- **`train.sh`** / **`train.bat`** - Quick training scripts (Linux/Mac and Windows)
- **`TRAINING_GUIDE.md`** - Comprehensive training documentation
- **`ML_WORKFLOW.md`** - Visual workflow diagrams and architecture

## 🚀 Quick Start

### Option 1: Use Pre-Trained Model (Default)

The platform ships with a pre-trained model. **No action needed!**

Just deploy your Edge Functions and the model will be loaded automatically.

### Option 2: Train Your Own Model

```bash
# Install dependencies
pip install -r requirements.txt

# Run training
python train_demo_model.py

# Copy to Edge Functions
cp model.json ../supabase/functions/score_case/
```

Or use the convenience scripts:
```bash
# Linux/Mac
bash train.sh

# Windows
train.bat
```

## 📊 Model Specifications

**Algorithm:** Logistic Regression  
**Training Data:** 5,000 synthetic cases with realistic business logic  
**Performance:**
- Accuracy: ~84%
- ROC-AUC: ~0.91
- Precision: ~0.84
- Recall: ~0.85

**Features (6 total):**
1. `ageing` - Normalized days overdue (0-1)
2. `log_amount` - Log-scaled debt amount
3. `attempts` - Contact attempts in last 30 days
4. `staleness` - Days since last update (normalized)
5. `dispute` - Binary flag for active disputes
6. `ptp_active` - Binary flag for payment promises

**Outputs:**
- **Recovery Probability** (0-1): Likelihood of recovery within 30 days
- **Priority Score**: Weighted combination for case ranking
- **Reason Codes**: Top 3 explainable factors

## 🎯 What It Predicts

The model answers: **"What's the probability this debt will be recovered in the next 30 days?"**

### High Recovery Probability Cases
✅ Low ageing (recently overdue)  
✅ Active engagement (contact attempts)  
✅ Active payment promise (PTP)  
✅ No disputes  
✅ Recently updated  

### Low Recovery Probability Cases
❌ High ageing (long overdue)  
❌ No recent contact  
❌ Has active disputes  
❌ Stale (not updated)  
❌ No payment promises  

## 📈 How It's Used

### 1. Automatic Scoring
When a case is created:
```
Case Created
    ↓
score_case Edge Function
    ↓
ML Model Inference
    ↓
Database Updated
    ↓
Dashboard Shows Scores
```

### 2. Intelligent Allocation
```
New Case
    ↓
Scored by ML
    ↓
Priority Calculated
    ↓
Allocated to Best DCA
    ↓
DCA Works High-Priority First
```

### 3. Business Insights
```
Case Dashboard
    ↓
Shows Recovery Probability
    ↓
Shows Priority Ranking
    ↓
Shows Reason Codes
    ↓
Team Makes Informed Decisions
```

## 🔍 Model Explainability

Every prediction includes human-readable reasons:

**Example 1: High Recovery (78%)**
- ✅ "Active PTP significantly increases recovery"
- ✅ "Low ageing increases recovery"
- ✅ "Active engagement with customer"

**Example 2: Low Recovery (23%)**
- ❌ "High ageing reduces recovery significantly"
- ❌ "Active dispute reduces recovery"
- ❌ "Stale case needs immediate attention"

## 📐 Feature Schema (Single Source of Truth)

All features are computed identically in training and production:

| Feature | Type | Formula | Range | Description |
|---------|------|---------|-------|-------------|
| `ageing` | float | `min(ageing_days / 120, 1.0)` | [0, 1] | Normalized days overdue, capped at 120 days |
| `log_amount` | float | `ln(amount + 1) / 10` | [0.92, 1.56] | Log-scaled debt amount (₹10k-₹5M range) |
| `attempts` | float | `min(attempts_30d / 10, 1.0)` | [0, 1] | Contact attempts in last 30 days, capped at 10 |
| `staleness` | float | `min(days_since_update / 14, 1.0)` | [0, 1] | Days since last activity, capped at 14 days |
| `dispute` | binary | `1 if status='DISPUTE' OR dispute_activity else 0` | {0, 1} | Active dispute flag |
| `ptp_active` | binary | `1 if active_payment_promise else 0` | {0, 1} | Payment promise exists |

**Critical Note:** All features use **normalized values (0-1)** except `log_amount` which uses log-scaling for interpretability.

## 📊 Reproducibility

### Training Reproducibility
- **Random Seed:** `42` (fixed in `train_demo_model.py`)
- **Dataset:** 5,000 synthetic cases generated programmatically
- **Validation:** 80/20 train-test split (stratified)
- **Sanity Checks:** 6 business logic tests (see `business_sanity_tests.py`)

### Reproducing Results
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Train model (generates synthetic data internally)
python train_demo_model.py

# 3. Run sanity tests
python business_sanity_tests.py

# 4. Deploy
cp model.json ../supabase/functions/score_case/
```

**Expected Metrics:**
- Test Accuracy: ~83.8%
- ROC-AUC: ~0.908
- Brier Score: ~0.12 (calibration)

### Important Disclaimer
⚠️ **Demo Training:** This model is trained on **synthetic data** generated to match realistic debt collection patterns. For production use, retrain on historical FedEx case outcomes for optimal accuracy

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **TRAINING_GUIDE.md** | Complete training documentation |
| **ML_WORKFLOW.md** | Architecture and workflow diagrams |
| **model.json** | Model weights and metadata |
| **train_demo_model.py** | Source code with comments |

## 🛠️ Customization

### Change Training Data Size
```python
# In train_demo_model.py, line 107
X, y = generate_synthetic_data(n_samples=10000)  # Default: 5000
```

### Adjust Feature Importance
```python
# In generate_synthetic_data(), modify logit formula (lines 72-80)
logit = (
    -0.5
    - 4.0 * ageing  # Increase from -3.0 to make ageing more important
    + 0.3 * log_amount  # Increase from +0.15
    # ...
)
```

### Tune Model Parameters
```python
# In train_model(), line 119
model = LogisticRegression(
    C=0.5,  # Stronger regularization (default: 1.0)
    class_weight='balanced',  # Handle imbalanced data
    max_iter=3000  # More iterations if needed
)
```

## 🔄 Continuous Improvement

### Phase 1: Synthetic Data (Current)
✅ Pre-trained model ready to use  
✅ Realistic business logic baked in  
✅ Good starting point for demo  

### Phase 2: Production Data (Future)
1. Export real cases with outcomes
2. Train on historical data
3. A/B test new model
4. Deploy if performance improves

### Phase 3: Advanced ML (Optional)
- Try Random Forest or XGBoost
- Add more features (customer demographics, payment history)
- Implement online learning (model updates continuously)
- Add neural networks for complex patterns

## ⚠️ Important Notes

### Do NOT Expose Service Role Key
The model is loaded server-side in Edge Functions. **Never** send it to the frontend.

### Model Versioning
Each trained model includes:
```json
{
  "version": "1.0",
  "trained_on": "2024-01-10",
  "n_samples": 5000,
  "test_accuracy": 0.838,
  "test_auc": 0.908
}
```

Track versions when retraining to enable rollbacks.

### Testing Before Deployment
Always validate on test set before deploying:
```python
# In train_demo_model.py
test_acc = model.score(X_test, y_test)
test_auc = roc_auc_score(y_test, y_proba_test)

# Only deploy if:
# - test_acc > 0.80
# - test_auc > 0.85
# - Business validation passes
```

## 🎓 Learning Resources

### Logistic Regression
- [scikit-learn docs](https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression)
- Understanding coefficients and odds ratios
- When to use vs other algorithms

### Feature Engineering
- Normalization techniques
- Handling categorical variables
- Creating interaction features
- Feature selection methods

### Model Evaluation
- Accuracy vs ROC-AUC
- Precision-Recall tradeoffs
- Confusion matrix interpretation
- Business metrics alignment

## 🆘 Troubleshooting

**Q: Training accuracy is 100%, test is 60%**  
A: Overfitting. Increase regularization (lower C) or add more data.

**Q: Model predicts same for all cases**  
A: Check feature variance. Ensure features have meaningful distributions.

**Q: Predictions don't match business intuition**  
A: Review synthetic data generation logic. Adjust coefficients.

**Q: ImportError for numpy or sklearn**  
A: Run `pip install -r requirements.txt`

**Q: How often should I retrain?**  
A: Monthly with real data, or when recovery patterns change significantly.

## 📞 Support

For questions about:
- **Training**: See TRAINING_GUIDE.md
- **Architecture**: See ML_WORKFLOW.md
- **Deployment**: See main README.md
- **Edge Functions**: See ../supabase/functions/score_case/

---

**Happy ML-ing! 🤖📊**
