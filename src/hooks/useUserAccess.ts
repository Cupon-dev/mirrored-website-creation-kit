
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserAccess = () => {
  const { user } = useAuth();
  const [userAccess, setUserAccess] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchUserAccess = async () => {
      const { data } = await supabase
        .from('user_product_access')
        .select('product_id')
        .eq('user_id', user.id);

      if (data) {
        setUserAccess(data.map(item => item.product_id));
      }
    };

    fetchUserAccess();
  }, [user]);

  const hasAccess = (productId: string) => {
    return userAccess.includes(productId);
  };

  const grantAccess = (productId: string) => {
    setUserAccess(prev => [...prev, productId]);
  };

  return {
    hasAccess,
    grantAccess,
    userAccess
  };
};
