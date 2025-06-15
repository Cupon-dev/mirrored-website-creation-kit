
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { initializePayment } from '@/services/payment/paymentInitialization';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, removeFromCart, clearAllItems, cartTotal, discountAmount, finalAmount } = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to complete your purchase",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // For simplicity, use the first product for payment initialization
      const firstProduct = cart[0];
      const productPrice = firstProduct.products.price;

      console.log('Initializing payment for:', {
        email: user.email,
        phone: user.mobile_number || '1234567890',
        amount: productPrice,
        productId: firstProduct.product_id
      });

      const paymentResult = await initializePayment(
        user.email,
        user.mobile_number || '1234567890',
        productPrice,
        firstProduct.product_id
      );

      console.log('Payment initialization result:', paymentResult);

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment initialization failed');
      }

      // Initialize Razorpay
      const options = {
        key: 'rzp_test_your_key_id', // Replace with your actual key
        amount: paymentResult.amount! * 100,
        currency: paymentResult.currency,
        name: paymentResult.name,
        description: paymentResult.description,
        order_id: paymentResult.orderId,
        handler: function(response: any) {
          console.log('Payment successful:', response);
          
          // Clear cart after successful payment
          clearAllItems();
          
          // Redirect to success page
          const successUrl = `/payment-success?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}&signature=${response.razorpay_signature}&email=${user.email}`;
          window.location.href = successUrl;
        },
        prefill: paymentResult.prefill,
        notes: paymentResult.notes,
        theme: {
          color: '#10B981'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "You can continue shopping and try again",
              variant: "default",
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    clearAllItems();
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Continue Shopping
          </Button>

          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Start shopping to add products to your cart!</p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-green-500 hover:bg-green-600"
            >
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Continue Shopping
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Your Cart ({cart.length})</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>

              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <img 
                      src={item.products.image_url} 
                      alt={item.products.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.products.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-bold text-green-600">
                          ₹{Number(item.products.price).toLocaleString('en-IN')}
                        </span>
                        {item.products.original_price && (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              ₹{Number(item.products.original_price).toLocaleString('en-IN')}
                            </span>
                            <Badge className="bg-red-100 text-red-800">
                              {item.products.discount_percentage}% OFF
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{finalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Proceed to Pay
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Secure payment powered by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
