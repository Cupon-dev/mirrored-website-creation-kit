
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
    <div className="flex items-center space-x-4 mb-4">
      <Badge className="bg-green-100 text-green-800 px-3 py-1 flex items-center space-x-2 animate-pulse">
        <Eye className="w-4 h-4" />
        <span className="font-medium">{animatedViewers} viewing now</span>
      </Badge>
      
      <Badge className="bg-blue-100 text-blue-800 px-3 py-1 flex items-center space-x-2">
        <ShoppingBag className="w-4 h-4" />
        <span className="font-medium">{animatedPurchases} purchased</span>
      </Badge>

      {animatedViewers > 10 && (
        <Badge className="bg-red-100 text-red-800 px-3 py-1 flex items-center space-x-2 animate-bounce">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">High Demand!</span>
        </Badge>
      )}
    </div>
  );
};

export default FOMOCounter;
