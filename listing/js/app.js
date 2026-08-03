/* ============================================================
   Simple PRO — листинг · интерактив страницы (идиомы карточки app.js)
   Хедер и футер сюда НЕ входят: ими правят модули ../nav/nav.js и ../footer/footer.js.
   ============================================================ */
(function () {
  "use strict";
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- 1. Кнопки «копировать» (канон карточки: класс .copied,
                  визуал галки — components.css) ---------- */
  $$(".copy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy || "";
      try { await navigator.clipboard.writeText(text); } catch (e) {
        const t = document.createElement("textarea"); t.value = text;
        document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); } catch (_) {}
        t.remove();
      }
      btn.classList.add("copied");
      setTimeout(() => btn.classList.remove("copied"), 1200);
    });
  });

  /* ---------- 2. Табы «Модели вытяжных шкафов» ---------- */
  $$(".mtab").forEach(btn => {
    btn.addEventListener("click", () => {
      /* aria-selected больше НЕ ставим: роли tablist/tab сняты с разметки 31.07 —
         панелей у этих табов нет, и атрибут состояния без роли ничего не значит
         (а с ролью — обещал бы читалке переключение, которого не происходит).
         Активность несёт класс, его и переключаем. */
      $$(".mtab").forEach(b => b.classList.toggle("is-active", b === btn));
    });
  });

  /* ---------- 3. УТП: доты моб-ленты (канон продуктовой app.js §офферы) ----------
     Активная полоска по прогрессу скролла ленты. На деске .utp-scroll — display:contents,
     скролла нет, обработчик просто не срабатывает. */
  const utpScroll = $(".utp-scroll"), utpDots = $("#utpDots");
  if (utpScroll && utpDots) {
    const dots = $$("span", utpDots);
    const last = dots.length - 1;
    utpScroll.addEventListener("scroll", () => {
      const max = utpScroll.scrollWidth - utpScroll.clientWidth;
      const i = max > 0 ? Math.min(last, Math.round((utpScroll.scrollLeft / max) * last)) : 0;
      dots.forEach((s, n) => s.classList.toggle("on", n === i));
    }, { passive: true });
  }

  /* ---------- 4. УТП: красный градиент вотермарки за курсором ---------- */
  const utp = $("#utpBlock"), wm = $("#utpWatermark");
  if (utp && wm) {
    utp.addEventListener("mousemove", e => {
      const r = wm.getBoundingClientRect();
      wm.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      wm.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  }
})();
