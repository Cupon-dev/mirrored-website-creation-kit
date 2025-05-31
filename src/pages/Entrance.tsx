
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, TrendingUp, Users, Shield, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Entrance = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: ''
  });
  const { registerUser } = useAuth();

  const handleRegister = async () => {
    if (!formData.name || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await registerUser(formData.name, formData.email, formData.mobile);
    if (result.success) {
      // User will be automatically redirected by the auth wrapper
    }
  };

  const runningOffers = [
    "🔥 50% OFF Digital Products",
    "⚡ Instant WhatsApp Delivery",
    "🎯 Premium Courses Available",
    "💎 Lifetime Access Guaranteed",
    "🚀 New Products Added Daily",
    "🎊 Limited Time Offers"
  ];

  const productImages = [
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Running Offers Ticker */}
      <div className="bg-green-600 text-white py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          {runningOffers.map((offer, index) => (
            <span key={index} className="text-sm font-medium mx-8">
              {offer}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Registration Section - Moved to Top */}
        <div className="text-center mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto shadow-xl border border-green-200">
            <div className="inline-flex items-center space-x-2 bg-green-100 rounded-full px-6 py-3 mb-6">
              <Sparkles className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Join Premium Store</span>
            </div>
            
            <h2 className="text-2xl font-bold text-green-900 mb-4">Get Instant Access</h2>
            <p className="text-green-700 mb-6">Register now and start shopping premium digital products!</p>

            <div className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-white border-green-300 text-green-900 placeholder-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-white border-green-300 text-green-900 placeholder-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <Input
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="bg-white border-green-300 text-green-900 placeholder-green-500 focus:border-green-500"
                />
              </div>

              <Button 
                onClick={handleRegister}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl transform transition hover:scale-105"
              >
                <Users className="w-5 h-5 mr-2" />
                Register Now - FREE
              </Button>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-green-900 mb-4">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">PremiumLeaks</span>
          </h1>
          <p className="text-xl text-green-700 mb-8 max-w-2xl mx-auto">
            Get instant access to premium digital products delivered directly to your WhatsApp
          </p>
        </div>

        {/* Product Images Carousel */}
        <div className="mb-12">
          <div className="flex space-x-4 overflow-hidden">
            <div className="flex space-x-4 animate-scroll">
              {[...productImages, ...productImages].map((image, index) => (
                <div key={index} className="flex-shrink-0 w-64 h-40 rounded-xl overflow-hidden shadow-lg border-2 border-green-200">
                  <img src={image} alt={`Product ${index}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-green-200">
            <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-900 mb-2">Instant Delivery</h3>
            <p className="text-green-700">Get your products delivered via WhatsApp instantly</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-green-200">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-900 mb-2">Secure Access</h3>
            <p className="text-green-700">Safe and secure with lifetime access to products</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-green-200">
            <Gift className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-900 mb-2">Premium Content</h3>
            <p className="text-green-700">High-quality digital products and courses</p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 max-w-2xl mx-auto border border-green-200">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Badge className="bg-green-500 text-white">Trusted by 1000+ Users</Badge>
              <Badge className="bg-green-500 text-white">Instant Downloads</Badge>
              <Badge className="bg-green-500 text-white">24/7 Support</Badge>
            </div>
            <p className="text-green-700 text-lg">Join thousands of satisfied customers who trust PremiumLeaks for their digital needs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Entrance;
