
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

    // Generate realistic initial values starting from lower numbers
    const generateRealisticNumbers = () => {
      const baseViewers = Math.floor(Math.random() * (2000) + 1500); // 1500-3500
      const basePurchases = Math.floor(Math.random() * (2000) + 3000); // 3000-5000
      
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

    // Very slow viewer fluctuations (every 30-45 seconds)
    const viewerInterval = setInterval(() => {
      const randomChange = Math.floor(Math.random() * 11) - 5; // -5 to +5
      setAnalytics(prev => ({
        ...prev,
        current_viewers: Math.max(1500, Math.min(9000, prev.current_viewers + randomChange))
      }));
    }, Math.random() * 15000 + 30000); // 30-45 seconds

    // Very slow purchase updates (every 60-90 seconds)
    const purchaseInterval = setInterval(() => {
      if (Math.random() < 0.2) { // 20% chance
        const purchaseIncrease = Math.floor(Math.random() * 2) + 1; // 1-2 purchases
        setAnalytics(prev => ({
          ...prev,
          total_purchases: Math.min(9000, prev.total_purchases + purchaseIncrease)
        }));
      }
    }, Math.random() * 30000 + 60000); // 60-90 seconds

    return () => {
      decrementViewer();
      clearInterval(viewerInterval);
      clearInterval(purchaseInterval);
    };
  }, [productId]);

  return analytics;
};
