
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

    // Fetch current analytics
    const fetchAnalytics = async () => {
      const { data } = await supabase
        .from('product_analytics')
        .select('current_viewers, total_purchases')
        .eq('product_id', productId)
        .single();

      if (data) {
        setAnalytics(data);
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

    // Simulate random viewer fluctuations for FOMO
    const interval = setInterval(() => {
      const randomChange = Math.floor(Math.random() * 5) - 2; // -2 to +2
      setAnalytics(prev => ({
        ...prev,
        current_viewers: Math.max(0, prev.current_viewers + randomChange)
      }));
    }, 5000);

    return () => {
      decrementViewer();
      clearInterval(interval);
    };
  }, [productId]);

  return analytics;
};
