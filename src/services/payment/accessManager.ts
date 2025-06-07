
import { getActiveProducts, checkExistingAccess, grantUserAccess } from './paymentQueries';
import type { PaymentVerificationResult } from './types';

export const grantProductAccess = async (
  userId: string, 
  latestPayment: any
): Promise<Partial<PaymentVerificationResult>> => {
  console.log('Granting access to user:', userId, 'for payment:', latestPayment.id);
  
  // Get active products to potentially grant access to
  const { productsData, error: productsError } = await getActiveProducts();

  if (productsError || !productsData || productsData.length === 0) {
    console.error('No active products found:', productsError);
    return { 
      success: false, 
      error: 'No active products found to grant access to',
      debugInfo: { productsError, userId, paymentId: latestPayment.id }
    };
  }

  // Find products that match the payment amount
  const paymentAmount = Number(latestPayment.amount || 0);
  const matchingProducts = productsData.filter(product => {
    const productPrice = Number(product.price || 0);
    return Math.abs(productPrice - paymentAmount) < 0.01; // Allow for small floating point differences
  });

  console.log('Found matching products for payment amount:', paymentAmount, 'products:', matchingProducts.length);

  // If no exact match, grant access to the first product (fallback for backward compatibility)
  const productsToGrant = matchingProducts.length > 0 ? matchingProducts : [productsData[0]];

  for (const product of productsToGrant) {
    const productId = product.id;
    console.log('Processing access grant for product:', productId, 'amount:', product.price);
    
    // Check if access already exists for this specific product
    const { existingAccess, error: accessCheckError } = await checkExistingAccess(userId, productId);

    if (!existingAccess) {
      // Grant access to the specific product that matches the payment
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
      console.log('Access already exists for product:', productId);
    }
  }

  return { success: true };
};
