import type { IChainAnchor } from "../interfaces/chain-anchor.js";

// Single Responsibility (spec section 8/9): batches ledger entries into a
// Merkle root and submits it via IChainAnchor on a schedule. Nothing else
// in the codebase should import a chain SDK directly — this is the one seam.
export class ChainAnchorService {
  constructor(private readonly anchor: IChainAnchor) {}

  async anchorBatch(merkleRoot: string) {
    return this.anchor.anchor(merkleRoot);
  }
}
