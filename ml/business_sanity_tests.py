#!/usr/bin/env python3
"""
Business Sanity Tests for ML Model
Validates that model predictions follow expected business logic
"""

import json
import numpy as np
from sklearn.linear_model import LogisticRegression

# Load model
with open('model.json', 'r') as f:
    model_data = json.load(f)

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def predict_recovery(features, model_data):
    """Predict recovery probability given features"""
    z = model_data['bias']
    for feat, value in features.items():
        z += model_data['weights'][feat] * value
    return sigmoid(z)

def run_sanity_tests():
    """Run 6 critical business sanity checks"""
    print("="*60)
    print("BUSINESS SANITY TESTS")
    print("="*60 + "\n")
    
    passed = 0
    total = 6
    
    # Base case: moderate values
    base_case = {
        'ageing': 0.5,        # 60 days (60/120)
        'log_amount': 1.2,    # ~₹160k
        'attempts': 0.4,      # 4 attempts
        'staleness': 0.5,     # 7 days
        'dispute': 0,
        'ptp_active': 0
    }
    
    # Test 1: PTP should increase probability
    print("Test 1: Active PTP increases recovery probability")
    test_case = base_case.copy()
    test_case['ptp_active'] = 1
    prob_no_ptp = predict_recovery(base_case, model_data)
    prob_with_ptp = predict_recovery(test_case, model_data)
    
    if prob_with_ptp > prob_no_ptp:
        print(f"  ✓ PASS: {prob_no_ptp:.1%} → {prob_with_ptp:.1%} (PTP helps)")
        passed += 1
    else:
        print(f"  ✗ FAIL: {prob_no_ptp:.1%} → {prob_with_ptp:.1%} (PTP should help!)")
    
    # Test 2: Dispute should reduce probability
    print("\nTest 2: Active dispute reduces recovery probability")
    test_case = base_case.copy()
    test_case['dispute'] = 1
    prob_no_dispute = predict_recovery(base_case, model_data)
    prob_with_dispute = predict_recovery(test_case, model_data)
    
    if prob_with_dispute < prob_no_dispute:
        print(f"  ✓ PASS: {prob_no_dispute:.1%} → {prob_with_dispute:.1%} (Dispute hurts)")
        passed += 1
    else:
        print(f"  ✗ FAIL: {prob_no_dispute:.1%} → {prob_with_dispute:.1%} (Dispute should hurt!)")
    
    # Test 3: Higher ageing should reduce probability
    print("\nTest 3: Higher ageing reduces recovery probability")
    test_case = base_case.copy()
    test_case['ageing'] = 0.9  # very old
    prob_newer = predict_recovery(base_case, model_data)
    prob_older = predict_recovery(test_case, model_data)
    
    if prob_older < prob_newer:
        print(f"  ✓ PASS: {prob_newer:.1%} → {prob_older:.1%} (Older is harder)")
        passed += 1
    else:
        print(f"  ✗ FAIL: {prob_newer:.1%} → {prob_older:.1%} (Older should be harder!)")
    
    # Test 4: More attempts should increase probability
    print("\nTest 4: More contact attempts increase recovery probability")
    test_case = base_case.copy()
    test_case['attempts'] = 0.9  # 9 attempts
    prob_few_attempts = predict_recovery(base_case, model_data)
    prob_many_attempts = predict_recovery(test_case, model_data)
    
    if prob_many_attempts > prob_few_attempts:
        print(f"  ✓ PASS: {prob_few_attempts:.1%} → {prob_many_attempts:.1%} (Engagement helps)")
        passed += 1
    else:
        print(f"  ✗ FAIL: {prob_few_attempts:.1%} → {prob_many_attempts:.1%} (Engagement should help!)")
    
    # Test 5: Less staleness should increase probability
    print("\nTest 5: Recently updated cases have higher recovery probability")
    test_case = base_case.copy()
    test_case['staleness'] = 0.1  # recently updated
    prob_stale = predict_recovery(base_case, model_data)
    prob_fresh = predict_recovery(test_case, model_data)
    
    if prob_fresh > prob_stale:
        print(f"  ✓ PASS: {prob_stale:.1%} → {prob_fresh:.1%} (Fresh cases better)")
        passed += 1
    else:
        print(f"  ✗ FAIL: {prob_stale:.1%} → {prob_fresh:.1%} (Fresh should be better!)")
    
    # Test 6: Combined positive factors should stack
    print("\nTest 6: Multiple positive factors should compound")
    best_case = {
        'ageing': 0.2,        # young case
        'log_amount': 1.5,    # high amount
        'attempts': 0.8,      # many attempts
        'staleness': 0.2,     # recently updated
        'dispute': 0,         # no dispute
        'ptp_active': 1       # has PTP
    }
    worst_case = {
        'ageing': 0.9,        # old case
        'log_amount': 0.8,    # low amount
        'attempts': 0.1,      # few attempts
        'staleness': 0.9,     # very stale
        'dispute': 1,         # has dispute
        'ptp_active': 0       # no PTP
    }
    prob_best = predict_recovery(best_case, model_data)
    prob_worst = predict_recovery(worst_case, model_data)
    
    if prob_best > prob_worst + 0.2:  # at least 20% difference
        print(f"  ✓ PASS: Worst {prob_worst:.1%} << Best {prob_best:.1%} (Factors compound)")
        passed += 1
    else:
        print(f"  ✗ FAIL: Worst {prob_worst:.1%}, Best {prob_best:.1%} (Too similar!)")
    
    # Summary
    print("\n" + "="*60)
    print(f"RESULTS: {passed}/{total} tests passed")
    print("="*60)
    
    if passed == total:
        print("✓ Model passes all business sanity constraints!")
    else:
        print(f"⚠ Model failed {total - passed} sanity check(s)")
    
    return passed == total

if __name__ == '__main__':
    success = run_sanity_tests()
    exit(0 if success else 1)
