
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Clock, Users, Zap } from 'lucide-react';
import { useFlashOffers } from '@/hooks/useFlashOffers';

const FlashOfferBanner = () => {
  const { currentOffer, getTimeRemaining } = useFlashOffers();
  const [timeLeft, setTimeLeft] = useState<{hours: number, minutes: number, seconds: number} | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const offerImages = [
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=400&h=200&fit=crop"
  ];

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

  useEffect(() => {
    const imageTimer = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % offerImages.length);
    }, 3000);

    return () => clearInterval(imageTimer);
  }, []);

  if (!currentOffer || !timeLeft) return null;

  return (
    <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-xl p-4 mb-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img 
          src={offerImages[currentImageIndex]} 
          alt="Flash offer" 
          className="w-full h-full object-cover transition-opacity duration-1000"
        />
      </div>
      
      <div className="relative z-10">
        {/* Mobile Layout */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-yellow-300 animate-pulse" />
              <span className="text-white font-bold text-sm">DIGITAL SALE</span>
              <Badge className="bg-yellow-400 text-red-900 font-bold animate-bounce text-xs">
                {currentOffer.discount_percentage}% OFF
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-white text-xs">
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{currentOffer.current_purchases}/{currentOffer.max_purchases}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <div className="flex space-x-1 font-mono">
                  <span className="bg-white text-red-600 px-1.5 py-0.5 rounded font-bold text-xs">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="bg-white text-red-600 px-1.5 py-0.5 rounded font-bold text-xs">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="bg-white text-red-600 px-1.5 py-0.5 rounded font-bold text-xs">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
            
            <Button className="bg-yellow-400 text-red-900 hover:bg-yellow-300 font-bold text-xs px-3 py-1">
              <Zap className="w-3 h-3 mr-1" />
              Grab Now!
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
              <span className="text-white font-bold text-lg">DIGITAL PRODUCT SALE</span>
            </div>
            
            <Badge className="bg-yellow-400 text-red-900 font-bold animate-bounce">
              {currentOffer.discount_percentage}% OFF
            </Badge>
            
            <Badge className="bg-orange-500 text-white animate-pulse">
              LIMITED TIME OFFER
            </Badge>
          </div>

          <div className="flex items-center space-x-6 text-white">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">
                {currentOffer.current_purchases.toLocaleString('en-IN')}/{currentOffer.max_purchases.toLocaleString('en-IN')} sold
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <div className="flex space-x-1 font-mono">
                <span className="bg-white text-red-600 px-2 py-1 rounded font-bold">
                  {timeLeft.hours.toString().padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-white text-red-600 px-2 py-1 rounded font-bold">
                  {timeLeft.minutes.toString().padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-white text-red-600 px-2 py-1 rounded font-bold">
                  {timeLeft.seconds.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            <Button className="bg-yellow-400 text-red-900 hover:bg-yellow-300 font-bold">
              <Zap className="w-4 h-4 mr-2" />
              Grab Now!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashOfferBanner;
