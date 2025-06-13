
import { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const FlashOfferBanner = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg p-3 mb-4 shadow-lg animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-yellow-300" />
          <span className="font-bold text-sm">Flash Sale!</span>
          <Badge className="bg-yellow-400 text-red-800 text-xs px-2 py-0.5">
            Limited Time
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <div className="flex space-x-1 text-sm font-mono">
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span>:</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span>:</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-2">
        <p className="text-xs opacity-90">
          🔥 Get amazing digital products at unbeatable prices! Hurry up!
        </p>
      </div>
    </div>
  );
};

export default FlashOfferBanner;
