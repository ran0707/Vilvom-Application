@echo off
echo =============================================
echo   Tea Pest Detection - YOLO Server (port 8000)
echo =============================================

:: Change to the directory where this script lives
cd /d "%~dp0"

:: Optional: set a custom model path
:: set MODEL_PATH=C:\path\to\your\best.pt

:: Check if idrone_v1.tflite exists
if exist "idrone_v1.tflite" (
    echo [INFO] Using model: idrone_v1.tflite
) else if exist "idrone_qunt_v1.tflite" (
    echo [INFO] Using model: idrone_qunt_v1.tflite ^(quantized^)
) else (
    echo [WARN] No custom model found. Will download YOLOv11n base model on first run.
)

echo [INFO] Starting server on http://0.0.0.0:8000
echo [INFO] Endpoint: POST http://localhost:8000/yolo-v11/
echo [INFO] Health:   GET  http://localhost:8000/health
echo.

python yolo_server.py

pause
