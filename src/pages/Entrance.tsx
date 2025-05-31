
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, TrendingUp, Users, Shield, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Entrance = () => {
  const [step, setStep] = useState<'welcome' | 'register' | 'payment'>('welcome');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: ''
  });
  const { registerUser, verifyPayment } = useAuth();

  const handleRegister = async () => {
    if (!formData.name || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await registerUser(formData.name, formData.email, formData.mobile);
    if (result.success) {
      setStep('payment');
    }
  };

  const handlePaymentComplete = () => {
    // This will be called after payment verification
    // For now, we'll simulate verification
    setTimeout(() => {
      verifyPayment('dummy_payment_id');
    }, 2000);
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

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Running Offers Ticker */}
        <div className="bg-red-500 text-white py-2 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            {runningOffers.map((offer, index) => (
              <span key={index} className="text-sm font-medium mx-8">
                {offer}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-medium">Premium Digital Store</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">PremiumLeaks</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Get instant access to premium digital products delivered directly to your WhatsApp
            </p>
          </div>

          {/* Product Images Carousel */}
          <div className="mb-12">
            <div className="flex space-x-4 overflow-hidden">
              <div className="flex space-x-4 animate-scroll">
                {[...productImages, ...productImages].map((image, index) => (
                  <div key={index} className="flex-shrink-0 w-64 h-40 rounded-xl overflow-hidden shadow-lg">
                    <img src={image} alt={`Product ${index}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Instant Delivery</h3>
              <p className="text-gray-300">Get your products delivered via WhatsApp instantly</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Secure Access</h3>
              <p className="text-gray-300">Safe and secure payment with lifetime access</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <Gift className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Premium Content</h3>
              <p className="text-gray-300">High-quality digital products and courses</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">Join Our Premium Store</h3>
              <div className="flex items-center justify-center space-x-2 mb-6">
                <Badge className="bg-red-500 text-white animate-pulse">One-time payment</Badge>
                <span className="text-3xl font-bold text-yellow-400">₹5</span>
              </div>
              <p className="text-gray-300 mb-6">Pay once, access forever!</p>
              <Button 
                onClick={() => setStep('register')}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 text-lg rounded-xl transform transition hover:scale-105"
              >
                <Users className="w-5 h-5 mr-2" />
                Register Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-gray-300">Join thousands of satisfied customers</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">Full Name *</label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-white/20 border-white/30 text-white placeholder-gray-300"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Email Address *</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-white/20 border-white/30 text-white placeholder-gray-300"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Mobile Number</label>
              <Input
                type="tel"
                placeholder="Enter your mobile number"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                className="bg-white/20 border-white/30 text-white placeholder-gray-300"
              />
            </div>

            <Button 
              onClick={handleRegister}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl"
            >
              Continue to Payment
            </Button>

            <Button 
              onClick={() => setStep('welcome')}
              variant="ghost"
              className="w-full text-white hover:bg-white/10"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Complete Payment</h2>
            <p className="text-gray-300">Pay ₹5 to get lifetime access</p>
          </div>

          <div className="bg-white/20 rounded-2xl p-6 mb-6">
            <p className="text-white font-medium mb-4">Registration Details:</p>
            <div className="text-left space-y-2 text-gray-300">
              <p><strong>Name:</strong> {formData.name}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              {formData.mobile && <p><strong>Mobile:</strong> {formData.mobile}</p>}
            </div>
          </div>

          <Button 
            onClick={() => window.open('https://rzp.io/rzp/PHanJB0', '_blank')}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 text-lg rounded-xl mb-4"
          >
            Pay ₹5 Now
          </Button>

          <Button 
            onClick={handlePaymentComplete}
            variant="outline"
            className="w-full border-white/30 text-white hover:bg-white/10"
          >
            I've completed the payment
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default Entrance;
