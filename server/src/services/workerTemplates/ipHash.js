const config = __CONFIG__;

export default {
  async fetch(request) {
    if (!config.origins.length) {
      return new Response("No origin servers available", { status: 502 });
    }

    const origin = selectHashedOrigin(config.origins, request);
    return proxyToOrigin(origin, request);
  }
};

function selectHashedOrigin(origins, request) {
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  let hash = 0;

  for (let i = 0; i < ip.length; i += 1) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i);
    hash |= 0;
  }

  return origins[Math.abs(hash) % origins.length];
}

async function proxyToOrigin(origin, request) {
  const url = new URL(request.url);
  const originUrl = origin.url + url.pathname + url.search;
  const requestClone = request.clone();
  const headers = new Headers(requestClone.headers);

  headers.set("Host", url.hostname);
  headers.set("X-Forwarded-For", request.headers.get("cf-connecting-ip") || "");
  headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

  try {
    return await fetch(originUrl, {
      method: request.method,
      headers,
      body: allowsBody(request.method) ? requestClone.body : undefined,
    });
  } catch (error) {
    return new Response("Origin server unavailable", { status: 502 });
  }
}

function allowsBody(method) {
  return method !== "GET" && method !== "HEAD";
}
