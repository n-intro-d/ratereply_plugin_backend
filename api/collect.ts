import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendMessage } from "../lib/crisp.js";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end("Method Not Allowed");

  const website_id = req.query.website_id as string;
  const session_id = req.query.session_id as string;
  const rating = Number(req.query.rating);
  const src = (req.query.src as string) || "unknown";

  console.log("[collect] query", { website_id, session_id, rating, src });

  if (!website_id || !session_id || !rating) {
    console.error("[collect] missing params");
    return res.status(400).send("Missing params");
  }

  if (process.env.FORWARD_DEBUG_WEBHOOK) {
    try {
      const r = await axios.post(process.env.FORWARD_DEBUG_WEBHOOK, {
        type: "ratereply:rating",
        website_id, session_id, rating, source: src, at: Date.now()
      });
      console.log("[collect] forwarded to sink", r.status);
    } catch (e) {
      console.error("[collect] sink error");
    }
  }

  const r1 = await sendMessage(website_id, session_id, {
    type: "text",
    content: { text: `Thank you for your ${"⭐".repeat(rating)} rating!` },
    from: "operator",
    origin: "chat"
  });
  console.log("[collect] thank-you sent", r1);

  const r2 = await sendMessage(website_id, session_id, {
    type: "field",
    content: {
      id: "ratereply:comment",
      label: "Leave us a comment.",
      explain: "Optional, but very helpful.",
      required: false,
      value: ""
    },
    from: "operator",
    origin: "chat"
  });
  console.log("[collect] comment field sent", r2);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:system-ui;margin:2rem}</style>
    <h2>Thank you!</h2>
    <p>Your rating was recorded.</p>`);
}
