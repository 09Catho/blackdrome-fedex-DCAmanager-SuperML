#!/bin/bash
# Quick training script for FedEx DCA ML Model

echo "============================================================"
echo "FedEx DCA Platform - ML Model Training"
echo "============================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+."
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"
echo ""

# Check if dependencies are installed
echo "Checking dependencies..."
if ! python3 -c "import numpy, sklearn" 2>/dev/null; then
    echo "⚠️  Dependencies not found. Installing..."
    pip install -r requirements.txt
else
    echo "✓ Dependencies already installed"
fi

echo ""
echo "Starting model training..."
echo ""

# Run training
python3 train_demo_model.py

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================"
    echo "✅ Training completed successfully!"
    echo "============================================================"
    echo ""
    echo "Next steps:"
    echo "1. Review model.json for updated weights"
    echo "2. Copy to Edge Functions: cp model.json ../supabase/functions/score_case/"
    echo "3. Redeploy: supabase functions deploy score_case"
    echo ""
else
    echo ""
    echo "❌ Training failed. Check errors above."
    exit 1
fi
