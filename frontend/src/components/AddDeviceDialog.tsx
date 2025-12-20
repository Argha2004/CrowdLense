import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import type { TrafficDevice } from '../App';

interface AddDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDevice: (device: TrafficDevice) => void;
}

export function AddDeviceDialog({ open, onOpenChange, onAddDevice }: AddDeviceDialogProps) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      toast.error('Invalid latitude. Must be between -90 and 90.');
      return;
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      toast.error('Invalid longitude. Must be between -180 and 180.');
      return;
    }

    if (!address.trim()) {
      toast.error('Please provide an address.');
      return;
    }

    // Generate device ID
    const deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newDevice: TrafficDevice = {
      id: deviceId,
      lat: latitude,
      lng: longitude,
      address: address.trim(),
      providerId: 'current-user',
      createdAt: new Date().toISOString(),
      status: 'offline',
      lastUpdate: new Date().toISOString(),
    };

    onAddDevice(newDevice);
    toast.success('Device registered successfully!', {
      description: `Device ID: ${deviceId}`,
    });

    // Reset form
    setLat('');
    setLng('');
    setAddress('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Register New Device</DialogTitle>
            <DialogDescription>
              Add a new traffic sensor location. You'll receive a setup package to deploy on your Raspberry Pi.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="28.6139"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Valid range: -90 to 90
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="77.2090"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Valid range: -180 to 180
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address / Location Name</Label>
              <Input
                id="address"
                type="text"
                placeholder="Connaught Place, New Delhi"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Descriptive name for this location
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Register Device</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
