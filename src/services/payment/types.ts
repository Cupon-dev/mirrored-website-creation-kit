
export interface PaymentInitializationResult {
  success: boolean;
  error?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
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
