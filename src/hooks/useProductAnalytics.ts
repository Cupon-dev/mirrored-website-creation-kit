
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductAnalytics {
  current_viewers: number;
  total_purchases: number;
}

export const useProductAnalytics = (productId: string) => {
  const [analytics, setAnalytics] = useState<ProductAnalytics>({
    current_viewers: 0,
    total_purchases: 0
  });

  useEffect(() => {
    if (!productId) return;

    // Generate realistic initial values between 3k-9k
    const generateRealisticNumbers = () => {
      const baseViewers = Math.floor(Math.random() * (9000 - 3000) + 3000);
      const basePurchases = Math.floor(Math.random() * (9000 - 3000) + 3000);
      
      setAnalytics({
        current_viewers: baseViewers,
        total_purchases: basePurchases
      });
    };

    // Fetch current analytics from database or use generated numbers
    const fetchAnalytics = async () => {
      const { data } = await supabase
        .from('product_analytics')
        .select('current_viewers, total_purchases')
        .eq('product_id', productId)
        .single();

      if (data) {
        setAnalytics(data);
      } else {
        generateRealisticNumbers();
      }
    };

    // Increment viewer count when component mounts
    const incrementViewer = async () => {
      await supabase.rpc('update_product_viewers', {
        product_uuid: productId,
        viewer_change: 1
      });
    };

    // Decrement viewer count when component unmounts
    const decrementViewer = async () => {
      await supabase.rpc('update_product_viewers', {
        product_uuid: productId,
        viewer_change: -1
      });
    };

    fetchAnalytics();
    incrementViewer();

    // Realistic slow viewer fluctuations (every 8-12 seconds)
    const viewerInterval = setInterval(() => {
      const randomChange = Math.floor(Math.random() * 21) - 10; // -10 to +10
      setAnalytics(prev => ({
        ...prev,
        current_viewers: Math.max(3000, Math.min(9000, prev.current_viewers + randomChange))
      }));
    }, Math.random() * 4000 + 8000); // 8-12 seconds

    // Realistic purchase updates (every 15-25 seconds)
    const purchaseInterval = setInterval(() => {
      if (Math.random() < 0.4) { // 40% chance
        const purchaseIncrease = Math.floor(Math.random() * 3) + 1; // 1-3 purchases
        setAnalytics(prev => ({
          ...prev,
          total_purchases: Math.min(9000, prev.total_purchases + purchaseIncrease)
        }));
      }
    }, Math.random() * 10000 + 15000); // 15-25 seconds

    return () => {
      decrementViewer();
      clearInterval(viewerInterval);
      clearInterval(purchaseInterval);
    };
  }, [productId]);

  return analytics;
};
