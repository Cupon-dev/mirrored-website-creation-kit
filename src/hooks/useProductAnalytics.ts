
import { useState, useEffect, useCallback } from 'react';
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

  const incrementViewer = useCallback(async () => {
    await supabase.rpc('update_product_viewers', {
      product_uuid: productId,
      viewer_change: 1
    });
  }, [productId]);

  const decrementViewer = useCallback(async () => {
    await supabase.rpc('update_product_viewers', {
      product_uuid: productId,
      viewer_change: -1
    });
  }, [productId]);

  useEffect(() => {
    if (!productId) return;

    // Generate realistic initial values within specified ranges
    const generateRealisticNumbers = () => {
      const baseViewers = Math.floor(Math.random() * (14500 - 1500) + 1500); // 1500-14500
      const basePurchases = Math.floor(Math.random() * (13500 - 1900) + 1900); // 1900-13500
      
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
        // Ensure database values are within our ranges
        const clampedViewers = Math.max(1500, Math.min(14500, data.current_viewers));
        const clampedPurchases = Math.max(1900, Math.min(13500, data.total_purchases));
        
        setAnalytics({
          current_viewers: clampedViewers,
          total_purchases: clampedPurchases
        });
      } else {
        generateRealisticNumbers();
      }
    };

    fetchAnalytics();
    incrementViewer();

    // Very slow viewer fluctuations (every 10-15 seconds)
    const viewerInterval = setInterval(() => {
      const randomChange = Math.random() < 0.6 
        ? Math.floor(Math.random() * 20) + 10  // +10 to +29 (double digit increase)
        : -(Math.floor(Math.random() * 9) + 1); // -1 to -9 (single digit decrease)
      
      setAnalytics(prev => ({
        ...prev,
        current_viewers: Math.max(1500, Math.min(14500, prev.current_viewers + randomChange))
      }));
    }, Math.random() * 5000 + 10000); // 10-15 seconds

    // Very slow purchase updates (every 10-20 seconds)
    const purchaseInterval = setInterval(() => {
      if (Math.random() < 0.4) { // 40% chance
        const purchaseChange = Math.random() < 0.7
          ? Math.floor(Math.random() * 15) + 10  // +10 to +24 (double digit increase)
          : -(Math.floor(Math.random() * 5) + 1); // -1 to -5 (single digit decrease)
        
        setAnalytics(prev => ({
          ...prev,
          total_purchases: Math.max(1900, Math.min(13500, prev.total_purchases + purchaseChange))
        }));
      }
    }, Math.random() * 10000 + 10000); // 10-20 seconds

    return () => {
      decrementViewer();
      clearInterval(viewerInterval);
      clearInterval(purchaseInterval);
    };
  }, [productId, incrementViewer, decrementViewer]);

  return { analytics, incrementViewer, decrementViewer };
};
