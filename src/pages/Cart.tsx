
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import WhatsAppDelivery from "@/components/WhatsAppDelivery";

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, originalTotal } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const handleOrderComplete = () => {
    // Clear cart and redirect
    cart.forEach(item => removeFromCart(item.id));
    navigate('/');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white px-4 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center">
            <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 mr-3">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Shopping Cart</h1>
          </div>
        </header>
        
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <ShoppingBag className="w-24 h-24 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6 text-center">Add some items to get started</p>
          <Button onClick={() => navigate('/')} className="bg-lime-400 text-gray-800 hover:bg-lime-500">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const totalSavings = originalTotal - cartTotal;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 mr-3">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Cart ({cartCount} items)</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!showCheckout ? (
          <>
            <div className="space-y-4 mb-8">
              {cart.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.products?.image_url}
                      alt={item.products?.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.products?.name}</h3>
                      <div className="flex items-center space-x-2">
                        <p className="text-lime-600 font-bold">${item.products?.price}</p>
                        {item.products?.original_price && (
                          <p className="text-gray-500 line-through text-sm">${item.products?.original_price}</p>
                        )}
                      </div>
                      <div className="flex items-center mt-2 space-x-3">
                        <div className="flex items-center border rounded-lg">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity - 1 })}
                            className="px-3 py-1"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="px-3 py-1 border-x text-sm">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity + 1 })}
                            className="px-3 py-1"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Total: ${((item.products?.price || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>${originalTotal.toFixed(2)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>You Save</span>
                    <span>-${totalSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="text-green-600 font-medium">Instant Digital</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <WhatsAppDelivery 
            cartTotal={cartTotal}
            cartItems={cart}
            onOrderComplete={handleOrderComplete}
          />
        )}
      </div>

      {/* Fixed Bottom Checkout */}
      {!showCheckout && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{cartCount} items</p>
              <p className="font-bold text-lg">${cartTotal.toFixed(2)}</p>
            </div>
            <Button 
              onClick={() => setShowCheckout(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-8 py-3 rounded-xl"
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
