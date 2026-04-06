let roundRobinCursor = 0;

const config = __CONFIG__;

export default {
  async fetch(request) {
    if (!config.origins.length) {
      return new Response("No origin servers available", { status: 502 });
    }

    const candidates = selectGeoSteeredOrigins(config.origins, request);

    for (const origin of candidates) {
      const response = await proxyToOrigin(origin, request);
      if (response.status < 500) {
        return response;
      }
    }

    return new Response("Origin server unavailable", { status: 502 });
  }
};

function selectGeoSteeredOrigins(origins, request) {
  const cf = request.cf || {};
  const colo = normalizeGeoCode(cf.colo);
  const country = normalizeGeoCode(cf.country);
  const continent = normalizeGeoCode(cf.continent);

  const coloMatches = origins.filter((origin) => Array.isArray(origin.geoColos) && colo && origin.geoColos.includes(colo));
  if (coloMatches.length > 0) {
    return rotateOrigins(coloMatches);
  }

  const countryMatches = origins.filter((origin) => Array.isArray(origin.geoCountries) && country && origin.geoCountries.includes(country));
  if (countryMatches.length > 0) {
    return rotateOrigins(countryMatches);
  }

  const continentMatches = origins.filter((origin) => Array.isArray(origin.geoContinents) && continent && origin.geoContinents.includes(continent));
  if (continentMatches.length > 0) {
    return rotateOrigins(continentMatches);
  }

  return rotateOrigins(origins);
}

function rotateOrigins(origins) {
  const startIndex = roundRobinCursor % origins.length;
  roundRobinCursor = (roundRobinCursor + 1) % 2147483647;
  return origins.slice(startIndex).concat(origins.slice(0, startIndex));
}

function normalizeGeoCode(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
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
