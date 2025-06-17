
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
      console.log('=== USER ACCESS CHECK ===');
      console.log('Fetching user access for user:', user.id);
      
      // Query user_product_access with payment verification
      const { data: accessData, error: accessError } = await supabase
        .from('user_product_access')
        .select(`
          product_id,
          created_at,
          payment_id,
          payments!inner(
            status,
            verified_at,
            razorpay_payment_id,
            amount
          )
        `)
        .eq('user_id', user.id);

      if (accessError) {
        console.error('Error fetching user access:', accessError);
        setUserAccess([]);
        return;
      }

      if (accessData && accessData.length > 0) {
        // Include access with verified payments OR completed status
        const validAccess = accessData.filter(item => {
          const payment = item.payments;
          const isValid = payment && (
            (payment.status === 'completed' && payment.verified_at) ||
            (payment.status === 'completed' && payment.razorpay_payment_id)
          );
          
          console.log('Access verification check:', {
            productId: item.product_id,
            paymentId: item.payment_id,
            isValid,
            paymentStatus: payment?.status,
            hasVerifiedAt: !!payment?.verified_at,
            hasRazorpayId: !!payment?.razorpay_payment_id,
            amount: payment?.amount
          });
          
          return isValid;
        });

        const productIds = validAccess.map(item => item.product_id);
        console.log('User has valid access to products:', productIds);
        setUserAccess(productIds);
      } else {
        console.log('No access found for user');
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
    console.log(`Access check for product ${productId}:`, access, 'Access list:', userAccess);
    return access;
  };

  const grantAccess = async (productId: string) => {
    console.log('Direct access grant not allowed - must go through payment flow');
    return false;
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
