import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

/**
 * Derives a secure 32-byte encryption key from environment secret
 */
const getEncryptionKey = () => {
  const secret =
    process.env.ENCRYPTION_SECRET ||
    process.env.JWT_SECRET ||
    "geo_intelligence_platform_secure_encryption_key_2026";
  return crypto.createHash("sha256").update(String(secret)).digest();
};

/**
 * Encrypts sensitive string (e.g. OAuth refresh token) using AES-256-GCM
 * Output format: <iv_hex>:<auth_tag_hex>:<encrypted_hex>
 */
export const encryptText = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

/**
 * Decrypts AES-256-GCM encrypted string
 */
export const decryptText = (cipherString) => {
  if (!cipherString) return null;
  const parts = cipherString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted cipher format");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

export default {
  encryptText,
  decryptText,
};
