// 司令塔画面（最小版）— Supabase REST（PostgREST）から読み取り専用で表示する。
// config.js がプレースホルダの場合はモックデータで表示する。
(function () {
  "use strict";

  var cfg = window.OPS_CONFIG || {};
  var useMock = cfg.forceMock || !cfg.supabaseUrl || !cfg.anonKey ||
    cfg.supabaseUrl.indexOf("YOUR_") >= 0 || cfg.anonKey.indexOf("YOUR_") >= 0;

  // ---------------- 画面の自動更新（新しい版が出ていたら自動で読み直す） ----------------
  var APP_VERSION = "20261123-2245";
  function checkVersion() {
    fetch("./index.html?nv=" + Date.now(), { cache: "no-store" }).then(function (res) {
      return res.text();
    }).then(function (text) {
      var m = text.match(/app\.js\?v=([0-9-]+)/);
      if (m && m[1] !== APP_VERSION) location.reload();
    }).catch(function () {});
  }
  setTimeout(checkVersion, 5000);
  setInterval(checkVersion, 10 * 60 * 1000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) checkVersion();
  });

  // ---------------- モックデータ（REST の返却形に合わせた形） ----------------
  var MOCK = {
    projects: [
      { id: "p1", slug: "the-gym", name: "THE GYM", status_label: "運用中", status_color: "green", summary: "テーマ投稿は火・金に公開", next_action: "11月6日分の画像を検品", owner_action: "", sort_order: 1, updated_at: "2026-11-03T12:00:00+09:00" },
      { id: "p2", slug: "corporate-line", name: "法人LINE", status_label: "進行中", status_color: "yellow", summary: "検証は完了。本番の塞ぎ予約は鍵の種類が原因で未作成", next_action: "buyer-level の鍵で再実施", owner_action: "11月4日18時に承認操作", sort_order: 3, updated_at: "2026-11-03T19:00:00+09:00" },
      { id: "p3", slug: "spotter", name: "SPOTTER", status_label: "進行中", status_color: "yellow", summary: "実装完了。試験用DBへの反映が残り", next_action: "migration 適用と通し確認", owner_action: "ログインとDBパスワード入力", sort_order: 4, updated_at: "2026-11-03T18:00:00+09:00" }
    ],
    media_channels: [
      { id: "m1", slug: "instagram", name: "Instagram", account_label: "@thegym_fit", sort_order: 1 },
      { id: "m2", slug: "threads", name: "Threads", account_label: "@thegym_fit", sort_order: 2 },
      { id: "m3", slug: "x", name: "X", account_label: "@thegym_fit", sort_order: 4 },
      { id: "m4", slug: "note", name: "note", account_label: "wataru_gym_ai", sort_order: 7 }
    ],
    work_items: [
      {
        id: "w1", title: "11月6日テーマ投稿（画像付き）", kind: "production",
        project_id: "p1", media_id: "m1", assignee: "gpt", status: "in_progress",
        scheduled_at: "2026-11-06T20:49:00+09:00", due_at: "2026-11-06T10:00:00+09:00",
        steps: [
          { label: "画像の依頼", done: true },
          { label: "GPTの納品", done: true },
          { label: "自動検品", done: false },
          { label: "承認", done: false },
          { label: "投稿と実物確認", done: false }
        ],
        steps_total: 5, steps_done: 2, note: "", blocked_reason: "", owner_action: "",
        media: { name: "Instagram", slug: "instagram" }, project: { name: "THE GYM", slug: "the-gym" }
      },
      {
        id: "w2", title: "本番Squareの塞ぎ予約（再実施）", kind: "task",
        project_id: "p2", media_id: null, assignee: "muse", status: "blocked",
        scheduled_at: "2026-11-04T18:00:00+09:00", due_at: "2026-11-04T18:00:00+09:00",
        steps: [
          { label: "buyer-level の鍵を取得", done: false },
          { label: "予約を作成", done: false },
          { label: "目視確認と取消", done: false }
        ],
        steps_total: 3, steps_done: 0, note: "",
        blocked_reason: "鍵の種類が違うため作成できなかった",
        owner_action: "11月4日18時に承認操作をお願いします",
        media: null, project: { name: "法人LINE", slug: "corporate-line" }
      },
      {
        id: "w3", title: "記事3本目の公開", kind: "task",
        project_id: null, media_id: "m4", assignee: "muse", status: "waiting_approval",
        scheduled_at: null, due_at: null,
        steps: [
          { label: "下書き", done: true },
          { label: "見出し画像", done: true },
          { label: "公開の承認", done: false }
        ],
        steps_total: 3, steps_done: 2, note: "", blocked_reason: "", owner_action: "公開の承認",
        media: { name: "note", slug: "note" }, project: null
      }
    ],
    approvals: [
      {
        id: "a1", title: "note記事3本目の公開", status: "pending",
        recommendation: "公開する", reason: "見出し画像の検品と承認が完了している",
        assumptions: "本文は下書きのまま", risk: "低（下書き内容の公開のみ）",
        created_at: "2026-11-03T13:30:00+09:00", project: null
      }
    ],
    reports: [
      { id: "r1", kind: "result", body: "Threads 11月3日分を承認文面のまま公開し、読み戻しで一致を確認", created_at: "2026-11-03T20:55:00+09:00" },
      { id: "r2", kind: "progress", body: "法人LINEの本番テストは鍵の種類が原因で作成できず。11月4日18時に再実施", created_at: "2026-11-03T19:10:00+09:00" },
      { id: "r3", kind: "alert", body: "Instagram の予約投稿が公開されなかったため、即時投稿へ切り替えた", created_at: "2026-11-03T21:15:00+09:00" }
    ],
    today_tasks: [
      { id: 1, task_date: "2026-11-04", title: "法人LINE 本番Square再実施（buyer-levelトークンで作成）", task_time: "18:00", project: null, note: "", done: false, done_at: null, sort_order: 1 },
      { id: 2, task_date: "2026-11-04", title: "Threads第1週 #7投稿", task_time: "20:30", project: "ミューズの作業", note: "", done: true, done_at: "2026-11-04T20:30:00+09:00", sort_order: 2 }
    ],
    measures: [
      { id: "ms1", title: "従量課金APIクレジット", description: "", project: null, media: null, started_on: null, ended_on: null }
    ],
    measure_results: [
      { id: "mr1", measure_id: "ms1", metric_name: "Perplexity 残り", metric_value: 9.86, unit: "$", measured_at: "2026-11-16T15:56:00+09:00", note: "" },
      { id: "mr2", measure_id: "ms1", metric_name: "Perplexity 累計使用", metric_value: 0.14, unit: "$", measured_at: "2026-11-16T15:56:00+09:00", note: "" },
      { id: "mr3", measure_id: "ms1", metric_name: "Gemini 残り", metric_value: 0, unit: "円", measured_at: "2026-11-12T23:59:00+09:00", note: "" },
      { id: "mr4", measure_id: "ms1", metric_name: "Gemini 累計使用", metric_value: 800, unit: "円", measured_at: "2026-11-12T23:59:00+09:00", note: "" }
    ]
  };

  // ---------------- REST 取得 ----------------
  function rest(path) {
    return fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/" + path, {
      headers: {
        apikey: cfg.anonKey,
        Authorization: "Bearer " + cfg.anonKey,
        Accept: "application/json"
      }
    }).then(function (res) {
      if (!res.ok) throw new Error("REST " + res.status);
      return res.json();
    });
  }

  // ---------------- 書き込み（合言葉トークン方式） ----------------
  // 編集範囲は「完了チェック」と「タスク追加」だけ（2026年11月3日決定）。
  // トークンはこの端末の localStorage にだけ置く。ページのソースには入れない。
  function getToken() {
    try { return localStorage.getItem("opsWriteToken") || ""; } catch (e) { return ""; }
  }
  function setToken(t) {
    try {
      if (t) localStorage.setItem("opsWriteToken", t);
      else localStorage.removeItem("opsWriteToken");
    } catch (e) { /* 保存できない環境では編集不可のまま */ }
  }
  // ボタンは常時表示し、押した時点でキーが無ければその場で入力を求める（2026年11月5日変更）。
  // キーの入力は window.prompt ではなく画面内の入力欄（#keymodal）で行う（2026年11月23日変更）。
  // prompt が出ない表示環境（アプリ内表示など）でも入力して先へ進めるようにするため。
  var keyModalResolve = null;
  function openKeyModal() {
    return new Promise(function (resolve) {
      var m = document.getElementById("keymodal");
      var inp = document.getElementById("keymodal-input");
      if (!m || !inp) { resolve(null); return; }
      // 前の呼び出しが残っていたら先に打ち切る（多重バインド時のハング防止）
      if (keyModalResolve) { var prev = keyModalResolve; keyModalResolve = null; prev(null); }
      keyModalResolve = resolve;
      inp.value = "";
      m.hidden = false;
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 30);
    });
  }
  function closeKeyModal(val) {
    var m = document.getElementById("keymodal");
    if (m) m.hidden = true;
    if (keyModalResolve) { var r = keyModalResolve; keyModalResolve = null; r(val); }
  }
  // キーがあれば即 true、無ければ画面内入力を求め、入力されたら保存して true を返す（Promise）。
  function ensureTokenAsync() {
    if (getToken()) return Promise.resolve(true);
    return openKeyModal().then(function (t) {
      if (t) { setToken(t); return true; }
      return false;
    });
  }
  function writeRest(method, path, payload) {
    return fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/" + path, {
      method: method,
      headers: {
        apikey: cfg.anonKey,
        Authorization: "Bearer " + cfg.anonKey,
        "x-ops-token": getToken(),
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: payload ? JSON.stringify(payload) : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error("WRITE " + res.status);
      return res.json().catch(function () { return null; });
    });
  }
  function reload() {
    load().then(render).catch(function (e) {
      document.getElementById("meta").textContent = "読み取りに失敗しました：" + e.message;
    });
  }
  function writeFailed(e) {
    alert("保存できませんでした。編集キーが違うか、通信に失敗しました。（" + e.message + "）");
  }
  // 書き込みの結果を今日タブ上部の #notice に出す。#notice は render の再描画対象外なので、
  // 再読み込み（reload）の後も残り、結果が後からでも分かる（2026年11月23日追加）。
  var noticeTimer = null;
  function showNotice(msg, isError) {
    var n = document.getElementById("notice");
    if (!n) return;
    n.textContent = msg;
    n.className = isError ? "notice err" : "notice ok";
    n.hidden = false;
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = setTimeout(function () { n.hidden = true; }, 9000);
  }

  function todayJst() {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
  }

  function tomorrowJst() {
    var p = todayJst().split("-");
    var d = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]) + 1));
    return d.toISOString().slice(0, 10);
  }

  function load() {
    if (useMock) return Promise.resolve(MOCK);
    var workSelect =
      "select=*,media:media_channels(name,slug),project:projects(name,slug)" +
      "&status=not.in.(done,cancelled)&order=due_at.asc.nullslast,created_at.desc&limit=50";
    var doneSelect =
      "select=*,media:media_channels(name,slug),project:projects(name,slug)" +
      "&status=eq.done&order=done_at.desc.nullslast&limit=10";
    // 今日のタスクの取得失敗（テーブル未作成など）で画面全体を落とさない
    var todayFetch = rest("daily_tasks?select=*&task_date=eq." + todayJst() +
      "&order=done.asc,sort_order.asc,id.asc&limit=100").catch(function () { return []; });
    return Promise.all([
      rest("projects?select=*&order=sort_order.asc"),
      rest("media_channels?select=*&order=sort_order.asc"),
      rest("work_items?" + workSelect),
      rest("approvals?select=*,project:projects(name,slug)&status=eq.pending&order=created_at.desc"),
      rest("reports?select=*&order=created_at.desc&limit=20"),
      rest("work_items?" + doneSelect),
      rest("board_requests?select=*,project:projects(name,slug)&order=created_at.desc&limit=20"),
      rest("measures?select=*,project:projects(name,slug),media:media_channels(name,slug)&order=created_at.desc&limit=20"),
      rest("measure_results?select=*&order=measured_at.desc&limit=300"),
      todayFetch
    ]).then(function (r) {
      return { projects: r[0], media_channels: r[1], work_items: r[2], approvals: r[3], reports: r[4], done_items: r[5], board_requests: r[6], measures: r[7], measure_results: r[8], today_tasks: r[9] };
    });
  }

  // ---------------- 表示 ----------------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtTime(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return (d.getMonth() + 1) + "/" + d.getDate() + " " +
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  var STATUS_LABEL = {
    planned: "予定", in_progress: "進行中", waiting_approval: "承認待ち",
    blocked: "止まっている", done: "完了", cancelled: "中止"
  };

  function progressHtml(w) {
    if (!w.steps_total) return "";
    var pct = Math.round((w.steps_done / w.steps_total) * 100);
    var rest = (w.steps || []).filter(function (s) { return !s.done; })
      .map(function (s) { return s.label; });
    var restText = rest.length ? "残り：" + rest.join("、") : "全工程が完了";
    return '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<p class="progress-note">工程の割合 ' + pct + "%（" + w.steps_done + "/" + w.steps_total + "）｜" +
      esc(restText) + "</p>";
  }

  // 案件カード用：その案件に紐づく作業すべての工程を合計した進行バー。
  // 進行中の作業と完了済みの作業の両方を対象にする。工程を持つ作業が無ければ出さない。
  function projectProgressHtml(p, works, doneWorks) {
    var linked = (works || []).concat(doneWorks || []).filter(function (w) {
      return w.project_id === p.id;
    });
    var total = 0, done = 0, rest = [];
    linked.forEach(function (w) {
      var t = w.steps_total || 0;
      if (!t) return;
      total += t;
      done += (w.status === "done") ? t : Math.min(w.steps_done || 0, t);
      if (w.status !== "done") {
        (w.steps || []).forEach(function (s) { if (!s.done) rest.push(s.label); });
      }
    });
    if (!total) return "";
    var pct = Math.round((done / total) * 100);
    var restText = rest.length ? "残り：" + rest.join("、") : "全工程が完了";
    return '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<p class="progress-note">工程 ' + done + "/" + total + " 完了（" + pct + "%）｜" +
      esc(restText) + "</p>";
  }

  function render(data) {
    document.getElementById("meta").innerHTML =
      (useMock ? '<span class="badge">モック表示</span> ' : "") +
      esc(new Date().toLocaleString("ja-JP")) + " 時点";

    // 今日のタスク（司令塔の先頭）
    var tdEl = document.getElementById("today-date");
    if (tdEl) {
      var tparts = todayJst().split("-");
      tdEl.textContent = Number(tparts[1]) + "/" + Number(tparts[2]);
    }
    var tasks = data.today_tasks || [];
    var doneCount = tasks.filter(function (t) { return t.done; }).length;
    var tpSec = document.getElementById("today-progress");
    if (tpSec) {
      if (tasks.length) {
        var pct = Math.round(doneCount / tasks.length * 100);
        tpSec.hidden = false;
        document.getElementById("today-bar-fill").style.width = pct + "%";
        document.getElementById("today-bar-note").innerHTML = "今日のタスク <b>" + doneCount + " / " + tasks.length + "</b> 件完了 ・ " + pct + "%" +
          (tasks.length - doneCount ? "（残り " + (tasks.length - doneCount) + " 件）" : "");
      } else {
        tpSec.hidden = true;
      }
    }
    // 一覧には未完了だけを出す（完了分はバー側の件数と末尾の1行要約にだけ数える）
    var visibleTasks = tasks.filter(function (t) { return !t.done; });
    var doneTitles = tasks.filter(function (t) { return t.done; }).map(function (t) { return t.title; });
    var doneLine = doneTitles.length
      ? '<p class="done-line">完了した' + doneTitles.length + "件：" + doneTitles.map(esc).join("／") + "</p>"
      : "";
    var todayHtml = visibleTasks.length ? visibleTasks.map(function (t) {
      var canEdit = !useMock && !!getToken();
      var check = canEdit
        ? (t.done
          ? '<button class="tcheck2 on" data-tundo="' + esc(t.id) + '" aria-label="完了を取り消す">✓</button>'
          : '<button class="tcheck2" data-tdone="' + esc(t.id) + '" aria-label="完了にする"></button>')
        : '<span class="tcheck2' + (t.done ? " on" : "") + '">' + (t.done ? "✓" : "") + "</span>";
      var moveBtn = canEdit && !t.done ? '<button class="btn move-btn" data-tmove="' + esc(t.id) + '">明日へ送る</button>' : "";
      var delBtn = canEdit ? '<button class="btn del-btn" data-tdel="' + esc(t.id) + '" data-ttitle="' + esc(t.title) + '">削除</button>' : "";
      var noteText = t.note || "";
      var stLabel = "";
      var stMatch = noteText.match(/^【状態：(進行中|待ち|未定)】\s*/);
      if (stMatch) { stLabel = stMatch[1]; noteText = noteText.slice(stMatch[0].length); }
      var chip = "";
      if (!t.task_time && !t.done) {
        if (!stLabel) stLabel = "未定";
        var stClass = stLabel === "進行中" ? "in_progress" : (stLabel === "待ち" ? "waiting_approval" : "planned");
        chip = '<span class="status ' + stClass + '">' + stLabel + "</span>";
      }
      var metaBits = [t.task_time, t.project].filter(function (x) { return !!x; }).map(function (x) { return esc(x); }).join(" ・ ");
      var metaHtml = (chip && metaBits ? chip + " " : chip) + metaBits;
      return '<article class="card task' + (t.done ? " is-done" : "") + '"><div class="trow2">' + check +
        '<div class="tmain"><span class="ttitle">' + esc(t.title) + "</span>" +
        (noteText ? '<div class="tnoterow"><p class="tnote">' + esc(noteText) + '</p><span class="chev">⌄</span></div>' : "") +
        "</div></div>" +
        (metaHtml || moveBtn || delBtn ? '<div class="tfoot"><span class="tmeta">' + metaHtml + "</span>" + moveBtn + delBtn + "</div>" : "") +
        "</article>";
    }).join("")
      : (tasks.length ? '<p class="empty">今日のタスクは全件完了</p>' : '<p class="empty">今日のタスクはまだ登録なし</p>');
    document.getElementById("today").innerHTML = todayHtml + doneLine;

    // APIクレジット（目安）— measures の「従量課金APIクレジット」の最新値から作る。
    // 残りは使用記録ベースの目安（残高を返す公式APIが無いため）。
    var credSec = document.getElementById("credits-section");
    if (credSec) {
      var creditMeasure = (data.measures || []).filter(function (m) {
        return m.title === "従量課金APIクレジット";
      })[0];
      if (creditMeasure) {
        var latest = {};
        (data.measure_results || []).forEach(function (r) {
          if (r.measure_id !== creditMeasure.id) return;
          if (!latest[r.metric_name]) latest[r.metric_name] = r; // measured_at の新しい順で取得済み
        });
        var usd2 = function (v) { return "$" + Number(v).toFixed(2); };
        var usdSub = function (v) { var n = Number(v); return "$" + (n === 0 ? "0" : String(Number(n.toFixed(4)))); };
        var jpy0 = function (v) { return "¥" + Math.round(Number(v)).toLocaleString("ja-JP"); };
        // 「今月」は使用イベント（1回の使用ごとの記録）を当月（JST）分だけ合算する。
        // 月別の内訳が無い過去分はイベントが無いため、今月には入らない。
        var ymJst = function (d) {
          var parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).formatToParts(d);
          var y = "", m = "";
          parts.forEach(function (p) { if (p.type === "year") y = p.value; if (p.type === "month") m = p.value; });
          return y + "-" + m;
        };
        var nowYm = ymJst(new Date());
        var usageStats = function (label) {
          var month = 0, total = 0;
          (data.measure_results || []).forEach(function (r) {
            if (r.measure_id !== creditMeasure.id) return;
            if (r.metric_name !== label + " 使用イベント") return;
            var v = Number(r.metric_value) || 0;
            total += v;
            if (ymJst(new Date(r.measured_at)) === nowYm) month += v;
          });
          return { month: month, total: total };
        };
        // 今日タブでは1行にまとめる（今月・累計の内訳は数字タブの施策カードで見る）
        var parts = [];
        var hasUnallocated = false;
        var pRem = latest["Perplexity 残り"], pCum = latest["Perplexity 累計使用"];
        if (pRem || pCum) {
          var pSt = usageStats("Perplexity");
          var pCumV = pCum ? Number(pCum.metric_value) : 0;
          if (pCumV - pSt.total > 0.00001) hasUnallocated = true;
          parts.push({
            text: "Perplexity " + (pRem ? "残り " + usd2(pRem.metric_value) : "累計 " + usd2(pCumV)),
            low: !!(pRem && Number(pRem.metric_value) < 2)
          });
        }
        var gRem = latest["Gemini 残り"], gCum = latest["Gemini 累計使用"];
        if (gRem || gCum) {
          var gSt = usageStats("Gemini");
          var gCumV = gCum ? Number(gCum.metric_value) : 0;
          if (gCumV - gSt.total > 0.5) hasUnallocated = true;
          parts.push({
            text: "Gemini " + (gRem ? "残り " + jpy0(gRem.metric_value) : "累計 " + jpy0(gCumV)),
            low: false
          });
        }
        var oCum = latest["OpenAI 累計使用"];
        if (oCum) {
          var oSt = usageStats("OpenAI");
          if (Number(oCum.metric_value) - oSt.total > 0.00001) hasUnallocated = true;
          parts.push({ text: "OpenAI 累計 " + usd2(oCum.metric_value), low: false });
        } else {
          parts.push({ text: "OpenAI 記録なし", low: false });
        }
        credSec.hidden = false;
        document.getElementById("credits").innerHTML = '<p class="credit-line">' + parts.map(function (pt) {
          return pt.low ? '<span class="credit-low">' + esc(pt.text) + "（残りわずか）</span>" : esc(pt.text);
        }).join(" ／ ") + "</p>";
        var credNote = document.getElementById("credits-note");
        if (credNote) {
          credNote.hidden = !hasUnallocated;
          credNote.textContent = hasUnallocated ? "※月別の内訳が無い過去分は「今月」に含みません" : "";
        }
      } else {
        credSec.hidden = true;
      }
    }

    // あなたの番（承認待ち＋案件ごとの「あなたの番」）— 今日タブの先頭に大きなカードで出す。
    // 出すのは承認待ちと、案件に具体的な指示（owner_action）が入っているものだけ。
    var apSec = document.getElementById("approvals-section");
    var ap = document.getElementById("approvals");
    var ownerProjects = (data.projects || []).filter(function (p) { return p.owner_action; });
    if (data.approvals.length || ownerProjects.length) {
      apSec.hidden = false;
      var apCnt = document.getElementById("approvals-count");
      if (apCnt) apCnt.textContent = (data.approvals.length + ownerProjects.length) + "件";
      ap.innerHTML = data.approvals.map(function (a) {
        return '<article class="card approval"><div class="name">' + esc(a.title) + "</div>" +
          (a.recommendation ? '<p class="rec clampable">推奨：' + esc(a.recommendation) + "</p>" : "") +
          (a.reason ? '<p class="rec clampable">理由：' + esc(a.reason) + "</p>" : "") +
          (a.risk ? '<p class="rec clampable">リスク：' + esc(a.risk) + "</p>" : "") +
          '<div class="appr-btns"><button class="btn appr-ok" data-id="' + a.id + '">承認する</button>' +
            '<button class="btn appr-ng" data-id="' + a.id + '">見送る</button></div>' +
          "</article>";
      }).join("") + ownerProjects.map(function (p) {
        return '<article class="card ownercard"><div class="name"><span class="dot ' + esc(p.status_color) + '"></span>' +
          esc(p.name) + "</div>" +
          '<p class="owner-how">' + esc(p.owner_action) + "</p></article>";
      }).join("");
      Array.prototype.forEach.call(ap.querySelectorAll(".appr-ok"), function (btn) {
        btn.addEventListener("click", function () {
          if (!confirm("この内容で承認しますか？")) return;
          ensureTokenAsync().then(function (ok) {
            if (!ok) return;
            writeRest("PATCH", "approvals?id=eq." + btn.getAttribute("data-id"), { status: "approved" })
              .then(function () { showNotice("承認を記録しました"); reload(); })
              .catch(function () { alert("承認の記録に失敗しました。通信状態を確認してください。"); });
          });
        });
      });
      Array.prototype.forEach.call(ap.querySelectorAll(".appr-ng"), function (btn) {
        btn.addEventListener("click", function () {
          if (!confirm("この内容を見送りますか？")) return;
          ensureTokenAsync().then(function (ok) {
            if (!ok) return;
            writeRest("PATCH", "approvals?id=eq." + btn.getAttribute("data-id"), { status: "rejected" })
              .then(function () { showNotice("見送りを記録しました"); reload(); })
              .catch(function () { alert("記録に失敗しました。通信状態を確認してください。"); });
          });
        });
      });
    } else {
      // 0件でもボックス自体は出す（モックCの並びを常に保つ。2026-11-23 わたるの指摘）
      apSec.hidden = false;
      var apCnt0 = document.getElementById("approvals-count");
      if (apCnt0) apCnt0.textContent = "0件";
      ap.innerHTML = '<p class="empty-note">今はありません</p>';
    }
    Array.prototype.forEach.call(document.querySelectorAll(".appr-badge"), function (apprBadge) {
      apprBadge.textContent = data.approvals.length;
      apprBadge.style.display = data.approvals.length ? "" : "none";
    });

    // 詰まり帯（今日タブ上部）— 判定は既存の詰まり検知（ops_watch）と同じ定義で、取得済みデータから引く。
    // 案件単位：summary 先頭の【止まり検知】マーカー（ops_watch が付けたもの）。
    // 作業単位：blocked／期限超過／進行中のまま48時間以上更新なし、の3条件（1作業は1件だけ数える）。
    // 第2弾（2026-11-23）：各行に操作ボタンを常時表示する（モックC2-A「行内ボタン型」）。
    // 行の種類は3つ：わたる待ち／Muse側の停滞・作業単位／Muse側の停滞・案件単位。
    // わたる待ちの判定：案件は owner_action があるか、次の一手（next_action）に承認・わたる待ちが含まれるもの。
    // 作業は owner_action があるか承認待ち状態のもの。承認（approvals）との紐づけは今回はしない（比較メモの未対応1）。
    // 書き込み先は既存の置き場だけ：判断・再開・指示は board_requests、終わりにするは work_items の status=cancelled。
    var stallSec = document.getElementById("stalls-section");
    if (stallSec) {
      var nowMs = Date.now();
      var stallItems = [];
      // 押した行の完了表示を保持する印（localStorage）。項目が一覧から消えたら印は外れる。
      var STALL_ACTED_KEY = "tower_stall_acted";
      var loadStallActed = function () {
        try {
          var v = JSON.parse(localStorage.getItem(STALL_ACTED_KEY) || "{}");
          return v && typeof v === "object" ? v : {};
        } catch (e) { return {}; }
      };
      var stallActed = loadStallActed();
      var saveStallActed = function () {
        try { localStorage.setItem(STALL_ACTED_KEY, JSON.stringify(stallActed)); } catch (e) {}
      };
      var markStallActed = function (it, msg) {
        if (!it || !it.skey) return;
        stallActed[it.skey] = { msg: msg };
        saveStallActed();
      };
      (data.projects || []).forEach(function (p) {
        var sm = p.summary || "";
        if (sm.indexOf("【止まり検知】") !== 0) return;
        var dm = sm.match(/最終更新：(\d+)年(\d+)月(\d+)日/);
        var dateTxt = dm ? "（最終更新 " + Number(dm[2]) + "/" + Number(dm[3]) + "）" : "";
        var restSm = sm.replace(/^【止まり検知】動きが止まっています（最終更新：[^）]+）。/, "");
        var waitP = !!p.owner_action || /承認|わたる待ち/.test(p.next_action || "");
        stallItems.push({
          rank: 0, kind: waitP ? "wait" : "project",
          kindLabel: waitP ? "わたる待ち" : "案件の止まり",
          pj: p.name, pjId: p.id, pjSlug: p.slug, workId: null,
          skey: "pj:" + p.id, stamp: p.updated_at || sm,
          act: "止まり検知" + dateTxt,
          why: waitP && p.next_action ? p.next_action : restSm,
          nextAction: p.next_action || ""
        });
      });
      (data.work_items || []).forEach(function (w) {
        var where = (w.project && w.project.name) || (w.media && w.media.name) || "";
        var waitW = !!w.owner_action || w.status === "waiting_approval";
        var base = {
          pj: where, pjId: w.project_id || null,
          pjSlug: (w.project && w.project.slug) || null,
          workId: w.id, act: w.title, nextAction: "",
          skey: String(w.id),
          stamp: (w.updated_at || "") + "|" + w.status + "|" + (w.due_at || ""),
          kind: waitW ? "wait" : "work"
        };
        if (w.status === "blocked") {
          base.rank = 1;
          base.kindLabel = waitW ? "わたる待ち" : "止まっている";
          base.why = w.blocked_reason || "止まっています";
          stallItems.push(base);
        } else if (w.due_at && new Date(w.due_at).getTime() < nowMs) {
          base.rank = 2;
          base.kindLabel = waitW ? "わたる待ち" : "期限超過";
          base.why = "期限 " + fmtTime(w.due_at) + " を過ぎています";
          stallItems.push(base);
        } else if (w.status === "in_progress" && w.updated_at &&
                   new Date(w.updated_at).getTime() < nowMs - 48 * 3600 * 1000) {
          base.rank = 3;
          base.kindLabel = waitW ? "わたる待ち" : "更新なし";
          base.why = "進行中のまま48時間以上更新がありません（最終更新 " + fmtTime(w.updated_at) + "）";
          stallItems.push(base);
        }
      });
      stallItems.sort(function (a, b) { return a.rank - b.rank; });
      // 今の一覧から消えた項目の印だけを外して保存し直す。
      // 項目が一覧に残っている間は、更新時刻などが変わっても印は外さない
      // （2026年11月23日夜の修正：updated_at を条件に含めると、記録の更新のたびに印が消えてボタンが戻っていた）。
      var actedChanged = false;
      Object.keys(stallActed).forEach(function (k) {
        var cur = null;
        stallItems.forEach(function (it) { if (it.skey === k) cur = it; });
        if (!cur) {
          delete stallActed[k];
          actedChanged = true;
        }
      });
      if (actedChanged) saveStallActed();
      if (stallItems.length) {
        stallSec.hidden = false;
        var stCnt = document.getElementById("stalls-count");
        if (stCnt) stCnt.textContent = stallItems.length + "件";
        document.getElementById("stalls").innerHTML = stallItems.map(function (it, idx) {
          var acted = stallActed[it.skey];
          var isActed = !!acted;
          var btns;
          if (isActed) {
            btns = '<span class="sdone">✓ ' +
              esc(acted.msg === "終わりにしました" ? "終わりにしました" : "登録済み（Museが対応中）") + "</span>";
          } else if (it.kind === "wait") {
            btns = '<button class="sbtn pri" data-sact="ok" data-idx="' + idx + '">進めてよい</button>' +
              '<button class="sbtn restart" data-sact="restart" data-idx="' + idx + '">再開させる</button>' +
              '<button class="sbtn dng" data-sact="ng" data-idx="' + idx + '">見送る</button>' +
              '<button class="sbtn" data-sact="write" data-idx="' + idx + '">判断を書く</button>';
          } else if (it.kind === "work") {
            btns = '<button class="sbtn restart" data-sact="restart" data-idx="' + idx + '">再開させる</button>' +
              '<button class="sbtn" data-sact="write" data-idx="' + idx + '">指示を書く</button>' +
              '<button class="sbtn dng" data-sact="close" data-idx="' + idx + '">終わりにする</button>';
          } else {
            btns = '<button class="sbtn restart" data-sact="restart" data-idx="' + idx + '">再開させる</button>' +
              '<button class="sbtn" data-sact="write" data-idx="' + idx + '">指示を書く</button>';
          }
          if (!isActed) btns += '<button class="sbtn detail" data-sact="detail" data-idx="' + idx + '">詳細 ›</button>';
          var ph = it.kind === "wait" ? "判断を短く書く（例：その内容で進めてよい）" : "Museへの指示を短く書く";
          return '<div class="stallitem">' +
            '<span class="kind' + (it.kind === "wait" ? " wait" : "") + '">' + esc(it.kindLabel) + "</span>" +
            (it.pj ? '<span class="pj">' + esc(it.pj) + "：</span>" : "") +
            '<span class="act">' + esc(it.act) + "</span>" +
            (it.why ? '<div class="why">' + esc(it.why) + "</div>" : "") +
            '<div class="sbtns">' + btns + "</div>" +
            (isActed ? "" :
              '<div class="sinp"><input type="text" data-sinp="' + idx + '" placeholder="' + ph + '" autocomplete="off">' +
              '<button class="sbtn pri" data-sact="send" data-idx="' + idx + '">送る</button></div>') +
            "</div>";
        }).join("");
        // 詰まり行のボタンの処理。ボタンは常時表示し、編集キーが無ければ押した時点で入力を求める（ensureTokenAsync）。
        // 成功したら行に完了表示を出し、上部にも通知を出す。完了表示は印（tower_stall_acted）で保持し、
        // 再描画されても項目の状態が変わるまではボタンを戻さない（2026年11月23日修正）。
        var stallTarget = function (it) {
          if (it.workId) return "作業「" + it.act + "」" + (it.pj ? "（案件：" + it.pj + "）" : "");
          return "案件「" + it.pj + "」";
        };
        var stallShort = function (it) { return it.workId ? it.act : it.pj; };
        var stallLabel = function (it) { return it.workId ? it.act : it.pj + "の件"; };
        // 送信中はその行のボタンと入力欄を無効化して二重押しを防ぐ
        var setStallBusy = function (row, busy) {
          if (!row) return;
          Array.prototype.forEach.call(row.querySelectorAll("button"), function (b) { b.disabled = busy; });
          var inp = row.querySelector("input[data-sinp]");
          if (inp) inp.disabled = busy;
        };
        // 成功時：ボタンの並びを完了表示に差し替え、入力欄を閉じる
        var stallDone = function (row, msg) {
          if (!row) return;
          var btns = row.querySelector(".sbtns");
          if (btns) btns.innerHTML = '<span class="sdone">✓ ' + esc(msg) + "</span>";
          var sinp = row.querySelector(".sinp");
          if (sinp) sinp.classList.remove("open");
        };
        var stallFailed = function (row, e) {
          setStallBusy(row, false);
          showNotice("保存できませんでした。編集キーが違うか、通信に失敗しました。（" + e.message + "）", true);
        };
        var postStallRequest = function (it, title, detail, row) {
          ensureTokenAsync().then(function (ok) {
            if (!ok) return;
            setStallBusy(row, true);
            writeRest("POST", "board_requests", {
              title: title, detail: detail, requester: "wataru",
              assignee_ai: "muse", project_id: it.pjId || null,
              status: "requested", deliverable_url: ""
            }).then(function () {
              markStallActed(it, "登録しました");
              stallDone(row, "登録しました");
              showNotice("登録しました：「" + title + "」Muse が拾って進めます");
            }).catch(function (e) { stallFailed(row, e); });
          });
        };
        Array.prototype.forEach.call(document.querySelectorAll("#stalls [data-sact]"), function (btn) {
          btn.addEventListener("click", function () {
            var it = stallItems[Number(btn.getAttribute("data-idx"))];
            if (!it) return;
            var act = btn.getAttribute("data-sact");
            var row = btn.closest(".stallitem");
            if (act === "write") {
              var inp = row ? row.querySelector(".sinp") : null;
              if (inp) {
                inp.classList.toggle("open");
                var f = inp.querySelector("input");
                if (inp.classList.contains("open") && f) f.focus();
              }
            } else if (act === "send") {
              var f2 = row ? row.querySelector("input[data-sinp]") : null;
              var text = f2 ? f2.value.trim() : "";
              if (!text) { if (f2) f2.focus(); return; }
              if (it.kind === "wait") {
                postStallRequest(it, "判断：" + stallShort(it),
                  "対象：" + stallTarget(it) + "\n判断：" + text, row);
              } else {
                postStallRequest(it, "指示：" + stallShort(it),
                  "対象：" + stallTarget(it) + "\n指示：" + text, row);
              }
            } else if (act === "ok" || act === "ng") {
              if (act === "ng" && !confirm("この件を見送りますか？")) return;
              var judge = act === "ok" ? "進めてよい" : "見送る";
              postStallRequest(it, "判断：" + stallLabel(it) + "を" + judge,
                "対象：" + stallTarget(it) +
                (it.nextAction ? "\n次の動き：" + it.nextAction : "") +
                (it.why && it.why !== it.nextAction ? "\n詰まりの理由：" + it.why : "") +
                "\n判断：" + judge, row);
            } else if (act === "restart") {
              postStallRequest(it, "再開：" + stallShort(it),
                "対象：" + stallTarget(it) + "\n詰まりの理由：" + it.why +
                "\n詰まり帯の「再開させる」から登録された指示です。対象を再開してください。", row);
            } else if (act === "close") {
              if (!it.workId) return;
              if (!confirm("この作業を終わりにしますか？（中止として閉じます）")) return;
              ensureTokenAsync().then(function (ok) {
                if (!ok) return;
                setStallBusy(row, true);
                writeRest("PATCH", "work_items?id=eq." + encodeURIComponent(it.workId), { status: "cancelled" })
                  .then(function () {
                    markStallActed(it, "終わりにしました");
                    stallDone(row, "終わりにしました");
                    showNotice("作業を終わりにしました：「" + it.act + "」");
                  })
                  .catch(function (e) { stallFailed(row, e); });
              });
            } else if (act === "detail") {
              activateTab("projects");
              try { history.replaceState(null, "", "#projects"); } catch (e) {}
              var tid = it.pjSlug ? "pjcard-" + it.pjSlug : (it.workId ? "wkcard-" + it.workId : null);
              if (tid) {
                setTimeout(function () {
                  var el = document.getElementById(tid);
                  if (el) el.scrollIntoView({ block: "center" });
                }, 60);
              }
            }
          });
        });
      } else {
        // 0件でもボックス自体は出す（モックCの並びを常に保つ。2026-11-23 わたるの指摘）
        stallSec.hidden = false;
        var stCnt0 = document.getElementById("stalls-count");
        if (stCnt0) stCnt0.textContent = "0件";
        document.getElementById("stalls").innerHTML = '<p class="empty-note">今はありません</p>';
      }
    }

    // 媒体カード（媒体ごとの直近の作業と進捗）。カードを押すと各媒体へ飛ぶ
    var MEDIA_LINKS = {
      instagram: "https://www.instagram.com/thegym_fit/",
      threads: "https://www.threads.com/@thegym_fit",
      facebook: "https://www.facebook.com/61587059349872",
      x: "https://x.com/thegym_fit",
      blog: "https://the-gym.info/blog/",
      gbp: "https://www.google.com/maps/search/?api=1&query=THE%20GYM%20%E5%90%8D%E5%8F%A4%E5%B1%8B%E5%B8%82%E7%B7%91%E5%8C%BA%E6%BB%9D%E3%83%8E%E6%B0%B4",
      note: "https://note.com/wataru_gym_ai",
      youtube: "https://www.youtube.com/@ParallelJapanWorld",
      "youtube-atlas-oddities": "https://www.youtube.com/@AtlasOdditiesShorts",
      "youtube-parallel-timelines": "https://www.youtube.com/@ParallelTimelinesHQ",
      "youtube-cosmic-what-if": "https://www.youtube.com/@CosmicWhatIfUSA",
      "youtube-scale-shock": "https://www.youtube.com/@ScaleShockShortsUSA",
      "youtube-myths-retold": "https://www.youtube.com/@MythsRetoldHQ",
      "youtube-after-dark-tales": "https://www.youtube.com/@MidnightTalesShortsUSA",
      "youtube-food-origins": "https://www.youtube.com/@FoodOriginsShorts",
      "youtube-ancient-enigmas": "https://www.youtube.com/@AncientEnigmasUSA",
      "youtube-natures-fury": "https://www.youtube.com/@NaturesFuryShortsUSA",
      instagram_parallel: "https://www.instagram.com/paralleljapanworld/",
      tiktok: "https://www.tiktok.com/@paralleljapanworld",
      line_stamps: "https://creator.line.me/",
      booth: "https://manage.booth.pm/",
      "exp-jitsuroku-instagram": "https://www.instagram.com/jitsuroku_lab/",
      "exp-jitsuroku-threads": "https://www.threads.com/@jitsuroku_lab",
      "exp-jitsuroku-x": "https://x.com/jitsuroku_lab",
      "exp-jitsuroku-note": "https://note.com/jitsuroku_lab",
      "exp-promptpilot-x": "https://x.com/promptpilot_jp",
      "exp-promptpilot-instagram": "https://www.instagram.com/promptpilotai.jp/",
      "exp-promptpilot-gumroad": "https://gumroad.com/dashboard"
    };
    document.getElementById("media").innerHTML = data.media_channels.map(function (m) {
      var works = data.work_items.filter(function (w) { return w.media_id === m.id; });
      var head = works[0];
      var body = head
        ? '<p class="line">' + esc(head.title) + "</p>" + progressHtml(head)
        : '<p class="line empty">進行中の作業なし</p>';
      var url = MEDIA_LINKS[m.slug];
      var inner = '<div class="name">' + esc(m.name) + (url ? ' <span class="go">開く ›</span>' : "") + "</div>" +
        '<div class="sub">' + esc(m.account_label) + "</div>" +
        (m.schedule_label ? '<div class="sub">更新：' + esc(m.schedule_label) + "</div>" : "") +
        (m.fallback_label ? '<div class="sub">代替：' + esc(m.fallback_label) + "</div>" : "") + body;
      return url
        ? '<a class="card medialink" href="' + url + '" target="_blank" rel="noopener">' + inner + "</a>"
        : '<article class="card">' + inner + "</article>";
    }).join("") || '<p class="empty">媒体の登録なし</p>';

    // 案件
    document.getElementById("projects").innerHTML = data.projects.map(function (p) {
      return '<article class="card pcard ' + esc(p.status_color) + '" id="pjcard-' + esc(p.slug) + '"><div class="name"><span class="dot ' + esc(p.status_color) + '"></span>' +
        esc(p.name) + "</div>" +
        '<div class="sub">' + esc(p.status_label) + "</div>" +
        (p.summary ? '<p class="line clampable">' + esc(p.summary) + "</p>" : "") +
        (p.next_action ? '<p class="line">次：' + esc(p.next_action) + "</p>" : "") +
        (p.owner_action ? '<p class="line warn">あなたの番：' + esc(p.owner_action) + "</p>" : "") +
        projectProgressHtml(p, data.work_items, data.done_items) +
        "</article>";
    }).join("") || '<p class="empty">案件の登録なし</p>';

    // 今日タブ用：全案件を1行ずつ圧縮して出す（自分の番・詰まりを上に寄せる。詳細は案件タブ）
    // 状態の判定は既存の項目だけから引く：自分の番＝owner_action があるか承認待ちが紐づくもの、
    // 詰まり＝止まり検知マーカーがあるか blocked の作業があるもの、進行中＝進行中の作業があるか状態色が緑・黄・青のもの。
    var tdProjSec = document.getElementById("today-projects-section");
    if (tdProjSec) {
      if (data.projects.length) {
        tdProjSec.hidden = false;
        var pjCnt = document.getElementById("today-projects-count");
        if (pjCnt) pjCnt.textContent = data.projects.length + "件・1行ずつ";
        var pjState = function (p) {
          var works = (data.work_items || []).filter(function (w) { return w.project_id === p.id; });
          var ban = !!p.owner_action || (data.approvals || []).some(function (a) { return a.project_id === p.id; });
          var tumi = (p.summary || "").indexOf("【止まり検知】") === 0 ||
            works.some(function (w) { return w.status === "blocked"; });
          var active = works.some(function (w) { return w.status === "in_progress"; }) ||
            p.status_color === "green" || p.status_color === "yellow" || p.status_color === "blue";
          if (ban) return { rank: 0, key: "ban", label: "自分の番" };
          if (tumi) return { rank: 1, key: "tumi", label: "詰まり" };
          if (active) return { rank: 2, key: "shin", label: "進行中" };
          return { rank: 3, key: "machi", label: "待ち" };
        };
        var sortedProjects = data.projects.slice().sort(function (a, b) {
          var d = pjState(a).rank - pjState(b).rank;
          return d !== 0 ? d : (a.sort_order || 0) - (b.sort_order || 0);
        });
        document.getElementById("today-projects").innerHTML = sortedProjects.map(function (p) {
          var st = pjState(p);
          var sm = p.summary || "";
          var one;
          if (sm.indexOf("【止まり検知】") === 0) {
            var dm = sm.match(/最終更新：(\d+)年(\d+)月(\d+)日/);
            one = "止まり検知" + (dm ? "（最終更新 " + Number(dm[2]) + "/" + Number(dm[3]) + "）" : "");
          } else {
            one = sm;
          }
          return '<div class="crow"><span class="dot ' + st.key + '"></span>' +
            '<span class="cname">' + esc(p.name) + "</span>" +
            '<span class="cone">' + esc(one) + "</span>" +
            '<span class="cst ' + st.key + '">' + st.label + "</span>" +
            '<button class="cdetail" data-pjgo="' + esc(p.slug) + '">詳細</button></div>';
        }).join("");
        // 詳細ボタン：案件タブの該当カードへ移動する（2026-11-23 わたるの指摘で復活）
        Array.prototype.forEach.call(document.querySelectorAll("[data-pjgo]"), function (b) {
          b.addEventListener("click", function () {
            var slug = b.getAttribute("data-pjgo");
            activateTab("projects");
            try { history.replaceState(null, "", "#projects"); } catch (e) {}
            setTimeout(function () {
              var el = document.getElementById("pjcard-" + slug);
              if (el) el.scrollIntoView({ block: "center" });
            }, 60);
          });
        });
      } else {
        tdProjSec.hidden = true;
      }
    }

    // 今日タブ用：全アカウントを1行ずつ圧縮して出す（系統ごとにまとめ、アカウント名から各媒体へ飛べる）
    // 状態は紐づく作業から引く：blocked があれば詰まり、進行中があれば進行中、未完了の作業があれば運用中、無ければ作業なし。
    var tdAcctSec = document.getElementById("today-accounts-section");
    if (tdAcctSec) {
      if (data.media_channels.length) {
        tdAcctSec.hidden = false;
        var acCnt = document.getElementById("today-accounts-count");
        if (acCnt) acCnt.textContent = data.media_channels.length + "件・1行ずつ";
        var MEDIA_GENRE = {
          instagram: "店舗・集客", threads: "店舗・交流", facebook: "店舗ページ",
          x: "知識系・note導線", blog: "SEO・AIO", gbp: "店舗情報", note: "実録・有料記事",
          youtube: "POVキャラ型", "youtube-atlas-oddities": "地理", "youtube-parallel-timelines": "歴史What-if",
          "youtube-cosmic-what-if": "宇宙What-if", "youtube-scale-shock": "サイズ比較",
          "youtube-myths-retold": "神話", "youtube-after-dark-tales": "ホラー・怪奇",
          "youtube-food-origins": "食の起源", "youtube-ancient-enigmas": "古代の謎",
          "youtube-natures-fury": "自然災害", instagram_parallel: "Shorts横流し", tiktok: "POV歴史",
          line_stamps: "受注制作", booth: "受注制作"
        };
        var acctGenre = function (m) {
          if (MEDIA_GENRE[m.slug]) return MEDIA_GENRE[m.slug];
          if (m.slug.indexOf("exp-jitsuroku") === 0) return "実録・実験";
          if (m.slug.indexOf("exp-promptpilot") === 0) return "英語AI・実験";
          return "";
        };
        var acctGroup = function (m) {
          if (m.slug === "line_stamps" || m.slug === "booth") return "販売（スタンプ・BOOTH）";
          if (m.slug.indexOf("youtube") === 0 || m.slug === "instagram_parallel" || m.slug === "tiktok") return "Parallel Japan（動画）";
          if (m.slug.indexOf("exp-jitsuroku") === 0) return "実験（実録ラボ）";
          if (m.slug.indexOf("exp-promptpilot") === 0) return "実験（PromptPilot AI）";
          return "THE GYM";
        };
        var acctState = function (m) {
          var works = (data.work_items || []).filter(function (w) { return w.media_id === m.id; });
          if (works.some(function (w) { return w.status === "blocked"; })) return { key: "tumi", label: "詰まり" };
          if (works.some(function (w) { return w.status === "in_progress"; })) return { key: "shin", label: "進行中" };
          if (works.length) return { key: "shin", label: "運用中" };
          return { key: "machi", label: "作業なし" };
        };
        var groupOrder = ["THE GYM", "Parallel Japan（動画）", "販売（スタンプ・BOOTH）"];
        var groups = {};
        data.media_channels.forEach(function (m) {
          var g = acctGroup(m);
          if (groupOrder.indexOf(g) < 0) groupOrder.push(g);
          (groups[g] = groups[g] || []).push(m);
        });
        document.getElementById("today-accounts").innerHTML = groupOrder.filter(function (g) {
          return groups[g] && groups[g].length;
        }).map(function (g) {
          return '<p class="cgrp">' + esc(g) + "</p>" + groups[g].map(function (m) {
            var st = acctState(m);
            var url = MEDIA_LINKS[m.slug];
            var acct = url
              ? '<a class="cacct" href="' + url + '" target="_blank" rel="noopener">' + esc(m.account_label) + "</a>"
              : '<span class="cacct">' + esc(m.account_label) + "</span>";
            return '<div class="crow"><span class="cmedia">' + esc(m.name) + "</span>" +
              (acctGenre(m) ? '<span class="cgenre">' + esc(acctGenre(m)) + "</span>" : "") +
              acct +
              '<span class="cst ' + st.key + '">' + st.label + "</span></div>";
          }).join("");
        }).join("");
      } else {
        tdAcctSec.hidden = true;
      }
    }

    // 今日タブ用：数字は主要なものだけ（クレジット系と使用イベントは除く。前回比があれば添える）
    var tdNumSec = document.getElementById("today-numbers-section");
    if (tdNumSec) {
      var creditMeasureId = null;
      (data.measures || []).forEach(function (m) {
        if (m.title === "従量課金APIクレジット") creditMeasureId = m.id;
      });
      var tdByMetric = {};
      (data.measure_results || []).forEach(function (r) {
        if (r.measure_id === creditMeasureId) return;
        if (/使用イベント$/.test(r.metric_name)) return;
        (tdByMetric[r.metric_name] = tdByMetric[r.metric_name] || []).push(r);
      });
      var tdCands = Object.keys(tdByMetric).map(function (name) {
        var arr = tdByMetric[name]; // measured_at の新しい順で取得済み
        var cur = arr[0];
        var delta = null;
        if (arr.length > 1) {
          var d = Number(cur.metric_value) - Number(arr[1].metric_value);
          if (isFinite(d)) delta = d;
        }
        return { name: name, value: cur.metric_value, unit: cur.unit || "", at: cur.measured_at, delta: delta };
      });
      var TD_PREF = ["Instagram フォロワー", "Threads フォロワー", "YouTube 登録者", "YouTube 総再生", "GBP", "Facebook"];
      var tdPicked = [];
      TD_PREF.forEach(function (key) {
        tdCands.forEach(function (c) {
          if (tdPicked.length < 6 && c.name.indexOf(key) >= 0 && tdPicked.indexOf(c) < 0) tdPicked.push(c);
        });
      });
      tdCands.slice().sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); })
        .forEach(function (c) {
          if (tdPicked.length < 6 && tdPicked.indexOf(c) < 0) tdPicked.push(c);
        });
      if (tdPicked.length) {
        tdNumSec.hidden = false;
        document.getElementById("today-numbers").innerHTML = tdPicked.map(function (c) {
          var dHtml = (c.delta !== null && c.delta !== 0)
            ? '<div class="tnum-sub">前回比 ' + (c.delta > 0 ? "+" : "") + fmtNum(c.delta) + "</div>" : "";
          return '<div class="tnum"><div class="tnum-label">' + esc(c.name) + '</div>' +
            '<div class="tnum-value">' + fmtNum(c.value) + '<span class="tnum-unit">' + esc(c.unit) + "</span></div>" + dHtml + "</div>";
        }).join("");
      } else {
        tdNumSec.hidden = true;
      }
    }

    // 今日タブ用：報告履歴の直近3件（全文は連携タブの報告履歴で見る）
    var tdRepSec = document.getElementById("today-reports-section");
    if (tdRepSec) {
      if (data.reports && data.reports.length) {
        tdRepSec.hidden = false;
        document.getElementById("today-reports").innerHTML = data.reports.slice(0, 3).map(function (r) {
          return '<div class="trep"><time>' + esc(fmtTime(r.created_at)) + "</time>" +
            '<span class="trep-body">' + esc(r.body) + "</span></div>";
        }).join("");
      } else {
        tdRepSec.hidden = true;
      }
    }

    // 作業（進行中＋完了済み。完了済みは末尾に置き、取り消しできる）
    var workCard = function (w, isDone) {
      var where = [w.project && w.project.name, w.media && w.media.name].filter(Boolean).join(" / ");
      var when = w.due_at ? "期限 " + fmtTime(w.due_at) : (w.scheduled_at ? "予定 " + fmtTime(w.scheduled_at) : "");
      var btn = "";
      if (!useMock && getToken()) {
        btn = isDone
          ? '<button class="btn undo-btn" data-undo="' + esc(w.id) + '">完了を取り消す</button>'
          : '<button class="btn done-btn" data-done="' + esc(w.id) + '">完了にする</button>';
      }
      return '<article class="card" id="wkcard-' + esc(w.id) + '"><div class="name">' + esc(w.title) + "</div>" +
        '<div class="sub">' + esc(where) + (when ? "｜" + esc(when) : "") + "</div>" +
        '<p class="line"><span class="status ' + esc(w.status) + '">' +
        esc(STATUS_LABEL[w.status] || w.status) + "</span></p>" +
        progressHtml(w) +
        (w.status === "blocked" && w.blocked_reason ? '<p class="warn">理由：' + esc(w.blocked_reason) + "</p>" : "") +
        btn +
        "</article>";
    };
    var allCards = data.work_items.map(function (w) { return workCard(w, false); })
      .concat((data.done_items || []).map(function (w) { return workCard(w, true); }));
    document.getElementById("works").innerHTML = allCards.join("") || '<p class="empty">進行中の作業なし</p>';

    // 編集キー（右上の鍵アイコン）とタスク追加フォーム
    Array.prototype.forEach.call(document.querySelectorAll(".clampable"), function (el) {
      el.addEventListener("click", function () { el.classList.toggle("open"); });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".tnote"), function (el) {
      el.addEventListener("click", function () { el.classList.toggle("open"); });
    });
    var kb = document.getElementById("keybtn");
    if (!useMock && kb) {
      kb.classList.toggle("on", !!getToken());
      kb.addEventListener("click", function () {
        if (getToken()) {
          if (confirm("編集をオフにしますか？（この端末の編集キーを消します）")) { setToken(""); reload(); }
        } else {
          openKeyModal().then(function (t) {
            if (t) { setToken(t); reload(); }
          });
        }
      });

      var aw = document.getElementById("addwork");
      if (getToken()) {
        aw.innerHTML = '<form class="addform" id="addform">' +
          '<input type="text" id="new-title" placeholder="タスクを追加" autocomplete="off">' +
          '<select id="new-project"><option value="">案件なし</option>' +
          data.projects.map(function (p) {
            return '<option value="' + esc(p.id) + '">' + esc(p.name) + "</option>";
          }).join("") +
          '</select><button class="btn" type="submit">追加</button></form>';
        document.getElementById("addform").addEventListener("submit", function (ev) {
          ev.preventDefault();
          var title = document.getElementById("new-title").value.trim();
          if (!title) return;
          var pid = document.getElementById("new-project").value || null;
          writeRest("POST", "work_items", {
            title: title, kind: "task", assignee: "wataru", status: "planned",
            project_id: pid, steps: [], steps_total: 0, steps_done: 0, note: ""
          }).then(reload).catch(writeFailed);
        });
      } else {
        aw.innerHTML = "";
      }

      // 一括指示フォーム（AI連携あて）
      var dv = document.getElementById("directive");
      if (getToken()) {
        var TEMPLATES = {
          image: "目的：\n使う媒体：\nサイズ：\n雰囲気・条件：\n納品先：共有フォルダ（Drive）",
          research: "調べてほしいこと：\n知りたい理由：\n出力してほしい形：",
          consult: "相談内容：\n迷っている点：\n決めたいこと：",
          writing: "作る・直す文章：\n使い道：\nトーン："
        };
        dv.innerHTML = '<form class="addform" id="directive-form">' +
          '<select id="dv-ai"><option value="muse">Muse へ</option><option value="gpt">GPTへ</option><option value="perplexity">Perplexityへ</option></select>' +
          '<select id="dv-project"><option value="">案件なし</option>' +
          data.projects.map(function (p) {
            return '<option value="' + esc(p.id) + '">' + esc(p.name) + "</option>";
          }).join("") +
          '</select>' +
          '<select id="dv-priority"><option value="normal">通常</option><option value="urgent">急ぎ</option></select>' +
          '<input type="text" id="dv-title" placeholder="指示・相談の件名" autocomplete="off">' +
          '<div class="dvchips">' +
          '<button type="button" class="chipbtn" data-tpl="image">画像を作る</button>' +
          '<button type="button" class="chipbtn" data-tpl="research">調べる</button>' +
          '<button type="button" class="chipbtn" data-tpl="consult">相談する</button>' +
          '<button type="button" class="chipbtn" data-tpl="writing">文章を作る・直す</button>' +
          '</div>' +
          '<textarea id="dv-detail" placeholder="指示の本文（条件・納品先など）"></textarea>' +
          '<input type="date" id="dv-due" title="期限（任意）">' +
          '<button class="btn appr-ok" type="submit">送る</button></form>' +
          '<p class="sub">送ると Muse が約1分で検知して受け付けます。GPT宛は依頼ボードへ中継し、GPTの定期確認で処理されます。</p>';
        Array.prototype.forEach.call(dv.querySelectorAll("[data-tpl]"), function (b) {
          b.addEventListener("click", function () {
            var ta = document.getElementById("dv-detail");
            if (!ta.value.trim()) ta.value = TEMPLATES[b.getAttribute("data-tpl")] || "";
            ta.focus();
          });
        });
        document.getElementById("directive-form").addEventListener("submit", function (ev) {
          ev.preventDefault();
          var title = document.getElementById("dv-title").value.trim();
          if (!title) return;
          var parts = [];
          var body = document.getElementById("dv-detail").value.trim();
          if (body) parts.push(body);
          var due = document.getElementById("dv-due").value;
          if (due) parts.push("期限：" + due);
          if (document.getElementById("dv-priority").value === "urgent") parts.push("優先度：急ぎ");
          writeRest("POST", "board_requests", {
            title: title, detail: parts.join("\n"), requester: "wataru",
            assignee_ai: document.getElementById("dv-ai").value,
            project_id: document.getElementById("dv-project").value || null,
            status: "requested", deliverable_url: ""
          }).then(reload).catch(writeFailed);
        });
        Array.prototype.forEach.call(document.querySelectorAll("[data-ask]"), function (b) {
          b.addEventListener("click", function () {
            var sel = document.getElementById("dv-ai");
            if (sel) sel.value = b.getAttribute("data-ask");
            var t = document.getElementById("dv-title");
            if (t) { t.scrollIntoView({ block: "center" }); t.focus(); }
          });
        });
      } else {
        dv.innerHTML = "";
      }
      Array.prototype.forEach.call(document.querySelectorAll("[data-done]"), function (b) {
        b.addEventListener("click", function () {
          if (!window.confirm("この作業を完了にしますか？")) return;
          writeRest("PATCH", "work_items?id=eq." + encodeURIComponent(b.getAttribute("data-done")), {
            status: "done", done_at: new Date().toISOString()
          }).then(reload).catch(writeFailed);
        });
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-undo]"), function (b) {
        b.addEventListener("click", function () {
          writeRest("PATCH", "work_items?id=eq." + encodeURIComponent(b.getAttribute("data-undo")), {
            status: "planned", done_at: null
          }).then(reload).catch(writeFailed);
        });
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-tdone]"), function (b) {
        b.addEventListener("click", function () {
          if (!window.confirm("このタスクを完了にしますか？")) return;
          writeRest("PATCH", "daily_tasks?id=eq." + encodeURIComponent(b.getAttribute("data-tdone")), {
            done: true, done_at: new Date().toISOString()
          }).then(reload).catch(writeFailed);
        });
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-tundo]"), function (b) {
        b.addEventListener("click", function () {
          writeRest("PATCH", "daily_tasks?id=eq." + encodeURIComponent(b.getAttribute("data-tundo")), {
            done: false, done_at: null
          }).then(reload).catch(writeFailed);
        });
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-tmove]"), function (b) {
        b.addEventListener("click", function () {
          if (!window.confirm("このタスクを明日に送りますか？")) return;
          var id = encodeURIComponent(b.getAttribute("data-tmove"));
          writeRest("PATCH", "daily_tasks?id=eq." + id, {
            task_date: tomorrowJst()
          }).then(reload).catch(function () {
            // 明日分に同じタスクが既にある場合は、今日分を消して一本化する
            writeRest("DELETE", "daily_tasks?id=eq." + id, null).then(reload).catch(writeFailed);
          });
        });
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-tdel]"), function (b) {
        b.addEventListener("click", function () {
          if (!window.confirm("このタスクを削除しますか？\n" + (b.getAttribute("data-ttitle") || ""))) return;
          writeRest("DELETE", "daily_tasks?id=eq." + encodeURIComponent(b.getAttribute("data-tdel")), null).then(reload).catch(writeFailed);
        });
      });
    }

    // 数字とPDCA（施策ごとに、指標の最新値と前回比）
    function fmtNum(v) {
      var n = Number(v);
      return isFinite(n) ? n.toLocaleString("ja-JP") : String(v);
    }
    document.getElementById("numbers").innerHTML = (data.measures || []).map(function (ms) {
      var where = [ms.project && ms.project.name, ms.media && ms.media.name].filter(Boolean).join(" / ");
      var period = ms.started_on ? esc(ms.started_on) + (ms.ended_on ? "〜" + esc(ms.ended_on) : "〜") : "";
      var byMetric = {};
      (data.measure_results || []).forEach(function (r) {
        if (r.measure_id !== ms.id) return;
        (byMetric[r.metric_name] = byMetric[r.metric_name] || []).push(r);
      });
      var names = Object.keys(byMetric).filter(function (n) { return !/使用イベント$/.test(n); });
      var lines = names.length ? names.map(function (name) {
        var arr = byMetric[name];
        var cur = arr[0];
        var delta = "";
        if (arr.length > 1) {
          var d = Number(cur.metric_value) - Number(arr[1].metric_value);
          delta = "（前回比 " + (d > 0 ? "+" : "") + fmtNum(d) + "）";
        }
        return '<div class="metric"><div class="metricname">' + esc(name) + '</div>' +
          '<div class="bignum">' + fmtNum(cur.metric_value) + '<span class="bigunit">' + esc(cur.unit || "") + "</span></div>" +
          '<div class="sub">' + esc(fmtTime(cur.measured_at)) + esc(delta) + "</div></div>";
      }).join("") : '<p class="line empty">結果はまだ記録なし</p>';
      return '<article class="card"><div class="name">' + esc(ms.title) + "</div>" +
        '<div class="sub">' + esc(where) + (period ? "｜" + period : "") + "</div>" +
        (ms.description ? '<p class="line clampable">' + esc(ms.description) + "</p>" : "") +
        lines + "</article>";
    }).join("") || '<p class="empty">施策の登録なし</p>';

    // AI連携（依頼ボード）
    var BOARD_STATUS = { requested: "送信済み", in_progress: "対応中", delivered: "納品あり", checked: "検品済み", done: "完了", cancelled: "中止" };
    var AI_LABEL = { gpt: "GPT", muse: "Muse", perplexity: "Perplexity" };
    function boardNext(b) {
      if (b.status === "done" || b.status === "cancelled") return "";
      if (b.assignee_ai === "gpt") {
        return (b.detail && b.detail.indexOf("中継済み") >= 0)
          ? "GPTの定期確認待ちです" : "Museが依頼ボードへ中継します";
      }
      if (b.assignee_ai === "perplexity") return "Museが調査として処理します";
      return "Museが受け付け次第、対応します";
    }
    document.getElementById("board").innerHTML = (data.board_requests || []).map(function (b) {
      var proj = (b.project && b.project.name) ? b.project.name + "｜" : "";
      var urgent = (b.detail && b.detail.indexOf("優先度：急ぎ") >= 0)
        ? ' <span class="status urgent">急ぎ</span>' : "";
      var next = boardNext(b);
      return '<article class="card"><div class="name">' + esc(b.title) + "</div>" +
        '<div class="sub">' + esc(proj) + "担当：" + esc(AI_LABEL[b.assignee_ai] || b.assignee_ai || "") +
        (b.created_at ? "｜" + esc(fmtTime(b.created_at)) : "") + "</div>" +
        '<p class="line"><span class="status ' + esc(b.status) + '">' +
        esc(BOARD_STATUS[b.status] || b.status) + "</span>" + urgent + "</p>" +
        (b.detail ? '<p class="line clampable">' + esc(b.detail) + "</p>" : "") +
        (next ? '<p class="sub">' + esc(next) + "</p>" : "") +
        (b.deliverable_url ? '<p class="line"><a href="' + esc(b.deliverable_url) + '" target="_blank" rel="noopener">依頼ボードを開く</a></p>' : "") +
        "</article>";
    }).join("") || '<p class="empty">依頼なし</p>';

    // 担当AI（作業と依頼から自動集計）。urlは各AIを直接開くリンク（アプリがあればアプリで開く）
    var AGENTS = [
      { key: "muse", label: "Muse", role: "開発・制作・運用", url: "https://muse.ai/" },
      { key: "gpt", label: "GPT", role: "デザイン・画像・相談", url: "https://chatgpt.com/" },
      { key: "perplexity", label: "Perplexity", role: "調査", url: "https://www.perplexity.ai/" }
    ];
    document.getElementById("agents").innerHTML = AGENTS.map(function (ag) {
      var items = [];
      data.work_items.forEach(function (w) {
        if (w.assignee === ag.key) items.push(w.title + "（" + (STATUS_LABEL[w.status] || w.status) + "）");
      });
      (data.board_requests || []).forEach(function (b) {
        if (b.assignee_ai === ag.key && b.status !== "done" && b.status !== "cancelled") {
          items.push(b.title + "（" + (BOARD_STATUS[b.status] || b.status) + "）");
        }
      });
      var body = items.length
        ? items.slice(0, 4).map(function (t) { return '<p class="line">' + esc(t) + "</p>"; }).join("")
        : '<p class="line empty">対応中の作業・依頼なし</p>';
      var ask = "";
      try {
        if (typeof getToken === "function" && getToken()) {
          ask = '<button class="btn" type="button" data-ask="' + ag.key + '">このAIへ指示</button>';
        }
      } catch (e) {}
      var btns = '<div class="agent-btns"><a class="btn" href="' + ag.url + '"' + (ag.scheme ? ' data-scheme="' + ag.scheme + '"' : "") + '>開く</a>' + ask + "</div>";
      return '<article class="card"><div class="name">' + esc(ag.label) + "</div>" +
        '<div class="sub">' + esc(ag.role) + "｜対応中 " + items.length + "件</div>" + body + btns + "</article>";
    }).join("");
    // 担当AIカードの「このAIへ指示」は、カード描画後に紐付ける（指示フォームへ移動して宛先を選ぶ）
    Array.prototype.forEach.call(document.querySelectorAll("#agents [data-ask]"), function (b) {
      b.addEventListener("click", function () {
        var sel = document.getElementById("dv-ai");
        if (sel) sel.value = b.getAttribute("data-ask");
        var t = document.getElementById("dv-title");
        if (t) { t.scrollIntoView({ block: "center" }); t.focus(); }
      });
    });

    // 報告履歴
    document.getElementById("reports").innerHTML = data.reports.slice(0, 6).map(function (r) {
      return '<article class="card report"><time>' + esc(fmtTime(r.created_at)) + "</time>" +
        '<span class="reportbody">' + esc(r.body) + "</span></article>";
    }).join("") || '<p class="empty">報告なし</p>';

  }

  // タブ切り替え（今日／媒体／案件／数字／連携）
  function activateTab(name) {
    if (!document.getElementById("panel-" + name)) name = "today";
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === name);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".panel"), function (p) {
      p.classList.toggle("active", p.id === "panel-" + name);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
    b.addEventListener("click", function () {
      var name = b.getAttribute("data-tab");
      try { history.replaceState(null, "", "#" + name); } catch (e) {}
      activateTab(name);
      window.scrollTo(0, 0);
    });
  });
  activateTab((location.hash || "#today").slice(1));

  // 編集キー入力モーダル（#keymodal）のボタン結び付け（静的HTMLなので1回だけ）
  (function () {
    var okBtn = document.getElementById("keymodal-ok");
    var cancelBtn = document.getElementById("keymodal-cancel");
    var inp = document.getElementById("keymodal-input");
    if (!okBtn || !cancelBtn || !inp) return;
    var submit = function () { closeKeyModal(inp.value.trim() || null); };
    okBtn.addEventListener("click", submit);
    cancelBtn.addEventListener("click", function () { closeKeyModal(null); });
    inp.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); submit(); }
      else if (ev.key === "Escape") { closeKeyModal(null); }
    });
  })();

  // アプリ専用の呼び出し形式（data-scheme）が付いたリンクは、まずアプリ起動を試し、開かなければWebへ進む
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("[data-scheme]") : null;
    if (!a) return;
    e.preventDefault();
    var web = a.getAttribute("href");
    var done = false;
    var timer = setTimeout(function () { if (!done) location.href = web; }, 1300);
    document.addEventListener("visibilitychange", function h() {
      if (document.hidden) { done = true; clearTimeout(timer); document.removeEventListener("visibilitychange", h); }
    });
    location.href = a.getAttribute("data-scheme");
  });

  load().then(render).catch(function (e) {
    document.getElementById("meta").textContent = "読み取りに失敗しました：" + e.message;
  });
})();

// アプリとしてインストール可能にする（service worker登録）
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}

// ---------------- プッシュ通知（TOWERからの通知） ----------------
// 右上のベルでオン/オフする。購読情報はSupabaseの push_subscriptions に保存し、
// 送信はサーバー側（Muse）から行う。編集キーのある端末だけが購読できる。
(function () {
  var cfg2 = window.OPS_CONFIG || {};
  function getToken2() {
    try { return localStorage.getItem("opsWriteToken") || ""; } catch (e) { return ""; }
  }
  function urlB64ToUint8Array(base64String) {
    var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    var raw = atob(base64);
    var arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }
  function bellEl() { return document.getElementById("bellbtn"); }
  function refreshBell() {
    var b = bellEl();
    if (!b || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      return reg.pushManager.getSubscription();
    }).then(function (sub) {
      b.classList.toggle("on", !!sub);
      // 購読があるのにサーバーへ届いていない場合は、開いたついでに保存し直す
      if (sub && getToken2()) saveSubscription(sub).catch(function () {});
    }).catch(function () {});
  }
  function saveSubscription(sub) {
    var base = cfg2.supabaseUrl.replace(/\/$/, "") + "/rest/v1/push_subscriptions";
    return fetch(base + "?on_conflict=endpoint", {
      method: "POST",
      headers: {
        apikey: cfg2.anonKey,
        Authorization: "Bearer " + cfg2.anonKey,
        "x-ops-token": getToken2(),
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify({ endpoint: sub.endpoint, subscription: sub.toJSON() })
    }).then(function (res) {
      if (!res.ok) throw new Error("SAVE " + res.status);
      var postStatus = res.status;
      return res.text().then(function (postBody) {
        // 保存できたかを読み戻して確認する（200でも行が無いケースの切り分け用）
        return fetch(base + "?endpoint=eq." + encodeURIComponent(sub.endpoint) + "&select=id", {
          headers: { apikey: cfg2.anonKey, Authorization: "Bearer " + cfg2.anonKey }
        }).then(function (r2) { return r2.json(); }).then(function (rows) {
          if (!rows || !rows.length) {
            throw new Error("VERIFY-EMPTY POST=" + postStatus + " BODY=" + String(postBody).slice(0, 120));
          }
        });
      });
    });
  }
  function deleteSubscription(endpoint) {
    return fetch(cfg2.supabaseUrl.replace(/\/$/, "") + "/rest/v1/push_subscriptions?endpoint=eq." + encodeURIComponent(endpoint), {
      method: "DELETE",
      headers: {
        apikey: cfg2.anonKey,
        Authorization: "Bearer " + cfg2.anonKey,
        "x-ops-token": getToken2()
      }
    }).catch(function () {});
  }
  function onBellClick() {
    if (!getToken2()) { alert("先に右上の鍵で編集キーを設定してください"); return; }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !cfg2.vapidPublicKey) {
      alert("この端末・ブラウザでは通知が使えません"); return;
    }
    navigator.serviceWorker.ready.then(function (reg) {
      return reg.pushManager.getSubscription().then(function (sub) {
        if (sub) {
          if (!confirm("通知をオフにしますか？")) return null;
          var ep = sub.endpoint;
          return sub.unsubscribe().then(function () { return deleteSubscription(ep); }).then(function () {
            refreshBell(); alert("通知をオフにしました");
          });
        }
        return Notification.requestPermission().then(function (perm) {
          if (perm !== "granted") { alert("通知が許可されませんでした"); return null; }
          return reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlB64ToUint8Array(cfg2.vapidPublicKey)
          }).then(saveSubscription).then(function () {
            refreshBell(); alert("通知をオンにしました。承認待ちやタスクの時刻に、この端末へ通知が届きます");
          });
        });
      });
    }).catch(function (e) { alert("通知の設定に失敗しました（" + e.message + "）"); });
  }
  window.addEventListener("load", function () {
    var b = bellEl();
    if (b) { b.addEventListener("click", onBellClick); refreshBell(); }
  });
})();

