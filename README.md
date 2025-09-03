# RateReply Backend (Vercel Functions) — Logging Enabled

This build adds `console.log` statements so you can see payloads in **Vercel → Deployments → Functions logs**.

Endpoints:
- `POST /api/action` — logs signature headers, action body, and message-send outcomes.
- `GET /api/collect` — logs query params (rating, ids) and send-message outcomes.
- `POST /api/webhooks/crisp` — logs raw webhook body (parsed) after signature check.

## Quick start
1) Push to GitHub ➜ Import to Vercel.
2) Env vars:
   - `PUBLIC_BASE_URL=https://api.ratereply.app`
   - `CRISP_IDENTIFIER=...`
   - `CRISP_KEY=...`
   - `CRISP_SIGNING_SECRET=...`
   - (Optional) `FORWARD_DEBUG_WEBHOOK=https://...`
3) Domain: add `api.ratereply.app` to this project.
4) Crisp:
   - Action URL: `https://api.ratereply.app/api/action`
   - Webhooks: `https://api.ratereply.app/api/webhooks/crisp`
   - Paste your `widget.json` in Marketplace → Widgets.

## Where to view logs
Vercel → Project → Deployments → select latest → **Functions** tab.
