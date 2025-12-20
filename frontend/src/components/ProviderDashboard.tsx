import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LogOut, Plus, MapPin, Activity, Download, Trash2 } from 'lucide-react';
import { AddDeviceDialog } from './AddDeviceDialog';
import type { User, TrafficDevice } from '../App';
import { providerAPI } from '../services/api';
import { toast } from 'sonner';

interface ProviderDashboardProps {
  user: User;
  onLogout: () => void;
}

export function ProviderDashboard({ user, onLogout }: ProviderDashboardProps) {
  const [devices, setDevices] = useState<TrafficDevice[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch provider devices from API
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await providerAPI.getDashboard();
        if (response.success) {
          // Map API response to TrafficDevice format
          const mappedDevices = response.data.devices.map((device: any) => ({
            id: device.deviceId,
            lat: device.latitude,
            lng: device.longitude,
            address: device.address,
            providerId: user.email,
            createdAt: new Date().toISOString(),
            status: device.status,
            lastUpdate: device.lastUpdate,
          }));
          setDevices(mappedDevices);
        }
      } catch (error: any) {
        toast.error('Failed to load devices');
        console.error('Fetch devices error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [user.email]);

  const handleAddDevice = async (device: TrafficDevice) => {
    try {
      const response = await providerAPI.addDevice(device.lat, device.lng, device.address);
      if (response.success) {
        const newDevice = {
          ...device,
          id: response.data.deviceId,
        };
        setDevices([...devices, newDevice]);
        toast.success('Device added successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add device');
      console.error('Add device error:', error);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await providerAPI.removeDevice(deviceId);
      setDevices(devices.filter(device => device.id !== deviceId));
      toast.success('Device removed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove device');
      console.error('Remove device error:', error);
    }
  };

  const downloadSetupPackage = (device: TrafficDevice) => {
    // Create mock setup files content
    const pythonCode = `#!/usr/bin/env python3
"""
TrafficSense RPi Sensor Client
Device ID: ${device.id}
Location: ${device.address}
"""

import time
import json
from datetime import datetime
from collections import deque
import paho.mqtt.client as mqtt

# Configuration
DEVICE_ID = "${device.id}"
MQTT_BROKER = "your-aws-iot-endpoint.iot.region.amazonaws.com"
MQTT_PORT = 8883
MQTT_TOPIC = f"traffic/data/{DEVICE_ID}"

# YOLO11-s model path
MODEL_PATH = "./yolo11s_idd_finetuned.ncnn"

class TrafficSensor:
    def __init__(self):
        self.device_id = DEVICE_ID
        self.inference_buffer = deque(maxlen=5)
        self.mqtt_client = self.setup_mqtt()
        
    def setup_mqtt(self):
        """Setup MQTT connection to AWS IoT Core"""
        client = mqtt.Client(client_id=self.device_id)
        # Add your AWS IoT certificates here
        client.tls_set(
            ca_certs="AmazonRootCA1.pem",
            certfile="device-certificate.pem.crt",
            keyfile="device-private.pem.key"
        )
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        return client
    
    def detect_vehicles(self, frame):
        """Run YOLO11-s inference on frame"""
        # TODO: Implement NCNN inference with YOLO11-s
        # This is a placeholder - implement actual inference
        import random
        return random.randint(20, 60)  # Mock vehicle count
    
    def process_frame(self, frame):
        """Process a single frame and add to buffer"""
        vehicle_count = self.detect_vehicles(frame)
        self.inference_buffer.append(vehicle_count)
        return vehicle_count
    
    def get_averaged_count(self):
        """Get average of last 5 inferences"""
        if len(self.inference_buffer) == 0:
            return 0
        return int(sum(self.inference_buffer) / len(self.inference_buffer))
    
    def publish_data(self, vehicle_count):
        """Publish data to AWS IoT Core"""
        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "device_id": self.device_id,
            "vehicle_count": vehicle_count,
            "status": "active"
        }
        
        self.mqtt_client.publish(
            MQTT_TOPIC,
            json.dumps(payload),
            qos=1
        )
        print(f"Published: {payload}")
    
    def run(self):
        """Main sensor loop"""
        print(f"Starting TrafficSense sensor: {self.device_id}")
        print(f"Location: ${device.address}")
        
        # TODO: Initialize camera
        # cap = cv2.VideoCapture(0)
        
        while True:
            # TODO: Capture frame from camera
            # ret, frame = cap.read()
            
            # Process 5 frames
            for _ in range(5):
                # vehicle_count = self.process_frame(frame)
                time.sleep(0.4)  # 2 seconds / 5 inferences
            
            # Get averaged count and publish
            avg_count = self.get_averaged_count()
            self.publish_data(avg_count)
            
            # Heartbeat
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Vehicles: {avg_count}")

if __name__ == "__main__":
    sensor = TrafficSensor()
    sensor.run()
`;

    const setupScript = `#!/bin/bash
# TrafficSense Setup Script for Raspberry Pi
# Device ID: ${device.id}

echo "🚦 TrafficSense Sensor Setup"
echo "=============================="
echo "Device ID: ${device.id}"
echo "Location: ${device.address}"
echo ""

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your AWS IoT certificates to this directory:"
echo "   - AmazonRootCA1.pem"
echo "   - device-certificate.pem.crt"
echo "   - device-private.pem.key"
echo ""
echo "2. Download YOLO11-s NCNN model and place in this directory"
echo ""
echo "3. Run the sensor:"
echo "   source venv/bin/activate"
echo "   python3 sensor.py"
`;

    const requirements = `paho-mqtt==1.6.1
opencv-python==4.8.1.78
numpy==1.24.3
ncnn==1.0.20230816
`;

    const readme = `# TrafficSense Raspberry Pi Sensor

Device ID: ${device.id}
Location: ${device.address}
GPS: ${device.lat}, ${device.lng}

## Hardware Requirements
- Raspberry Pi 4/5
- Camera Module or USB Camera
- 16GB+ SD Card
- Stable power supply

## Setup Instructions

1. Extract this package to your Raspberry Pi
2. Run the setup script:
   \`\`\`bash
   chmod +x setup.sh
   ./setup.sh
   \`\`\`

3. Add AWS IoT certificates (provided separately via AWS Console)
4. Download the YOLO11-s NCNN model
5. Start the sensor:
   \`\`\`bash
   source venv/bin/activate
   python3 sensor.py
   \`\`\`

## Model Information
- Model: YOLO11-s (Small variant)
- Engine: NCNN
- Fine-tuned on: IDD (Indian Driving Dataset)
- Inference interval: 2 seconds (5 frames averaged)
- Classes: Cars, Trucks, Buses, Motorcycles, etc.

## Troubleshooting
- Ensure camera is properly connected
- Check AWS IoT credentials
- Verify internet connectivity
- Monitor system resources (RAM, CPU)

For support, contact: support@trafficsense.example.com
`;

    // Create a simple text file with instructions since we can't create actual ZIP
    const packageContent = `TrafficSense Setup Package
Device ID: ${device.id}
Location: ${device.address}

=== FILES IN THIS PACKAGE ===

1. sensor.py - Main sensor application
2. setup.sh - Setup script
3. requirements.txt - Python dependencies
4. README.md - Complete instructions

=== sensor.py ===
${pythonCode}

=== setup.sh ===
${setupScript}

=== requirements.txt ===
${requirements}

=== README.md ===
${readme}

========================================
Extract these files on your Raspberry Pi and follow README.md instructions.
`;

    const blob = new Blob([packageContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trafficsense-setup-${device.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="size-6 text-indigo-600" />
            <div>
              <h1 className="text-indigo-900">Data Provider Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>Total Devices</CardDescription>
              <CardTitle className="text-3xl">{devices.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Online Devices</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {devices.filter(d => d.status === 'online').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Offline Devices</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {devices.filter(d => d.status === 'offline').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Devices List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Devices</CardTitle>
                <CardDescription>Manage your traffic sensor deployments</CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="size-4 mr-2" />
                Add New Device
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-muted-foreground mb-2">No devices yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by adding your first traffic sensor
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="size-4 mr-2" />
                  Add First Device
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-gray-900">{device.address}</h3>
                          <Badge variant={device.status === 'online' ? 'default' : 'destructive'}>
                            {device.status}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="size-4" />
                            <span>GPS: {device.lat.toFixed(4)}, {device.lng.toFixed(4)}</span>
                          </div>
                          <div>
                            Device ID: <span className="font-mono">{device.id}</span>
                          </div>
                          <div>
                            Registered: {new Date(device.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            Last Update: {new Date(device.lastUpdate).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadSetupPackage(device)}
                        >
                          <Download className="size-4 mr-2" />
                          Download Setup
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveDevice(device.id)}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        

      </main>

      <AddDeviceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddDevice={handleAddDevice}
      />
    </div>
  );
}
