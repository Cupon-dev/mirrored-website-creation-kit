
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Lock, ExternalLink, Sparkles, Play } from 'lucide-react';
import { useUserAccess } from '@/hooks/useUserAccess';
import { useAuth } from '@/hooks/useAuth';

interface ProductAccessButtonProps {
  productId: string;
  downloadLink?: string;
  price: number;
  onPurchase: () => void;
}

const ProductAccessButton = ({ 
  productId, 
  downloadLink, 
  price, 
  onPurchase 
}: ProductAccessButtonProps) => {
  const { hasAccess } = useUserAccess();
  const { user } = useAuth();
  const [isClicked, setIsClicked] = useState(false);
  const userHasAccess = user && hasAccess(productId);

  const handleLinkClick = () => {
    if (userHasAccess && downloadLink) {
      setIsClicked(true);
      window.open(downloadLink, '_blank');
      
      setTimeout(() => setIsClicked(false), 2000);
    }
  };

  const handleDemoClick = () => {
    // Demo video link
    window.open('https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view', '_blank');
  };

  if (userHasAccess) {
    return (
      <div className="space-y-2">
        <Button
          onClick={handleLinkClick}
          className={`w-full font-bold py-2 md:py-4 text-sm md:text-lg rounded-xl shadow-lg transform transition-all duration-300 ${
            isClicked 
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 scale-105' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-[1.02]'
          }`}
          disabled={!downloadLink}
        >
          {isClicked ? (
            <>
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin" />
              <span className="hidden md:inline">Opening Your Product! ✨</span>
              <span className="md:hidden">Opening! ✨</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="hidden md:inline">Access Your Product</span>
              <span className="md:hidden">Access</span>
              <ExternalLink className="w-3 h-3 md:w-4 md:h-4 ml-2" />
            </>
          )}
        </Button>
        
        <Button
          onClick={handleDemoClick}
          variant="outline"
          className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 py-2 text-sm"
        >
          <Play className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">Watch Demo Video</span>
          <span className="md:hidden">Demo</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      <Button
        onClick={onPurchase}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 md:py-4 text-sm md:text-lg rounded-xl shadow-lg transform transition hover:scale-[1.02]"
      >
        <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
        <span className="hidden md:inline">BUY NOW - ₹{price.toLocaleString('en-IN')}</span>
        <span className="md:hidden">₹{price.toLocaleString('en-IN')}</span>
      </Button>
      
      <Button
        onClick={handleDemoClick}
        variant="outline"
        className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 py-2 text-sm"
      >
        <Play className="w-4 h-4 mr-2" />
        <span className="hidden md:inline">Watch Demo Video</span>
        <span className="md:hidden">Demo</span>
      </Button>
      
      <Button
        disabled
        variant="outline"
        className="w-full border-2 border-gray-300 text-gray-500 font-semibold py-2 md:py-4 text-sm md:text-lg rounded-xl cursor-not-allowed opacity-50"
      >
        <Lock className="w-4 h-4 md:w-5 md:h-5 mr-2" />
        <span className="hidden md:inline">Full Access</span>
        <span className="md:hidden">🔗</span>
        <Badge className="ml-2 bg-gray-200 text-gray-600 text-xs">Purchase Required</Badge>
      </Button>
    </div>
  );
};

export default ProductAccessButton;
