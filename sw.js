// 司令塔 service worker: アプリとしてインストール可能にするための最小構成。
// 中身は常にネットワーク優先（古い画面を配らないため、キャッシュはオフライン時の予備だけ）。
self.addEventListener("install", function (event) {
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
// プッシュ通知の受信：タイトルと本文を表示する
self.addEventListener("push", function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  var title = data.title || "TOWER";
  var options = {
    body: data.body || "",
    icon: "icon-192.png",
    badge: "icon-192.png",
    data: { url: data.url || "./" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
// 通知をタップしたらTOWERを開く（開いていれば前面に出す）
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || "./";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(self.location.origin) === 0) return list[i].focus();
      }
      return self.clients.openWindow(target);
    })
  );
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
