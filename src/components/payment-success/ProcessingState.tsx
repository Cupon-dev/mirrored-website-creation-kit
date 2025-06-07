
import { RefreshCw } from 'lucide-react';

const ProcessingState = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-green-700 text-lg font-medium">Verifying payment...</p>
        <p className="text-gray-600 text-sm mt-2">Please wait while we process your payment and grant access</p>
      </div>
    </div>
  );
};

export default ProcessingState;
