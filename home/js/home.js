/* ============================================================
   Simple PRO — главная · интерактив демо (образцы: js/app.js карточки)
   ============================================================ */
(function () {
  "use strict";
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- 1. Хедер: живёт в модуле code/nav/ (nav.js) ----------
     Прежний обработчик full → short СНЯТ вместе со встроенным .site-header:
     сворачивание, подложку и моб-манифестацию ведёт nav.js. Оставленный код
     падал бы на первом же кадре — #siteHeader в разметке больше нет. */

  /* ---------- 2. Кнопки «копировать» (телефон / email) ---------- */
  $$("[data-copy]").forEach(btn => {
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

  /* ---------- 3. Видео: постер → RuTube iframe ---------- */
  $$(".video-poster").forEach(poster => {
    poster.addEventListener("click", () => {
      const src = poster.dataset.embed + (poster.dataset.embed.includes("?") ? "&" : "?") + "autoplay=1";
      const f = document.createElement("iframe");
      f.src = src; f.allow = "autoplay; fullscreen"; f.setAttribute("allowfullscreen", "");
      poster.replaceWith(f);
    });
  });

  /* ---------- 4. Табы (отрасли клиентов / категории популярных) — визуальный active ---------- */
  [".industry-tabs .industry-tab", ".popular-tabs .ptab"].forEach(sel => {
    const tabs = $$(sel);
    tabs.forEach(tab => tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.toggle("is-active", t === tab));
    }));
  });

  /* ---------- 5. УТП: красный градиент вотермарки следует за курсором ---------- */
  const utp = $("#utpBlock"), wm = $("#utpWatermark");
  if (utp && wm) {
    utp.addEventListener("mousemove", e => {
      const r = wm.getBoundingClientRect();
      wm.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      wm.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  }

  /* ---------- 6. «Показать еще» каталога — рыба-кнопка (донор: скрытых карточек нет) ---------- */
  $(".show-more")?.addEventListener("click", function () { this.blur(); });

  /* ---------- 7. Карточки категорий: живая мебель + меню модификаций ----------
     Смена кадра мебели — ЧИСТО CSS (:hover карточки, см. home.css). Здесь только то,
     чего CSS не умеет: открытие меню строго от КНОПКИ (а не от карточки), удержание
     меню открытым, пока курсор идёт к чипам, и тап вместо ховера на тач-девайсах. */
  const catGrid = $(".cat-grid");
  if (catGrid) {
    /* ПРОГРЕВ hov-кадров. Кадры «ожившей» мебели помечены loading="lazy", чтобы не
       тянуть 14 картинок при первой отрисовке. Но проявляться на глазах они не должны:
       как только курсор ВПЕРВЫЕ зашёл в сетку (то есть на первую же карточку) —
       догружаем ВСЕ hov-кадры сразу, чтобы к соседним карточкам они были уже в кэше.
       Дублируем srcset/sizes в отдельный Image, чтобы браузер выбрал ТОТ ЖЕ кандидат. */
    let warmed = false;
    const warmHovFrames = () => {
      if (warmed) return;
      warmed = true;
      $$(".cat-frame--hov", catGrid).forEach(img => {
        const pre = new Image();
        pre.sizes = img.sizes;
        pre.srcset = img.srcset;
        pre.src = img.src;
      });
    };
    catGrid.addEventListener("pointerover", warmHovFrames, { once: true });
    /* Страховка на случай, если до сетки курсором так и не дошли (тач, клавиатура):
       догреваем в простое, уже после основной загрузки страницы. */
    if (window.requestIdleCallback) window.requestIdleCallback(warmHovFrames, { timeout: 3000 });
    else window.setTimeout(warmHovFrames, 3000);

    const cards = $$(".cat-card--live", catGrid);

    /* РАСКЛАДКА НАБОРА: один столбец или два. CSS сам не видит «содержимое выше
       коробки», поэтому замер тут, а раскладку по флагу data-cols делает home.css.

       Порядок именно такой:
         1. снимаем флаг и меряем ЧЕСТНО одним столбцом — в этом состоянии список
            растянут на всю свободную высоту, и его нижняя кромка И ЕСТЬ та, за
            которую нельзя вылезать (запоминаем как floor);
         2. влезло — оставляем столбик, больше ничего не нужно;
         3. не влезло — включаем два столбца и сверяем с ТОЙ ЖЕ кромкой (в этом
            режиме коробка уже по содержимому, мерить её саму бессмысленно);
         4. не влезло и в два — честно возвращаем столбик со скроллом.

       ⚠ Мерим ГЕОМЕТРИЕЙ последнего чипа, а не парой scrollHeight/clientHeight:
       обе эти величины ЦЕЛЫЕ (одна округлена вверх, другая вниз), и на границе
       они врут в разные стороны. Живой случай: набор «Мойки» на 375 — коробка
       288.1, содержимое 289 «целыми», и допуск в 1 px пропускал набор как
       влезший, хотя нижний чип реально срезан. Кромка чипа против кромки
       коробки — величина дробная и врать не умеет.
       Пересчитываем на открытии меню и при смене ширины окна. */
    const layoutChips = list => {
      if (!list) return;
      list.removeAttribute("data-cols");
      const floor = list.getBoundingClientRect().bottom;
      const spills = () => {
        const last = list.lastElementChild;
        return !!last && last.getBoundingClientRect().bottom - floor > 0.5;
      };
      if (!spills()) return;
      list.dataset.cols = "2";
      if (spills()) list.removeAttribute("data-cols");
    };
    const markAll = () => $$(".cat-menu-list", catGrid).forEach(layoutChips);
    markAll();
    window.addEventListener("resize", markAll);
    const closeAll = except => cards.forEach(c => {
      if (c === except) return;
      c.dataset.menu = "closed";
      c.querySelector("[data-cat-toggle]")?.setAttribute("aria-expanded", "false");
    });

    cards.forEach(card => {
      const btn = card.querySelector("[data-cat-toggle]");
      if (!btn) return;

      const setMenu = open => {
        card.dataset.menu = open ? "open" : "closed";
        btn.setAttribute("aria-expanded", String(open));
        if (open) { closeAll(card); layoutChips(card.querySelector(".cat-menu-list")); }
      };

      /* Мышь или палец решаем по САМОМУ СОБЫТИЮ (pointerType), а не по media-query:
         гибриды (ноут с тачскрином) отвечают «hover: hover» и на тапе вели бы себя
         как мышь — меню открывалось бы и тут же закрывалось. */
      let lastPointer = "mouse";
      btn.addEventListener("pointerdown", e => { lastPointer = e.pointerType || "mouse"; });

      /* Мышь: меню открывает ТОЛЬКО кнопка (ховер карточки чипы не раскрывает)... */
      btn.addEventListener("pointerenter", e => {
        if ((e.pointerType || "mouse") === "mouse") setMenu(true);
      });
      /* ...а закрывает уход курсора с ВСЕЙ карточки, а не с кнопки: иначе меню
         схлопывалось бы ровно в тот момент, когда курсор идёт к чипам. */
      card.addEventListener("pointerleave", e => {
        if ((e.pointerType || "mouse") === "mouse") setMenu(false);
      });

      /* Клавиатура: фокус на кнопке = тот же ховер. Проверка :focus-visible здесь
         обязательна — тап тоже даёт фокус, и без неё пара «фокус открыл → клик
         переключил обратно» гасила бы меню на первом же тапе. */
      btn.addEventListener("focus", () => {
        if (btn.matches(":focus-visible")) setMenu(true);
      });
      card.addEventListener("focusout", e => {
        if (!card.contains(e.relatedTarget)) setMenu(false);
      });

      /* Тач: ховера нет — меню раскрывается ТАПОМ по кнопке, повторный тап закрывает. */
      btn.addEventListener("click", e => {
        if (lastPointer === "mouse") return;
        e.preventDefault();
        setMenu(card.dataset.menu !== "open");
      });
    });

    /* Тач: тап мимо карточки закрывает открытое меню. */
    document.addEventListener("click", e => {
      if (!e.target.closest(".cat-card--live")) closeAll(null);
    });
  }
})();
