// spec section 8/9 — the only thing ChainAnchorService is allowed to depend
// on. Today's implementation is @ayudaan/chain-anchor's
// PolygonAnchorAdapter — if the anchor chain ever changes, this interface
// is what makes that a new adapter instead of a rewrite.
export interface IChainAnchor {
  anchor(merkleRoot: string): Promise<{ txHash: string }>;
  verify(merkleRoot: string, txHash: string): Promise<boolean>;
}
