import crypto from 'crypto';

// Minimal AES-256-GCM encrypt/decrypt using a 32-byte base64 key from env ENCRYPTION_KEY_32B_BASE64

const getKey = () => {
  const b64 = process.env.ENCRYPTION_KEY_32B_BASE64;
  if (!b64) throw new Error('Missing ENCRYPTION_KEY_32B_BASE64');
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY_32B_BASE64 must decode to 32 bytes');
  return key;
};

export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(b64: string): string {
  const key = getKey();
  const buf = Buffer.from(b64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}
