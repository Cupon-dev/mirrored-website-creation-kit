
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface IndexHeaderProps {
  currentView: 'home' | 'library' | 'profile' | 'updates';
  cartCount: number;
}

const IndexHeader = ({ currentView, cartCount }: IndexHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white px-4 py-2 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <div className="hidden sm:block">
            <p className="font-semibold text-gray-900 text-sm">
              {currentView === 'library' ? 'Your Library 📚' : 'PremiumLeaks Store 🔥'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-gray-600" />
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default IndexHeader;
