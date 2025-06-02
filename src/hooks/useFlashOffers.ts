
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
      const endTime = new Date(now.getTime() + (6 * 60 * 60 * 1000)); // 6 hours from now
      
      const offer: FlashOffer = {
        id: 'flash-offer-1',
        product_id: 'digital-products',
        title: 'Digital Product Mega Sale',
        description: 'Limited time offer on all digital products',
        discount_percentage: Math.floor(Math.random() * 30) + 40, // 40-70% off
        original_price: 2999,
        offer_price: 1499,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        is_active: true,
        max_purchases: Math.floor(Math.random() * 3000) + 7000, // 7k-10k max
        current_purchases: Math.floor(Math.random() * 3000) + 3000 // 3k-6k current
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
        setCurrentOffer(data[0]);
      } else {
        // Create a realistic offer if none exists in database
        createRealisticOffer();
      }
    };

    fetchActiveOffers();

    // Simulate realistic purchase updates every 45-60 seconds
    const purchaseUpdateInterval = setInterval(() => {
      setCurrentOffer(prev => {
        if (!prev) return prev;
        
        // Random chance of new purchases (30% chance)
        if (Math.random() < 0.3) {
          const newPurchases = Math.floor(Math.random() * 5) + 1; // 1-5 new purchases
          return {
            ...prev,
            current_purchases: Math.min(prev.max_purchases, prev.current_purchases + newPurchases)
          };
        }
        return prev;
      });
    }, Math.random() * 15000 + 45000); // 45-60 seconds

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
