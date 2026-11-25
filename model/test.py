import ultralytics
import cv2
import time
import csv
from datetime import datetime
from ultralytics import YOLO



MODEL_PATH = r"weights/best_1.pt"   # path to your trained weights

MODEL_PATH = "yolo11n.pt"


# Load YOLOv8 model (nano version for faster inference)
#model = YOLO('yolov8n.pt')
#model = YOLO('yolov8n_ncnn_model')
model = YOLO('best_ncnn_model')

#model = YOLO(MODEL_PATH)




# Relevant traffic object classes
relevant_classes = [
    'person', 'bicycle', 'car', 'motorcycle', 'bus', 'train', 'truck',
    'traffic light', 'stop sign'
]

# Full COCO class list
class_list = model.names

# Open video file
#cap = cv2.VideoCapture('dhaka.mp4')
#cap = cv2.VideoCapture('saltlake_traffic.mp4')
#cap = cv2.VideoCapture('http://10.230.246.159:8080/video')
camera_index = 0 
cap = cv2.VideoCapture(camera_index)

# camera_index = 0
# cap = cv2.VideoCapture(camera_index)

if not cap.isOpened():
    print("Error: Could not open video file")
    exit()

# Get video FPS and compute ideal frame delay
fps_video = cap.get(cv2.CAP_PROP_FPS)
frame_delay = int(1000 / fps_video)
print(f"Video FPS: {fps_video:.2f}")

# CSV logging setup
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
csv_filename = f"object_log_{timestamp}.csv"
header = ["Frame_ID", "FPS", "Timestamp"] + relevant_classes

with open(csv_filename, mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(header)

print(f"Logging started: {csv_filename}")

frame_id = 0
confidence_threshold = 0.5
fps_buffer = []
fps_buffer_size = 10

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_id += 1
    start_time = time.time()

    frame = cv2.resize(frame, (1020, 500))
    results = model.predict(
        frame,
        verbose=False,
        conf=confidence_threshold,
        iou=0.5,
        imgsz=640
    )

    detections = results[0].boxes.data.cpu().numpy()
    object_counts = {cls: 0 for cls in relevant_classes}

    for det in detections:
        x1, y1, x2, y2, conf, cls_id = det
        cls_name = class_list[int(cls_id)]
        if cls_name in relevant_classes and conf > confidence_threshold:
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
            cv2.putText(frame, f"{cls_name} {conf:.2f}", (int(x1), int(y1) - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            object_counts[cls_name] += 1

    # FPS calculation
    end_time = time.time()
    current_fps = 1 / (end_time - start_time)
    fps_buffer.append(current_fps)
    if len(fps_buffer) > fps_buffer_size:
        fps_buffer.pop(0)
    smoothed_fps = sum(fps_buffer) / len(fps_buffer)

    # Display information
    cv2.putText(frame, f"FPS: {smoothed_fps:.2f}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    cv2.putText(frame, f"Frame: {frame_id}", (20, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    y_offset = 100
    displayed_count = 0
    for obj, count in object_counts.items():
        if count > 0:
            cv2.putText(frame, f"{obj}: {count}", (20, y_offset),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            y_offset += 25
            displayed_count += 1

    if displayed_count == 0:
        cv2.putText(frame, "No traffic objects detected", (20, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    # Log to CSV
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(csv_filename, mode='a', newline='') as file:
        writer = csv.writer(file)
        row = [frame_id, round(smoothed_fps, 2), timestamp_str] + [object_counts[obj] for obj in relevant_classes]
        writer.writerow(row)

    cv2.imshow("YOLOv8 Traffic Object Detection", frame)

    # Proper delay for real-time playback
    if cv2.waitKey(frame_delay) & 0xFF == 27:  # ESC to quit
        break

cap.release()
cv2.destroyAllWindows()
print(f"Detection and logging completed.\nData saved to: {csv_filename}")
