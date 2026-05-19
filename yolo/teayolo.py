# train_teayolo.py
# Single-file training script for a tea-specialized YOLO (tiny-object biased with P2 head + RFBlite)
# Requirements: `pip install ultralytics>=8.2.0 opencv-python`
# Usage:
#   python train_teayolo.py --data /path/to/tea.yaml --imgsz 960 --epochs 200 --batch 16 --device 0
# Optional:
#   --export onnx tflite --int8  (exports at the end)

import argparse
import os
import sys
from pathlib import Path
import textwrap

# ---------------------------
# 1) Define RFBlite
# ---------------------------
import torch
import torch.nn as nn

# In recent versions of Ultralytics, you no longer need to use a decorator to register a custom module.
# You can define the module class in your script, and Ultralytics will automatically find it.
# The previous `from ultralytics.nn.modules import register_module` is now deprecated.

class DWConv(nn.Module):
    def __init__(self, c1, c2, k=3, s=1, p=None):
        super().__init__()
        p = k // 2 if p is None else p
        self.conv = nn.Sequential(
            nn.Conv2d(c1, c1, k, s, p, groups=c1, bias=False),
            nn.BatchNorm2d(c1),
            nn.SiLU(),
            nn.Conv2d(c1, c2, 1, 1, 0, bias=False),
            nn.BatchNorm2d(c2),
            nn.SiLU()
        )
    def forward(self, x):  
        return self.conv(x)

class RFBlite(nn.Module):
    """
    Tiny Receptive Field Block (export-safe).
    Three depthwise-dilated branches fused by a depthwise conv.
    Args:
        c: input/output channels
        r: reduction ratio for mid channels
        dilations: tuple of dilation rates
    """
    def __init__(self, c, r=0.5, dilations=(1, 3, 5)):
        super().__init__()
        mid = max(8, int(c * r))
        self.branches = nn.ModuleList([
            nn.Sequential(
                nn.Conv2d(c, mid, 1, 1, 0, bias=False),
                nn.BatchNorm2d(mid), nn.SiLU(),
                nn.Conv2d(mid, mid, 3, 1, d, padding=d, groups=mid, bias=False),
                nn.BatchNorm2d(mid), nn.SiLU(),
                nn.Conv2d(mid, c, 1, 1, 0, bias=False),
                nn.BatchNorm2d(c), nn.SiLU()
            ) for d in dilations
        ])
        self.fuse = DWConv(c * (len(dilations)+1), c, 3, 1)

    def forward(self, x):
        outs = [x] + [b(x) for b in self.branches]
        return self.fuse(torch.cat(outs, 1))

# ------------------------------------------------
# 2) Write TeaYOLO-N (P2 head + RFBlite) YAML file
# ------------------------------------------------
TEAYOLO_YAML = """\
# TeaYOLO-N (tiny-object biased with P2 head + RFBlite)
# Train:
#   yolo detect train model=teayolo-n-p2.yaml data=tea.yaml imgsz=960 epochs=200
nc: 18  # change to your number of classes if different
scales:
  depth_multiple: 0.33
  width_multiple: 0.25

backbone:
  - [-1, 1, Conv, [64, 3, 2]]
  - [-1, 1, Conv, [64, 3, 1]]
  - [-1, 1, C2f,  [64, 1, True]]
  - [-1, 1, Conv, [128, 3, 2]]    # P2/4
  - [-1, 2, C2f,  [128, 1, True]]
  - [-1, 1, Conv, [256, 3, 2]]    # P3/8
  - [-1, 2, C2f,  [256, 1, True]]
  - [-1, 1, Conv, [512, 3, 2]]    # P4/16
  - [-1, 2, C2f,  [512, 1, True]]
  - [-1, 1, SPPF, [512, 5]]
  - [-1, 1, Conv, [512, 1, 1]]

neck:
  # Slim adapters
  - [3, 1, Conv, [96, 1, 1]]      # P2 in
  - [6, 1, Conv, [128, 1, 1]]    # P3 in
  - [8, 1, Conv, [192, 1, 1]]    # P4 in
  - [9, 1, Conv, [256, 1, 1]]    # P5 in

  # Top-down FPN
  - [9, 1, Upsample, [None, 2]]
  - [[-1, 8], 1, Concat, [1]]
  - [-1, 1, C2f, [192, 1, True]]

  - [-1, 1, Upsample, [None, 2]]
  - [[-1, 6], 1, Concat, [1]]
  - [-1, 1, C2f, [128, 1, True]]

  - [-1, 1, Upsample, [None, 2]]
  - [[-1, 4], 1, Concat, [1]]
  - [-1, 1, RFBlite, [96]]        # Tiny-object context on P2
  - [-1, 1, C2f, [96, 1, True]]

  # Bottom-up PAN
  - [-1, 1, Conv, [128, 3, 2]]
  - [[-1, 14], 1, Concat, [1]]
  - [-1, 1, C2f, [128, 1, True]]

  - [-1, 1, Conv, [192, 3, 2]]
  - [[-1, 12], 1, Concat, [1]]
  - [-1, 1, C2f, [192, 1, True]]

  - [-1, 1, Conv, [256, 3, 2]]
  - [[-1, 10], 1, Concat, [1]]
  - [-1, 1, C2f, [256, 1, True]]

head:
  - [[15, 18, 21, 24], 1, Detect, [nc]]  # P2, P3, P4, P5
"""

def ensure_model_yaml(path: Path):
    if not path.exists():
        path.write_text(TEAYOLO_YAML)
        print(f"[Info] Wrote model YAML to: {path.resolve()}")
    else:
        print(f"[Info] Using existing model YAML: {path.resolve()}")

# ---------------------------
# 3) Train / Validate / Export
# ---------------------------
def main():
    parser = argparse.ArgumentParser(description="Train TeaYOLO with RFBlite (single-file).")
    parser.add_argument("--data", type=str, required=True, help="Path to your Ultralytics data YAML (tea.yaml).")
    parser.add_argument("--model", type=str, default="teayolo-n-p2.yaml", help="Model YAML output/name.")
    parser.add_argument("--imgsz", type=int, default=960)
    parser.add_argument("--epochs", type=int, default=200)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--device", type=str, default="0", help="GPU id, e.g. 0; use 'cpu' for CPU.")
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--project", type=str, default="runs/teayolo", help="Ultralytics project dir.")
    parser.add_argument("--name", type=str, default="teayolo-n-p2", help="Run name.")
    parser.add_argument("--export", type=str, default="", choices=["", "onnx", "tflite"], help="Export format after training.")
    parser.add_argument("--int8", action="store_true", help="INT8 (TFLite) export if --export tflite.")
    args = parser.parse_args()

    # 2) Write YAML if needed
    model_yaml = Path(args.model)
    ensure_model_yaml(model_yaml)

    # Lazy import Ultralytics runtime
    from ultralytics import YOLO

    print("\n[Info] Loading model YAML and starting training...")
    model = YOLO(str(model_yaml))

    # Recommended tiny-object augment knobs (safe defaults)
    train_kwargs = dict(
        data=args.data,
        imgsz=args.imgsz,
        epochs=args.epochs,
        batch=args.batch,
        device=args.device,
        workers=args.workers,
        project=args.project,
        name=args.name,
        verbose=True,
        # Augment & opt
        optimizer="adamw",
        lr0=0.002, lrf=0.1, warmup_epochs=5,
        mosaic=1.0, mixup=0.1,
        hsv_h=0.015, hsv_s=0.40, hsv_v=0.20,
        translate=0.05, scale=0.5, shear=0.0, degrees=0.0,
        cos_lr=True,
        cache=True
    )

    # Train
    model.train(**train_kwargs)

    # Validate (on the best weights)
    print("\n[Info] Validating best weights...")
    best = Path(args.project) / args.name / "weights" / "best.pt"
    model_val = YOLO(str(best)) if best.exists() else model
    model_val.val(data=args.data, imgsz=args.imgsz, device=args.device, workers=args.workers)

    # Optional export
    if args.export:
        print(f"\n[Info] Exporting to {args.export} ...")
        export_kwargs = dict(format=args.export)
        if args.export == "tflite" and args.int8:
            export_kwargs.update(dict(int8=True))  # provide a representative dataset when prompted/logged
        model_val.export(**export_kwargs)
        print("[Info] Export complete.")

    print("\n[Done] Training pipeline finished.")

if __name__ == "__main__":
    main()
