// Store device coordinates temporarily for DeviceDetail page
const deviceCoordinatesCache = new Map<string, { lat: number; lng: number }>();

export const cacheDeviceCoordinates = (deviceId: string, lat: number, lng: number) => {
  deviceCoordinatesCache.set(deviceId, { lat, lng });
};

export const getDeviceCoordinates = (deviceId: string) => {
  return deviceCoordinatesCache.get(deviceId);
};

export const clearDeviceCache = () => {
  deviceCoordinatesCache.clear();
};
