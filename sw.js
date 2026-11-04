// 司令塔 service worker: アプリとしてインストール可能にするための最小構成。
// 中身は常にネットワーク優先（古い画面を配らないため、キャッシュはオフライン時の予備だけ）。
self.addEventListener("install", function (event) {
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // 画面（ナビゲーション）はHTTPキャッシュを使わず常に最新を取りに行く（配信側の10分キャッシュで古い画面が残るのを防ぐ）
  var req = event.request.mode === "navigate"
    ? new Request(event.request.url, { cache: "no-store" })
    : event.request;
  event.respondWith(
    fetch(req).catch(function () {
      return caches.match(event.request);
    })
  );
});
