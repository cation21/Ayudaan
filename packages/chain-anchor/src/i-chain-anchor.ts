// Mirrors apps/api/src/interfaces/chain-anchor.ts — duplicated here (not
// imported from the api app) so this package has zero dependency on the
// api app and can be consumed or published standalone (spec section 13).
export interface IChainAnchor {
  anchor(merkleRoot: string): Promise<{ txHash: string }>;
  verify(merkleRoot: string, txHash: string): Promise<boolean>;
}
