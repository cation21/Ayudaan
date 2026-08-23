import { Contract, JsonRpcProvider, Wallet } from "ethers";
import type { IChainAnchor } from "./i-chain-anchor";

// Minimal placeholder ABI: one function to store a bytes32 root, one event
// for it. Replace with the real deployed contract's ABI once it exists.
const ANCHOR_ABI = [
  "function anchorRoot(bytes32 root) external",
  "event RootAnchored(bytes32 indexed root, uint256 timestamp)",
];

export interface PolygonAnchorAdapterConfig {
  rpcUrl: string;
  // spec section 9 — load from a secrets manager/KMS; never a repo or a
  // plaintext .env outside local dev.
  privateKey: string;
  contractAddress: string;
}

// spec section 8 — the only concrete implementation of IChainAnchor today.
// ChainAnchorService (apps/api) depends on the interface above, not on
// this class or on `ethers` directly.
export class PolygonAnchorAdapter implements IChainAnchor {
  private readonly contract: Contract;

  constructor(config: PolygonAnchorAdapterConfig) {
    const provider = new JsonRpcProvider(config.rpcUrl);
    const wallet = new Wallet(config.privateKey, provider);
    this.contract = new Contract(config.contractAddress, ANCHOR_ABI, wallet);
  }

  async anchor(merkleRoot: string): Promise<{ txHash: string }> {
    const tx = await this.contract.anchorRoot(merkleRoot);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async verify(merkleRoot: string, txHash: string): Promise<boolean> {
    const provider = this.contract.runner as JsonRpcProvider | null;
    const receipt = await provider?.getTransactionReceipt(txHash);
    if (!receipt) return false;
    // TODO: decode RootAnchored logs and compare the decoded root against
    // merkleRoot, rather than only checking transaction status.
    return receipt.status === 1;
  }
}
