
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

  // Find the product that matches the payment amount
  const matchingProduct = productsData.find(product => {
    const productPrice = Number(product.price || 0);
    const paymentAmount = Number(latestPayment.amount || 0);
    return Math.abs(productPrice - paymentAmount) < 0.01; // Allow for small floating point differences
  });

  if (!matchingProduct) {
    console.log('No product found matching payment amount:', latestPayment.amount);
    // Fallback to first product if no exact match (for backward compatibility)
    const productId = productsData[0].id;
    console.log('Using fallback product:', productId);
    
    const { existingAccess, error: accessCheckError } = await checkExistingAccess(userId, productId);

    if (!existingAccess) {
      const { error: accessError } = await grantUserAccess(userId, productId, latestPayment.id);

      if (accessError) {
        console.error('Error granting fallback access:', accessError);
        return { 
          success: false, 
          error: 'Failed to grant product access',
          debugInfo: { accessError, userId, paymentId: latestPayment.id, productId }
        };
      }
      console.log('Fallback access granted successfully to product:', productId);
    }
    
    return { success: true };
  }

  const productId = matchingProduct.id;
  console.log('Found matching product for payment amount:', productId, 'amount:', latestPayment.amount);
  
  // Check if access already exists for this specific product
  const { existingAccess, error: accessCheckError } = await checkExistingAccess(userId, productId);

  if (!existingAccess) {
    // Grant access to the specific product that matches the payment
    const { error: accessError } = await grantUserAccess(userId, productId, latestPayment.id);

    if (accessError) {
      console.error('Error granting access:', accessError);
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

  return { success: true };
};
