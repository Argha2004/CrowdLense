from ultralytics import YOLO
import multiprocessing

if __name__ == "__main__":
    # Optional: ensures multiprocessing safety on Windows
    multiprocessing.freeze_support()

    # Load pretrained YOLOv11n model (you can also use yolov8l.pt, yolov11l.pt etc.)
    model = YOLO("yolo11s.pt")

    # Train configuration
    results = model.train(
        data="dataset.yaml",           # path to your dataset.yaml
        epochs=50,                     # number of epochs
        imgsz=640,                     # image size
        batch=32,                      # batch size
        name="yolo11n_frozen_backbone",# name of the experiment folder
        device=0,                      # use GPU (set to 'cpu' if no GPU)
        workers=2,                     # number of data loading workers
        #freeze="backbone",             # freezes all backbone layers
        pretrained=True,               # use pretrained weights
        verbose=True                   # print detailed logs
    )

    # Optional: evaluate and plot results
    metrics = model.val()              # run validation after training
    # model.plot_results()               # plot training curves (saved as results.png)
