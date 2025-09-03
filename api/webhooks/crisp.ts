import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readRawBody } from "../../lib/raw.js";
import { verifyCrispSignature } from "../../lib/signature.js";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const raw = await readRawBody(req);
  const ts = req.headers["x-crisp-request-timestamp"] as string | undefined;
  const sig = req.headers["x-crisp-signature"] as string | undefined;
  const ok = verifyCrispSignature(raw, ts, sig);
  console.log("[webhook] headers", { ts, sigPresent: Boolean(sig), ok });
  if (!ok) return res.status(401).send("Invalid signature");

  let parsed: any = {};
  try { parsed = JSON.parse(raw); } catch {}
  console.log("[webhook] body", parsed);

  if (process.env.FORWARD_DEBUG_WEBHOOK) {
    try {
      const r = await axios.post(process.env.FORWARD_DEBUG_WEBHOOK, {
        event: "webhook",
        raw: parsed,
        at: Date.now()
      });
      console.log("[webhook] forwarded to sink", r.status);
    } catch {
      console.error("[webhook] sink error");
    }
  }

  res.status(200).end();
}
