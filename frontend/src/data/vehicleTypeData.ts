// Vehicle types detected by YOLO11-S model trained on Indian Driving Dataset (IDD)
export interface VehicleTypeCounts {
  hour: string;
  cars: number;
  trucks: number;
  buses: number;
  motorcycles: number;
  autoRickshaws: number;
  bicycles: number;
  pedestrians: number;
}

// Generate mock data up to 9 PM, with X-axis showing full day (12 AM to 11:59 PM)
export const generateVehicleTypeData = (): VehicleTypeCounts[] => {
  const data: VehicleTypeCounts[] = [];
  
  // Generate data for all 24 hours, but only populate values up to 9 PM (21)
  for (let hour = 0; hour <= 23; hour++) {
    const timeLabel = hour === 0 ? '12 AM' : 
                     hour < 12 ? `${hour} AM` : 
                     hour === 12 ? '12 PM' : 
                     `${hour - 12} PM`;
    
    // Only generate values for hours up to 9 PM (21), null after that
    if (hour <= 21) {
      // Generate realistic traffic patterns for Indian roads
      const baseMultiplier = hour >= 6 && hour <= 22 ? 1.5 : 0.5; // Higher traffic during day
      const rushHourMultiplier = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19) ? 2 : 1;
      const multiplier = baseMultiplier * rushHourMultiplier;
      
      data.push({
        hour: timeLabel,
        cars: Math.floor((Math.random() * 20 + 15) * multiplier),
        trucks: Math.floor((Math.random() * 8 + 3) * multiplier),
        buses: Math.floor((Math.random() * 6 + 2) * multiplier),
        motorcycles: Math.floor((Math.random() * 30 + 20) * multiplier), // High in India
        autoRickshaws: Math.floor((Math.random() * 12 + 5) * multiplier), // Common in India
        bicycles: Math.floor((Math.random() * 8 + 2) * multiplier),
        pedestrians: Math.floor((Math.random() * 15 + 5) * multiplier),
      });
    } else {
      // Add hour label but no data (for X-axis display)
      data.push({
        hour: timeLabel,
        cars: null as any,
        trucks: null as any,
        buses: null as any,
        motorcycles: null as any,
        autoRickshaws: null as any,
        bicycles: null as any,
        pedestrians: null as any,
      });
    }
  }
  
  return data;
};

export const vehicleTypeColors = {
  cars: '#3b82f6',        // Blue
  trucks: '#f59e0b',      // Orange
  buses: '#10b981',       // Green
  motorcycles: '#ef4444', // Red
  autoRickshaws: '#8b5cf6', // Purple
  bicycles: '#06b6d4',    // Cyan
  pedestrians: '#ec4899', // Pink
};

export const vehicleTypeLabels = {
  cars: 'Cars',
  trucks: 'Trucks',
  buses: 'Buses',
  motorcycles: 'Motorcycles',
  autoRickshaws: 'Auto-Rickshaws',
  bicycles: 'Bicycles',
  pedestrians: 'Pedestrians',
};


