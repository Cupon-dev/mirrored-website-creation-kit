
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Lock, ExternalLink, Sparkles } from 'lucide-react';
import { useUserAccess } from '@/hooks/useUserAccess';

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
  const [isClicked, setIsClicked] = useState(false);
  const userHasAccess = hasAccess(productId);

  const handleLinkClick = () => {
    if (userHasAccess && downloadLink) {
      setIsClicked(true);
      window.open(downloadLink, '_blank');
      
      setTimeout(() => setIsClicked(false), 2000);
    }
  };

  if (userHasAccess) {
    return (
      <Button
        onClick={handleLinkClick}
        className={`w-full font-bold py-4 text-lg rounded-xl shadow-lg transform transition-all duration-300 ${
          isClicked 
            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 scale-105' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-[1.02]'
        }`}
        disabled={!downloadLink}
      >
        {isClicked ? (
          <>
            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
            Opening Your Product! ✨
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" />
            Access Your Product
            <ExternalLink className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={onPurchase}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform transition hover:scale-[1.02]"
      >
        <Download className="w-5 h-5 mr-2" />
        BUY NOW - ${price}
      </Button>
      
      <Button
        disabled
        variant="outline"
        className="w-full border-2 border-gray-300 text-gray-500 font-semibold py-4 text-lg rounded-xl cursor-not-allowed opacity-50"
      >
        <Lock className="w-5 h-5 mr-2" />
        Link
        <Badge className="ml-2 bg-gray-200 text-gray-600">Purchase Required</Badge>
      </Button>
    </div>
  );
};

export default ProductAccessButton;
