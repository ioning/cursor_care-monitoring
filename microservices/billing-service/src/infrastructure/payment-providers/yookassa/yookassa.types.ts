export interface YooKassaPaymentRequest {
  amount: {
    value: string;
    currency: string;
  };
  confirmation: {
    type: 'redirect';
    return_url: string;
  };
  description: string;
  metadata?: Record<string, string>;
  capture?: boolean;
}

export interface YooKassaPaymentResponse {
  id: string;
  status: 'pending' | 'succeeded' | 'canceled';
  amount: {
    value: string;
    currency: string;
  };
  confirmation: {
    type: string;
    confirmation_url: string;
  };
  created_at: string;
  description: string;
  metadata?: Record<string, string>;
  paid: boolean;
}

export interface YooKassaWebhookPayload {
  type: 'notification';
  event: 'payment.succeeded' | 'payment.canceled' | 'payment.waiting_for_capture';
  object: {
    id: string;
    status: 'pending' | 'succeeded' | 'canceled';
    amount: {
      value: string;
      currency: string;
    };
    metadata?: Record<string, string>;
    created_at: string;
    paid: boolean;
  };
}

