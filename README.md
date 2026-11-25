# CrowdLense 🚦

<div align="center">

**Privacy-Preserving Crowdsourced Traffic Monitoring Platform (Research Project)**

A full-stack research platform for real-time traffic monitoring using Raspberry Pi edge devices with YOLO11-s (NCNN) object detection and a web analytics dashboard.

📄 **Research Paper:** [IEEE COMSNETS 2026 — CrowdLense (DOI: 10.1109/COMSNETS67989.2026.11418200)](https://doi.org/10.1109/COMSNETS67989.2026.11418200)

</div>

---

## 📋 Overview

**CrowdLense** is a research project investigating privacy-preserving, crowdsourced traffic monitoring through edge computing and computer vision. Model training and validation are performed on a GPU workstation using a modified [IDD-YOLO dataset](https://www.kaggle.com/datasets/ankita2028/idd-yolo-indian-driving-dataset-for-object-detect), while the NCNN-exported YOLO11-s model runs directly on Raspberry Pi edge devices so raw camera frames never leave the node.

### Key Highlights
- **Privacy-First**: Edge computing ensures no raw images are transmitted
- **Accurate Detection**: YOLO11-s trained on Indian Driving Dataset (IDD)
- **Dual Dashboard**: Separate interfaces for data providers and viewers
- **Real-time Analytics**: Live traffic data visualization with charts
- **Interactive Maps**: Leaflet-powered device tracking
- **Data Export**: CSV export for further analysis

## ✨ Features

### For Traffic Data Providers
- Add and manage traffic monitoring devices
- Configure IoT device credentials
- Monitor device status (online/offline)
- View device-specific analytics
- Interactive map view of all deployed devices

### For Traffic Data Viewers
- Explore all active traffic sensors on an interactive map
- View real-time traffic data and analytics
- Visualize vehicle type distribution with charts
- Export traffic data as CSV
- Filter and analyze historical traffic patterns

### Vehicle Detection
Detects **7 vehicle types** using YOLO11-s:
- 🚗 Cars
- 🏍️ Motorcycles
- 🛺 Auto-Rickshaws
- 🚚 Trucks
- 🚌 Buses
- 🚴 Bicycles
- 🚶 Pedestrians

## 🎮 Demo

### Demo Credentials

**Viewer Account**
```
Email: viewer@example.com
Password: PlainTextPassword
```

**Provider Account**
```
Email: provider@example.com
Password: PlainTextPassword
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Argha2004/crowdlense.git
cd crowdlense
```

### 2️⃣ Backend Setup (Flask API)

```bash
# Navigate to backend folder
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

Backend runs on: `http://localhost:5000`

### 3️⃣ Frontend Setup (React + Vite)

```bash
#navigate to frontend folder
cd frontend

# From project root directory
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:3000`

### 4️⃣ Access the Application

Open your browser and navigate to `http://localhost:3000`

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework with hooks |
| **TypeScript** | Type-safe development |
| **Vite** | Lightning-fast build tool |
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn/ui** | Accessible UI components (Radix UI) |
| **Leaflet** | Interactive maps |
| **Recharts** | Data visualization |
| **Lucide React** | Beautiful icons |
| **Sonner** | Toast notifications |
| **React Hook Form** | Form management |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Flask 3.0** | Python web framework |
| **Flask-CORS** | Cross-origin resource sharing |
| **JWT** | Authentication tokens |

### IoT Edge & Model Pipeline (`model/`)
- **Training & Validation (GPU Workstation):** [Ultralytics YOLO11-s](model/train.py), [class remapping & person auto-labeling](model/data_label.py), and [visual validation](model/val.py)
- **Edge Inference & Benchmarking (Raspberry Pi):** [NCNN real-time detection & CSV logging](model/test.py) and [NCNN FPS/CPU/RAM benchmark](model/fps_test.py)
- **Dataset:** Modified [IDD-YOLO (Indian Driving Dataset for Object Detection)](https://www.kaggle.com/datasets/ankita2028/idd-yolo-indian-driving-dataset-for-object-detect)

For full details on training, dataset preparation, and Raspberry Pi execution, see [`model/Readme.md`](model/Readme.md).

## 🖥️ Web Dashboard

The web dashboard (`frontend/` + `backend/`) provides role-based access for **Traffic Data Viewers** and **Data Providers**, backed by a Flask REST API (`http://localhost:5000/api/v1`):

- **Authentication (`AuthPage.tsx`):** Sign up and login as either a `viewer` or `provider`.
- **Viewer Dashboard (`ViewerDashboard.tsx` & `DeviceDetail.tsx`):**
  - Interactive Leaflet map displaying all registered sensors with online (green) and offline (red) status markers.
  - Search/filter sensors by address or GPS coordinates.
  - Device analytics view with a Recharts multi-class vehicle trend `LineChart`, latest vehicle distribution `PieChart`, flow rate/congestion/dominant-type summary cards, location map, and one-click CSV export.
- **Provider Dashboard (`ProviderDashboard.tsx` & `AddDeviceDialog.tsx`):**
  - Overview of total, online, and offline devices owned by the provider.
  - Register new sensor locations (latitude, longitude, address) or remove existing devices.
  - Generate and download a Raspberry Pi setup package (`sensor.py`, `setup.sh`, `requirements.txt`, `README.md`) for each registered device.

## 🤖 Model Training & Edge Testing (`model/`)

The [`model/`](model/Readme.md) folder separates heavy training from lightweight edge deployment:

- **Workstation (Training & Validation):** `data_label.py` remaps 21 original IDD classes to 7 traffic classes and auto-labels pedestrians (`yolo11m.pt`), `train.py` fine-tunes `yolo11s.pt` (`epochs=50`, `imgsz=640`, `batch=32`), and `val.py` visualizes predictions on validation images.
- **Raspberry Pi (Edge Testing):** `test.py` runs live camera/video inference using the NCNN-exported model (`best_ncnn_model`), overlays bounding boxes and smoothed FPS, and logs per-frame class counts to CSV; `fps_test.py` benchmarks raw NCNN inference FPS, latency, CPU, and RAM usage.

## 📁 Project Structure

```
CrowdLense/
├── backend/
│   ├── app.py                  # Flask REST API server (in-memory demo DB)
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # React components (Auth, Dashboards, DeviceDetail, ui/)
│   │   ├── services/           # API client (api.ts) & coordinate cache (deviceCache.ts)
│   │   ├── data/               # Vehicle type config & chart helpers
│   │   ├── styles/             # Global CSS
│   │   ├── App.tsx             # Main application & role routing
│   │   └── main.tsx            # Entry point
│   ├── public/
│   │   └── markers/            # Map marker icons
│   ├── package.json
│   └── vite.config.ts
├── model/
│   ├── data_label.py           # Dataset class remapping (21 -> 7) & person auto-labeling
│   ├── train.py                # YOLO11-s training script (GPU workstation)
│   ├── val.py                  # Validation prediction visualizer
│   ├── test.py                 # Raspberry Pi NCNN live detection & CSV logger
│   ├── fps_test.py             # Raspberry Pi NCNN FPS/CPU/RAM benchmark
│   └── Readme.md               # Detailed model & edge documentation
└── README.md
```

## 🔌 API Endpoints

### Authentication
```http
POST   /api/v1/auth/signup           # Register new user
POST   /api/v1/auth/login            # Login and get token
POST   /api/v1/auth/logout           # Logout
```

### Provider (Requires Authentication)
```http
GET    /api/v1/providers/dashboard                        # Get dashboard data
POST   /api/v1/providers/devices                          # Add new device
DELETE /api/v1/providers/devices/:deviceId                # Remove device
POST   /api/v1/providers/devices/:deviceId/iot-credentials # Get IoT credentials
```

### Viewer (Requires Authentication)
```http
GET    /api/v1/viewer/devices                         # Get all devices
GET    /api/v1/viewer/devices/:deviceId/traffic       # Get device traffic data
GET    /api/v1/viewer/devices/:deviceId/traffic/export # Export traffic data (CSV)
```

### Traffic Data (IoT Devices)
```http
POST   /api/v1/traffic/logs          # Upload traffic logs from IoT devices
```

## 🔐 Security Notes

⚠️ **This is a demo application** - For production deployment:

- ✅ Implement secure password hashing (bcrypt, argon2)
- ✅ Use proper JWT token management with refresh tokens
- ✅ Add input validation and sanitization
- ✅ Enable HTTPS for all communications
- ✅ Store secrets in environment variables
- ✅ Implement rate limiting
- ✅ Add comprehensive error handling
- ✅ Use a production database (PostgreSQL, MongoDB)
- ✅ Implement proper authentication middleware
- ✅ Add API request logging

## 📊 Data Flow

```
┌─────────────────┐
│  Raspberry Pi   │
│  + Camera       │
│  + YOLO11-s     │
└────────┬────────┘
         │ Vehicle counts only (privacy-preserving)
         ▼
┌─────────────────┐
│   Flask API     │
│   (Backend)     │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│  React Frontend │
│  (Dashboard)    │
└─────────────────┘
```

## 🎯 Roadmap

- [1] Integrate with AWS IoT Core
- [1] Implement WebSocket for real-time updates
- [1] Add PostgreSQL database
- [1] Deploy to cloud (AWS/Vercel)
- [1] Add advanced analytics and heatmaps
- [1] Implement user management system
- [ ] Add mobile application
- [1] Integration with traffic management systems

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**ARGHADEEP PAHIRA , ANKITA CHANDA , SHUBHAM BHUNIA , BIDYUT SAHA**

Sister Nivedita University  
Department of Computer Science & Engineering  
New Town, Kolkata - 700156

## 📧 Contact

For questions or support, please open an issue or contact the development team.
shubhambhunia20b@gmail.com
arghadeeppakhira@gmail.com
---

<div align="center">

Made with ❤️ for safer and smarter cities

**[⬆ Back to Top](#crowdlense-)**

</div>
