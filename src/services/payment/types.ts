
export interface PaymentInitializationResult {
  success: boolean;
  error?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  prefill?: {
    email: string;
    contact: string;
  };
  notes?: any;
}

export interface PaymentVerificationResult {
  success: boolean;
  error?: string;
  accessGranted?: boolean;
  driveLink?: string;
  whatsappGroup?: string;
  debugInfo?: any;
}

export interface StuckPaymentsResult {
  success: boolean;
  error?: string;
  message?: string;
  fixedCount?: number;
}
