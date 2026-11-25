import ncnn
import cv2
import time
import psutil
import os

# ========== CONFIG ==========
MODEL_PARAM = "/home/pi/Downloads/YOLO/Yolo_8n/NCNN/model.ncnn.param"
MODEL_BIN   = "/home/pi/Downloads/YOLO/Yolo_8n/NCNN/model.ncnn.bin"
IMAGE_PATH  = "/home/pi/Downloads/bus.jpg"
NUM_RUNS    = 20
# ============================

# Download test image if missing
if not os.path.exists(IMAGE_PATH):
    import urllib.request
    print("Downloading sample image...")
    urllib.request.urlretrieve("https://ultralytics.com/images/bus.jpg", IMAGE_PATH)

# Load image
img = cv2.imread(IMAGE_PATH)
if img is None:
    raise FileNotFoundError(f"Could not read image: {IMAGE_PATH}")

# Load NCNN model
net = ncnn.Net()
net.opt.use_vulkan_compute = False
net.load_param(MODEL_PARAM)
net.load_model(MODEL_BIN)

# Prepare input
img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
in_blob = ncnn.Mat.from_pixels_resize(img, ncnn.Mat.PixelType.PIXEL_RGB, img.shape[1], img.shape[0], 640, 640)

# Benchmark loop
fps_list, cpu_list, mem_list, ms_list = [], [], [], []

for i in range(NUM_RUNS):
    start = time.time()

    ex = net.create_extractor()
    ex.set_light_mode(True)
    ex.input("images", in_blob)
    ret, out = ex.extract("output0")

    end = time.time()
    elapsed = end - start
    fps = 1 / elapsed
    ms = elapsed * 1000

    fps_list.append(fps)
    ms_list.append(ms)
    cpu_list.append(psutil.cpu_percent())
    mem_list.append(psutil.virtual_memory().percent)

    print(f"Run {i+1}: {fps:.2f} FPS ({ms:.2f} ms/frame)")

print("\n--- NCNN Benchmark Results ---")
print(f"Average FPS: {sum(fps_list)/len(fps_list):.2f}")
print(f"Average Time: {sum(ms_list)/len(ms_list):.2f} ms/frame")
print(f"Average CPU: {sum(cpu_list)/len(cpu_list):.1f}%")
print(f"Average RAM: {sum(mem_list)/len(mem_list):.1f}%")
