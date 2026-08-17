let roundRobinCursor = 0;

const config = __CONFIG__;

// ─── Path pattern matching ────────────────────────────────────────────
function matchPathPattern(pattern, pathname) {
  if (pattern === '/') return pathname === '/';
  const p = pattern.endsWith('/*') ? pattern : pattern.replace(/\/+$/, '');
  if (p === pathname) return true;
  if (p.endsWith('/*')) {
    const prefix = p.slice(0, -2);
    return pathname === prefix || pathname.startsWith(prefix + '/');
  }
  return false;
}

function findMatchingRoute(pathname) {
  for (const route of config.pathRoutes) {
    if (matchPathPattern(route.path, pathname)) return route;
  }
  return null;
}

function findMatchingPathRateLimit(pathname) {
  for (const rl of config.pathRateLimits) {
    if (matchPathPattern(rl.path, pathname)) return rl;
  }
  return null;
}

export default {
  async fetch(request, env) {
    if (!config.origins.length) {
      return new Response("No origin servers available", { status: 502 });
    }

    if (config.corsEnabled && request.method === "OPTIONS") {
      return buildCorsPreflightResponse(request);
    }

    const limited = await enforceRateLimit(request, env);
    if (limited) return limited;

    const pathLimited = await enforcePathRateLimit(request, env);
    if (pathLimited) return pathLimited;

    const url = new URL(request.url);
    const pathRoute = findMatchingRoute(url.pathname);
    let origin;
    if (pathRoute) {
      origin = config.origins[pathRoute.originIndex];
    } else {
      origin = selectRoundRobinOrigin(config.origins);
    }
    return proxyToOrigin(origin, request);
  }
};

// ─── Rate limiting ladder: in-memory → colo cache → platform binding ─────────
const RATE_WINDOW_MS = 60000;
const memoryRateWindows = new Map();

function rateLimitedResponse(retryAfter) {
  return new Response("Rate limit exceeded", {
    status: 429,
    headers: { "Retry-After": String(retryAfter), "Content-Type": "text/plain" },
  });
}

function memoryRateRecordAndCheck(ip, now, limit) {
  const cutoff = now - RATE_WINDOW_MS;
  const key = `rl:${ip}`;
  const recent = (memoryRateWindows.get(key) || []).filter((t) => t >= cutoff);
  const allowed = recent.length < limit;
  recent.push(now);
  memoryRateWindows.set(key, recent);
  if (memoryRateWindows.size > 1000) {
    for (const [k, v] of memoryRateWindows) {
      if (v[v.length - 1] < cutoff) memoryRateWindows.delete(k);
    }
  }
  return allowed;
}

async function cacheRateRecordAndCheck(ip, now, limit) {
  try {
    const key = "https://edgebalancer.local/ratelimit/" + encodeURIComponent(ip);
    const cutoff = now - RATE_WINDOW_MS;
    let recent = [];
    const cached = await caches.default.match(key);
    if (cached) {
      try {
        const parsed = await cached.json();
        if (Array.isArray(parsed.timestamps)) recent = parsed.timestamps;
      } catch {}
    }
    recent = recent.filter((t) => t >= cutoff);
    const allowed = recent.length < limit;
    recent.push(now);
    await caches.default.put(
      key,
      new Response(JSON.stringify({ timestamps: recent }), {
        headers: { "Cache-Control": "max-age=60" },
      })
    );
    return allowed;
  } catch (error) {
    return true; // fail open if the cache is unavailable
  }
}

async function enforceRateLimit(request, env) {
  if (!config.rateLimitEnabled) return null;
  const limit = config.rateLimitRequestsPerMinute || 60;
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const now = Date.now();

  // Layer 1: per-isolate in-memory sliding window (synchronous, race-free)
  if (!memoryRateRecordAndCheck(ip, now, limit)) return rateLimitedResponse(60);

  // Layer 2: per-colo Cache API window (shared across isolates in this colo)
  const cacheAllowed = await cacheRateRecordAndCheck(ip, now, limit);
  if (!cacheAllowed) return rateLimitedResponse(60);

  // Layer 3: platform binding (authoritative when healthy)
  if (!env.EDGEBALANCER_RATE_LIMITER) return null; // fail open if the binding is absent
  const result = await env.EDGEBALANCER_RATE_LIMITER.limit({ key: ip });
  if (!result.success) {
    const retryAfter =
      Number.isFinite(result.reset_in_seconds) && result.reset_in_seconds > 0
        ? Math.max(1, Math.round(result.reset_in_seconds))
        : 60;
    return rateLimitedResponse(retryAfter);
  }
  return null;
}

// ─── Path-based rate limiting ─────────────────────────────────────────
const pathRateWindows = new Map();

async function enforcePathRateLimit(request, env) {
  if (!config.pathRateLimits || !config.pathRateLimits.length) return null;
  const url = new URL(request.url);
  const match = findMatchingPathRateLimit(url.pathname);
  if (!match) return null;
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const now = Date.now();
  const limit = match.requestsPerMinute;
  const key = `prl:${match.path}:${ip}`;
  const cutoff = now - RATE_WINDOW_MS;

  // Layer 1: memory
  const recent = (pathRateWindows.get(key) || []).filter(function(t) { return t >= cutoff; });
  if (recent.length >= limit) return rateLimitedResponse(60);
  recent.push(now);
  pathRateWindows.set(key, recent);
  if (pathRateWindows.size > 1000) {
    for (const [k, v] of pathRateWindows) {
      if (v[v.length - 1] < cutoff) pathRateWindows.delete(k);
    }
  }

  // Layer 2: colo cache
  try {
    const cacheKey = "https://edgebalancer.local/pathratelimit/" + encodeURIComponent(key);
    let cached = [];
    const cachedResp = await caches.default.match(cacheKey);
    if (cachedResp) {
      try {
        const parsed = await cachedResp.json();
        if (Array.isArray(parsed.timestamps)) cached = parsed.timestamps;
      } catch {}
    }
    cached = cached.filter(function(t) { return t >= cutoff; });
    if (cached.length >= limit) return rateLimitedResponse(60);
    cached.push(now);
    await caches.default.put(
      cacheKey,
      new Response(JSON.stringify({ timestamps: cached }), {
        headers: { "Cache-Control": "max-age=60" },
      })
    );
  } catch (e) { /* fail open */ }

  // Layer 3: platform binding
  if (!env.EDGEBALANCER_RATE_LIMITER) return null;
  try {
    const result = await env.EDGEBALANCER_RATE_LIMITER.limit({ key: key });
    if (!result.success) {
      const retryAfter = Number.isFinite(result.reset_in_seconds) && result.reset_in_seconds > 0
        ? Math.max(1, Math.round(result.reset_in_seconds)) : 60;
      return rateLimitedResponse(retryAfter);
    }
  } catch (e) { /* fail open */ }
  return null;
}

function selectRoundRobinOrigin(origins) {
  const origin = origins[roundRobinCursor % origins.length];
  roundRobinCursor = (roundRobinCursor + 1) % 2147483647;
  return origin;
}

async function proxyToOrigin(origin, request) {
  const url = new URL(request.url);
  const originBase = new URL(origin.url);
  const targetUrl = origin.url.replace(/\/$/, "") + url.pathname + url.search;
  const requestClone = request.clone();
  const headers = new Headers(requestClone.headers);

  // Set Host to the origin's hostname — fixes virtual-host routing and image/favicon loading
  headers.set("Host", originBase.hostname);

  // Rewrite Referer so the origin never sees the load balancer's domain
  const referer = headers.get("Referer");
  if (referer) {
    try {
      const refUrl = new URL(referer);
      refUrl.protocol = originBase.protocol;
      refUrl.host = originBase.host;
      headers.set("Referer", refUrl.toString());
    } catch {}
  }

  // Rewrite Origin header to the actual origin domain (skipped when exposeRealOrigin is enabled)
  const originHeader = headers.get("Origin");
  if (originHeader && !config.exposeRealOrigin) {
    headers.set("Origin", originBase.origin);
  }

  // Forward real client IP; strip any header that reveals the load balancer domain
  headers.set("X-Forwarded-For", request.headers.get("cf-connecting-ip") || "");
  headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));
  headers.delete("X-Forwarded-Host");

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: allowsBody(request.method) ? requestClone.body : undefined,
    });
    return config.corsEnabled ? injectCorsHeaders(response, request) : response;
  } catch (error) {
    return new Response("Origin server unavailable", { status: 502 });
  }
}

function allowsBody(method) {
  return method !== "GET" && method !== "HEAD";
}

function getAllowedOrigin(requestOrigin) {
  if (!requestOrigin) return null;
  if (!config.corsOrigins || config.corsOrigins.length === 0) return requestOrigin;
  return config.corsOrigins.includes(requestOrigin) ? requestOrigin : null;
}

function buildCorsPreflightResponse(request) {
  const allowedOrigin = getAllowedOrigin(request.headers.get("Origin"));
  const headers = new Headers();
  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE, PATCH, OPTIONS, CONNECT, TRACE");
    headers.set("Access-Control-Allow-Headers",
      request.headers.get("Access-Control-Request-Headers") || "*");
    headers.set("Access-Control-Expose-Headers", "*");
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Max-Age", "86400");
    headers.set("Vary", "Origin");
  }
  return new Response(null, { status: 204, headers });
}

function injectCorsHeaders(response, request) {
  const allowedOrigin = getAllowedOrigin(request.headers.get("Origin"));
  if (!allowedOrigin) return response;
  const headers = new Headers(response.headers);
  headers.delete("Access-Control-Allow-Origin");
  headers.delete("Access-Control-Allow-Credentials");
  headers.delete("Access-Control-Expose-Headers");
  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Vary", "Origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
