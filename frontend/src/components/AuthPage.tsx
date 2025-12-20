import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Camera, MapPin, Eye } from 'lucide-react';
import type { UserRole } from '../App';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface AuthPageProps {
  onLogin: (email: string, password: string, role: UserRole) => void;
  onSignup: (email: string, password: string, role: UserRole) => void;
  loading?: boolean;
}

export function AuthPage({ onLogin, onSignup, loading = false }: AuthPageProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('viewer');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo, assume existing users - providers use provider@, viewers use viewer@
    const role: UserRole = loginEmail.includes('provider@') ? 'provider' : 'viewer';
    onLogin(loginEmail, loginPassword, role);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    onSignup(signupEmail, signupPassword, signupRole);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1646079670582-807db63b82a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFmZmljJTIwY2l0eSUyMGFlcmlhbHxlbnwxfHx8fDE3NjI2MjI1NDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Traffic monitoring background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-indigo-900/85 backdrop-blur-sm"></div>
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left side - Branding */}
        <div className="text-center md:text-left space-y-6">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Camera className="size-12 text-white" />
            <h1 className="text-white">CrowdLense</h1>
          </div>
          <p className="text-white/90 max-w-md">
            Privacy-preserving, low-cost traffic monitoring platform powered by edge computing and crowdsourced data.
          </p>
          
          <div className="space-y-4 pt-6">
            <div className="flex items-start gap-3">
              <MapPin className="size-5 text-white/90 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-white">Crowdsourced Coverage</h3>
                <p className="text-sm text-white/80">Deploy sensors anywhere with Raspberry Pi devices</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Eye className="size-5 text-white/90 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-white">Privacy First</h3>
                <p className="text-sm text-white/80">On-device processing with YOLO11-s, only metadata shared</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <Card className="w-full shadow-xl">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-gray-100">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Login</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader className="space-y-3 px-8 pt-8">
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-8 py-6">
                  <div className="space-y-3">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    Enter your credentials to access the platform
                  </p>
                </CardContent>
                <CardFooter className="px-8 pb-8">
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardHeader className="space-y-3 px-8 pt-8">
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Choose your role and get started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-8 py-6">
                  <div className="space-y-3">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <Label>Account Type</Label>
                    <RadioGroup value={signupRole || ''} onValueChange={(value) => setSignupRole(value as UserRole)}>
                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="viewer" id="viewer" />
                        <Label htmlFor="viewer" className="flex-1 cursor-pointer">
                          <div>
                            <div className="flex items-center gap-2">
                              <Eye className="size-4" />
                              <span>Viewer</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">View real-time and historical traffic data</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="provider" id="provider" />
                        <Label htmlFor="provider" className="flex-1 cursor-pointer">
                          <div>
                            <div className="flex items-center gap-2">
                              <Camera className="size-4" />
                              <span>Data Provider</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Deploy sensors and contribute traffic data</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
                <CardFooter className="px-8 pb-8">
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}