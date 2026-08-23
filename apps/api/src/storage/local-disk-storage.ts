import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { IDocumentStorage, StoredDocument } from "../interfaces/document-storage.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

/**
 * Dev/demo-only implementation of IDocumentStorage (spec section 8 —
 * Open/Closed) — writes to local disk, served via Express static
 * middleware (see index.ts). Production should swap this for an
 * S3Storage/R2Storage behind the same interface; nothing that calls
 * IDocumentStorage needs to change when that happens.
 *
 * NOTE: does not do EXIF/GPS stripping yet (spec section 6/9) — flagged
 * as a real follow-up, not done here.
 */
export class LocalDiskStorage implements IDocumentStorage {
  async save(fileBuffer: Buffer, originalFilename: string): Promise<StoredDocument> {
    await mkdir(UPLOAD_DIR, { recursive: true });

    const hash = createHash("sha256").update(fileBuffer).digest("hex");
    const ext = path.extname(originalFilename) || "";
    const filename = `${randomUUID()}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), fileBuffer);

    const base = process.env.API_PUBLIC_URL ?? "http://localhost:4000";
    return { url: `${base}/uploads/${filename}`, hash };
  }
}
