# FireVolt

**Smart early fire detection for electrical rooms.**

FireVolt uses computer vision (YOLO26) to detect **fire**, **smoke** and **sparks** from camera streams, with the goal of raising an alert before a small incident turns into a fire.

---

## Table of contents

- [Context](#context)
- [AI model](#ai-model)
- [Results](#results)
- [Dataset](#dataset)
- [Usage](#usage)
- [Training](#training)
- [Acknowledgements](#acknowledgements)
---

## Context

Electrical rooms and distribution substations are often located in the middle of cities and residential areas, close to homes and the public, yet they are only visited occasionally. Without permanent monitoring, smoke or a small fire can go unnoticed, and a late detection makes the risk spread quickly.

FireVolt addresses three questions:

1. **Detect:** how to automatically identify smoke, flames and sparks without relying on a single localized physical sensor?
2. **Monitor:** how to provide continuous 24/7 watch in an unattended environment?
3. **Alert:** how to transmit the information quickly to remote response teams?


## AI model

| Property | Value |
|---|---|
| Architecture | YOLO26s (Ultralytics) |
| Parameters | 9.47 M |
| Compute | 20.8 GFLOPs |
| Input size | 800 × 800 |
| Classes | `fire`, `smoke`, `spark` |
| Inference speed | ~12.7 ms / image (NVIDIA RTX 2050, 4 GB) |

| ID | Class | Description |
|----|-------|-------------|
| 0 | `fire` | Flames |
| 1 | `smoke` | Smoke |
| 2 | `spark` | Electrical sparks |

---

## Results

Evaluated on the validation split of the dataset (1,638 images, 2,241 instances):

| Class | Precision | Recall | mAP50 | mAP50-95 |
|-------|-----------|--------|-------|----------|
| fire  | 0.852 | 0.789 | 0.854 | 0.519 |
| smoke | 0.942 | 0.858 | 0.924 | 0.663 |
| spark | 0.978 | 0.966 | 0.992 | 0.944 |
| **all** | **0.924** | **0.871** | **0.923** | **0.709** |

---

## Dataset

Final model trained on **spark-detector** (Roboflow Universe):

- Source: https://universe.roboflow.com/fahads-workspace-0gh18/spark-detector-pcnjm
- Author: fahads-workspace
- Images: ~8,212 · Classes: 3 (`fire`, `smoke`, `spark`)

---


## Usage

### Detect on an image

```bash
yolo predict model=weights/best.pt source=your_image.jpg conf=0.4 save=True
```

### Detect on a video

```bash
yolo predict model=weights/best.pt source=your_video.mp4 conf=0.4 save=True
```

### Live webcam
```bash
yolo predict model=weights/best.pt source=0 conf=0.4 show=True

```


## Training

```bash
yolo task=detect mode=train model=yolo26s.pt data=data.yaml epochs=100 patience=20 imgsz=800 batch=6 workers=4 name=incendie_spark
```

| Parameter | Value |
|-----------|-------|
| Base model | `yolo26s.pt` (pretrained) |
| Epochs | 100 (`patience=20`) |
| Image size | 800 |
| Batch size | 6 |
| Optimizer | auto (AdamW) |
| GPU | NVIDIA GeForce RTX 2050 (4 GB) |

---




## Acknowledgements

- [Ultralytics](https://github.com/ultralytics/ultralytics) for YOLO
- [Roboflow Universe](https://universe.roboflow.com/) 

