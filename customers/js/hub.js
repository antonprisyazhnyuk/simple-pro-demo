/* Simple PRO — хаб «Покупателю» · механика шаблона.
   Один файл на все девять разделов: страница отличается только контентом,
   поведение у неё общее.

   §1 Лента разделов на мобе — подскролл активного пункта в видимую зону.
   §2 Расчёт срока доставки — живой контент раздела /customers/delivery/.
   ============================================================ */

(function () {
  "use strict";

  /* ── §1 ЛЕНТА: активный пункт в видимую зону ───────────────────────────────
     Лента живёт ВНИЗУ экрана, липкой, вплотную над моб-баром (слово Антона 04.08
     18:14) — раскладку держит css/mobile.css, здесь только подскролл.
     С девятью пунктами человек, открывший «Столешницы», иначе видит ленту с
     начала и не понимает, где он. Скроллим ТОЛЬКО саму ленту (scrollLeft), а не
     через scrollIntoView: тот тянет за собой и вертикальный скролл страницы —
     на длинных разделах это швыряет человека вниз при загрузке.
     Порог 720 читаем матчмедиа, а не шириной: он обязан совпадать с моб-сводом. */
  var rail = document.querySelector(".hub-nav");
  var active = rail && rail.querySelector(".hub-nav-item.is-active");
  var mobile = window.matchMedia("(max-width: 45rem)");

  function centerActive() {
    if (!rail || !active || !mobile.matches) return;
    var railBox = rail.getBoundingClientRect();
    var itemBox = active.getBoundingClientRect();
    // цель: активный пункт по центру ленты, но не левее нуля
    var target = rail.scrollLeft + (itemBox.left - railBox.left)
               - (railBox.width - itemBox.width) / 2;
    rail.scrollLeft = Math.max(0, target);
  }

  centerActive();
  // шрифты доезжают позже разметки и меняют ширины пунктов — пересчитываем
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(centerActive);
  mobile.addEventListener("change", centerActive);

  /* ── §2 РАСЧЁТ СРОКА ДОСТАВКИ ─────────────────────────────────────────────
     Живой контент раздела: выпадающий список городов, у каждого свой срок в днях.
     Данные лежат в разметке (data-days у <option>) — второго источника правды не
     заводим. Форма ничего не отправляет: это калькулятор, а не заявка. */
  var pick = document.querySelector("[data-delivery-city]");
  var out = document.querySelector("[data-delivery-out]");
  if (pick && out) {
    var blank = out.textContent;
    pick.addEventListener("change", function () {
      var opt = pick.options[pick.selectedIndex];
      var days = opt && opt.getAttribute("data-days");
      if (!days) { out.textContent = blank; return; }
      var n = parseInt(days, 10);
      // 1 день · 2–4 дня · 5–20 дней · 21 день · 22–24 дня …
      var t10 = n % 10, t100 = n % 100;
      var word = (t10 === 1 && t100 !== 11) ? "день"
               : (t10 >= 2 && t10 <= 4 && (t100 < 12 || t100 > 14)) ? "дня"
               : "дней";
      out.textContent = n + " " + word;
    });
  }
})();
