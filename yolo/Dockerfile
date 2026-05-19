FROM python:3.12-slim

WORKDIR /app

# System deps for OpenCV and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps — torch CPU-only to keep image size reasonable
# If you have a GPU node, replace with torch+cu121 wheel
RUN pip install --no-cache-dir \
    fastapi>=0.100.0 \
    "uvicorn[standard]>=0.23.0" \
    python-multipart>=0.0.7 \
    Pillow>=10.0.0 \
    numpy>=1.24.0 \
    opencv-python-headless>=4.8.0 \
    ai-edge-litert>=1.0.0 \
    torch>=2.0.0 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics>=8.0.0

COPY yolo_server.py .

# Model file — copy if present during build (or mount at runtime via volume)
COPY idrone_v1.tflite* ./
COPY idrone_qunt_v1.tflite* ./

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "yolo_server:app", "--host", "0.0.0.0", "--port", "8000"]
