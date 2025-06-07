
export interface PaymentVerificationResult {
  success: boolean;
  accessGranted?: boolean;
  driveLink?: string;
  whatsappGroup?: string;
  error?: string;
  debugInfo?: any;
}

export interface PaymentInitializationResult {
  success: boolean;
  paymentId?: string;
  razorpayOrderId?: string;
  error?: string;
}

export interface StuckPaymentsResult {
  success: boolean;
  message?: string;
  error?: string;
  fixedCount?: number;
}
