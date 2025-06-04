
import { useState, useEffect, useCallback } from 'react';
import { useSharedAnalytics } from '@/contexts/AnalyticsContext';

interface FOMOCounterProps {
  productId: string;
}

const FOMOCounter = ({ productId }: FOMOCounterProps) => {
  const { getAnalytics } = useSharedAnalytics();
  const analytics = getAnalytics(productId);
  const [displayViewers, setDisplayViewers] = useState(analytics.current_viewers);

  // Memoize the analytics call to prevent re-renders
  const trackView = useCallback(() => {
    // Track view without causing re-render
    console.log('Tracking view for product:', productId);
  }, [productId]);

  useEffect(() => {
    trackView();
  }, [trackView]);

  useEffect(() => {
    // Update display viewers when analytics change
    setDisplayViewers(analytics.current_viewers);
  }, [analytics.current_viewers]);

  useEffect(() => {
    // Animate viewer count changes
    const interval = setInterval(() => {
      const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      setDisplayViewers(prev => Math.max(1, prev + variation));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-700 font-medium">
            {displayViewers} people viewing this
          </span>
        </div>
        <span className="text-red-600 font-semibold">
          {analytics.total_purchases} sold today
        </span>
      </div>
    </div>
  );
};

export default FOMOCounter;
