/* 여러 장 미리보기 (학생 요청 2026-10-16) — sig.js 뒤에 실행. sig.js는 고치지 않는다.
   줄을 가리키는 동안 왼쪽 미리보기에서 사진이 2.5초마다 한 장씩, 기억이 떠오르듯 흐릿하게 겹쳐 들어왔다가 또렷해진다.
   - 의미 줄: sig.js가 만든 미리보기 사진 위에 겹침 사진을 하나 더 두고 넘긴다
   - 소개 줄: 미리보기가 없어서 새로 만들어 붙인다 (sig.js는 가리킬 때 row._pv 를 읽는다)
   - 폰(줄 안 사진이 보일 때): 줄 안 사진도 같은 방식으로 넘어간다 (CSS가 겹쳐 놓음) */
(function () {
  var STEP = 2500;
  var preview = document.querySelector(".w5c-preview");
  if (!preview) return;
  function ready(src) {
    var n = new Image(); n.src = src;
    return (n.decode ? n.decode() : Promise.resolve()).catch(function () {});
  }

  /* 기본 글 칸(나의 시선 아카이브 · 제목 · 본문)을 의미 사진과 같은 크기로 — 첫 의미 사진의 실제 크기를 재서 넘긴다 */
  function fitCard() {
    var ref = preview.querySelector(".w5c-pv:not(.is-default) .w5c-pv__pic img");
    if (!ref) return;
    var r = ref.getBoundingClientRect();
    if (r.width && r.height) { preview.style.setProperty("--card-w", r.width + "px"); preview.style.setProperty("--card-h", r.height + "px"); }
  }
  window.addEventListener("load", fitCard);
  window.addEventListener("resize", fitCard);
  setTimeout(fitCard, 300);

  [].forEach.call(document.querySelectorAll(".w5c-row"), function (row) {
    var fig = row.querySelector(".w5c-fig.w5c-multi");
    if (!fig) return;
    var srcs = [].map.call(fig.querySelectorAll("img"), function (i) { return i.getAttribute("src"); });
    if (!srcs.length) return;

    var pv = row._pv;
    if (!pv) {
      pv = document.createElement("figure");
      pv.className = "w5c-pv"; pv.setAttribute("aria-hidden", "true");
      var cap = document.createElement("figcaption"), lab = document.createElement("div");
      lab.className = "w5c-pv__label";
      var key = row.querySelector(".w5c-year"); lab.textContent = key ? key.textContent.trim() : "";
      cap.appendChild(lab); pv.appendChild(cap);
      preview.appendChild(pv);
      row._pv = pv;
    }
    var pic = pv.querySelector(".w5c-pv__pic");
    if (!pic) {
      pic = document.createElement("span"); pic.className = "w5c-pv__pic";
      var im = document.createElement("img"); im.alt = ""; im.decoding = "async"; im.width = 900; im.height = 1200;
      pic.appendChild(im); pv.insertBefore(pic, pv.querySelector("figcaption"));
    }
    pic.classList.add("w5c-memo");
    var base = pic.querySelector("img");
    base.src = srcs[0];
    var over = document.createElement("img"); over.alt = ""; over.className = "w5c-memo__over"; over.setAttribute("aria-hidden", "true");
    pic.appendChild(over);
    srcs.forEach(ready);

    var i = 0, timer = null, swap = null;
    function show(n, soft) {
      i = n % srcs.length; var want = srcs[i];
      ready(want).then(function () {
        if (srcs[i] !== want) return;
        clearTimeout(swap);
        if (!soft) { base.src = want; over.classList.remove("is-in"); pic.classList.remove("is-drift"); void pic.offsetWidth; pic.classList.add("is-drift"); return; }
        over.src = want; over.classList.remove("is-in"); void over.offsetWidth; over.classList.add("is-in");
        swap = setTimeout(function () {                    /* 다 떠오른 뒤 바닥 사진을 바꾸고 겹침을 걷는다 */
          base.src = want; over.classList.remove("is-in");
          pic.classList.remove("is-drift"); void pic.offsetWidth; pic.classList.add("is-drift");
        }, 1250);
      });
    }
    function start() { stop(); timer = setInterval(function () { show(i + 1, true); }, STEP); }
    function stop() { clearInterval(timer); timer = null; }
    row.addEventListener("mouseenter", function () { show(0); start(); });
    row.addEventListener("focus", function () { show(0); start(); });
    row.addEventListener("mouseleave", function () { stop(); show(0); });
    row.addEventListener("blur", function () { stop(); show(0); });

    /* 폰: 줄 안 사진 */
    var inl = [].slice.call(fig.querySelectorAll("img")), k = 0;
    inl.forEach(function (el, n) { el.classList.toggle("is-on", n === 0); });
    setInterval(function () {
      if (getComputedStyle(fig).display === "none") return;
      inl[k].classList.remove("is-on"); k = (k + 1) % inl.length; inl[k].classList.add("is-on");
    }, STEP);
  });
})();

/* 학생 요청 (2026-10-16) — 상단 "의미" 탭을 누르면 의미 1만이 아니라 1·2·3 줄이 함께 진해지고 형광펜이 켜진다.
   목록에 마우스를 올리면 평소처럼 한 줄씩 반응한다. */
(function () {
  var tab = document.querySelector('.w5c-tabs a[href="#r1"]');
  var list = document.querySelector(".w5c-list");
  if (!tab || !list) return;
  tab.addEventListener("click", function () {
    if (document.activeElement && document.activeElement.classList.contains("w5c-row")) document.activeElement.blur();
    list.classList.remove("is-focus");
    list.classList.add("is-group");
    /* 주소(#r1)로 이동하면 브라우저가 의미 1에만 포커스를 줘서 분홍 테두리가 1에만 생긴다 — 이동이 끝난 뒤 풀어 준다 */
    setTimeout(function () {
      var ae = document.activeElement;
      if (ae && ae.classList && ae.classList.contains("w5c-row")) ae.blur();
      list.classList.add("is-group");
    }, 50);
  });
  list.addEventListener("mouseenter", function () { list.classList.remove("is-group"); });
  document.querySelectorAll('.w5c-tabs a:not([href="#r1"])').forEach(function (a) {
    a.addEventListener("click", function () { list.classList.remove("is-group"); });
  });
})();
