
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Clock, Users } from 'lucide-react';
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
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
            <span className="text-white font-bold text-lg">FLASH SALE</span>
          </div>
          
          <Badge className="bg-yellow-400 text-red-900 font-bold animate-bounce">
            {currentOffer.discount_percentage}% OFF
          </Badge>
        </div>

        <div className="flex items-center space-x-6 text-white">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              {currentOffer.current_purchases}/{currentOffer.max_purchases} sold
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
            Grab Now!
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FlashOfferBanner;
