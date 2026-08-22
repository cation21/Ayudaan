// spec section 8 — Open/Closed: new rails implement this interface;
// PaymentService never branches on which one it's holding (Liskov
// Substitution — every implementation must honor this same contract).
export interface PaymentProvider {
  charge(params: {
    amountInPaise: number;
    currency: "INR";
    metadata: Record<string, unknown>;
  }): Promise<{ providerTransactionId: string }>;

  refund(providerTransactionId: string): Promise<{ refunded: boolean }>;

  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean;
}
