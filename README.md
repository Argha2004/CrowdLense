# CrowdLense 🚦

<div align="center">

**Privacy-Preserving Crowdsourced Traffic Monitoring Platform**

A full-stack web application for real-time traffic monitoring using Raspberry Pi devices with YOLO11-s object detection

</div>

---

## 📋 Overview

CrowdLense is a crowdsourced traffic monitoring platform that leverages edge computing and computer vision to provide real-time traffic analytics. The system uses Raspberry Pi devices equipped with cameras running YOLO11-s for privacy-preserving vehicle detection and classification.

### Key Highlights
- 🔒 **Privacy-First**: Edge computing ensures no raw images are transmitted
- 🎯 **Accurate Detection**: YOLO11-s trained on Indian Driving Dataset (IDD)
- 🌐 **Dual Dashboard**: Separate interfaces for data providers and viewers
- 📊 **Real-time Analytics**: Live traffic data visualization with charts
- 🗺️ **Interactive Maps**: Leaflet-powered device tracking
- 📤 **Data Export**: CSV export for further analysis

## ✨ Features

### For Traffic Data Providers
- 📍 Add and manage traffic monitoring devices
- 🔧 Configure IoT device credentials
- 📈 Monitor device status (online/offline)
- 📊 View device-specific analytics
- 🗺️ Interactive map view of all deployed devices

### For Traffic Data Viewers
- 🗺️ Explore all active traffic sensors on an interactive map
- 📊 View real-time traffic data and analytics
- 📈 Visualize vehicle type distribution with charts
- 📥 Export traffic data as CSV
- 🔍 Filter and analyze historical traffic patterns

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

### IoT Edge (Raspberry Pi)
- **YOLO11-s** - Object detection model
- **Python** - Device software
- **Camera Module** - Image capture

## 📁 Project Structure

```
CrowdLense_Fi/
├── backend/
│   ├── app.py              # Flask API server
│   └── requirements.txt    # Python dependencies
|
|
├── frontend/
│       ├── src/
│       │   ├── components/         # React components
│       │   │   ├── AuthPage.tsx
│       │   │   ├── ViewerDashboard.tsx
│       │   │   ├── ProviderDashboard.tsx
│       │   │   ├── DeviceDetail.tsx
│       │   │   ├── AddDeviceDialog.tsx
│       │   │   └── ui/            # shadcn/ui components
│       │   ├── services/          # API service layer
│       │   │   ├── api.ts         # API client functions
│       │   │   └── deviceCache.ts # Device data caching
│       │   ├── data/              # Mock data & type definitions
│       │   ├── styles/            # Global CSS
│       │   ├── App.tsx            # Main application
│       │   └── main.tsx           # Entry point
│       ├── public/
│       │   └── markers/           # Map marker icons
│       ├── package.json
│       ├── vite.config.ts
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

**ARGHADEEP PAHIRA , ANKITA CHANDA , SHUBHAM BHUNIA**

Sister Nivedita University  
B.Tech in Computer Science & Business Systems(Y3)
Department of Computer Science & Engineering  
New Town, Kolkata - 700156

## 📧 Contact

For questions or support, please open an issue or contact the development team.
shubhambhunia20b@gmail.com
---

<div align="center">

Made with ❤️ for safer and smarter cities

**[⬆ Back to Top](#crowdlense-)**

</div>
