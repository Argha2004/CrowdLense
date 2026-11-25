import os
import cv2
import shutil
from ultralytics import YOLO
from tqdm import tqdm

# ==============================
# CONFIGURATION
# ==============================
DATASET_DIR = "old_data_set"       # your main dataset folder (contains train/, valid/, dataset.yaml)
OUTPUT_DIR = "dataset_with_person" # new dataset folder
CONF_THRESHOLD = 0.35
PERSON_CLASS_ID = 0
NEW_CLASS_ID_FOR_PERSON = 7

# ==============================
# CLASS MAPPING (21 → 7)
# ==============================
mapping = {
    0: 5,  1: 5,  2: 4,  3: 0,  4: 2,  5: 1,  6: 3,
    7: 2,  8: 2,  9: 1,  10: 0, 11: 3, 12: 5, 13: 4,
    14: 0, 15: 1, 16: 1, 17: 4, 18: 3, 19: 3, 20: 6
}

# ==============================
# LOAD YOLO MODEL
# ==============================
model = YOLO("yolo11m.pt")

# ==============================
# HELPERS
# ==============================
def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def process_split(split_name):
    img_dir = os.path.join(DATASET_DIR, split_name, "images")
    label_dir = os.path.join(DATASET_DIR, split_name, "labels")

    if not os.path.exists(img_dir) or not os.path.exists(label_dir):
        print(f"⚠️ Skipping {split_name}: Missing 'images' or 'labels' folder.")
        return

    out_img_dir = os.path.join(OUTPUT_DIR, split_name, "images")
    out_label_dir = os.path.join(OUTPUT_DIR, split_name, "labels")
    ensure_dir(out_img_dir)
    ensure_dir(out_label_dir)

    img_files = [f for f in os.listdir(img_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not img_files:
        print(f"⚠️ No images found in {img_dir}")
        return

    for img_name in tqdm(img_files, desc=f"Processing {split_name}"):
        img_path = os.path.join(img_dir, img_name)
        label_path = os.path.join(label_dir, os.path.splitext(img_name)[0] + ".txt")

        # 1️⃣ Remap old labels
        new_labels = []
        if os.path.exists(label_path):
            with open(label_path, "r") as f:
                for line in f:
                    parts = line.strip().split()
                    if not parts:
                        continue
                    old_cls = int(parts[0])
                    if old_cls in mapping:
                        parts[0] = str(mapping[old_cls])
                        new_labels.append(" ".join(parts))

        # 2️⃣ Detect persons
        results = model.predict(img_path, conf=CONF_THRESHOLD, verbose=False)
        boxes = results[0].boxes.xywhn.cpu().numpy() if len(results[0].boxes) else []
        cls = results[0].boxes.cls.cpu().numpy() if len(results[0].boxes) else []

        for i in range(len(cls)):
            if cls[i] == PERSON_CLASS_ID:
                x, y, w, h = boxes[i]
                new_labels.append(f"{NEW_CLASS_ID_FOR_PERSON} {x:.6f} {y:.6f} {w:.6f} {h:.6f}")

        # 3️⃣ Save new label
        out_label_path = os.path.join(out_label_dir, os.path.splitext(img_name)[0] + ".txt")
        with open(out_label_path, "w") as f:
            f.write("\n".join(new_labels))

        # 4️⃣ Copy image
        shutil.copy2(img_path, os.path.join(out_img_dir, img_name))

# ==============================
# MAIN
# ==============================
if __name__ == "__main__":
    print(f"🔍 Using dataset in: {DATASET_DIR}")
    print(f"🧩 Output will be saved to: {OUTPUT_DIR}\n")

    for split in ["train", "valid"]:  # directly inside master folder
        process_split(split)

    print("\n✅ Done! Grouped + person dataset saved in:", os.path.abspath(OUTPUT_DIR))
