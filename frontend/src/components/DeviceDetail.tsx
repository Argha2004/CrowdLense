import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Download, Car, Truck, Bus, Calendar, Clock, MapPin, Activity, Wifi, Timer, Bike, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { TrafficDevice, TrafficData } from '../App';
import { viewerAPI } from '../services/api';
import { getDeviceCoordinates } from '../services/deviceCache';
import { generateVehicleTypeData, vehicleTypeColors, vehicleTypeLabels } from '../data/vehicleTypeData';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/markers/marker-icon-2x.png',
  iconUrl: '/markers/marker-icon.png',
  shadowUrl: '/markers/marker-shadow.png',
});

interface DeviceDetailProps {
  deviceId: string;
  onBack: () => void;
}

// Generate mock historical data
const generateMockHistoricalData = (): TrafficData[] => {
  const data: TrafficData[] = [];
  const now = Date.now();
  
  // Generate data for last 24 hours, every 2 minutes
  for (let i = 720; i >= 0; i--) {
    const timestamp = new Date(now - i * 2 * 60 * 1000);
    data.push({
      timestamp: timestamp.toISOString(),
      deviceId: 'device-1',
      vehicleCount: Math.floor(Math.random() * 50) + 20,
      status: 'active',
    });
  }
  
  return data;
};

// Generate chart data (hourly aggregates for last 24 hours)
const generateChartData = (historicalData: TrafficData[]) => {
  const hourlyData: { [key: string]: { count: number; samples: number } } = {};
  
  historicalData.forEach((data) => {
    const hour = new Date(data.timestamp).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit',
      hour12: false 
    });
    
    if (!hourlyData[hour]) {
      hourlyData[hour] = { count: 0, samples: 0 };
    }
    
    hourlyData[hour].count += data.vehicleCount;
    hourlyData[hour].samples += 1;
  });
  
  return Object.entries(hourlyData)
    .map(([time, data]) => ({
      time,
      vehicles: Math.round(data.count / data.samples),
    }))
    .slice(-24); // Last 24 hours
};

export function DeviceDetail({ deviceId, onBack }: DeviceDetailProps) {
  // State for device and traffic data
  const [device, setDevice] = useState<TrafficDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [vehicleTypeChartData, setVehicleTypeChartData] = useState<any[]>([]);

  // Calculate all values that depend on state (before any returns)
  // Vehicle type icon mapping
  const vehicleIcons = {
    Cars: Car,
    Motorcycles: Bike,
    Trucks: Truck,
    Buses: Bus,
    'Auto-Rickshaws': Car,
    Bicycles: Bike,
    Pedestrians: User,
  };

  // Calculate metrics from actual data
  const currentCount = trafficData.length > 0 
    ? trafficData[trafficData.length - 1].carCount + trafficData[trafficData.length - 1].motorcycleCount 
    : 45;
  
  const trafficFlowRate = Math.round(currentCount / 2); // vehicles per minute (assuming 2 min intervals)
  
  const getCongestionLevel = (count: number) => {
    if (count < 30) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (count < 50) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };
  const congestion = getCongestionLevel(currentCount);
  
  const yesterdayComparison = -8;
  
  const lastDataPoint = vehicleTypeChartData.length > 0 ? vehicleTypeChartData[vehicleTypeChartData.length - 1] : null;
  const getDominantVehicleType = () => {
    if (!lastDataPoint) return { name: 'Motorcycles', icon: Bike, color: 'text-red-600', bgColor: 'bg-red-100', value: 0 };
    const types = [
      { name: 'Cars', value: lastDataPoint.cars || 0, icon: vehicleIcons.Cars, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { name: 'Motorcycles', value: lastDataPoint.motorcycles || 0, icon: vehicleIcons.Motorcycles, color: 'text-red-600', bgColor: 'bg-red-100' },
      { name: 'Trucks', value: lastDataPoint.trucks || 0, icon: vehicleIcons.Trucks, color: 'text-orange-600', bgColor: 'bg-orange-100' },
      { name: 'Buses', value: lastDataPoint.buses || 0, icon: vehicleIcons.Buses, color: 'text-green-600', bgColor: 'bg-green-100' },
      { name: 'Auto-Rickshaws', value: lastDataPoint.autoRickshaws || 0, icon: vehicleIcons['Auto-Rickshaws'], color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { name: 'Bicycles', value: lastDataPoint.bicycles || 0, icon: vehicleIcons.Bicycles, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
      { name: 'Pedestrians', value: lastDataPoint.pedestrians || 0, icon: vehicleIcons.Pedestrians, color: 'text-pink-600', bgColor: 'bg-pink-100' },
    ];
    return types.reduce((max, type) => (type.value > max.value ? type : max));
  };
  const dominantType = getDominantVehicleType();

  // Fetch device details from API
  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        setLoading(true);
        console.log('Fetching device data for:', deviceId);
        const response = await viewerAPI.getDeviceTraffic(deviceId);
        console.log('API Response:', response);
        
        if (response.success) {
          const deviceDetails = response.data.deviceDetails;
          const backendTrafficData = response.data.trafficData || [];
          
          // Use coordinates from API response (primary) or cache (fallback)
          const coords = getDeviceCoordinates(deviceId);
          const lat = deviceDetails.latitude || coords?.lat || 22.578626314440456;
          const lng = deviceDetails.longitude || coords?.lng || 88.47671755291033;
          
          console.log('Device coordinates:', { lat, lng, address: deviceDetails.address });
          console.log('Traffic data from backend:', backendTrafficData);
          
          // Map API response to TrafficDevice format
          const mappedDevice: TrafficDevice = {
            id: deviceDetails.deviceId,
            lat: lat,
            lng: lng,
            address: deviceDetails.address,
            providerId: 'provider',
            createdAt: new Date().toISOString(),
            status: deviceDetails.status || 'online',
            lastUpdate: deviceDetails.lastDataUpload || new Date().toISOString(),
          };
          
          // Transform backend data to chart format
          const chartData = backendTrafficData.map((item: any) => {
            const timestamp = new Date(item.timestamp);
            const hour = timestamp.toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit',
              hour12: true 
            });
            
            return {
              hour,
              cars: item.carCount || 0,
              trucks: item.truckCount || 0,
              buses: item.busCount || 0,
              motorcycles: item.motorcycleCount || 0,
              autoRickshaws: item.autoRickshawCount || 0,
              bicycles: item.bicycleCount || 0,
              pedestrians: item.pedestrianCount || 0,
            };
          });
          
          console.log('Setting device:', mappedDevice);
          console.log('Setting chart data:', chartData);
          setDevice(mappedDevice);
          setTrafficData(backendTrafficData);
          setVehicleTypeChartData(chartData);
        } else {
          console.error('API returned success=false');
          throw new Error('API returned unsuccessful response');
        }
      } catch (error: any) {
        console.error('Fetch device error:', error);
        toast.error('Failed to load device details: ' + (error.message || 'Unknown error'));
        
        // Try to get coordinates from cache even on error
        const coords = getDeviceCoordinates(deviceId);
        
        // Set a default device to prevent blank page
        const fallbackDevice = {
          id: deviceId,
          lat: coords?.lat || 22.578626314440456,
          lng: coords?.lng || 88.47671755291033,
          address: 'Unknown Location',
          providerId: 'provider',
          createdAt: new Date().toISOString(),
          status: 'offline' as const,
          lastUpdate: new Date().toISOString(),
        };
        
        console.log('Setting fallback device:', fallbackDevice);
        setDevice(fallbackDevice);
        setTrafficData([]);
        setVehicleTypeChartData([]);
      } finally {
        console.log('Finished loading, setting loading to false');
        setLoading(false);
      }
    };

    fetchDeviceData();
  }, [deviceId]);

  // Initialize device location map (must be before any early returns)
  useEffect(() => {
    // Only run if we have a device
    if (!device) return;

    let map: L.Map | null = null;

    const timer = setTimeout(() => {
      const mapElement = document.getElementById('device-location-map');
      if (!mapElement) {
        console.log('Map element not found');
        return;
      }

      const existingMap = (mapElement as any)._leaflet_id;
      if (existingMap) {
        console.log('Map already initialized');
        return;
      }

      try {
        map = L.map('device-location-map', {
          center: [device.lat, device.lng],
          zoom: 15,
          scrollWheelZoom: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);

        const markerIcon = device.status === 'online'
          ? L.icon({
              iconUrl: '/markers/marker-icon-2x-green.png',
              shadowUrl: '/markers/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })
          : L.icon({
              iconUrl: '/markers/marker-icon-2x-red.png',
              shadowUrl: '/markers/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });

        L.marker([device.lat, device.lng], { icon: markerIcon })
          .addTo(map)
          .bindPopup(`<strong>${device.address}</strong>`);

        setTimeout(() => {
          if (map) {
            map.invalidateSize();
          }
        }, 200);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (map) {
        try {
          map.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
      }
    };
  }, [device]);

  const downloadCSV = async () => {
    try {
      await viewerAPI.exportTrafficCSV(deviceId);
      toast.success('CSV downloaded successfully!');
    } catch (error: any) {
      toast.error('Failed to download CSV');
      console.error('Download CSV error:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="size-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading device details...</p>
        </div>
      </div>
    );
  }

  // Show error if no device
  if (!device) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="size-4 mr-2" />
              Back to Map
            </Button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto p-6">
          <Card className="p-12 text-center">
            <MapPin className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-muted-foreground mb-2">Device not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Unable to load device details
            </p>
            <Button onClick={onBack}>Return to Map</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="size-4 mr-2" />
              Back to Map
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-gray-900">{device.address}</h1>
                <Badge variant={device.status === 'online' ? 'default' : 'destructive'}>
                  {device.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Device ID: {device.id} | GPS: {device.lat.toFixed(4)}, {device.lng.toFixed(4)}
              </p>
            </div>
          </div>
          <Button onClick={downloadCSV}>
            <Download className="size-4 mr-2" />
            Download Historical Data
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Vehicle Type Detection Chart - Shows First */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Type Detection Trend</CardTitle>
            <CardDescription>
              Historical vehicle detection data - YOLO11-S model trained on Indian Driving Dataset ({vehicleTypeChartData.length} data points)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vehicleTypeChartData.length === 0 ? (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                No traffic data available for this device
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <LineChart data={vehicleTypeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis label={{ value: 'Vehicle Count', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="cars" 
                  stroke={vehicleTypeColors.cars} 
                  strokeWidth={2}
                  name={vehicleTypeLabels.cars}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="trucks" 
                  stroke={vehicleTypeColors.trucks} 
                  strokeWidth={2}
                  name={vehicleTypeLabels.trucks}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="buses" 
                  stroke={vehicleTypeColors.buses} 
                  strokeWidth={2}
                  name={vehicleTypeLabels.buses}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="motorcycles" 
                  stroke={vehicleTypeColors.motorcycles} 
                  strokeWidth={2}
                  name={vehicleTypeLabels.motorcycles}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="autoRickshaws" 
                  stroke={vehicleTypeColors.autoRickshaws} 
                  strokeWidth={2}
                  name={vehicleTypeLabels.autoRickshaws}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="bicycles" 
                  stroke={vehicleTypeColors.bicycles} 
                  strokeWidth={2}
                  name={vehicleTypeLabels.bicycles}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="pedestrians" 
                  stroke={vehicleTypeColors.pedestrians} 
                  strokeWidth={2}
                  name={vehicleTypeLabels.pedestrians}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Traffic Analytics - Two Halves Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Side: Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Traffic Flow Rate */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Traffic Flow Rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{trafficFlowRate}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      vehicles/min
                    </p>
                  </div>
                  <Activity className="size-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            {/* Congestion Level */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Congestion Level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${congestion.color}`}>{congestion.level}</div>
                    <p className="text-xs text-muted-foreground mt-1">Based on flow rate</p>
                  </div>
                  <div className={`p-2 rounded-full ${congestion.bgColor}`}>
                    <Activity className={`size-6 ${congestion.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* vs Yesterday */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>vs Yesterday (Same Time)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${yesterdayComparison >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {yesterdayComparison >= 0 ? '+' : ''}{yesterdayComparison}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {yesterdayComparison >= 0 ? 'Higher than' : 'Lower than'} yesterday
                    </p>
                  </div>
                  <Calendar className="size-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            {/* Dominant Vehicle Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Dominant Vehicle Type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-gray-900">{dominantType.name}</div>
                    <p className="text-xs text-muted-foreground mt-1">Most detected</p>
                  </div>
                  <div className={`p-2 rounded-full ${dominantType.bgColor}`}>
                    <dominantType.icon className={`size-6 ${dominantType.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Distribution</CardTitle>
              <CardDescription>Latest breakdown by vehicle type from most recent data point</CardDescription>
            </CardHeader>
            <CardContent>
              {vehicleTypeChartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No traffic data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const lastValidDataPoint = vehicleTypeChartData[vehicleTypeChartData.length - 1] || {};
                        console.log('📊 Pie chart using data from:', lastValidDataPoint.hour);
                        return [
                          { name: 'Cars', value: lastValidDataPoint.cars || 0, color: vehicleTypeColors.cars },
                          { name: 'Motorcycles', value: lastValidDataPoint.motorcycles || 0, color: vehicleTypeColors.motorcycles },
                          { name: 'Auto-Rickshaws', value: lastValidDataPoint.autoRickshaws || 0, color: vehicleTypeColors.autoRickshaws },
                          { name: 'Trucks', value: lastValidDataPoint.trucks || 0, color: vehicleTypeColors.trucks },
                          { name: 'Buses', value: lastValidDataPoint.buses || 0, color: vehicleTypeColors.buses },
                          { name: 'Bicycles', value: lastValidDataPoint.bicycles || 0, color: vehicleTypeColors.bicycles },
                          { name: 'Pedestrians', value: lastValidDataPoint.pedestrians || 0, color: vehicleTypeColors.pedestrians },
                        ];
                      })()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(() => {
                        const lastValidDataPoint = vehicleTypeChartData[vehicleTypeChartData.length - 1] || {};
                        return [
                          { name: 'Cars', value: lastValidDataPoint.cars || 0, color: vehicleTypeColors.cars },
                          { name: 'Motorcycles', value: lastValidDataPoint.motorcycles || 0, color: vehicleTypeColors.motorcycles },
                          { name: 'Auto-Rickshaws', value: lastValidDataPoint.autoRickshaws || 0, color: vehicleTypeColors.autoRickshaws },
                          { name: 'Trucks', value: lastValidDataPoint.trucks || 0, color: vehicleTypeColors.trucks },
                          { name: 'Buses', value: lastValidDataPoint.buses || 0, color: vehicleTypeColors.buses },
                          { name: 'Bicycles', value: lastValidDataPoint.bicycles || 0, color: vehicleTypeColors.bicycles },
                          { name: 'Pedestrians', value: lastValidDataPoint.pedestrians || 0, color: vehicleTypeColors.pedestrians },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ));
                      })()}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Device Info */}
        <Card>
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left side - Map */}
              <div>
                <div id="device-location-map" className="w-full h-[400px] rounded-lg border" style={{ minHeight: '400px', height: '400px' }}></div>
              </div>
              
              {/* Right side - Information (Two Column Layout) */}
              <div className="grid grid-cols-2 gap-4">
                {/* Status Badge - Spans both columns */}
                <div className="col-span-2 flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${device.status === 'online' ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Wifi className={`size-5 ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Device Status</p>
                      <Badge variant={device.status === 'online' ? 'default' : 'destructive'} className="mt-1">
                        {device.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <Activity className={`size-6 ${device.status === 'online' ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                </div>

                {/* Device ID Card */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="size-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Device ID</p>
                    <p className="text-base font-semibold text-gray-900">{device.id}</p>
                  </div>
                </div>

                {/* Location Card */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="size-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                    <p className="text-base font-semibold text-gray-900">{device.address}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {device.lat.toFixed(6)}, {device.lng.toFixed(6)}
                    </p>
                  </div>
                </div>

                {/* Registered Date Card */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="size-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Registered On</p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(device.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {/* Last Update Card */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Clock className="size-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Last Update</p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(device.lastUpdate).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Update Interval Card */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Timer className="size-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Update Interval</p>
                    <p className="text-base font-semibold text-gray-900">2 seconds</p>
                    <p className="text-xs text-muted-foreground mt-1">5 inferences averaged</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
