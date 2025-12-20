const API_BASE_URL = 'http://localhost:5000/api/v1';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

// API request helper with auth
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error: any) {
    // Better error messages for common issues
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please ensure the backend is running on http://localhost:5000');
    }
    throw error;
  }
};

// ============================================================
// Authentication API
// ============================================================
export const authAPI = {
  signup: async (email: string, password: string, accountType: 'viewer' | 'provider') => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, accountType }),
    });
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      removeAuthToken();
    }
  },
};

// ============================================================
// Provider API
// ============================================================
export const providerAPI = {
  getDashboard: async () => {
    return apiRequest('/providers/dashboard');
  },

  addDevice: async (latitude: number, longitude: number, address: string) => {
    return apiRequest('/providers/devices', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, address }),
    });
  },

  removeDevice: async (deviceId: string) => {
    return apiRequest(`/providers/devices/${deviceId}`, {
      method: 'DELETE',
    });
  },

  getIoTCredentials: async (deviceId: string) => {
    return apiRequest(`/providers/devices/${deviceId}/iot-credentials`, {
      method: 'POST',
    });
  },
};

// ============================================================
// Viewer API
// ============================================================
export const viewerAPI = {
  getAllDevices: async () => {
    return apiRequest('/viewer/devices');
  },

  getDeviceTraffic: async (deviceId: string) => {
    return apiRequest(`/viewer/devices/${deviceId}/traffic`);
  },

  exportTrafficCSV: async (deviceId: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/viewer/devices/${deviceId}/traffic/export`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deviceId}_traffic.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

// ============================================================
// Traffic Data API
// ============================================================
export const trafficAPI = {
  uploadLogs: async (data: {
    deviceId: string;
    timestamp: string;
    carCount: number;
    truckCount: number;
    busCount: number;
    motorcycleCount: number;
    autoRickshawCount: number;
    bicycleCount: number;
    pedestrianCount: number;
  }) => {
    return apiRequest('/traffic/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
