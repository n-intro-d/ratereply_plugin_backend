import crypto from "node:crypto";

export function verifyCrispSignature(
  rawBody: string,
  timestamp?: string,
  signature?: string
) {
  if (!timestamp || !signature) return false;
  const payload = `[${timestamp};${rawBody}]`;
  const hmac = crypto
    .createHmac("sha256", process.env.CRISP_SIGNING_SECRET as string)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac));
  } catch {
    return false;
  }
}
