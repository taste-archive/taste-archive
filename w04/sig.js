/* W05-A 연표형 — 시그니처 런타임 (classic script, 의존 0, file:// 동작)
   1) my-style.css 의 --my-* 를 읽어 <html> 에 클래스를 붙인다
   2) 바탕색에서 글자·흐린 글자·헤어라인 색을 대비로 파생한다 (면 색은 그대로)
   3) 이유 행마다 왼쪽 미리보기를 만든다 — 행을 가리키면 0.5초 교차, 목록을 떠나면 5초 뒤 기본으로
      (레퍼런스 Chronology: 행 mouseenter → setActive, 목록 mouseleave → 5000ms 뒤 기본)
   4) 이름: 폰트 로드 후 실제 폭을 재서 맞춘다 (COMMON_RULES §2) */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("to-load");

  function cssVar(name, el) {
    return getComputedStyle(el || root).getPropertyValue(name).trim().replace(/^["']|["']$/g, "");
  }
  function pick(v, allowed, dflt) { return allowed.indexOf(v) > -1 ? v : dflt; }

  /* ── 1. 커스텀 항목 → 클래스 ── */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var type = pick(cssVar("--my-type"), ["serif", "sans", "mono", "hand"], "sans");
  var motion = reduce ? "0" : pick(cssVar("--my-motion"), ["0", "1", "2"], "1");
  var density = pick(cssVar("--my-density"), ["0", "1", "2"], "1");
  var image = pick(cssVar("--my-image"), ["original", "mono", "tint", "native"], "native");
  var bar = pick(cssVar("--my-bar"), ["cycle", "point", "none"], "cycle");
  root.classList.add("t-" + type, "m-" + motion, "d-" + density, "i-" + image, "bar-" + bar);
  root.style.setProperty("--k", { "0": "1", "1": "1", "2": "1.14" }[density]);

  /* ── 2. 색 ── */
  function rgb(c) {
    var i = document.createElement("i");
    i.style.color = c; i.style.display = "none";
    document.body.appendChild(i);
    var m = getComputedStyle(i).color.match(/[\d.]+/g) || [0, 0, 0];
    i.parentNode.removeChild(i);
    return [+m[0], +m[1], +m[2]];
  }
  function lum(a) {
    a = a.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mix(a, b, t) { return [0, 1, 2].map(function (k) { return Math.round(a[k] * (1 - t) + b[k] * t); }); }
  function css(a) { return "rgb(" + a.join(",") + ")"; }

  var bgRaw = cssVar("--my-bg") || cssVar("--c-paper");
  var bgC = rgb(bgRaw);
  var inkC = rgb(cssVar("--c-ink")), whiteC = rgb(cssVar("--c-white"));
  var ink = contrast(inkC, bgC) >= 4.5 ? inkC : (contrast(whiteC, bgC) > contrast(inkC, bgC) ? whiteC : inkC);
  /* 원본: 라벨(c-mute) ≈ 글자→바탕 38% · 흐린 행(c-dim) ≈ 82%. 작은 글자는 4.5:1 이상이 될 때까지 글자 쪽으로 당긴다 */
  var t = 0.38, mute = mix(ink, bgC, t);
  while (contrast(mute, bgC) < 4.5 && t > 0) { t -= 0.04; mute = mix(ink, bgC, Math.max(t, 0)); }
  var dim = mix(ink, bgC, 0.8);
  var pointRaw = cssVar("--my-point");
  var noPoint = !pointRaw || pointRaw === "none";
  var point = noPoint ? css(ink) : pointRaw;
  root.classList.toggle("no-point", noPoint);
  root.style.setProperty("--bg", bgRaw);
  root.style.setProperty("--ink", css(ink));
  root.style.setProperty("--mute", css(mute));
  root.style.setProperty("--dim", css(dim));
  root.style.setProperty("--hair", css(dim));
  root.style.setProperty("--point", point);
  for (var b = 1; b <= 5; b++) {
    var v = noPoint ? css(ink) : bar === "point" ? point : bar === "none" ? "transparent" : cssVar("--c-bar-" + b);
    root.style.setProperty("--bar-" + b, v);
  }

  /* ── 3. 미리보기 ── */
  var preview = document.querySelector(".w5c-preview");
  var list = document.querySelector(".w5c-list");
  var rows = [].slice.call(document.querySelectorAll(".w5c-row"));
  var reasons = [].slice.call(document.querySelectorAll(".w5c-reason"));
  var dflt = preview ? preview.querySelector(".w5c-pv.is-default") : null;
  var current = dflt;

  var sub = document.querySelector(".w5c-tabs__sub");
  if (sub) sub.textContent = reasons.length > 1 ? "1–" + reasons.length : "";

  reasons.forEach(function (row) {
    if (!preview) return;
    var fig = document.createElement("figure");
    fig.className = "w5c-pv";
    fig.setAttribute("aria-hidden", "true");
    var img = row.querySelector(".w5c-fig img");
    if (img) {
      var pic = document.createElement("span");
      pic.className = "w5c-pv__pic";
      var p = document.createElement("img");
      p.src = img.getAttribute("src"); p.alt = ""; p.decoding = "async";
      if (img.getAttribute("width")) { p.width = +img.getAttribute("width"); p.height = +img.getAttribute("height"); }
      pic.appendChild(p); fig.appendChild(pic);
    } else {
      /* 사진이 없는 이유: 원본은 그림 없이 "See 연도 →"만 남는다. 빈 칸 대신 그 행의 해석(없으면 본 것)을 한 문장 자리 글씨로 */
      var src = row.querySelector(".w5c-read") || row.querySelector(".w5c-seen");
      if (src) { var say = document.createElement("p"); say.className = "w5c-pv__say"; say.textContent = src.textContent.trim(); fig.appendChild(say); }
    }
    var cap = document.createElement("figcaption");
    var key = row.querySelector(".w5c-year");
    if (key) { var lab = document.createElement("div"); lab.className = "w5c-pv__label"; lab.textContent = key.textContent.trim(); cap.appendChild(lab); }
    var link = row.querySelector(".w5c-link");
    if (link) {
      var a = document.createElement("a");
      a.className = "w5c-arrow"; a.href = link.getAttribute("href") || "#"; a.textContent = link.textContent.trim();
      a.tabIndex = -1;
      cap.appendChild(a);
      fig.removeAttribute("aria-hidden");
    }
    fig.appendChild(cap);
    preview.appendChild(fig);
    row._pv = fig;
  });

  /* 기본 미리보기 = 원본의 초상 자리: 한 문장 아래에 첫 근거 사진을 한 장 세운다(모바일에서는 이유 칸 사진과 겹치므로 CSS가 숨김) */
  var firstImg = document.querySelector(".w5c-reason .w5c-fig img");
  if (dflt && firstImg) {
    var dp = document.createElement("span");
    dp.className = "w5c-pv__pic w5c-pv__cover";
    var di = document.createElement("img");
    di.src = firstImg.getAttribute("src"); di.alt = ""; di.decoding = "async";
    if (firstImg.getAttribute("width")) { di.width = +firstImg.getAttribute("width"); di.height = +firstImg.getAttribute("height"); }
    dp.appendChild(di);
    dflt.insertBefore(dp, dflt.querySelector("figcaption"));
    root.classList.add("has-cover");
  }

  function setActive(pv) {
    pv = pv || dflt;
    if (!pv || pv === current) return;
    if (current) current.classList.remove("is-on");
    pv.classList.add("is-on");
    current = pv;
  }
  if (dflt) dflt.classList.add("is-on");
  var hold = parseInt(cssVar("--hold"), 10) || 5000, timer = null;
  rows.forEach(function (row) {
    row.addEventListener("mouseenter", function () { clearTimeout(timer); setActive(row._pv); });
    row.addEventListener("focus", function () { clearTimeout(timer); setActive(row._pv); if (list) list.classList.add("is-focus"); });
  });
  if (list) {
    list.addEventListener("mouseleave", function () { clearTimeout(timer); timer = setTimeout(function () { setActive(null); }, hold); });
    list.addEventListener("focusout", function (e) {
      if (!list.contains(e.relatedTarget)) { list.classList.remove("is-focus"); clearTimeout(timer); timer = setTimeout(function () { setActive(null); }, hold); }
    });
  }

  /* ── 4. 이름 맞춤 + 미리보기 높이 ── */
  var nameEl = document.querySelector(".w5c-name");
  function esc(s) { return s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function splits(words, n) {
    if (n === 1) return [[words.join(" ")]];
    var out = [];
    for (var i = 1; i <= words.length - n + 1; i++) {
      var head = words.slice(0, i).join(" ");
      splits(words.slice(i), n - 1).forEach(function (rest) { out.push([head].concat(rest)); });
    }
    return out;
  }
  function widthAt(el, lines, px) {
    el.innerHTML = lines.map(esc).join("<br>");
    el.style.setProperty("--fs", px + "px");
    return el.scrollWidth;
  }
  function fitName() {
    if (!nameEl) return;
    var text = nameEl.getAttribute("data-text");
    if (text === null) { text = nameEl.textContent.replace(/\s+/g, " ").trim(); nameEl.setAttribute("data-text", text); }
    nameEl.style.removeProperty("--fs");
    nameEl.textContent = text;
    var cap = parseFloat(getComputedStyle(nameEl).fontSize);
    var key = nameEl.parentNode, ks = getComputedStyle(key);
    var avail = key.clientWidth - parseFloat(ks.paddingLeft) - parseFloat(ks.paddingRight);
    var sayEl = document.querySelector(".w5c-say");
    var floor = sayEl ? parseFloat(getComputedStyle(sayEl).fontSize) * 1.1 : 0;
    var words = text.split(" "), best = null;
    for (var n = 1; n <= Math.min(words.length, 3); n++) {
      splits(words, n).forEach(function (lines) {
        var w = widthAt(nameEl, lines, cap);
        var s = Math.min(cap, cap * avail / w * 0.985);
        if (!best || s > best.s + 0.5) best = { s: s, lines: lines };
      });
      if (best.s >= cap * 0.999 || (n === 1 && best.s >= cap * 0.62)) break;
    }
    widthAt(nameEl, best.lines, Math.floor(Math.max(best.s, Math.min(floor, cap)) * 10) / 10);
  }
  function sizePreview() {
    if (!preview) return;
    var pic = preview.querySelector(".w5c-pv__cover") || preview;
    var top = pic.getBoundingClientRect().top;
    root.style.setProperty("--pv-max", Math.max(200, window.innerHeight - top - 70) + "px");
    var cover = preview.querySelector(".w5c-pv__cover");
    root.style.setProperty("--say-h", cover ? Math.max(0, cover.getBoundingClientRect().top - preview.getBoundingClientRect().top) + "px" : "0px");
  }
  function fitAll() { fitName(); sizePreview(); }

  var ready = Promise.resolve();
  if (document.fonts && document.fonts.load && nameEl) {
    ready = document.fonts.load(getComputedStyle(nameEl).font, nameEl.textContent.trim() || "가A")
      .catch(function () {}).then(function () { return document.fonts.ready; });
  }
  ready.then(function () {
    fitAll();
    requestAnimationFrame(function () { root.classList.remove("to-load"); });
  });
  setTimeout(function () { root.classList.remove("to-load"); }, 3000);
  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(fitAll, 150); });
})();
