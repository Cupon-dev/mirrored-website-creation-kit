
import { getActiveProducts, checkExistingAccess, grantUserAccess } from './paymentQueries';
import type { PaymentVerificationResult } from './types';

export const grantProductAccess = async (
  userId: string, 
  latestPayment: any
): Promise<Partial<PaymentVerificationResult>> => {
  console.log('Granting access to user:', userId);
  
  // Get active products to grant access to
  const { productsData, error: productsError } = await getActiveProducts();

  if (productsError || !productsData || productsData.length === 0) {
    console.error('No active products found:', productsError);
    return { 
      success: false, 
      error: 'No active products found to grant access to',
      debugInfo: { productsError, userId, paymentId: latestPayment.id }
    };
  }

  const productId = productsData[0].id;
  console.log('Found product to grant access to:', productId);
  
  // Check if access already exists
  const { existingAccess, error: accessCheckError } = await checkExistingAccess(userId, productId);

  if (!existingAccess) {
    // Grant new access using direct insert
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
    console.log('Access already exists');
  }

  return { success: true };
};
