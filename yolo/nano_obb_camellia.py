#!/usr/bin/env python3
# Realtime YOLO-OBB on Jetson Nano (CSI cam)
# Deps: sudo apt install python3-opencv gstreamer1.0-tools gstreamer1.0-plugins-base gstreamer1.0-plugins-good
#       pip3 install ultralytics

import cv2
import time
import argparse
from ultralytics import YOLO

def gst_csi(sensor=0, cap_w=1920, cap_h=1080, out_w=960, out_h=540, fps=30, flip=0, use_underscore=False):
    # Use sensor-id (hyphen) by default; fall back to sensor_id if needed
    sid_key = "sensor_id" if use_underscore else "sensor-id"
    return (
        f"nvarguscamerasrc {sid_key}={sensor} ! "
        f"video/x-raw(memory:NVMM), width={cap_w}, height={cap_h}, framerate={fps}/1 ! "
        f"nvvidconv flip-method={flip} ! "
        f"video/x-raw, width={out_w}, height={out_h}, format=BGRx ! "
        f"videoconvert ! video/x-raw, format=BGR ! "
        f"appsink max-buffers=1 drop=True sync=false"
    )

def open_csi(sensor, cap_w, cap_h, out_w, out_h, fps, flip):
    # Try hyphen form first
    pipe = gst_csi(sensor, cap_w, cap_h, out_w, out_h, fps, flip, use_underscore=False)
    cap = cv2.VideoCapture(pipe, cv2.CAP_GSTREAMER)
    if not cap.isOpened():
        # Fallback: underscore form (some JetPack builds use this)
        pipe = gst_csi(sensor, cap_w, cap_h, out_w, out_h, fps, flip, use_underscore=True)
        cap = cv2.VideoCapture(pipe, cv2.CAP_GSTREAMER)
    return cap

def parse_args():
    p = argparse.ArgumentParser("Jetson Nano CSI + YOLO-OBB")
    p.add_argument("--weights", required=True, type=str, help="path to your OBB model .pt")
    p.add_argument("--sensor", type=int, default=0, help="CSI sensor-id (0 or 1)")
    p.add_argument("--cap_w", type=int, default=1920)
    p.add_argument("--cap_h", type=int, default=1080)
    p.add_argument("--out_w", type=int, default=960)
    p.add_argument("--out_h", type=int, default=540)
    p.add_argument("--fps", type=int, default=30)
    p.add_argument("--flip", type=int, default=0, help="0..7; 2 = rotate 180°")
    p.add_argument("--imgsz", type=int, default=512, help="use 416/512 on Nano for speed")
    p.add_argument("--conf", type=float, default=0.35)
    p.add_argument("--device", type=str, default="", help="'' auto | 'cpu' | 'cuda:0' (if PyTorch+CUDA installed)")
    p.add_argument("--stride", type=int, default=1, help="infer every Nth frame")
    p.add_argument("--show", action="store_true", help="try to open an OpenCV preview window")
    p.add_argument("--save", type=str, default="", help="optional MP4 path to record annotated video")
    return p.parse_args()

def main():
    args = parse_args()

    # Load model (Ultralytics auto-detects OBB from weights)
    model = YOLO(args.weights)
    if args.device:
        model.to(args.device)

    # Open CSI camera
    cap = open_csi(args.sensor, args.cap_w, args.cap_h, args.out_w, args.out_h, args.fps, args.flip)
    if not cap.isOpened():
        raise RuntimeError("Unable to open CSI camera via GStreamer. Check sensor-id and nvargus-daemon.")

    # Optional writer
    writer = None
    if args.save:
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        ok, f0 = cap.read()
        if not ok or f0 is None:
            raise RuntimeError("Failed to read initial frame for writer sizing.")
        h, w = f0.shape[:2]
        writer = cv2.VideoWriter(args.save, fourcc, float(args.fps if args.fps>0 else 25.0), (w, h))

    prev_t = time.time()
    can_show = args.show
    win = "YOLO OBB (CSI)"

    frame_id = 0
    try:
        while True:
            ok, frame = cap.read()
            if not ok or frame is None:
                continue

            frame_id += 1
            out = frame

            # Inference every Nth frame (for FPS stability)
            if frame_id % args.stride == 0:
                res = model.predict(
                    frame,
                    imgsz=args.imgsz,
                    conf=args.conf,
                    device=args.device if args.device else None,
                    verbose=False
                )
                out = res[0].plot()

                # FPS overlay
                now = time.time()
                fps = 1.0 / max(now - prev_t, 1e-6)
                prev_t = now
                cv2.putText(out, f"FPS: {fps:.1f}", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2, cv2.LINE_AA)

            if writer is not None:
                writer.write(out)

            if can_show:
                try:
                    cv2.imshow(win, out)
                    if cv2.waitKey(1) & 0xFF in (27, ord('q')):
                        break
                except cv2.error:
                    # GUI not available; continue headless
                    can_show = False

    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        if writer is not None:
            writer.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()

