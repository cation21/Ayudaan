import type {
  ILedgerRepository,
  LedgerEntryInput,
} from "../interfaces/ledger-repository.js";

// Single Responsibility (spec section 8): append-only ledger writes/reads
// only. Deliberately does not know how to charge a payment or anchor to
// Polygon — see PaymentService and ChainAnchorService.
export class LedgerService {
  constructor(private readonly repo: ILedgerRepository) {}

  async recordDonation(entry: LedgerEntryInput) {
    return this.repo.append(entry);
  }

  async getPublicHistory(postId: number) {
    return this.repo.getChainForPost(postId);
  }
}
