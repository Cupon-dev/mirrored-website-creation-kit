
import { getActiveProducts, checkExistingAccess, grantUserAccess } from './paymentQueries';
import type { PaymentVerificationResult } from './types';

export const grantProductAccess = async (
  userId: string, 
  latestPayment: any
): Promise<Partial<PaymentVerificationResult>> => {
  console.log('=== PRODUCT ACCESS GRANTING ===');
  console.log('Granting access to user:', userId, 'for payment:', latestPayment.id, 'amount:', latestPayment.amount);
  
  // Verify payment is completed
  if (!latestPayment.id || latestPayment.status !== 'completed') {
    console.log('Payment not completed - access denied');
    return {
      success: false,
      error: 'Payment not completed',
      debugInfo: { 
        paymentId: latestPayment.id,
        status: latestPayment.status
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

  // Grant access to products that match payment amount (with some flexibility)
  const paymentAmount = Number(latestPayment.amount || 0);
  const matchingProducts = productsData.filter(product => {
    const productPrice = Number(product.price || 0);
    // Allow small variance for currency conversion issues
    const exactMatch = Math.abs(productPrice - paymentAmount) < 1;
    console.log('Product price matching:', {
      productId: product.id,
      productPrice,
      paymentAmount,
      exactMatch
    });
    return exactMatch;
  });

  if (matchingProducts.length === 0) {
    console.log('No products match payment amount exactly, checking for closest match');
    // If no exact match, find the closest product within reasonable range
    const closestProduct = productsData.reduce((closest, product) => {
      const productPrice = Number(product.price || 0);
      const currentDiff = Math.abs(productPrice - paymentAmount);
      const closestDiff = Math.abs(Number(closest.price || 0) - paymentAmount);
      return currentDiff < closestDiff ? product : closest;
    });

    if (Math.abs(Number(closestProduct.price || 0) - paymentAmount) <= paymentAmount * 0.1) {
      matchingProducts.push(closestProduct);
      console.log('Using closest matching product:', closestProduct.id);
    }
  }

  if (matchingProducts.length === 0) {
    console.log('No suitable products found for payment amount');
    return {
      success: false,
      error: `No products found for payment amount of ₹${paymentAmount}`,
      debugInfo: {
        paymentAmount,
        availableProducts: productsData.map(p => ({ id: p.id, price: p.price }))
      }
    };
  }

  console.log('Products matching payment:', matchingProducts.map(p => ({ 
    id: p.id, 
    price: p.price 
  })));

  // Grant access to matching products
  for (const product of matchingProducts) {
    const productId = product.id;
    console.log('Processing access grant for product:', productId, 'price:', product.price);
    
    // Check if access already exists
    const { existingAccess, error: accessCheckError } = await checkExistingAccess(userId, productId);

    if (accessCheckError) {
      console.error('Error checking existing access:', accessCheckError);
      continue;
    }

    if (!existingAccess) {
      // Grant access to the product
      console.log('Granting new access for payment to product:', productId);
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
