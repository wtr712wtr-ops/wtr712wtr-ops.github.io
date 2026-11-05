// 司令塔画面（最小版）— Supabase REST（PostgREST）から読み取り専用で表示する。
// config.js がプレースホルダの場合はモックデータで表示する。
(function () {
  "use strict";

  var cfg = window.OPS_CONFIG || {};
  var useMock = cfg.forceMock || !cfg.supabaseUrl || !cfg.anonKey ||
    cfg.supabaseUrl.indexOf("YOUR_") >= 0 || cfg.anonKey.indexOf("YOUR_") >= 0;

  // ---------------- モックデータ（REST の返却形に合わせた形） ----------------
  var MOCK = {
    projects: [
      { id: "p1", slug: "the-gym", name: "THE GYM", status_label: "運用中", status_color: "green", summary: "テーマ投稿は火・金に公開", next_action: "11月6日分の画像を検品", owner_action: "", sort_order: 1, updated_at: "2026-11-03T12:00:00+09:00" },
      { id: "p2", slug: "corporate-line", name: "法人LINE", status_label: "本番テスト再実施予定", status_color: "yellow", summary: "検証は完了。本番の塞ぎ予約は鍵の種類が原因で未作成", next_action: "buyer-level の鍵で再実施", owner_action: "11月4日18時に承認操作", sort_order: 3, updated_at: "2026-11-03T19:00:00+09:00" },
      { id: "p3", slug: "spotter", name: "SPOTTER", status_label: "開発中", status_color: "yellow", summary: "実装完了。試験用DBへの反映が残り", next_action: "migration 適用と通し確認", owner_action: "ログインとDBパスワード入力", sort_order: 4, updated_at: "2026-11-03T18:00:00+09:00" }
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
    document.getElementById("today").innerHTML = tasks.length ? tasks.map(function (t) {
      var canEdit = !useMock && !!getToken();
      var check = canEdit
        ? (t.done
          ? '<button class="tcheck2 on" data-tundo="' + esc(t.id) + '" aria-label="完了を取り消す">✓</button>'
          : '<button class="tcheck2" data-tdone="' + esc(t.id) + '" aria-label="完了にする"></button>')
        : '<span class="tcheck2' + (t.done ? " on" : "") + '">' + (t.done ? "✓" : "") + "</span>";
      var moveBtn = canEdit && !t.done ? '<button class="btn move-btn" data-tmove="' + esc(t.id) + '">明日へ送る</button>' : "";
      var metaBits = [t.task_time, t.project].filter(function (x) { return !!x; }).map(function (x) { return esc(x); }).join(" ・ ");
      return '<article class="card task' + (t.done ? " is-done" : "") + '"><div class="trow2">' + check +
        '<div class="tmain"><span class="ttitle">' + esc(t.title) + "</span>" +
        (t.note ? '<div class="tnoterow"><p class="tnote">' + esc(t.note) + '</p><span class="chev">⌄</span></div>' : "") +
        "</div></div>" +
        (metaBits || moveBtn ? '<div class="tfoot"><span class="tmeta">' + metaBits + "</span>" + moveBtn + "</div>" : "") +
        "</article>";
    }).join("") + '<p class="sub today-count">' + tasks.length + "件中 " + doneCount + "件が完了</p>"
      : '<p class="empty">今日のタスクはまだ登録なし</p>';

    // 承認待ち
    var apSec = document.getElementById("approvals-section");
    var ap = document.getElementById("approvals");
    if (data.approvals.length) {
      apSec.hidden = false;
      ap.innerHTML = data.approvals.map(function (a) {
        return '<article class="card approval"><div class="name">' + esc(a.title) + "</div>" +
          (a.recommendation ? '<p class="rec clampable">推奨：' + esc(a.recommendation) + "</p>" : "") +
          (a.reason ? '<p class="rec clampable">理由：' + esc(a.reason) + "</p>" : "") +
          (a.risk ? '<p class="rec clampable">リスク：' + esc(a.risk) + "</p>" : "") +
          (getToken() ? '<div class="appr-btns"><button class="btn appr-ok" data-id="' + a.id + '">承認する</button>' +
            '<button class="btn appr-ng" data-id="' + a.id + '">見送る</button></div>' : "") +
          "</article>";
      }).join("");
      Array.prototype.forEach.call(ap.querySelectorAll(".appr-ok"), function (btn) {
        btn.addEventListener("click", function () {
          if (!confirm("この内容で承認しますか？")) return;
          writeRest("PATCH", "approvals?id=eq." + btn.getAttribute("data-id"), { status: "approved" })
            .then(function () { reload(); })
            .catch(function () { alert("承認の記録に失敗しました。通信状態を確認してください。"); });
        });
      });
      Array.prototype.forEach.call(ap.querySelectorAll(".appr-ng"), function (btn) {
        btn.addEventListener("click", function () {
          if (!confirm("この内容を見送りますか？")) return;
          writeRest("PATCH", "approvals?id=eq." + btn.getAttribute("data-id"), { status: "rejected" })
            .then(function () { reload(); })
            .catch(function () { alert("記録に失敗しました。通信状態を確認してください。"); });
        });
      });
    } else {
      apSec.hidden = true;
    }
    Array.prototype.forEach.call(document.querySelectorAll(".appr-badge"), function (apprBadge) {
      apprBadge.textContent = data.approvals.length;
      apprBadge.style.display = data.approvals.length ? "" : "none";
    });

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
      line_stamps: "https://creator.line.me/",
      booth: "https://manage.booth.pm/"
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
      return '<article class="card"><div class="name"><span class="dot ' + esc(p.status_color) + '"></span>' +
        esc(p.name) + "</div>" +
        '<div class="sub">' + esc(p.status_label) + "</div>" +
        (p.summary ? '<p class="line clampable">' + esc(p.summary) + "</p>" : "") +
        (p.next_action ? '<p class="line clampable">次：' + esc(p.next_action) + "</p>" : "") +
        (p.owner_action ? '<p class="warn">あなたの番：' + esc(p.owner_action) + "</p>" : "") +
        "</article>";
    }).join("") || '<p class="empty">案件の登録なし</p>';

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
      return '<article class="card"><div class="name">' + esc(w.title) + "</div>" +
        '<div class="sub">' + esc(where) + (when ? "｜" + esc(when) : "") + "</div>" +
        '<p class="line"><span class="status ' + esc(w.status) + '">' +
        esc(STATUS_LABEL[w.status] || w.status) + "</span></p>" +
        progressHtml(w) +
        (w.status === "blocked" && w.blocked_reason ? '<p class="warn">理由：' + esc(w.blocked_reason) + "</p>" : "") +
        (w.owner_action ? '<p class="warn">あなたの番：' + esc(w.owner_action) + "</p>" : "") +
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
          var t = prompt("編集キーを入力してください（この端末にだけ保存されます）");
          if (t) { setToken(t.trim()); reload(); }
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
      var names = Object.keys(byMetric);
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
        '<span class="clampable">' + esc(r.body) + "</span></article>";
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
