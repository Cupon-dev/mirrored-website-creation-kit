
import { CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuccessDisplayProps {
  verificationComplete: boolean;
  paymentData: {
    email: string;
    driveLink?: string;
    whatsappGroup?: string;
  } | null;
}

const SuccessDisplay = ({ verificationComplete, paymentData }: SuccessDisplayProps) => {
  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
      <p className="text-gray-600 mb-6">
        {verificationComplete ? 'Your purchase has been completed and access granted!' : 'Your payment has been received and is being processed.'}
      </p>

      {verificationComplete && (
        <div className="space-y-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-green-800 mb-2">✅ Access Granted!</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✅ Product access activated</li>
              <li>✅ Available on home page now</li>
              <li>✅ Permanent access to content</li>
            </ul>
          </div>

          {paymentData?.driveLink && (
            <div className="bg-purple-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-purple-800 mb-2">🔗 Your Content</h3>
              <Button
                onClick={() => window.open(paymentData.driveLink, '_blank')}
                variant="outline"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-100 mb-2"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Access Download Link
              </Button>
              {paymentData?.whatsappGroup && (
                <Button
                  onClick={() => window.open(paymentData.whatsappGroup, '_blank')}
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-100"
                >
                  💬 Join WhatsApp Group
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        💡 Your purchased products will show "Access Your Content" button on the home page!
      </p>
    </div>
  );
};

export default SuccessDisplay;
