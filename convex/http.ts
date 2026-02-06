import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

function corsHeaders(): Headers {
  return new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  });
}

const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";

const optionsHandler = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
});

const chatHandler = httpAction(async (_ctx, request) => {
  const headers = corsHeaders();
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") {
    headers.set("Content-Type", "text/plain");
    return new Response("Method not allowed", { status: 405, headers });
  }
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    headers.set("Content-Type", "application/json");
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }),
      { status: 500, headers }
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers,
    });
  }
  const res = await fetch(openRouterUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { status: res.status, headers });
});

const http = httpRouter();
http.route({ path: "/api/chat", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/api/chat", method: "POST", handler: chatHandler });

export default http;
