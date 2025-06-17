
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
      console.log('=== STRICT ACCESS CHECK ===');
      console.log('Fetching user access for user:', user.id);
      
      // STRICT: Only query verified access through user_product_access table
      const { data: accessData, error: accessError } = await supabase
        .from('user_product_access')
        .select(`
          product_id,
          created_at,
          payment_id,
          payments!inner(
            status,
            verified_at,
            razorpay_payment_id
          )
        `)
        .eq('user_id', user.id);

      if (accessError) {
        console.error('Error fetching user access:', accessError);
        setUserAccess([]);
        return;
      }

      if (accessData && accessData.length > 0) {
        // STRICT: Only include access with verified payments
        const verifiedAccess = accessData.filter(item => {
          const payment = item.payments;
          const isVerified = payment && 
            payment.status === 'completed' && 
            payment.verified_at && 
            payment.razorpay_payment_id;
          
          console.log('Access verification check:', {
            productId: item.product_id,
            paymentId: item.payment_id,
            isVerified,
            paymentStatus: payment?.status,
            hasVerifiedAt: !!payment?.verified_at,
            hasRazorpayId: !!payment?.razorpay_payment_id
          });
          
          return isVerified;
        });

        const productIds = verifiedAccess.map(item => item.product_id);
        console.log('User has verified access to products:', productIds);
        setUserAccess(productIds);
      } else {
        console.log('No verified access found for user');
        setUserAccess([]);
      }
      
    } catch (error) {
      console.error('Error in fetchUserAccess:', error);
      setUserAccess([]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasAccess = (productId: string) => {
    const access = userAccess.includes(productId);
    console.log(`Strict access check for product ${productId}:`, access, 'Verified access list:', userAccess);
    return access;
  };

  const grantAccess = async (productId: string) => {
    console.log('Manual access grant blocked - must go through verified payment flow');
    return false;
  };

  const refreshAccess = async () => {
    console.log('Refreshing user access with strict verification...');
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
