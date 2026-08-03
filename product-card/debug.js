/* СЛУЖЕБНАЯ ПЛАШКА ШИРИНЫ — канон, единственная живая копия (см. шапку debug.css).
   С 31.07 это язык общения с клиентом: он смотрит сайт и пишет «на 1280 деск вот тут
   ползёт» — плашка даёт ему число и режим, одинаковые на всех пяти страницах.

   Что показываем: ширину вьюпорта · режим (моб/деск) · масштаб rem-зума, если он включён.

   ⚠ Режим берём у САМОГО БРАУЗЕРА через matchMedia с тем же порогом, что в CSS
   (45rem = 720 при кегле 16), а не сравнением чисел в JS. Так плашка не может разойтись
   с вёрсткой в ту секунду, когда мобильный слой уже включился, а надпись ещё врёт.
   Порог всё равно записан в двух местах (здесь и в mobile.css) — если его двинут,
   двигать надо обе; сторожа на это нет, потому и висит предупреждение. */
(function () {
  var el = document.getElementById("debugVwBadge");
  if (!el) return;
  var mob = window.matchMedia("(max-width: 45rem)");
  function paint() {
    var fs = parseFloat(getComputedStyle(document.documentElement).fontSize);
    var k = fs / 16;                                   // опора канона — 16px
    var zoomed = Math.abs(k - 1) > 0.005;              // зум активен?
    el.textContent = window.innerWidth + "px  ·  " + (mob.matches ? "моб" : "деск")
      + (zoomed ? "  ·  ×" + k.toFixed(2) : "");
    el.classList.toggle("is-zoomed", zoomed);
  }
  paint();
  window.addEventListener("resize", paint);
  /* смена режима бывает и без resize (поворот экрана, зум страницы) — слушаем сам порог */
  if (mob.addEventListener) mob.addEventListener("change", paint);
})();
