import { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { ViewerDashboard } from './components/ViewerDashboard';
import { ProviderDashboard } from './components/ProviderDashboard';
import { DeviceDetail } from './components/DeviceDetail';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { authAPI, removeAuthToken } from './services/api';

export type UserRole = 'viewer' | 'provider' | null;

export interface User {
  email: string;
  role: UserRole;
  name: string;
  userId: string;
}

export interface TrafficDevice {
  id: string;
  lat: number;
  lng: number;
  address: string;
  providerId: string;
  createdAt: string;
  status: 'online' | 'offline';
  lastUpdate: string;
}

export interface TrafficData {
  timestamp: string;
  deviceId: string;
  vehicleCount: number;
  status: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'map' | 'device'>('map');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        setUser({
          userId: response.data.userId,
          email: response.data.email,
          role: response.data.accountType as UserRole,
          name: response.data.email.split('@')[0]
        });
        toast.success('Login successful!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      await authAPI.signup(email, password, role!);
      toast.success('Account created successfully! Please login.');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setCurrentView('map');
      setSelectedDeviceId(null);
      removeAuthToken();
      toast.success('Logged out successfully');
    }
  };

  const handleDeviceClick = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setCurrentView('device');
  };

  const handleBackToMap = () => {
    setCurrentView('map');
    setSelectedDeviceId(null);
  };

  if (!user) {
    return (
      <>
        <AuthPage 
          onLogin={handleLogin} 
          onSignup={handleSignup}
          loading={loading}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      {user.role === 'viewer' ? (
        currentView === 'map' ? (
          <ViewerDashboard 
            user={user} 
            onLogout={handleLogout}
            onDeviceClick={handleDeviceClick}
          />
        ) : (
          <DeviceDetail 
            deviceId={selectedDeviceId!}
            onBack={handleBackToMap}
          />
        )
      ) : (
        <ProviderDashboard 
          user={user}
          onLogout={handleLogout}
        />
      )}
      <Toaster />
    </>
  );
}

export default App;