import crypto from "node:crypto";

// Field-level encryption for UK special-category / sensitive PII
// (NI number, bank details, visa data). AES-256-GCM with a per-record IV.
// Ciphertext is stored base64 as "iv:tag:data". Key from ENCRYPTION_KEY (base64, 32 bytes).

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  }
  return key;
}

export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}

export function decryptField(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null;
  const [ivB64, tagB64, dataB64] = ciphertext.split(":");
  if (!ivB64 || !tagB64 || !dataB64) return null;
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

/** Mask an NI number for display, e.g. "QQ123456C" -> "QQ•••••6C". */
export function maskNiNumber(ni: string | null): string {
  if (!ni) return "—";
  const clean = ni.replace(/\s/g, "");
  if (clean.length < 4) return "•••";
  return `${clean.slice(0, 2)}•••••${clean.slice(-2)}`;
}
