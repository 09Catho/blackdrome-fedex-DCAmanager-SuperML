# ML Workflow - FedEx DCA Platform

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FedEx DCA Platform                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │
                ┌───────────────┴────────────────┐
                │                                │
                ▼                                ▼
    ┌─────────────────────┐        ┌──────────────────────┐
    │   Case Creation     │        │   Scheduled Jobs     │
    │   (Frontend/API)    │        │   (Cron/Manual)      │
    └──────────┬──────────┘        └──────────┬───────────┘
               │                               │
               │                               │
               ▼                               ▼
    ┌─────────────────────────────────────────────────────┐
    │         Supabase Edge Functions                     │
    │                                                      │
    │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
    │  │ score_case  │  │ allocate_case│  │ sla_sweep  │ │
    │  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘ │
    │         │                 │                │        │
    └─────────┼─────────────────┼────────────────┼────────┘
              │                 │                │
              ▼                 │                │
    ┌─────────────────┐         │                │
    │   ML Model      │         │                │
    │   (model.json)  │         │                │
    │                 │         │                │
    │  • Weights      │         │                │
    │  • Bias         │         │                │
    │  • Features     │         │                │
    └─────────┬───────┘         │                │
              │                 │                │
              ▼                 ▼                ▼
    ┌──────────────────────────────────────────────────┐
    │            Supabase PostgreSQL                   │
    │                                                   │
    │  • cases (with scores)                           │
    │  • case_activities                               │
    │  • case_audit                                    │
    └──────────────────────────────────────────────────┘
```

## Training Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                  ML Training Process                         │
└──────────────────────────────────────────────────────────────┘

STEP 1: Data Generation
┌─────────────────────────────────────────────────────────┐
│  generate_synthetic_data(n_samples=5000)                │
│                                                          │
│  → Generate 6 features with business logic              │
│     • ageing (normalized 0-1)                           │
│     • log_amount (log-scaled)                           │
│     • attempts (Poisson distribution)                   │
│     • staleness (correlated with ageing)                │
│     • dispute (binary, age-dependent)                   │
│     • ptp_active (binary, attempt-dependent)            │
│                                                          │
│  → Generate labels (recovered/not)                      │
│     • Apply logistic function with realistic weights    │
│     • Add noise for realism                             │
│     • Result: ~50% recovery rate                        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
STEP 2: Train/Test Split
┌─────────────────────────────────────────────────────────┐
│  train_test_split(X, y, test_size=0.2, stratify=y)     │
│                                                          │
│  Training Set: 4,000 cases (80%)                        │
│  Test Set:     1,000 cases (20%)                        │
│                                                          │
│  Stratification ensures balanced classes                │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
STEP 3: Model Training
┌─────────────────────────────────────────────────────────┐
│  LogisticRegression(                                    │
│    random_state=42,                                     │
│    max_iter=2000,                                       │
│    solver='lbfgs',                                      │
│    C=1.0                                                │
│  )                                                      │
│                                                          │
│  Learns optimal weights for each feature                │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
STEP 4: Validation
┌─────────────────────────────────────────────────────────┐
│  Metrics Computed:                                      │
│    ✓ Accuracy:    ~84%                                  │
│    ✓ ROC-AUC:     ~0.91                                 │
│    ✓ Precision:   ~0.84                                 │
│    ✓ Recall:      ~0.85                                 │
│    ✓ F1-Score:    ~0.84                                 │
│                                                          │
│  Confusion Matrix analyzed for bias                     │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
STEP 5: Feature Importance
┌─────────────────────────────────────────────────────────┐
│  Coefficients ranked by absolute value:                 │
│    1. ptp_active:   +2.347  (strongest positive)       │
│    2. ageing:       -2.834  (strongest negative)       │
│    3. dispute:      -1.723                              │
│    4. staleness:    -1.421                              │
│    5. attempts:     +0.234                              │
│    6. log_amount:   +0.143                              │
│                                                          │
│  Validates business logic expectations                  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
STEP 6: Export to JSON
┌─────────────────────────────────────────────────────────┐
│  {                                                       │
│    "version": "1.0",                                    │
│    "bias": -0.489,                                      │
│    "weights": {                                         │
│      "ageing": -2.834,                                  │
│      "log_amount": 0.143,                               │
│      "attempts": 0.234,                                 │
│      "staleness": -1.421,                               │
│      "dispute": -1.723,                                 │
│      "ptp_active": 2.347                                │
│    },                                                   │
│    "reason_mappings": {...}                             │
│  }                                                      │
│                                                          │
│  Saved to: ml/model.json                                │
└─────────────────────────────────────────────────────────┘
```

## Inference Workflow

```
┌──────────────────────────────────────────────────────────────┐
│               Real-Time Case Scoring                         │
└──────────────────────────────────────────────────────────────┘

TRIGGER: New Case Created
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  score_case Edge Function                                │
│                                                          │
│  1. Fetch case data from database                       │
│  2. Extract features:                                   │
│                                                          │
│     ageing = case.ageing_days / 365                     │
│     log_amount = Math.log(case.amount)                  │
│     attempts = countRecentAttempts(case_id)             │
│     staleness = daysSinceUpdate / 365                   │
│     dispute = hasActiveDispute ? 1 : 0                  │
│     ptp_active = hasActivePTP ? 1 : 0                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Load model.json                                         │
│                                                          │
│  const model = {                                         │
│    bias: -0.489,                                        │
│    weights: {...}                                       │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Compute Logit (Linear Combination)                     │
│                                                          │
│  logit = bias +                                         │
│          weights.ageing * ageing +                      │
│          weights.log_amount * log_amount +              │
│          weights.attempts * attempts +                  │
│          weights.staleness * staleness +                │
│          weights.dispute * dispute +                    │
│          weights.ptp_active * ptp_active                │
│                                                          │
│  Example: -0.489 + (-2.834 * 0.2) + ...                │
│          = -1.123                                       │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Apply Sigmoid (Convert to Probability)                 │
│                                                          │
│  probability = 1 / (1 + exp(-logit))                    │
│              = 1 / (1 + exp(1.123))                     │
│              = 0.245 (24.5% recovery chance)            │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Calculate Priority Score                                │
│                                                          │
│  urgency_factor = 1 + (ageing_days / 90)                │
│                 = 1 + (73 / 90)                         │
│                 = 1.811                                 │
│                                                          │
│  priority = amount * probability * urgency              │
│           = 150000 * 0.245 * 1.811                      │
│           = 66,529                                      │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Generate Explainability (Reason Codes)                 │
│                                                          │
│  1. Get absolute feature contributions                  │
│  2. Rank by magnitude                                   │
│  3. Pick top 3                                          │
│  4. Map to human-readable reasons                       │
│                                                          │
│  Top Reasons:                                           │
│   ✓ "High ageing reduces recovery significantly"       │
│   ✓ "Active PTP increases recovery"                    │
│   ✓ "Medium amount case"                                │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Update Database                                         │
│                                                          │
│  UPDATE cases                                           │
│  SET                                                    │
│    recovery_prob_30d = 0.245,                          │
│    priority_score = 66529,                             │
│    reason_codes = ['...', '...', '...']                │
│  WHERE id = case_id;                                   │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  RESULT: Case Scored and Prioritized                    │
│                                                          │
│  • Shows in dashboard with risk indicators              │
│  • Used for allocation to DCAs                          │
│  • Drives business prioritization                       │
└─────────────────────────────────────────────────────────┘
```

## Feature Engineering Details

### 1. Ageing (Normalized)
```
Raw: ageing_days (0 to 365+)
Normalized: ageing_days / 365
Range: 0.0 (brand new) to 1.0+ (very old)
Business Logic: Older = Harder to recover
```

### 2. Log Amount
```
Raw: amount (₹10,000 to ₹5,000,000)
Transformed: Math.log(amount)
Range: ~9.2 to ~15.4
Business Logic: Handles wide range, reduces outlier impact
```

### 3. Contact Attempts
```
Raw: Count of activities in last 30 days
Range: 0 to 15+
Business Logic: More contact = Better engagement
```

### 4. Staleness (Normalized)
```
Raw: Days since last update
Normalized: days_since_update / 365
Range: 0.0 (just updated) to 1.0+ (very stale)
Business Logic: Fresh cases easier to recover
```

### 5. Dispute (Binary)
```
Value: 0 (no dispute) or 1 (has dispute)
Business Logic: Disputes significantly reduce recovery
```

### 6. PTP Active (Binary)
```
Value: 0 (no PTP) or 1 (has active payment promise)
Business Logic: PTPs are strong positive signals
```

## Model Interpretability

### Why Logistic Regression?

1. **Transparent**: Coefficients show exact feature impact
2. **Fast**: Real-time inference (<10ms)
3. **Explainable**: Easy to communicate to business stakeholders
4. **Probabilistic**: Natural probability outputs
5. **Regulatory Friendly**: Can explain every decision

### Reading Coefficients

```
Coefficient = +2.347 for ptp_active
  ↳ Increases log-odds by 2.347 when PTP is present
  ↳ Multiplies odds by exp(2.347) = 10.45x
  ↳ Strong positive effect on recovery

Coefficient = -2.834 for ageing
  ↳ Decreases log-odds by 2.834 per unit increase
  ↳ At ageing=1.0, odds reduced by exp(-2.834) = 0.059x
  ↳ Strong negative effect on recovery
```

### Business Translation

| Feature | Coefficient | Business Meaning |
|---------|-------------|------------------|
| ptp_active | +2.347 | PTPs increase recovery odds by **10.5x** |
| ageing | -2.834 | Each 100 days of ageing reduces odds by **75%** |
| dispute | -1.723 | Disputes reduce recovery odds by **82%** |
| attempts | +0.234 | Each attempt increases odds by **26%** |

## Continuous Improvement Loop

```
   ┌─────────────────────────────────────────────┐
   │                                             │
   │   Production System                         │
   │   (Cases + Outcomes)                        │
   │                                             │
   └──────────────┬──────────────────────────────┘
                  │
                  │ Export historical data
                  ▼
   ┌─────────────────────────────────────────────┐
   │  Real Historical Data                       │
   │  • 1000s of cases with actual outcomes      │
   │  • Real feature distributions               │
   │  • True recovery rates                      │
   └──────────────┬──────────────────────────────┘
                  │
                  │ Retrain model
                  ▼
   ┌─────────────────────────────────────────────┐
   │  Updated ML Model                           │
   │  • Better accuracy                          │
   │  • Captures new patterns                    │
   │  • Reflects current business reality        │
   └──────────────┬──────────────────────────────┘
                  │
                  │ A/B test
                  ▼
   ┌─────────────────────────────────────────────┐
   │  Validation                                  │
   │  • Compare vs old model                     │
   │  • Monitor KPIs                             │
   │  • Check business impact                    │
   └──────────────┬──────────────────────────────┘
                  │
                  │ Deploy if better
                  ▼
   ┌─────────────────────────────────────────────┐
   │  Production Deployment                       │
   │  • Update model.json                        │
   │  • Redeploy Edge Functions                  │
   │  • Monitor performance                      │
   └─────────────────────────────────────────────┘
```

---

**For implementation details, see:**
- `train_demo_model.py` - Training script
- `TRAINING_GUIDE.md` - Detailed guide
- `../supabase/functions/score_case/` - Inference code
