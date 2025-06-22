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
      console.log('🔒 SECURE: Fetching verified user access for user:', user.id);
      
      // 🔒 SECURITY: Call Edge Function for server-side verification
      const { data, error } = await supabase.functions.invoke('get-user-access', {
        body: {
          user_id: user.id,
          user_email: user.email
        }
      });

      if (error) {
        console.error('❌ Error fetching user access:', error);
        setUserAccess([]);
        return;
      }

      if (data && data.productIds) {
        console.log('✅ VERIFIED: User has access to products:', data.productIds);
        setUserAccess(data.productIds);
      } else {
        console.log('ℹ️ No verified access found for user');
        setUserAccess([]);
      }
      
    } catch (error) {
      console.error('❌ Error in fetchUserAccess:', error);
      setUserAccess([]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasAccess = (productId: string) => {
    const access = userAccess.includes(productId);
    console.log(`🔍 Access check for product ${productId}:`, access ? '✅ GRANTED' : '❌ DENIED');
    return access;
  };

  const grantAccess = async (productId: string) => {
    console.log('❌ Direct access grant not allowed - must go through secure payment flow');
    return false;
  };

  const refreshAccess = async () => {
    console.log('🔄 Refreshing user access...');
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
