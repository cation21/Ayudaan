import { randomUUID } from "node:crypto";
import type { PaymentProvider } from "../interfaces/payment-provider.js";

/**
 * Dev/demo-only implementation of PaymentProvider (spec section 8 —
 * Open/Closed). Always "succeeds" so the donation flow can be exercised
 * locally without real Razorpay keys. RazorpayProvider / UPIProvider are
 * separate future implementations of the same interface — PaymentService
 * never needs to change to add them.
 */
export class MockPaymentProvider implements PaymentProvider {
  async charge(): Promise<{ providerTransactionId: string }> {
    return { providerTransactionId: `mock_${randomUUID()}` };
  }

  async refund(): Promise<{ refunded: boolean }> {
    return { refunded: true };
  }

  verifyWebhookSignature(): boolean {
    return true;
  }
}
