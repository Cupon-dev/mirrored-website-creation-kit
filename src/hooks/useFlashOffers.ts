
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
    const fetchActiveOffers = async () => {
      const { data } = await supabase
        .from('flash_offers')
        .select('*')
        .eq('is_active', true)
        .gte('end_time', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        setOffers(data);
        if (data.length > 0) {
          setCurrentOffer(data[0]);
        }
      }
    };

    fetchActiveOffers();

    // Check for offer updates every minute
    const interval = setInterval(fetchActiveOffers, 60000);

    return () => clearInterval(interval);
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
