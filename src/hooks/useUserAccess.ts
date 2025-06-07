
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
      
      // Query user_product_access table with proper user authentication
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

      // If no direct access found, check payment records to see if we need to grant access
      console.log('No direct access found, checking payment records for email:', user.email);
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('id, email, status, verified_at, amount')
        .eq('email', user.email)
        .eq('status', 'completed');

      if (!paymentError && paymentData && paymentData.length > 0) {
        console.log('Found completed payments, determining which products to grant access to');
        
        // For each completed payment, we need to determine which product it was for
        // This is a simplified approach - in a real system, you'd have payment_items or order_items
        // For now, we'll grant access to the first active product for each payment
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, price')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (!productsError && productsData && productsData.length > 0) {
          const grantedProductIds: string[] = [];
          
          // Match payments to products based on amount (simplified logic)
          for (const payment of paymentData) {
            // Find a product that matches the payment amount
            const matchingProduct = productsData.find(p => 
              Math.abs(Number(p.price) - Number(payment.amount)) < 0.01
            );
            
            if (matchingProduct && !grantedProductIds.includes(matchingProduct.id)) {
              try {
                // Grant access for this specific product
                const { error: grantError } = await supabase
                  .from('user_product_access')
                  .insert({
                    user_id: user.id,
                    product_id: matchingProduct.id,
                    payment_id: payment.id
                  })
                  .select()
                  .single();

                if (!grantError) {
                  console.log('Granted access for payment:', payment.id, 'product:', matchingProduct.id);
                  grantedProductIds.push(matchingProduct.id);
                } else if (grantError.code !== '23505') { // Ignore duplicate key errors
                  console.error('Error granting access:', grantError);
                }
              } catch (error) {
                console.error('Error in grant access:', error);
              }
            }
          }
          
          setUserAccess(grantedProductIds);
        } else {
          console.log('No active products found');
          setUserAccess([]);
        }
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

      // Find a payment record for this user that matches this product
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('id, amount')
        .eq('email', user.email)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (!paymentError && paymentData && paymentData.length > 0) {
        // Get the product details to match with payment amount
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('price')
          .eq('id', productId)
          .single();

        if (!productError && productData) {
          // Find a payment that matches this product's price
          const matchingPayment = paymentData.find(p => 
            Math.abs(Number(p.amount) - Number(productData.price)) < 0.01
          );

          if (matchingPayment) {
            // Grant access in database
            const { error } = await supabase
              .from('user_product_access')
              .insert({
                user_id: user.id,
                product_id: productId,
                payment_id: matchingPayment.id
              });

            if (error && error.code !== '23505') { // Ignore duplicate key errors
              console.error('Error granting access:', error);
              return;
            }

            // Update local state
            setUserAccess(prev => [...prev, productId]);
            console.log('Access granted successfully for product:', productId);
          } else {
            console.log('No matching payment found for product:', productId);
          }
        }
      }
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
