
import ProcessingState from './payment-success/ProcessingState';
import SuccessDisplay from './payment-success/SuccessDisplay';
import PaymentActions from './payment-success/PaymentActions';
import { usePaymentVerification } from './payment-success/usePaymentVerification';

const PaymentSuccessHandler = () => {
  const {
    isProcessing,
    paymentData,
    verificationComplete,
    handleManualRefresh
  } = usePaymentVerification();

  if (isProcessing) {
    return <ProcessingState />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SuccessDisplay 
          verificationComplete={verificationComplete}
          paymentData={paymentData}
        />
        <div className="mt-6">
          <PaymentActions
            verificationComplete={verificationComplete}
            isProcessing={isProcessing}
            onManualRefresh={handleManualRefresh}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessHandler;
