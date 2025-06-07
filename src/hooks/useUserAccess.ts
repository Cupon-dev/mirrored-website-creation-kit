
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
      
      // First check user_product_access table
      const { data: accessData, error: accessError } = await supabase
        .from('user_product_access')
        .select('product_id')
        .eq('user_id', user.id);

      if (!accessError && accessData && accessData.length > 0) {
        const productIds = accessData.map(item => item.product_id);
        console.log('User has access to products via user_product_access:', productIds);
        setUserAccess(productIds);
        return;
      }

      // Fallback: Check by email in payments table for completed payments
      console.log('No direct access found, checking payment records for email:', user.email);
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('id, email, status, verified_at')
        .eq('email', user.email)
        .eq('status', 'completed');

      if (!paymentError && paymentData && paymentData.length > 0) {
        console.log('Found completed payments, granting access to digital-product-1');
        
        // Auto-grant access for completed payments
        for (const payment of paymentData) {
          const { error: grantError } = await supabase
            .from('user_product_access')
            .insert({
              user_id: user.id,
              product_id: 'digital-product-1',
              payment_id: payment.id
            })
            .select()
            .single();

          if (!grantError) {
            console.log('Auto-granted access for payment:', payment.id);
          }
        }
        
        setUserAccess(['digital-product-1']);
      } else {
        console.log('No completed payments found for user');
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

      console.log('Granting access to product:', productId, 'for user:', user.id);

      // Find a payment record for this user
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('id')
        .eq('email', user.email)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      const paymentId = paymentData && paymentData.length > 0 ? paymentData[0].id : null;

      // Grant access in database
      const { error } = await supabase
        .from('user_product_access')
        .insert({
          user_id: user.id,
          product_id: productId,
          payment_id: paymentId
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
