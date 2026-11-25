# CrowdLense — Model Training & Edge Inference (`model/`)

This directory contains the computer vision pipeline for **CrowdLense**, a research project on privacy-preserving, crowdsourced traffic monitoring.

## Architecture & Workflow

The pipeline is split across two environments:

1. **Training & Validation (Workstation / GPU):** Dataset preparation, class remapping, YOLO11-s model training, and visual validation are performed on a separate machine with GPU acceleration.
2. **Edge Deployment (Raspberry Pi):** The trained model is exported to **NCNN** format and deployed to a Raspberry Pi edge device for real-time vehicle detection, CSV logging, and performance benchmarking (`test.py` and `fps_test.py`).

---

## Dataset

- **Dataset Link:** [IDD-YOLO (Indian Driving Dataset for Object Detection) on Kaggle](https://www.kaggle.com/datasets/ankita2028/idd-yolo-indian-driving-dataset-for-object-detect)
- **Why Modified:** The original Indian Driving Dataset (IDD) annotations and class structure are not directly suitable for standard YOLO training. This modified dataset adapts IDD into YOLO format and consolidates classes for traffic monitoring.

---

## Files Overview

### 1. Workstation / Training & Validation

| File | Purpose |
| :--- | :--- |
| [`data_label.py`](data_label.py) | Prepares the dataset from `old_data_set/` (`train/` and `valid/` splits) into `dataset_with_person/`. Remaps the 21 original class IDs (`0`–`20`) into 7 consolidated classes (`0`–`6`), runs `yolo11m.pt` (`CONF_THRESHOLD = 0.35`) to auto-detect `person` (COCO class `0`), and appends person bounding boxes as class ID `7`. |
| [`train.py`](train.py) | Trains `yolo11s.pt` on `dataset.yaml` using Ultralytics (`epochs=50`, `imgsz=640`, `batch=32`, `device=0`, `workers=2`, `pretrained=True`) and runs `model.val()` after training completes. |
| [`val.py`](val.py) | Loads trained weights (`MODEL_PATH`) and runs inference (`CONF_THRESHOLD = 0.5`) on images in `valid/images`, displaying annotated predictions sequentially with OpenCV (`q` to quit). |

### 2. Raspberry Pi / Edge Inference & Benchmarking

| File | Purpose |
| :--- | :--- |
| [`test.py`](test.py) | Runs real-time traffic object detection on the Raspberry Pi using the NCNN-exported model (`best_ncnn_model`). Captures frames from a camera (`camera_index = 0`) or video source, resizes to `1020x500`, runs inference (`conf=0.5`, `iou=0.5`, `imgsz=640`), overlays bounding boxes and smoothed FPS (10-frame moving average), and logs per-frame counts (`person`, `bicycle`, `car`, `motorcycle`, `bus`, `train`, `truck`, `traffic light`, `stop sign`) to `object_log_<timestamp>.csv`. Press `ESC` to stop. |
| [`fps_test.py`](fps_test.py) | Benchmarks raw NCNN model inference on the Raspberry Pi (`ncnn.Net()`, `use_vulkan_compute = False`). Runs `20` forward passes on a `640x640` RGB input image (auto-downloading `bus.jpg` if missing) and reports average FPS, inference latency (`ms/frame`), CPU usage (`%`), and RAM usage (`%`) via `psutil`. |

---

## Quick Usage

### Training (on GPU Workstation)

1. Download the dataset from Kaggle and place `dataset.yaml` along with `train/` and `valid/` folders in the working directory.
2. *(Optional)* Run class remapping and person auto-labeling:
   ```bash
   python data_label.py
   ```
3. Train the YOLO11-s model:
   ```bash
   python train.py
   ```
4. Visually inspect validation predictions (update `MODEL_PATH` in `val.py` first):
   ```bash
   python val.py
   ```
5. Export the trained `best.pt` weights to NCNN format (e.g., via Ultralytics `yolo export model=best.pt format=ncnn`) and transfer the resulting `best_ncnn_model` / `.param` & `.bin` files to the Raspberry Pi.

### Edge Inference & Benchmarking (on Raspberry Pi)

- **Run live detection & CSV logging** (ensure `best_ncnn_model` is in the working directory and a camera is connected):
  ```bash
  python test.py
  ```
- **Run NCNN FPS & resource benchmark** (update `MODEL_PARAM`, `MODEL_BIN`, and `IMAGE_PATH` in `fps_test.py` as needed):
  ```bash
  python fps_test.py
  ```
