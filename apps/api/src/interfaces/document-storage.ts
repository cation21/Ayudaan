export interface StoredDocument {
  url: string; // where it's publicly reachable
  hash: string; // sha256 of the file bytes, computed from the actual content
}

// spec section 8 — Open/Closed: LocalDiskStorage is the only
// implementation today; a future S3Storage/R2Storage is a new class, not
// a rewrite of anything that calls this.
export interface IDocumentStorage {
  save(fileBuffer: Buffer, originalFilename: string): Promise<StoredDocument>;
}
