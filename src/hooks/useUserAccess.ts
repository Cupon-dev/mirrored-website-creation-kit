
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserAccess = () => {
  const { user } = useAuth();
  const [userAccess, setUserAccess] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchUserAccess = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_product_access')
          .select('product_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user access:', error);
          return;
        }

        if (data) {
          setUserAccess(data.map(item => item.product_id));
        }
      } catch (error) {
        console.error('Error in fetchUserAccess:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAccess();
  }, [user]);

  const hasAccess = (productId: string) => {
    return userAccess.includes(productId);
  };

  const grantAccess = async (productId: string) => {
    if (!user) {
      console.log('No user logged in, cannot grant access');
      return;
    }

    try {
      // Check if access already exists
      if (userAccess.includes(productId)) {
        console.log('User already has access to product:', productId);
        return;
      }

      // Grant access in database
      const { error } = await supabase
        .from('user_product_access')
        .insert({
          user_id: user.id,
          product_id: productId
        });

      if (error) {
        console.error('Error granting access:', error);
        return;
      }

      // Update local state
      setUserAccess(prev => [...prev, productId]);
      console.log('Access granted successfully for product:', productId);
    } catch (error) {
      console.error('Error in grantAccess:', error);
    }
  };

  return {
    hasAccess,
    grantAccess,
    userAccess,
    isLoading
  };
};
