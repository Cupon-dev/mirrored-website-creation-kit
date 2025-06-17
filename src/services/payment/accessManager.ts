
import { getActiveProducts, checkExistingAccess, grantUserAccess } from './paymentQueries';
import type { PaymentVerificationResult } from './types';

export const grantProductAccess = async (
  userId: string, 
  latestPayment: any
): Promise<Partial<PaymentVerificationResult>> => {
  console.log('=== STRICT ACCESS GRANTING ===');
  console.log('Granting access to user:', userId, 'for payment:', latestPayment.id, 'amount:', latestPayment.amount);
  
  // CRITICAL: Verify payment is actually completed and verified
  if (!latestPayment.razorpay_payment_id || !latestPayment.verified_at) {
    console.log('Payment not properly verified - access denied');
    return {
      success: false,
      error: 'Payment not properly verified through gateway',
      debugInfo: { 
        paymentId: latestPayment.id,
        hasRazorpayId: !!latestPayment.razorpay_payment_id,
        hasVerifiedAt: !!latestPayment.verified_at
      }
    };
  }

  // Get active products for matching
  const { productsData, error: productsError } = await getActiveProducts();

  if (productsError || !productsData || productsData.length === 0) {
    console.error('No active products found:', productsError);
    return { 
      success: false, 
      error: 'No active products available for access grant',
      debugInfo: { productsError, userId, paymentId: latestPayment.id }
    };
  }

  console.log('Available products for access grant:', productsData.map(p => ({ 
    id: p.id, 
    price: p.price 
  })));

  // STRICT: Only grant access to products that exactly match payment amount
  const paymentAmount = Number(latestPayment.amount || 0);
  const matchingProducts = productsData.filter(product => {
    const productPrice = Number(product.price || 0);
    const exactMatch = Math.abs(productPrice - paymentAmount) < 0.01;
    console.log('Product price matching:', {
      productId: product.id,
      productPrice,
      paymentAmount,
      exactMatch
    });
    return exactMatch;
  });

  if (matchingProducts.length === 0) {
    console.log('No products match payment amount - access denied');
    return {
      success: false,
      error: `No products found matching payment amount of ₹${paymentAmount}`,
      debugInfo: {
        paymentAmount,
        availableProducts: productsData.map(p => ({ id: p.id, price: p.price })),
        noExactMatch: true
      }
    };
  }

  console.log('Products matching payment amount:', matchingProducts.map(p => ({ 
    id: p.id, 
    price: p.price 
  })));

  // Grant access only to matching products
  for (const product of matchingProducts) {
    const productId = product.id;
    console.log('Processing access grant for exact match product:', productId, 'price:', product.price);
    
    // Check if access already exists
    const { existingAccess, error: accessCheckError } = await checkExistingAccess(userId, productId);

    if (accessCheckError) {
      console.error('Error checking existing access:', accessCheckError);
      continue;
    }

    if (!existingAccess) {
      // Grant access to the specific product that matches the payment
      console.log('Granting new access for verified payment to product:', productId);
      const { error: accessError } = await grantUserAccess(userId, productId, latestPayment.id);

      if (accessError) {
        console.error('Error granting access to product:', productId, accessError);
        return { 
          success: false, 
          error: 'Failed to grant product access',
          debugInfo: { accessError, userId, paymentId: latestPayment.id, productId }
        };
      }
      console.log('Access granted successfully to product:', productId);
    } else {
      console.log('Access already exists for product:', productId, 'granted at:', existingAccess.created_at);
    }
  }

  console.log('=== ACCESS GRANTING COMPLETED ===');
  return { success: true };
};
