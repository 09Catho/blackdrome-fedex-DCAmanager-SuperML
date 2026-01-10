@echo off
REM Quick training script for FedEx DCA ML Model (Windows)

echo ============================================================
echo FedEx DCA Platform - ML Model Training
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [91mPython is not installed. Please install Python 3.8+.[0m
    exit /b 1
)

echo [92mPython found[0m
echo.

REM Check if dependencies are installed
echo Checking dependencies...
python -c "import numpy, sklearn" >nul 2>&1
if %errorlevel% neq 0 (
    echo [93mDependencies not found. Installing...[0m
    pip install -r requirements.txt
) else (
    echo [92mDependencies already installed[0m
)

echo.
echo Starting model training...
echo.

REM Run training
python train_demo_model.py

REM Check if successful
if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo [92mTraining completed successfully![0m
    echo ============================================================
    echo.
    echo Next steps:
    echo 1. Review model.json for updated weights
    echo 2. Copy to Edge Functions: copy model.json ..\supabase\functions\score_case\
    echo 3. Redeploy: supabase functions deploy score_case
    echo.
) else (
    echo.
    echo [91mTraining failed. Check errors above.[0m
    exit /b 1
)
