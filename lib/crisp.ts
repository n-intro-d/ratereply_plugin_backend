import axios from "axios";
import { Buffer } from "node:buffer";

const API = "https://api.crisp.chat/v1";

const basic = Buffer.from(
  `${process.env.CRISP_IDENTIFIER}:${process.env.CRISP_KEY}`
).toString("base64");

export const crisp = axios.create({
  baseURL: API,
  headers: { Authorization: `Basic ${basic}` }
});

export async function getConversation(websiteId: string, sessionId: string) {
  const { data } = await crisp.get(`/website/${websiteId}/conversation/${sessionId}`);
  return data;
}

export async function sendMessage(
  websiteId: string,
  sessionId: string,
  msg: unknown
) {
  const { data } = await crisp.post(`/website/${websiteId}/conversation/${sessionId}/message`, msg);
  return data;
}
