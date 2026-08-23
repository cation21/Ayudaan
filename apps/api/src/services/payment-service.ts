import type { PaymentProvider } from "../interfaces/payment-provider.js";

// Single Responsibility (spec section 8): charge/refund/webhook handling
// only. Does not decide whether a payout is *allowed* — that policy
// question belongs to whichever service calls this one.
export class PaymentService {
  constructor(private readonly provider: PaymentProvider) {}

  async charge(amountInPaise: number, metadata: Record<string, unknown>) {
    return this.provider.charge({ amountInPaise, currency: "INR", metadata });
  }

  async refund(providerTransactionId: string) {
    return this.provider.refund(providerTransactionId);
  }
}
