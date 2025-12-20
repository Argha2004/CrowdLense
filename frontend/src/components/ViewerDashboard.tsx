import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LogOut, Search, Activity, MapPin, Navigation } from 'lucide-react';
import type { User, TrafficDevice } from '../App';
import { viewerAPI } from '../services/api';
import { cacheDeviceCoordinates } from '../services/deviceCache';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface ViewerDashboardProps {
  user: User;
  onLogout: () => void;
  onDeviceClick: (deviceId: string) => void;
}

export function ViewerDashboard({ user, onLogout, onDeviceClick }: ViewerDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [devices, setDevices] = useState<TrafficDevice[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<TrafficDevice[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch devices from API
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await viewerAPI.getAllDevices();
        if (response.success) {
          // Map API response to TrafficDevice format
          const mappedDevices = response.data.map((device: any) => {
            const trafficDevice = {
              id: device.deviceId,
              lat: device.latitude,
              lng: device.longitude,
              address: device.address,
              providerId: device.providerEmail,
              createdAt: new Date().toISOString(),
              status: device.status,
              lastUpdate: device.lastUpdate,
            };
            
            // Cache coordinates for DeviceDetail page
            cacheDeviceCoordinates(device.deviceId, device.latitude, device.longitude);
            
            return trafficDevice;
          });
          setDevices(mappedDevices);
          setFilteredDevices(mappedDevices);
        }
      } catch (error: any) {
        toast.error('Failed to load devices');
        console.error('Fetch devices error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDevices(devices);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = devices.filter(
        (device) =>
          device.address.toLowerCase().includes(query) ||
          `${device.lat},${device.lng}`.includes(query)
      );
      setFilteredDevices(filtered);
    }
  }, [searchQuery, devices]);

  // Calculate center point for map link
  const centerLat = filteredDevices.length > 0 
    ? filteredDevices.reduce((sum, d) => sum + d.lat, 0) / filteredDevices.length 
    : 28.6139;
  const centerLng = filteredDevices.length > 0 
    ? filteredDevices.reduce((sum, d) => sum + d.lng, 0) / filteredDevices.length 
    : 77.2090;

  // Initialize map with Leaflet
  useEffect(() => {
    // Create map
    const map = L.map('map-container').setView([centerLat, centerLng], 5);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create custom icons for online (green) and offline (red) markers
    const greenIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Add markers for each device
    filteredDevices.forEach((device) => {
      // Choose icon based on device status
      const icon = device.status === 'online' ? greenIcon : redIcon;
      
      const marker = L.marker([device.lat, device.lng], { icon }).addTo(map);
      
      // Add tooltip (shows on hover)
      marker.bindTooltip(device.address, {
        permanent: false,
        direction: 'top'
      });
      
      // Add popup (shows on click)
      marker.bindPopup(`
        <div style="padding: 8px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">${device.address}</h3>
          <p style="font-size: 12px; margin-bottom: 4px;">Status: <span style="color: ${device.status === 'online' ? '#22c55e' : '#ef4444'}; font-weight: bold;">${device.status}</span></p>
          <p style="font-size: 11px; margin-bottom: 8px;">Last Update: ${new Date(device.lastUpdate).toLocaleString()}</p>
          <button onclick="window.dispatchEvent(new CustomEvent('deviceClick', { detail: '${device.id}' }))" style="width: 100%; padding: 4px 8px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">View Details</button>
        </div>
      `);
      
      // Add click handler to marker for direct navigation
      marker.on('click', () => {
        onDeviceClick(device.id);
      });
    });

    // Fit bounds to show all markers
    if (filteredDevices.length > 0) {
      const bounds = L.latLngBounds(filteredDevices.map(d => [d.lat, d.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Listen for custom device click events
    const handleDeviceClick = (e: any) => {
      onDeviceClick(e.detail);
    };
    window.addEventListener('deviceClick', handleDeviceClick);

    // Cleanup
    return () => {
      window.removeEventListener('deviceClick', handleDeviceClick);
      map.remove();
    };
  }, [filteredDevices, centerLat, centerLng, onDeviceClick]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="size-6 text-indigo-600" />
          <div>
            <h1 className="text-indigo-900">TrafficSense Viewer</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="size-4 mr-2" />
          Logout
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Search and Stats */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 max-w-xl relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by address or GPS coordinates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Online: {devices.filter(d => d.status === 'online').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500"></div>
                <span className="text-sm">Offline: {devices.filter(d => d.status === 'offline').length}</span>
              </div>
            </div>
          </div>

          {/* OpenStreetMap Embed */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Sensor Locations Map</CardTitle>
              <CardDescription>Interactive map showing all traffic sensor deployments</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div id="map-container" className="w-full h-[500px]"></div>
            </CardContent>
          </Card>

          {/* Devices Grid */}
          <div>
            <h2 className="text-xl mb-4">All Sensors ({filteredDevices.length})</h2>
            {filteredDevices.length === 0 ? (
              <Card className="p-12 text-center">
                <MapPin className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-muted-foreground mb-2">No devices found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search query
                </p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDevices.map((device) => (
                  <Card key={device.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onDeviceClick(device.id)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="size-4 text-indigo-600" />
                            <CardTitle className="text-base">{device.address}</CardTitle>
                          </div>
                        </div>
                        <Badge variant={device.status === 'online' ? 'default' : 'destructive'}>
                          {device.status}
                        </Badge>
                      </div>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Navigation className="size-3" />
                          <span>{device.lat.toFixed(4)}, {device.lng.toFixed(4)}</span>
                        </div>
                        <div className="text-xs">
                          Last update: {new Date(device.lastUpdate).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Device ID: {device.id}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" size="sm" onClick={() => onDeviceClick(device.id)}>
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          
        </div>
      </div>
    </div>
  );
}
