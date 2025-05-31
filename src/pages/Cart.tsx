
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, cartTotal, cartCount } = useCart();

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
        <div className="space-y-4">
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
                  <p className="text-lime-600 font-bold">${item.products?.price}</p>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                    <span className="text-sm font-medium text-gray-900">
                      Total: ${((item.products?.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  {item.products?.razorpay_link && (
                    <Button 
                      size="sm"
                      onClick={() => window.open(item.products.razorpay_link, '_blank')}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1"
                    >
                      Buy Now
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-green-600">FREE</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Checkout */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{cartCount} items</p>
            <p className="font-bold text-lg">${cartTotal.toFixed(2)}</p>
          </div>
          <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-8 py-3 rounded-xl">
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
