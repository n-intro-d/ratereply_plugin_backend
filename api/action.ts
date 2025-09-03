import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readRawBody } from "../lib/raw.js";
import { verifyCrispSignature } from "../lib/signature.js";
import { getConversation, sendMessage } from "../lib/crisp.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const raw = await readRawBody(req);
  const ts = req.headers["x-crisp-request-timestamp"] as string | undefined;
  const sig = req.headers["x-crisp-signature"] as string | undefined;
  const ok = verifyCrispSignature(raw, ts, sig);
  console.log("[action] headers", { ts, sigPresent: Boolean(sig), ok });

  if (!ok) return res.status(401).send("Invalid signature");

  let body: any = {};
  try { body = JSON.parse(raw); } catch {}
  console.log("[action] raw body", body);

  const b = (body?.data ?? body) || {};
  const website_id = b.website_id || b.website?.id;
  const session_id = b.session_id || b.session?.id;
  const operator = b.operator || b.user || {};
  if (!website_id || !session_id) {
    console.error("[action] missing ids", { website_id, session_id });
    return res.status(400).json({ error: "Missing website_id/session_id" });
  }

  const convo = await getConversation(website_id, session_id);
  const availability: string = convo?.data?.availability;
  console.log("[action] conversation", {
    website_id, session_id, availability
  });

  const base = process.env.PUBLIC_BASE_URL!;
  const operatorName = operator?.nickname || operator?.name || "our support agent";

  const pickerMsg = {
    type: "picker",
    content: {
      id: "ratereply:stars",
      text: `Please leave a quick rating for ${operatorName}`,
      choices: [1, 2, 3, 4, 5].map((n) => ({
        value: String(n),
        label: "⭐".repeat(n),
        selected: false
      })),
      action: {
        type: "link",
        target: `${base}/api/collect?website_id=${encodeURIComponent(
          website_id
        )}&session_id=${encodeURIComponent(session_id)}&rating={value}&src=picker`
      },
      required: false
    },
    from: "operator",
    origin: "chat"
  };
  const r1 = await sendMessage(website_id, session_id, pickerMsg);
  console.log("[action] picker sent", r1);

  const fallbackLinks = [1, 2, 3, 4, 5]
    .map((n) => `(${n}) ${base}/api/collect?website_id=${encodeURIComponent(
      website_id
    )}&session_id=${encodeURIComponent(session_id)}&rating=${n}&src=text`)
    .join("  ");

  const r2 = await sendMessage(website_id, session_id, {
    type: "text",
    content: { text: `Or tap a link: ${fallbackLinks}` },
    from: "operator",
    origin: "chat"
  });
  console.log("[action] fallback text sent", r2);

  if (availability === "offline") {
    const hasEmail =
      (convo.data?.participants || []).some((p: any) => p.type === "email") ||
      (convo.data?.verifications || []).some((v: any) => v.identity === "email");
    console.log("[action] offline branch", { hasEmail });

    if (hasEmail) {
      const r3 = await sendMessage(website_id, session_id, {
        type: "text",
        content: {
          text:
            `Please leave a quick rating for ${operatorName}:
` +
            [1, 2, 3, 4, 5]
              .map((n) => `${"⭐".repeat(n)} → ${base}/api/collect?website_id=${encodeURIComponent(
                website_id
              )}&session_id=${encodeURIComponent(
                session_id
              )}&rating=${n}&src=email`)
              .join("\n")
        },
        from: "operator",
        origin: "email"
      });
      console.log("[action] email text sent", r3);
    }
  }

  return res.status(200).json({ outcome: "success" });
}
