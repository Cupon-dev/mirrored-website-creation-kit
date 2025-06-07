
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserAccess = () => {
  const { user } = useAuth();
  const [userAccess, setUserAccess] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserAccess([]);
      setIsLoading(false);
      return;
    }

    fetchUserAccess();
  }, [user]);

  const fetchUserAccess = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching user access for user:', user.id);
      
      // Query user_product_access table directly - this is the authoritative source
      const { data: accessData, error: accessError } = await supabase
        .from('user_product_access')
        .select('product_id')
        .eq('user_id', user.id);

      if (accessError) {
        console.error('Error fetching user access:', accessError);
        setUserAccess([]);
        return;
      }

      if (accessData && accessData.length > 0) {
        const productIds = accessData.map(item => item.product_id);
        console.log('User has direct access to products:', productIds);
        setUserAccess(productIds);
        return;
      }

      // If no direct access found, don't automatically grant anything
      // Access should only be granted through proper payment flow
      console.log('No existing access found for user');
      setUserAccess([]);
      
    } catch (error) {
      console.error('Error in fetchUserAccess:', error);
      setUserAccess([]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasAccess = (productId: string) => {
    const access = userAccess.includes(productId);
    console.log(`Checking access for product ${productId}:`, access, 'User access list:', userAccess);
    return access;
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

      console.log('Attempting to grant access to product:', productId, 'for user:', user.id);

      // This should only be called after verified payment
      // Don't automatically grant access just because user logged in
      console.log('Manual access grant not allowed - must go through payment verification');
      
    } catch (error) {
      console.error('Error in grantAccess:', error);
    }
  };

  const refreshAccess = async () => {
    console.log('Refreshing user access...');
    await fetchUserAccess();
  };

  return {
    hasAccess,
    grantAccess,
    refreshAccess,
    userAccess,
    isLoading
  };
};
