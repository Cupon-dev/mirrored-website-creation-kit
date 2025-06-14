
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, User as UserIcon, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    identifier: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { registerUser, loginUser } = useAuth();

  const handleLogin = async () => {
    if (!formData.identifier.trim()) return;
    
    setIsLoading(true);
    const result = await loginUser(formData.identifier);
    setIsLoading(false);
    
    if (result.success) {
      navigate('/');
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.mobile) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    const result = await registerUser(formData.name, formData.email, formData.mobile);
    setIsLoading(false);
    
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Welcome Back!' : 'Join PremiumLeaks'}
            </CardTitle>
            <p className="text-gray-600 text-sm">
              {isLogin ? 'Sign in to access your digital products' : 'Create account to get started'}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Toggle between Login/Register */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <Button
                variant={isLogin ? "default" : "ghost"}
                onClick={() => setIsLogin(true)}
                className="flex-1 rounded-md text-sm"
              >
                Login
              </Button>
              <Button
                variant={!isLogin ? "default" : "ghost"}
                onClick={() => setIsLogin(false)}
                className="flex-1 rounded-md text-sm"
              >
                Register
              </Button>
            </div>

            {isLogin ? (
              /* Login Form */
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Email or mobile number"
                    value={formData.identifier}
                    onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                    className="pl-10 h-12 border-gray-200 focus:border-green-500 rounded-xl"
                  />
                </div>

                <Button 
                  onClick={handleLogin}
                  disabled={isLoading || !formData.identifier.trim()}
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </div>
            ) : (
              /* Register Form */
              <div className="space-y-4">
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Full name *"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="pl-10 h-12 border-gray-200 focus:border-green-500 rounded-xl"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="email"
                    placeholder="Email address *"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="pl-10 h-12 border-gray-200 focus:border-green-500 rounded-xl"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="tel"
                    placeholder="Mobile number *"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    className="pl-10 h-12 border-gray-200 focus:border-green-500 rounded-xl"
                  />
                </div>

                <Button 
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-5 h-5 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Security Badge */}
            <div className="flex items-center justify-center space-x-2 pt-4">
              <Badge className="bg-green-100 text-green-800 text-xs">
                🔒 Secure Authentication
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                ⚡ Instant Access
              </Badge>
            </div>

            {/* Back to Store */}
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Back to Store
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
