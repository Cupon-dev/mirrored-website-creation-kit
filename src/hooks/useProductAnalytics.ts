
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

    // Generate realistic initial values
    const generateRealisticNumbers = () => {
      const baseViewers = Math.floor(Math.random() * (25000 - 15000) + 15000);
      const basePurchases = Math.floor(Math.random() * (25000 - 5000) + 5000);
      
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

    // Simulate realistic viewer fluctuations for FOMO
    const interval = setInterval(() => {
      const randomChange = Math.floor(Math.random() * 100) - 50; // -50 to +50
      setAnalytics(prev => ({
        ...prev,
        current_viewers: Math.max(15000, Math.min(25000, prev.current_viewers + randomChange))
      }));
    }, 3000);

    // Simulate occasional purchases
    const purchaseInterval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every 10 seconds
        const purchaseIncrease = Math.floor(Math.random() * 5) + 1; // 1-5 purchases
        setAnalytics(prev => ({
          ...prev,
          total_purchases: prev.total_purchases + purchaseIncrease
        }));
      }
    }, 10000);

    return () => {
      decrementViewer();
      clearInterval(interval);
      clearInterval(purchaseInterval);
    };
  }, [productId]);

  return analytics;
};
