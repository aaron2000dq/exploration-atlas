/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision?: string }>;
};
declare const __BUILD_ID__: string;

const CACHE_PREFIX = "exploration-atlas-";
const CACHE_NAME = `${CACHE_PREFIX}${__BUILD_ID__}`;
const precacheUrls = [...new Set(self.__WB_MANIFEST.map((entry) => entry.url))];

async function createRangeResponse(request: Request, cached: Response) {
  const range = request.headers.get("range");
  if (!range) return cached;

  const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
  if (!match) return cached;

  const blob = await cached.blob();
  const size = blob.size;
  const [, startText, endText] = match;
  let start: number;
  let end: number;

  if (!startText && endText) {
    const suffixLength = Number(endText);
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(startText || 0);
    end = endText ? Math.min(Number(endText), size - 1) : size - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= size) {
    return new Response(null, {
      status: 416,
      statusText: "Range Not Satisfiable",
      headers: { "Content-Range": `bytes */${size}` },
    });
  }

  const contentType = cached.headers.get("Content-Type") ?? "video/mp4";
  const part = blob.slice(start, end + 1, contentType);
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-cache",
    "Content-Length": String(part.size),
    "Content-Range": `bytes ${start}-${end}/${size}`,
    "Content-Type": contentType,
  });

  return new Response(await part.arrayBuffer(), {
    status: 206,
    statusText: "Partial Content",
    headers,
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(precacheUrls))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim())
      .then(async () => {
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        clients.forEach((client) => {
          client.postMessage({ type: "ATLAS_UPDATED", buildId: __BUILD_ID__ });
        });
      }),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === "/sw.js") {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("index.html", clone));
          }
          return response;
        })
        .catch(async () => (await caches.match("index.html")) ?? Response.error()),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return createRangeResponse(event.request, cached);
      return fetch(event.request)
        .then((response) => {
          if (response.ok && response.status !== 206) {
            const clone = response.clone();
            void cache.put(event.request, clone).catch(() => undefined);
          }
          return response;
        })
        .catch(() => Response.error());
    }),
  );
});

export {};
