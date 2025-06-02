
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FlashOffer {
  id: string;
  product_id: string;
  title: string;
  description: string;
  discount_percentage: number;
  original_price: number;
  offer_price: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  max_purchases: number;
  current_purchases: number;
}

export const useFlashOffers = () => {
  const [offers, setOffers] = useState<FlashOffer[]>([]);
  const [currentOffer, setCurrentOffer] = useState<FlashOffer | null>(null);

  useEffect(() => {
    // Create a realistic flash offer if none exists
    const createRealisticOffer = () => {
      const now = new Date();
      const endTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // 8 hours from now
      
      const offer: FlashOffer = {
        id: 'flash-offer-1',
        product_id: 'digital-products',
        title: 'Digital Product Mega Sale',
        description: 'Limited time offer on all digital products',
        discount_percentage: Math.floor(Math.random() * 25) + 45, // 45-70% off
        original_price: 2999,
        offer_price: 1299,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        is_active: true,
        max_purchases: Math.floor(Math.random() * (13500 - 10000) + 10000), // 10k-13.5k max
        current_purchases: Math.floor(Math.random() * (13500 - 1900) + 1900) // 1900-13500 current
      };
      
      setCurrentOffer(offer);
    };

    const fetchActiveOffers = async () => {
      const { data } = await supabase
        .from('flash_offers')
        .select('*')
        .eq('is_active', true)
        .gte('end_time', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setOffers(data);
        // Ensure database values are within our ranges
        const clampedOffer = {
          ...data[0],
          current_purchases: Math.max(1900, Math.min(13500, data[0].current_purchases))
        };
        setCurrentOffer(clampedOffer);
      } else {
        // Create a realistic offer if none exists in database
        createRealisticOffer();
      }
    };

    fetchActiveOffers();

    // Simulate very slow purchase updates every 10-15 seconds
    const purchaseUpdateInterval = setInterval(() => {
      setCurrentOffer(prev => {
        if (!prev) return prev;
        
        // Random chance of new purchases (25% chance)
        if (Math.random() < 0.25) {
          const purchaseChange = Math.random() < 0.7
            ? Math.floor(Math.random() * 18) + 12  // +12 to +29 (double digit increase)
            : -(Math.floor(Math.random() * 6) + 1); // -1 to -6 (single digit decrease)
          
          return {
            ...prev,
            current_purchases: Math.max(1900, Math.min(13500, prev.current_purchases + purchaseChange))
          };
        }
        return prev;
      });
    }, Math.random() * 5000 + 10000); // 10-15 seconds

    return () => clearInterval(purchaseUpdateInterval);
  }, []);

  const getTimeRemaining = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, total: diff };
  };

  return {
    offers,
    currentOffer,
    getTimeRemaining
  };
};
