#!/usr/bin/env python3
"""
Tea Pest Detection — YOLO-v11 FastAPI Server
Endpoint : POST /yolo-v11/
Accepts  : multipart file upload (field name: "file")
Returns  : JSON matching the NestJS backend's expected format
"""

import os
import io
import base64
import logging
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
import uvicorn
from PIL import Image, ImageDraw, ImageFont
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("yolo_server")

SCRIPT_DIR = Path(__file__).parent

# ── Model path (env var overrides default) ────────────────────────────────────
MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    str(SCRIPT_DIR / "idrone_v1.tflite"),
)

# ── Class names (order must match training labels) ────────────────────────────
CLASS_NAMES = ["rsc", "looper", "thrips", "jassid", "rsm", "tmb", "healthy"]

# ── Pest knowledge base ───────────────────────────────────────────────────────
PEST_INFO = {
    "rsc": {
        "display_name": "Red Slug Caterpillar (Eterusia magnifica)",
        "symptoms": [
            "Skeletonized tea leaves with only veins remaining",
            "Red or brown caterpillars visible on leaf surfaces",
            "Severe defoliation of tea bushes",
            "Stunted bush growth and reduced flush quality",
        ],
        "biological_control": [
            "Use egg parasitoids (Gryon sp.) for biological suppression",
            "Encourage predatory beetles in the field",
            "Spray neem oil extract @ 5 ml/L water",
            "Apply Bacillus thuringiensis (Bt) @ 2 g/L during early larval stages",
        ],
        "chemical_control": [
            "Acephate 75 SP @ 1.5 g/L water",
            "Profenophos 50 EC @ 2 ml/L water",
            "Emamectin benzoate 5 SG @ 0.5 g/L water",
            "Rotate insecticide groups to prevent resistance development",
        ],
        "mechanical_control": [
            "Collect and destroy caterpillars during early morning hours",
            "Install pheromone traps for adult moth monitoring",
            "Prune and burn affected branches promptly",
            "Maintain field hygiene and remove leaf litter",
        ],
    },
    "looper": {
        "display_name": "Tea Looper (Buzura suppressaria)",
        "symptoms": [
            "Irregular holes and notches in tea leaves",
            "Progressive defoliation of tea bushes",
            "Looper caterpillars hanging from undersides of leaves",
            "Reduced leaf area and flush quality",
        ],
        "biological_control": [
            "Encourage natural predators such as birds and parasitic wasps (Apanteles sp.)",
            "Apply Bacillus thuringiensis (Bt) @ 2 g/L",
            "Use nuclear polyhedrosis virus (NPV) sprays",
            "Maintain biodiversity in and around tea gardens",
        ],
        "chemical_control": [
            "Quinalphos 25 EC @ 2 ml/L water",
            "Chlorpyrifos 20 EC @ 2.5 ml/L water",
            "Lambda-cyhalothrin 5 EC @ 1 ml/L water",
            "Apply during evening hours for best efficacy",
        ],
        "mechanical_control": [
            "Hand-pick caterpillars and destroy egg masses",
            "Use light traps to capture adult moths",
            "Proper pruning and field sanitation after harvest",
            "Remove alternate host plants from field margins",
        ],
    },
    "thrips": {
        "display_name": "Tea Thrips (Scirtothrips bispinosus)",
        "symptoms": [
            "Silvery-white patches on tender young leaves",
            "Bronze or brown discoloration on leaf surface",
            "Curling and distortion of young shoots",
            "Stunted shoot growth and poor flush development",
        ],
        "biological_control": [
            "Encourage predatory mites (Amblyseius cucumeris)",
            "Apply neem-based formulations @ 5 ml/L",
            "Use entomopathogenic fungi — Beauveria bassiana",
            "Maintain soil moisture to support beneficial organisms",
        ],
        "chemical_control": [
            "Spinosad 45 SC @ 0.75 ml/L water",
            "Imidacloprid 17.8 SL @ 0.5 ml/L water",
            "Thiamethoxam 25 WG @ 0.5 g/L water",
            "Alternate chemical groups to manage insecticide resistance",
        ],
        "mechanical_control": [
            "Install blue or yellow sticky traps for population monitoring",
            "Remove and destroy severely damaged shoot tips",
            "Avoid excessive nitrogen fertilization which favours thrips",
            "Ensure proper canopy management to improve airflow",
        ],
    },
    "jassid": {
        "display_name": "Tea Jassid / Leafhopper (Empoasca flavescens)",
        "symptoms": [
            "Marginal leaf scorch (hopper burn) on older leaves",
            "Upward curling and cupping of leaf edges",
            "Yellowing along leaf margins progressing inward",
            "Reduced shoot growth and poor quality flush",
        ],
        "biological_control": [
            "Preserve natural predators — spiders and mirid bugs",
            "Apply neem seed kernel extract @ 5% concentration",
            "Spray Verticillium lecanii fungal biopesticide",
            "Intercrop with plants that attract beneficial insects",
        ],
        "chemical_control": [
            "Buprofezin 25 SC @ 2 ml/L water",
            "Thiamethoxam 25 WG @ 0.5 g/L water",
            "Imidacloprid 17.8 SL @ 0.5 ml/L water",
            "Apply systemic insecticides during early nymphal stage",
        ],
        "mechanical_control": [
            "Yellow sticky traps for population monitoring",
            "Proper pruning to increase air circulation in canopy",
            "Remove weeds serving as alternate hosts",
            "Avoid excessive shade that favours jassid development",
        ],
    },
    "rsm": {
        "display_name": "Red Spider Mite (Oligonychus coffeae)",
        "symptoms": [
            "Bronze-red discoloration of the upper leaf surface",
            "Fine silky webbing visible on leaf undersides",
            "Premature leaf drop in severe infestations",
            "Silvery-brown rusty patches covering leaves",
        ],
        "biological_control": [
            "Introduce predatory mites (Phytoseiidae family)",
            "Apply neem oil @ 3 ml/L water regularly",
            "Spray Verticillium lecanii biofungicide",
            "Maintain field humidity with overhead irrigation misting",
        ],
        "chemical_control": [
            "Spiromesifen 22.9 SC @ 1 ml/L water",
            "Abamectin 1.9 EC @ 1 ml/L water",
            "Hexythiazox 5 EC @ 1 ml/L water",
            "Bifenazate 43 SC @ 1.5 ml/L — spray leaf undersides thoroughly",
        ],
        "mechanical_control": [
            "Strong water sprays on leaf undersides to dislodge mites",
            "Remove and destroy heavily infested leaves",
            "Avoid water stress — maintain adequate irrigation schedule",
            "Increase relative humidity in the field",
        ],
    },
    "tmb": {
        "display_name": "Tea Mosquito Bug (Helopeltis theivora)",
        "symptoms": [
            "Brown lesions with green or yellow halo on tender shoots",
            "Blister-like raised patches on young leaves",
            "Die-back of shoot tips causing witches-broom appearance",
            "Reduced flush and poor crop quality",
        ],
        "biological_control": [
            "Encourage parasitoid wasps (Gryon sp.)",
            "Apply Metarhizium anisopliae fungal biopesticide",
            "Spray neem oil @ 3 ml/L during early infestation",
            "Conserve predatory bugs that attack TMB egg masses",
        ],
        "chemical_control": [
            "Dimethoate 30 EC @ 2 ml/L water",
            "Quinalphos 25 EC @ 2 ml/L water",
            "Cypermethrin 10 EC @ 1 ml/L water",
            "Thiamethoxam 25 WG @ 0.5 g/L — effective against nymphs",
        ],
        "mechanical_control": [
            "Remove alternate host plants (Lantana, Euphorbia) from field margins",
            "Prune shaded and densely canopied areas regularly",
            "Burn infested prunings away from the field",
            "Monitor frequently during warm and humid weather conditions",
        ],
    },
    "healthy": {
        "display_name": "Healthy Tea Plant",
        "symptoms": [
            "No pest damage observed",
            "Leaves appear healthy, green, and well-formed",
            "Normal shoot growth and flush development",
        ],
        "biological_control": [
            "Continue integrated pest management practices",
            "Maintain populations of beneficial insects in the field",
            "Use pheromone traps for early pest detection and monitoring",
        ],
        "chemical_control": [
            "No chemical intervention required at this time",
            "Avoid unnecessary pesticide applications to protect beneficials",
            "Follow a preventive spray calendar if recommended regionally",
        ],
        "mechanical_control": [
            "Continue regular field monitoring and scouting",
            "Maintain proper pruning and field sanitation",
            "Remove weeds and alternate host plants from field borders",
        ],
    },
}

# ── Model loading ─────────────────────────────────────────────────────────────

model = None
model_type = None   # "ultralytics" | "tflite"
tflite_input_shape = None


def load_model():
    global model, model_type, tflite_input_shape

    model_path = MODEL_PATH

    # If specified path missing, try quantized fallback, then auto-download
    if not os.path.exists(model_path):
        q_path = str(SCRIPT_DIR / "idrone_qunt_v1.tflite")
        if os.path.exists(q_path):
            model_path = q_path
            logger.warning(f"Primary model not found — using quantized: {q_path}")
        else:
            logger.warning("No custom .tflite found — downloading YOLOv11n base model")
            model_path = "yolo11n.pt"

    logger.info(f"Loading model: {model_path}")

    is_tflite = model_path.endswith(".tflite")

    # For TFLite files use the lightweight interpreter directly (no tensorflow needed)
    if is_tflite:
        try:
            try:
                from ai_edge_litert.interpreter import Interpreter
            except ImportError:
                from tflite_runtime.interpreter import Interpreter
            interp = Interpreter(model_path=model_path)
            interp.allocate_tensors()
            model = interp
            model_type = "tflite"
            inp = interp.get_input_details()[0]
            tflite_input_shape = inp["shape"]
            logger.info(f"✓ TFLite model loaded. Input shape: {tflite_input_shape}")
            return
        except Exception as e:
            logger.warning(f"TFLite loader failed ({e}) — falling back to ultralytics")

    # For .pt / .onnx — use ultralytics
    try:
        from ultralytics import YOLO
        model = YOLO(model_path, task="detect")
        model_type = "ultralytics"
        logger.info(f"✓ Model loaded via ultralytics ({model_path})")
        return
    except Exception as e:
        logger.error(f"Ultralytics loader failed: {e}")
        raise RuntimeError(f"Cannot load model from '{model_path}': {e}")


load_model()

# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(title="Tea Pest Detection — YOLO-v11")


@app.post("/yolo-v11/")
async def predict(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        if model_type == "ultralytics":
            return _infer_ultralytics(image)
        elif model_type == "tflite":
            return _infer_tflite(image)
        else:
            raise HTTPException(status_code=503, detail="Model not loaded")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inference error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok", "model_type": model_type, "model_path": MODEL_PATH}


# ── Inference helpers ─────────────────────────────────────────────────────────

def _annotate_and_encode(image: Image.Image, boxes_labels_confs: list) -> str:
    """Draw bounding boxes on image and return as base64 JPEG data-URI."""
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype(str(SCRIPT_DIR / "arial.ttf"), 28)
    except Exception:
        font = ImageFont.load_default()

    for (box, label, conf) in boxes_labels_confs:
        draw.rectangle(box, outline="#FF0000", width=4)
        text = f"{label}: {conf:.2f}"
        bbox = draw.textbbox((box[0], max(0, box[1] - 36)), text, font=font)
        draw.rectangle(bbox, fill="#000000")
        draw.text((box[0], max(0, box[1] - 36)), text, fill="#FFFF00", font=font)

    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=85)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def _build_response(best_cls: str, best_conf: float, best_box: list, img_b64: str) -> dict:
    info = PEST_INFO.get(best_cls, PEST_INFO["healthy"])
    return {
        "prediction": info["display_name"],
        "confidence": round(best_conf if best_conf > 0 else 0.65, 4),
        "bounding_box": best_box,
        "symptoms": info["symptoms"],
        "biological_control": info["biological_control"],
        "chemical_control": info["chemical_control"],
        "mechanical_control": info["mechanical_control"],
        "processed_image": img_b64,
    }


def _infer_ultralytics(image: Image.Image) -> dict:
    results = model(image, verbose=False)

    best_cls, best_conf, best_box = "healthy", 0.0, []
    annotations = []

    for r in results:
        for box in r.boxes:
            cls_idx = int(box.cls[0])
            conf = float(box.conf[0])
            coords = [int(c) for c in box.xyxy[0].tolist()]
            label = CLASS_NAMES[cls_idx] if cls_idx < len(CLASS_NAMES) else "unknown"
            annotations.append((coords, label, conf))
            if conf > best_conf:
                best_conf, best_cls, best_box = conf, label, coords

    img_b64 = _annotate_and_encode(image, annotations)
    return _build_response(best_cls, best_conf, best_box, img_b64)


def _infer_tflite(image: Image.Image) -> dict:
    inp_details = model.get_input_details()[0]
    out_details = model.get_output_details()[0]

    # Input: [1, 640, 640, 3]
    h, w = int(inp_details["shape"][1]), int(inp_details["shape"][2])
    img_resized = image.resize((w, h))
    arr = np.array(img_resized, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)   # → [1, 640, 640, 3]

    model.set_tensor(inp_details["index"], arr)
    model.invoke()

    # Output: [1, 11, 8400]  — YOLOv8 format (no objectness score)
    #   rows 0-3 : cx, cy, w, h  (normalised 0-1)
    #   rows 4-10: class scores  (7 classes)
    raw = model.get_tensor(out_details["index"])[0]   # → [11, 8400]
    preds = raw.T                                      # → [8400, 11]

    CONF_THRESH = 0.25
    best_cls, best_conf, best_box = "healthy", 0.0, []
    annotations = []
    W, H = image.width, image.height

    try:
        boxes = preds[:, :4]          # [8400, 4]  cx,cy,bw,bh normalised
        scores = preds[:, 4:]         # [8400, 7]  class scores

        # Vectorised: find max class score per anchor
        cls_ids = np.argmax(scores, axis=1)           # [8400]
        confs   = scores[np.arange(len(scores)), cls_ids]  # [8400]

        # Filter by confidence threshold
        keep = np.where(confs >= CONF_THRESH)[0]

        for i in keep:
            conf    = float(confs[i])
            cls_idx = int(cls_ids[i])
            cx, cy, bw, bh = float(boxes[i, 0]), float(boxes[i, 1]), \
                              float(boxes[i, 2]), float(boxes[i, 3])
            box = [
                max(0, int((cx - bw / 2) * W)),
                max(0, int((cy - bh / 2) * H)),
                min(W, int((cx + bw / 2) * W)),
                min(H, int((cy + bh / 2) * H)),
            ]
            label = CLASS_NAMES[cls_idx] if cls_idx < len(CLASS_NAMES) else "unknown"
            annotations.append((box, label, conf))
            if conf > best_conf:
                best_conf, best_cls, best_box = conf, label, box

    except Exception as e:
        logger.warning(f"TFLite output parsing error: {e}", exc_info=True)

    img_b64 = _annotate_and_encode(image, annotations)
    return _build_response(best_cls, best_conf, best_box, img_b64)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
