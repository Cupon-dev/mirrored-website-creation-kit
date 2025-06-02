
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Eye, ShoppingBag, TrendingUp } from 'lucide-react';
import { useProductAnalytics } from '@/hooks/useProductAnalytics';

interface FOMOCounterProps {
  productId: string;
}

const FOMOCounter = ({ productId }: FOMOCounterProps) => {
  const analytics = useProductAnalytics(productId);
  const [animatedViewers, setAnimatedViewers] = useState(analytics.current_viewers);
  const [animatedPurchases, setAnimatedPurchases] = useState(analytics.total_purchases);

  useEffect(() => {
    // Slow, realistic viewer count animation (every 200ms)
    const viewerInterval = setInterval(() => {
      setAnimatedViewers(prev => {
        const diff = analytics.current_viewers - prev;
        if (diff === 0) return prev;
        const step = Math.sign(diff);
        return prev + step;
      });
    }, 200);

    return () => clearInterval(viewerInterval);
  }, [analytics.current_viewers]);

  useEffect(() => {
    // Slow, realistic purchase count animation (every 300ms)
    const purchaseInterval = setInterval(() => {
      setAnimatedPurchases(prev => {
        const diff = analytics.total_purchases - prev;
        if (diff === 0) return prev;
        const step = Math.sign(diff);
        return prev + step;
      });
    }, 300);

    return () => clearInterval(purchaseInterval);
  }, [analytics.total_purchases]);

  return (
    <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 mb-2 md:mb-3 overflow-x-auto">
      <Badge className="bg-green-100 text-green-800 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 flex items-center space-x-1 animate-pulse text-xs sm:text-xs md:text-sm whitespace-nowrap flex-shrink-0">
        <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
        <span className="font-medium">{animatedViewers.toLocaleString('en-IN')} viewing</span>
      </Badge>
      
      <Badge className="bg-blue-100 text-blue-800 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 flex items-center space-x-1 text-xs sm:text-xs md:text-sm whitespace-nowrap flex-shrink-0">
        <ShoppingBag className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
        <span className="font-medium">{animatedPurchases.toLocaleString('en-IN')} sold</span>
      </Badge>

      {animatedViewers > 6000 && (
        <Badge className="bg-red-100 text-red-800 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 flex items-center space-x-1 animate-bounce text-xs sm:text-xs md:text-sm whitespace-nowrap flex-shrink-0">
          <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
          <span className="font-medium hidden sm:inline">High Demand!</span>
          <span className="font-medium sm:hidden">🔥</span>
        </Badge>
      )}
    </div>
  );
};

export default FOMOCounter;
