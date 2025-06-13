
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Eye, ShoppingBag, TrendingUp } from 'lucide-react';
import { useSharedAnalytics } from '@/contexts/AnalyticsContext';

interface FOMOCounterProps {
  productId: string;
  showOnlyHighDemand?: boolean;
  hideHighDemand?: boolean;
}

const FOMOCounter = ({ productId, showOnlyHighDemand = false, hideHighDemand = false }: FOMOCounterProps) => {
  const { getAnalytics } = useSharedAnalytics();
  const analytics = getAnalytics(productId);
  const [animatedViewers, setAnimatedViewers] = useState(analytics.current_viewers);
  const [animatedPurchases, setAnimatedPurchases] = useState(analytics.total_purchases);

  useEffect(() => {
    setAnimatedViewers(analytics.current_viewers);
  }, [analytics.current_viewers]);

  useEffect(() => {
    setAnimatedPurchases(analytics.total_purchases);
  }, [analytics.total_purchases]);

  const isHighDemand = animatedViewers > 8000;

  // Show only high demand badge (for image overlay)
  if (showOnlyHighDemand) {
    return isHighDemand ? (
      <Badge className="bg-red-100 text-red-800 px-1 py-0.5 flex items-center space-x-1 animate-bounce text-xs whitespace-nowrap">
        <TrendingUp className="w-2 h-2 flex-shrink-0" />
        <span className="font-medium hidden sm:inline">High Demand!</span>
        <span className="font-medium sm:hidden">🔥</span>
      </Badge>
    ) : null;
  }

  // Regular view without high demand badge
  if (hideHighDemand) {
    return (
      <div className="flex items-center flex-wrap gap-1 mb-1">
        <Badge className="bg-green-100 text-green-800 px-1.5 py-0.5 flex items-center space-x-1 animate-pulse text-xs whitespace-nowrap">
          <Eye className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="font-medium">{animatedViewers.toLocaleString('en-IN')} viewing</span>
        </Badge>
        
        <Badge className="bg-blue-100 text-blue-800 px-1.5 py-0.5 flex items-center space-x-1 text-xs whitespace-nowrap">
          <ShoppingBag className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="font-medium">{animatedPurchases.toLocaleString('en-IN')} sold</span>
        </Badge>
      </div>
    );
  }

  // Full view with all badges (default)
  return (
    <div className="flex items-center flex-wrap gap-1 mb-1">
      <Badge className="bg-green-100 text-green-800 px-1.5 py-0.5 flex items-center space-x-1 animate-pulse text-xs whitespace-nowrap">
        <Eye className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="font-medium">{animatedViewers.toLocaleString('en-IN')} viewing</span>
      </Badge>
      
      <Badge className="bg-blue-100 text-blue-800 px-1.5 py-0.5 flex items-center space-x-1 text-xs whitespace-nowrap">
        <ShoppingBag className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="font-medium">{animatedPurchases.toLocaleString('en-IN')} sold</span>
      </Badge>

      {isHighDemand && (
        <Badge className="bg-red-100 text-red-800 px-1.5 py-0.5 flex items-center space-x-1 animate-bounce text-xs whitespace-nowrap">
          <TrendingUp className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="font-medium hidden sm:inline">High Demand!</span>
          <span className="font-medium sm:hidden">🔥</span>
        </Badge>
      )}
    </div>
  );
};

export default FOMOCounter;
