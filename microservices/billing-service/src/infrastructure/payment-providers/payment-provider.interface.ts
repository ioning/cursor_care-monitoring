export interface PaymentData {
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  id: string;
  status: 'pending' | 'succeeded' | 'canceled' | 'failed';
  confirmationUrl?: string;
  amount: {
    value: string;
    currency: string;
  };
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'succeeded' | 'canceled' | 'failed';
  paid: boolean;
  amount: {
    value: string;
    currency: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentProvider {
  createPayment(data: PaymentData): Promise<PaymentResponse>;
  getPaymentStatus(id: string): Promise<PaymentStatus>;
  validateWebhook(payload: any, signature: string): boolean;
  processWebhook(payload: any): Promise<PaymentStatus>;
}


  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  id: string;
  status: 'pending' | 'succeeded' | 'canceled' | 'failed';
  confirmationUrl?: string;
  amount: {
    value: string;
    currency: string;
  };
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'succeeded' | 'canceled' | 'failed';
  paid: boolean;
  amount: {
    value: string;
    currency: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentProvider {
  createPayment(data: PaymentData): Promise<PaymentResponse>;
  getPaymentStatus(id: string): Promise<PaymentStatus>;
  validateWebhook(payload: any, signature: string): boolean;
  processWebhook(payload: any): Promise<PaymentStatus>;
}







