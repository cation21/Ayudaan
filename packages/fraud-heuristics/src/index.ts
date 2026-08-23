export interface FraudSignal {
  score: number; // 0–1
  reasons: string[];
}

export interface FraudHeuristic {
  evaluate(postId: number): Promise<FraudSignal>;
}

// No concrete implementation in the public scaffold — see README.md.
