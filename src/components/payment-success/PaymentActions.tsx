
import { Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PaymentActionsProps {
  verificationComplete: boolean;
  isProcessing: boolean;
  onManualRefresh: () => void;
}

const PaymentActions = ({ verificationComplete, isProcessing, onManualRefresh }: PaymentActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <Button
        onClick={() => navigate('/', { replace: true })}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl"
      >
        <Home className="w-5 h-5 mr-2" />
        Go to Home Page
      </Button>
      
      {!verificationComplete && (
        <Button
          onClick={onManualRefresh}
          variant="outline"
          className="w-full"
          disabled={isProcessing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
          Check Payment Status
        </Button>
      )}
    </div>
  );
};

export default PaymentActions;
