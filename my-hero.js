/* 첫 화면 사진 넘기기 (7주 커스텀 — 학생 요청 "메인은 화면이 변화하면서 이미지가 바뀌는걸로")
   SLIDES 순서대로 3초마다 0.8초 동안 겹쳐 바뀐다. 바뀐 뒤 첫 사진 src 를 바꿔서 sig.js 가 글자색을 다시 잰다.
   첫 화면이 보일 때만 돈다. --my-motion: 0 이거나 '동작 줄이기' 설정이면 넘기지 않는다. */
(function () {
  var SLIDES = [
    'assets/space1_01.jpg',
    'assets/space1_02.jpg',
    'assets/space1_03.jpg',
    'assets/space1_04.jpg',
    'assets/space2_01.jpg',
    'assets/space2_02.jpg',
    'assets/space2_03.jpg',
    'assets/space2_04.jpg',
    'assets/space2_05.jpg',
    'assets/space3_01.jpg',
    'assets/space3_02.jpg',
    'assets/space3_03.jpg',
    'assets/space3_04.jpg',
    'assets/space3_05.jpg',
    'assets/space3_06.jpg'
  ];
  var EVERY = 3000, FADE = 800;
  var fig = document.querySelector('.ca-top--hero .ca-hero--full');
  var img = fig && fig.querySelector('img');
  if (!img || SLIDES.length < 2) return;
  var motion = getComputedStyle(document.documentElement).getPropertyValue('--my-motion').trim();
  if (motion === '0' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  SLIDES.forEach(function (s) { var p = new Image(); p.src = s; });   /* 미리 불러 두기 */
  var i = 0, timer = null, busy = false;

  function next() {
    if (busy) return;
    busy = true;
    i = (i + 1) % SLIDES.length;
    var top = document.createElement('img');
    top.className = 'my-hero-fade';
    top.alt = '';
    top.src = SLIDES[i];
    fig.appendChild(top);
    requestAnimationFrame(function () { requestAnimationFrame(function () { top.style.opacity = '1'; }); });
    setTimeout(function () {
      img.src = SLIDES[i];   /* load 때 sig.js 가 대표 제목·상단 바 글자색을 다시 고른다 */
      img.alt = '첫 화면 3장 공간 사진 ' + (i + 1);
      setTimeout(function () { top.remove(); busy = false; }, 80);
    }, FADE);
  }
  function start() { if (!timer) timer = setInterval(next, EVERY); }
  function stop() { clearInterval(timer); timer = null; }

  var seen = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { seen = es[0].isIntersecting; seen ? start() : stop(); }, { threshold: 0.3 }).observe(fig);
  } else start();
  document.addEventListener('visibilitychange', function () { (document.hidden || !seen) ? stop() : start(); });
})();
