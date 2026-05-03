/**
 * Cloudflare Pages Function — proxies all /api/* requests to the Render backend.
 *
 * Set RENDER_API_URL in the Cloudflare Pages dashboard:
 *   Settings → Environment Variables → Add variable
 *   Key: RENDER_API_URL
 *   Value: https://your-service.onrender.com   (no trailing slash)
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Session-Id",
  "Access-Control-Allow-Credentials": "true",
};

export async function onRequest(context) {
  const { request, env } = context;

  const origin = request.headers.get("Origin") || "*";
  const cors = { ...CORS_HEADERS, "Access-Control-Allow-Origin": origin };

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const renderApiUrl = env.RENDER_API_URL;
  if (!renderApiUrl) {
    return new Response(
      JSON.stringify({ error: "RENDER_API_URL is not configured in Cloudflare Pages environment variables." }),
      { status: 500, headers: { "Content-Type": "application/json", ...cors } }
    );
  }

  const url = new URL(request.url);
  const targetUrl = `${renderApiUrl.replace(/\/$/, "")}${url.pathname}${url.search}`;

  // Forward headers — strip host so Render gets the correct one
  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.delete("host");
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) forwardHeaders.set("X-Forwarded-For", cfIp);

  const hasBody = !["GET", "HEAD"].includes(request.method);

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: hasBody ? request.body : undefined,
      redirect: "follow",
    });

    // Rebuild response headers, inject CORS
    const responseHeaders = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(cors)) {
      responseHeaders.set(k, v);
    }
    // Remove headers that conflict with Cloudflare's own handling
    responseHeaders.delete("transfer-encoding");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to reach backend", detail: String(err) }),
      { status: 502, headers: { "Content-Type": "application/json", ...cors } }
    );
  }
}
