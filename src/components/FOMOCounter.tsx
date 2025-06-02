
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
    // Animate viewer count changes
    const viewerInterval = setInterval(() => {
      setAnimatedViewers(prev => {
        const diff = analytics.current_viewers - prev;
        if (diff === 0) return prev;
        return prev + Math.sign(diff);
      });
    }, 100);

    return () => clearInterval(viewerInterval);
  }, [analytics.current_viewers]);

  useEffect(() => {
    // Animate purchase count changes
    const purchaseInterval = setInterval(() => {
      setAnimatedPurchases(prev => {
        const diff = analytics.total_purchases - prev;
        if (diff === 0) return prev;
        return prev + Math.sign(diff);
      });
    }, 200);

    return () => clearInterval(purchaseInterval);
  }, [analytics.total_purchases]);

  return (
    <div className="flex items-center space-x-2 md:space-x-4 mb-2 md:mb-4 overflow-x-auto">
      <Badge className="bg-green-100 text-green-800 px-2 md:px-3 py-1 flex items-center space-x-1 md:space-x-2 animate-pulse text-xs whitespace-nowrap">
        <Eye className="w-3 h-3 md:w-4 md:h-4" />
        <span className="font-medium">{animatedViewers.toLocaleString('en-IN')} viewing</span>
      </Badge>
      
      <Badge className="bg-blue-100 text-blue-800 px-2 md:px-3 py-1 flex items-center space-x-1 md:space-x-2 text-xs whitespace-nowrap">
        <ShoppingBag className="w-3 h-3 md:w-4 md:h-4" />
        <span className="font-medium">{animatedPurchases.toLocaleString('en-IN')} sold</span>
      </Badge>

      {animatedViewers > 15000 && (
        <Badge className="bg-red-100 text-red-800 px-2 md:px-3 py-1 flex items-center space-x-1 md:space-x-2 animate-bounce text-xs whitespace-nowrap">
          <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
          <span className="font-medium hidden md:inline">High Demand!</span>
          <span className="font-medium md:hidden">🔥</span>
        </Badge>
      )}
    </div>
  );
};

export default FOMOCounter;
