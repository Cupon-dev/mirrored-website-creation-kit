
import { useNavigate } from "react-router-dom";
import { Library, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  image_url?: string;
  razorpay_link?: string;
}

interface IndexLibraryViewProps {
  currentView: 'home' | 'library' | 'profile' | 'updates';
  user: any;
  ownedProducts: Product[];
  setCurrentView: (view: 'home' | 'library' | 'profile' | 'updates') => void;
}

const IndexLibraryView = ({ 
  currentView, 
  user, 
  ownedProducts, 
  setCurrentView 
}: IndexLibraryViewProps) => {
  const navigate = useNavigate();

  if (currentView !== 'library') return null;

  return (
    <div className="mb-4">
      {user ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Your Digital Library</h2>
            <Badge className="bg-green-100 text-green-800">
              {ownedProducts.length} {ownedProducts.length === 1 ? 'Product' : 'Products'}
            </Badge>
          </div>
          {ownedProducts.length === 0 ? (
            <div className="text-center py-8">
              <Library className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-2">Your library is empty</h3>
              <p className="text-gray-500 mb-3 text-sm">Start shopping to add products to your library!</p>
              <Button 
                onClick={() => setCurrentView('home')}
                className="bg-green-500 hover:bg-green-600"
              >
                Browse Products
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-2">Please log in</h3>
          <p className="text-gray-500 mb-3 text-sm">Log in to view your digital library</p>
          <Button 
            onClick={() => navigate('/login')}
            className="bg-green-500 hover:bg-green-600"
          >
            Login
          </Button>
        </div>
      )}
    </div>
  );
};

export default IndexLibraryView;
