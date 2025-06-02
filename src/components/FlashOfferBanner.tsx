
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Clock, Users, Zap, Star, ShoppingCart } from 'lucide-react';
import { useFlashOffers } from '@/hooks/useFlashOffers';

const FlashOfferBanner = () => {
  const { currentOffer, getTimeRemaining } = useFlashOffers();
  const [timeLeft, setTimeLeft] = useState<{hours: number, minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    if (!currentOffer) return;

    const timer = setInterval(() => {
      const remaining = getTimeRemaining(currentOffer.end_time);
      if (remaining) {
        setTimeLeft(remaining);
      } else {
        setTimeLeft(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentOffer, getTimeRemaining]);

  const handleBuyNow = () => {
    // Navigate to products or specific offer
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  if (!currentOffer || !timeLeft) return null;

  return (
    <div className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 relative overflow-hidden shadow-xl">
      {/* Animated background elements and floating emojis */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-4 left-4 w-16 h-16 sm:w-20 sm:h-20 bg-yellow-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-4 right-4 w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 bg-orange-300 rounded-full opacity-30 animate-ping"></div>
      </div>

      {/* Floating hot emojis and icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-2 left-8 animate-bounce opacity-60 text-2xl">🔥</div>
        <div className="absolute top-8 right-12 animate-pulse opacity-50 text-xl">💥</div>
        <div className="absolute bottom-8 left-16 animate-bounce opacity-60 text-lg" style={{animationDelay: '1s'}}>⚡</div>
        <div className="absolute top-12 left-1/3 animate-pulse opacity-50 text-xl" style={{animationDelay: '2s'}}>🎯</div>
        <div className="absolute bottom-12 right-8 animate-bounce opacity-60 text-lg" style={{animationDelay: '1.5s'}}>💸</div>
        <Flame className="absolute top-6 right-20 w-6 h-6 text-yellow-300 animate-pulse opacity-40" />
        <Zap className="absolute bottom-6 left-12 w-5 h-5 text-white animate-bounce opacity-50" style={{animationDelay: '0.5s'}} />
      </div>

      {/* Moving poster images */}
      <div className="absolute top-2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg opacity-30 animate-pulse" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute top-6 right-1/4 w-6 h-6 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-400 to-red-500 rounded-full opacity-40 animate-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-4 left-1/3 w-10 h-6 sm:w-14 sm:h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg opacity-30 animate-pulse" style={{animationDelay: '1.5s'}}></div>
      
      <div className="relative z-10">
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          <div className="text-center mb-3 sm:mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-pulse" />
              <span className="text-white font-black text-lg sm:text-xl tracking-wide">MEGA SALE</span>
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-pulse" />
            </div>
            
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Badge className="bg-yellow-400 text-red-900 font-black text-sm sm:text-base px-3 py-1 animate-bounce shadow-lg">
                {currentOffer.discount_percentage}% OFF
              </Badge>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-300 text-yellow-300" />
                ))}
              </div>
            </div>
            
            <p className="text-white font-bold text-sm sm:text-base mb-3 opacity-90">
              🔥 LIMITED TIME DIGITAL PRODUCTS SALE 🔥
            </p>
          </div>
          
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between text-white text-xs sm:text-sm">
              <div className="flex items-center space-x-2 bg-black/20 rounded-full px-3 py-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-bold">{currentOffer.current_purchases.toLocaleString('en-IN')} sold</span>
              </div>
              
              <div className="flex items-center space-x-2 bg-black/20 rounded-full px-3 py-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <div className="flex space-x-1 font-mono font-bold">
                  <span className="bg-white text-red-600 px-2 py-1 rounded text-xs sm:text-sm">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="bg-white text-red-600 px-2 py-1 rounded text-xs sm:text-sm">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="bg-white text-red-600 px-2 py-1 rounded text-xs sm:text-sm">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleBuyNow}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-red-900 hover:from-yellow-300 hover:to-orange-300 font-black text-base sm:text-lg py-3 sm:py-4 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-pulse" />
              BUY NOW - SAVE BIG! 🎯
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Flame className="w-8 h-8 text-yellow-300 animate-pulse" />
              <div>
                <span className="text-white font-black text-2xl tracking-wide block">MEGA DIGITAL SALE</span>
                <div className="flex items-center space-x-2 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                  ))}
                  <span className="text-yellow-300 text-sm font-bold ml-2">Premium Quality ✨</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className="bg-yellow-400 text-red-900 font-black text-xl px-4 py-2 animate-bounce shadow-lg">
                {currentOffer.discount_percentage}% OFF
              </Badge>
              
              <Badge className="bg-gradient-to-r from-green-400 to-green-500 text-white font-bold text-lg px-4 py-2 animate-pulse shadow-lg">
                🔥 HOT DEAL 🔥
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-white">
            <div className="flex items-center space-x-3 bg-black/20 rounded-full px-4 py-3">
              <Users className="w-5 h-5" />
              <div className="text-center">
                <span className="text-lg font-bold block">
                  {currentOffer.current_purchases.toLocaleString('en-IN')}
                </span>
                <span className="text-sm opacity-90">already sold</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-black/20 rounded-full px-4 py-3">
              <Clock className="w-5 h-5 animate-pulse" />
              <div className="text-center">
                <div className="flex space-x-1 font-mono font-bold text-lg">
                  <span className="bg-white text-red-600 px-3 py-2 rounded animate-pulse">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </span>
                  <span className="flex items-center">:</span>
                  <span className="bg-white text-red-600 px-3 py-2 rounded animate-pulse">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </span>
                  <span className="flex items-center">:</span>
                  <span className="bg-white text-red-600 px-3 py-2 rounded animate-pulse">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </span>
                </div>
                <span className="text-sm opacity-90">time left ⏰</span>
              </div>
            </div>

            <Button 
              onClick={handleBuyNow}
              className="bg-gradient-to-r from-yellow-400 to-orange-400 text-red-900 hover:from-yellow-300 hover:to-orange-300 font-black text-xl px-8 py-4 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95"
            >
              <ShoppingCart className="w-6 h-6 mr-3 animate-pulse" />
              BUY NOW! 💥
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashOfferBanner;
