import cv2
import time
import glob
import os
from ultralytics import YOLO

# ======== USER CONFIGURATION ========
MODEL_PATH = r"D:\traffic_system\dataset2\trafic_data\runs\detect\yolo11n_frozen_backbone3\weights\best.pt"   # path to your trained weights
VAL_IMAGES_FOLDER = r"valid/images"                           # path to your validation images folder
DISPLAY_TIME = 1.0  # seconds per image
CONF_THRESHOLD = 0.5
# ====================================

# Load trained YOLO model
model = YOLO(MODEL_PATH)

# Collect all image files (supports .jpg, .png, .jpeg)
image_paths = glob.glob(os.path.join(VAL_IMAGES_FOLDER, "*.jpg")) + \
              glob.glob(os.path.join(VAL_IMAGES_FOLDER, "*.png")) + \
              glob.glob(os.path.join(VAL_IMAGES_FOLDER, "*.jpeg"))

if not image_paths:
    print("⚠️ No images found in:", VAL_IMAGES_FOLDER)
    exit()

print(f"📸 Found {len(image_paths)} validation images.")
print("🔍 Starting visualization... Press 'q' to quit early.\n")

for img_path in sorted(image_paths):
    # Run inference
    results = model.predict(source=img_path, conf=CONF_THRESHOLD, verbose=False)

    # Get image with bounding boxes drawn
    img_with_boxes = results[0].plot()

    # Display the image
    cv2.imshow("YOLOv11 Validation Predictions", img_with_boxes)

    # Wait for a second or until 'q' is pressed
    if cv2.waitKey(int(DISPLAY_TIME * 1000)) & 0xFF == ord('q'):
        break

cv2.destroyAllWindows()
print("✅ Visualization complete.")
