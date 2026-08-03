/* ============================================================
   Simple PRO — карточка товара · интерактив демо
   Всё на фейк-данных; «В корзину» и формы — пустышки.
   ============================================================ */
(function () {
  "use strict";
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";

  /* ---------- 1. Переключение хедера по скроллу — СНЯТО 21.07 ----------
     Вело встроенный .site-header (full → short по нижней границе #productHero).
     Хедер стал модулем code/nav/, и состояние ведёт nav.js по НАПРАВЛЕНИЮ скролла
     (is-pinned / is-collapsed) — другая механика, второй обработчик здесь только
     спорил бы с ним за один и тот же узел. */

  /* ---------- 1b/1c. Мега-меню категорий и выбор региона — СНЯТЫ 21.07 ----------
     Жили на разметке встроенного хедера (.cat-strip, #regionBtn, #regionMenu),
     которой больше нет. У nav-модуля своё меню (MENU: 7 разделов, 59 пунктов
     с живого сайта — против здешних 7 категорий) и свой регион-чип.
     Один источник правды на каталог. */

  /* ---------- 2. Панель товара: перетекание одной плашки (ответы Антона) ----------
     Рендер уезжает 1:1 со скроллом; плашка ОДНА: её низ прибит к линии vh-24,
     верх поднимается медленнее рендера (параллакс) от vh-297 до 140 — растяжение
     и есть расхлоп (табы открываются ростом). После p=1 сцена ещё прилипает
     (~экран скролла) — пауза на чтение раскрытого состояния. */
  const panels = $(".hero-panels");
  /* #productHero живёт здесь с 21.07: раньше его брала §1 (переключение хедера),
     а §2 пользовалась готовой ссылкой. §1 снята вместе со встроенным хедером —
     объявление переехало к настоящему потребителю. */
  const hero = $("#productHero");
  const mobileMq = matchMedia("(max-width: 720px)");
  /* Единственное ДВИЖЕНИЕ, которое рождает этот скрипт, — плавная прокрутка рельсов
     по стрелкам (§4). CSS-анимации страницы гасит `@media (prefers-reduced-motion: reduce)`
     в blocks.css/block-01, но programmatic scroll живёт в JS, и медиазапрос его не касается —
     спрашиваем сами. Не константа, а вызов: пользователь может переключить настройку
     системы при открытой странице, и следующий клик обязан ехать уже по-новому.
     ⚠ У соседа-донора (product-card/js/app.js) этого guard'а ПОКА нет — расхождение
     сознательное (требование зоны «prefers-reduced-motion уважать во всём, что движется»),
     при сверке файлов не «чинить» его обратно. */
  const reduceMotionMq = matchMedia("(prefers-reduced-motion: reduce)");
  const scrollEase = () => (reduceMotionMq.matches ? "auto" : "smooth");
  let ticking = false;
  const heroFlow = () => {
    ticking = false;
    if (mobileMq.matches) { // моб: панель в потоке (донор 18:7628), сцену не двигаем
      if (panels) { panels.style.top = ""; panels.style.height = ""; }
      hero.classList.add("expanded");
      return;
    }
    const vh = window.innerHeight;
    /* ⚠ REM-ЗУМ (21.07). Эти четыре величины — НЕ пиксели, а доли кегля, и в CSS они
       так и записаны: у .hero-media стоит top: calc(100vh - 18.5625rem) — те же «297».
       Пока кегль был всегда 16, разницы не было. На полосе 768–1230 стоит
       html { font-size: 1.25vw }: CSS-часть сцены сжимается, а константы здесь — нет,
       и панель остаётся десктопной коробкой вокруг уменьшенного содержимого (замер:
       736px высоты при содержимом на ~500). Считаем от ФАКТИЧЕСКОГО кегля. */
    const R = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    /* Финальная посадка панели читается ИЗ CSS (--panel-top-final на .product-hero):
       по макету она текучая — 104@1280 · 112@1440 · 140@1920 (задача №7а), и держать
       её вторым числом здесь значило бы завести второй источник правды. Пробник ставим
       ВНУТРЬ хоста: токен объявлен на .product-hero, а не на :root, и замер в body дал
       бы 0 (та самая оговорка из плана зума). */
    const FINAL_TOP = (() => {
      const host = hero || document.body;
      const pr = document.createElement("div");
      pr.style.cssText = "position:absolute;visibility:hidden;width:var(--panel-top-final)";
      host.appendChild(pr);
      const v = pr.getBoundingClientRect().width;
      pr.remove();
      return v > 0 ? v : 8.75 * R;   /* фолбэк на прежние 140 при кегле 16 */
    })();
    const SCENE_OFF = 18.5625 * R;   /* 297 — тот же отступ, что у .hero-media в CSS */
    const BOTTOM    = 1.5 * R;       /* 24  — низ панели от кромки вьюпорта */
    const EXPAND_AT = FINAL_TOP + 0.3125 * R;   /* финал + 5 при кегле 16 — порог едет ЗА посадкой (№7а) */
    // триггер расхлопа (слово Антона): верх карточки выравнивается с верхом
    // картинки шкафа — дальше карточка едет вверх ВМЕСТЕ с фото до финала.
    const photoTop = vh - window.scrollY + FINAL_TOP;
    const top = Math.max(FINAL_TOP, Math.min(vh - SCENE_OFF, photoTop));
    if (panels) {
      panels.style.top = top + "px";
      panels.style.height = (vh - BOTTOM - top) + "px";
    }
    hero.classList.toggle("expanded", top <= EXPAND_AT);
  };
  const heroExpand = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(heroFlow); }
  };
  window.addEventListener("scroll", heroExpand, { passive: true });
  window.addEventListener("resize", heroExpand);
  heroFlow();

  /* ---------- 2b. Заголовок hero — правило двух строк (решение Антона) ----------
     Заголовок всегда в две строки, кегль не меняется. Длинный переносится сам
     (+ text-wrap: balance в CSS). Короткий, влезший в одну строку, делим пополам
     по словам — но не оставляем одинокое короткое слово на строке. */
  const heroTitle = $(".panel-card .title");
  if (heroTitle) {
    const fullText = heroTitle.textContent.trim();
    const balanceTitle = () => {
      heroTitle.textContent = fullText;               // сброс к цельному тексту перед замером
      heroTitle.style.minHeight = "0";                // снимаем зону 2lh, чтобы измерить реальные строки
      const lh = parseFloat(getComputedStyle(heroTitle).lineHeight) || heroTitle.offsetHeight;
      const oneLine = heroTitle.offsetHeight < lh * 1.5;
      heroTitle.style.minHeight = "";                 // возвращаем зону (CSS min-height: 2lh)
      if (!oneLine) return;                            // длинный уже две строки — балансом займётся CSS
      const words = fullText.split(/\s+/);
      if (words.length < 2) return;
      let acc = 0, split = 1, best = Infinity;
      for (let i = 0; i < words.length - 1; i++) {    // точка деления ближе всего к середине по длине
        acc += words[i].length + 1;
        const diff = Math.abs(acc - fullText.length / 2);
        if (diff < best) { best = diff; split = i + 1; }
      }
      heroTitle.innerHTML = words.slice(0, split).join(" ") + "<br>" + words.slice(split).join(" ");
    };
    balanceTitle();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(balanceTitle);
    window.addEventListener("resize", balanceTitle);
  }

  /* ---------- 3. Галерея: рейка-свопер + 3D в главном квадрате ----------
     Рейка слева управляет главным квадратом: обычная миниатюра подставляет свой кадр,
     нижняя (3D-бейдж) открывает вьювер на весь квадрат. Контент-табы справа независимы. */
  const galleryPhoto = $("#galleryMain > img");
  const viewerBox = $("#viewer3d");
  const open3dBtn = $("#open3d");
  const railThumbs = $$(".gallery-rail .thumb");
  const selectThumb = t => railThumbs.forEach(b => {
    const on = b === t;
    b.classList.toggle("is-selected", on);
    if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
  });
  const show3d = on => {
    if (!viewerBox || !galleryPhoto) return;
    viewerBox.hidden = !on;
    galleryPhoto.style.visibility = on ? "hidden" : "";
    if (on) initViewer();
  };
  railThumbs.forEach(thumb => {
    if (thumb === open3dBtn) return;                          // 3D-бейдж — обработчик ниже
    thumb.addEventListener("click", () => {
      const img = thumb.querySelector("img");
      if (img) galleryPhoto.src = img.currentSrc || img.src;  // кадр миниатюры → в главный квадрат
      show3d(false);
      selectThumb(thumb);
      const d3tab = $('.tab-btn[data-tab="d3"]');             // если открыт таб-подсказка 3D — вернуть «Описание»
      if (d3tab && d3tab.classList.contains("is-active")) $('.tab-btn[data-tab="descr"]').click();
    });
  });
  open3dBtn?.addEventListener("click", () => {                // нижняя миниатюра = 3D на весь квадрат
    hero.classList.add("expanded");
    show3d(true);
    selectThumb(open3dBtn);
  });

  /* ---------- 3d. СВАЙП по кадру (только моб) ----------
     Моб-канон (research/figma-drops/mob-canon/principles.md §4, кадр product-full): фото
     товара — свайп-карусель с точками-индикатором. Точки — та же рейка, переодетая в
     полоски (css/mobile.css §Галерея), листание пальцем живёт здесь. Переключаем НЕ src
     напрямую, а .click() по нужной миниатюре — тем же путём, что тап по точке, иначе
     появился бы второй источник правды на «текущий кадр».
     Порог 40px и сравнение с вертикалью: короткое касание остаётся кликом (лайтбокс),
     вертикальное движение — скроллом страницы. После состоявшегося свайпа клик глушим
     в фазе перехвата, иначе поверх кадра открывался бы лайтбокс. */
  const galleryMain = $("#galleryMain");
  if (galleryMain && railThumbs.length > 1) {
    const photoThumbs = railThumbs.filter(t => t !== open3dBtn);
    let x0 = null, y0 = 0, swiped = false;
    galleryMain.addEventListener("pointerdown", e => {
      if (!mobileMq.matches || e.pointerType === "mouse") return;
      x0 = e.clientX; y0 = e.clientY; swiped = false;
    });
    galleryMain.addEventListener("pointerup", e => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;   // не свайп — оставляем клик/скролл
      swiped = true;
      const cur = photoThumbs.findIndex(t => t.classList.contains("is-selected"));
      const step = dx < 0 ? 1 : -1;                                    // влево — следующий кадр
      const next = photoThumbs[((cur < 0 ? 0 : cur) + step + photoThumbs.length) % photoThumbs.length];
      next && next.click();
    });
    galleryMain.addEventListener("click", e => {
      if (!swiped) return;
      swiped = false; e.stopPropagation(); e.preventDefault();
    }, true);
  }

  /* ---------- 3b. Контент-табы правой панели (Описание/Размеры/…); таб «3D» дублирует рейку ---------- */
  $$(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.tab;
      $$(".tab-btn").forEach(b => { const on = b === btn; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on); });
      $$(".tab-panel").forEach(p => p.classList.toggle("is-active", p.dataset.panel === id));
      if (id === "d3") { show3d(true); selectThumb(open3dBtn); }  // таб 3D → та же модель в квадрате
    });
  });

  /* ---------- 3c. Квадрат галереи: сторона = min(канон макета, доступная ширина, высота) ----------
     Зона галереи портретная на нормальной высоте (ширина лимитирует) и наоборот на низком
     окне — берём меньшее, кадр остаётся 1:1 на любом ресайзе (px тут — рантайм-раскладка).

     №7д добавил ТРЕТЬЕ ограничение — канон-ширину фото макета. Без него квадрат раздувался
     до всей доступной ширины и на 1920 уходил на +46 сверх макета, забирая ширину у рейки.
     ⚠ Этого ограничения здесь НЕТ НАРОЧНО: оно живёт как `max-width: var(--photo-canon)`
     у .gallery-view, то есть в CSS одной строкой. Читать токен отсюда я пробовал —
     getPropertyValue отдаёт незарезолвленный текст calc(clamp(…)+clamp(…)), parseFloat даёт
     NaN, и кап молча выключался. Второе место для того же числа = второй источник правды,
     а он уже разъезжался при rem-зуме (грабля №7а).

     ⚠ Ширину рейки БОЛЬШЕ НЕ СПРАШИВАЕМ у самой рейки: она теперь flex:1 и её ширина —
     СЛЕДСТВИЕ ширины квадрата. Спросить offsetWidth здесь = замкнуть круг. Вычитаем то,
     что рейке гарантировано, — её min-width, то есть токен миниатюры. */
  const galleryView = $(".gallery-view");
  const galleryBody = galleryView && galleryView.parentElement;
  const railEl = $(".gallery-rail");
  const captionEl = $(".gallery-caption");
  const fitSquare = () => {
    if (!galleryView || !galleryBody) return;
    if (mobileMq.matches) { galleryView.style.width = ""; return; } // моб — раскладку держит CSS
    const bodyCS = getComputedStyle(galleryBody);
    const rowGap = parseFloat(bodyCS.columnGap) || 0;
    const colGap = parseFloat(getComputedStyle(galleryView).rowGap) || 0;
    const railCS = railEl ? getComputedStyle(railEl) : null;
    const railMin = railCS ? parseFloat(railCS.minWidth) || 0 : 0;
    const availW = galleryBody.clientWidth - railMin - rowGap;
    const capH = captionEl ? captionEl.offsetHeight : 0;
    const availH = galleryBody.clientHeight - capH - colGap;
    const side = Math.max(0, Math.floor(Math.min(availW, availH)));
    galleryView.style.width = side + "px";
  };
  window.addEventListener("resize", fitSquare);
  fitSquare();
  requestAnimationFrame(fitSquare); // добор после первичной раскладки/шрифтов

  /* ---------- 3d. ФУЛВЬЮ-КАНОН №14г/№14д: лайтбокс + рейка миниатюр слева ----------
     Эталон 2184:36730. Был «голой картинкой» — теперь слева рейка кликабельных миниатюр
     (включая 3D-слот), в центре крупный кадр, крестик 44 справа-сверху, закрытие по
     Esc/крестику/подложке.

     РЕЙКА СТРОИТСЯ ИЗ РЕЙКИ ПАНЕЛИ, а не дублируется в разметке. Это не экономия строк:
     статичная копия семи миниатюр — второй источник правды, который разъедется при первой
     же смене фотографий (поменяют ассет в панели — фулвью останется со старым и никто
     не заметит). Клонируем узлы и держим соответствие по ИНДЕКСУ, а не по совпадению src:
     ассеты повторяются, по src соответствие неоднозначно.

     3D-СЛОТ — ЖИВОЙ ВЬЮВЕР, решение лида. Узел #viewer3d ПЕРЕЕЗЖАЕТ в лайтбокс и обратно,
     а не копируется: обработчики вращения висят на нём самом и едут вместе с узлом, 15
     кадров уже загружены, а копия завела бы второй источник правды о текущем ракурсе. */
  const lightbox = $("#lightbox"), lightboxImg = $("#lightboxImg"), lightboxClose = $("#lightboxClose");
  const lightboxRail = $("#lightboxRail");
  let lastFocusedEl = null;          // куда вернуть фокус после закрытия
  let viewerHome = null;             // откуда взяли #viewer3d, чтобы вернуть точно на место

  /* вернуть 3D-вьювер в панель (если он гостит в лайтбоксе) */
  const returnViewer = () => {
    if (viewerBox && viewerHome && viewerBox.parentElement === lightbox) {
      viewerHome.appendChild(viewerBox);
      viewerBox.hidden = true;
      viewerHome = null;
    }
  };

  /* показать в центре лайтбокса кадр i-й миниатюры панели (или 3D, если это 3D-слот) */
  const showInLightbox = (i) => {
    const src = railThumbs[i];
    if (!src) return;
    const lbThumbs = lightboxRail ? $$(".thumb", lightboxRail) : [];
    lbThumbs.forEach((t, k) => {
      t.classList.toggle("is-selected", k === i);
      t.setAttribute("aria-current", k === i ? "true" : "false");
    });
    if (src === open3dBtn) {                        // 3D-слот → живой вьювер в центр
      if (viewerBox) {
        if (!viewerHome) viewerHome = viewerBox.parentElement;
        initViewer();                               // кадры догружаются один раз
        lightbox.appendChild(viewerBox);
        viewerBox.hidden = false;
      }
      lightboxImg.hidden = true;
    } else {
      returnViewer();
      lightboxImg.hidden = false;
      const img = $("img", src);
      if (img) { lightboxImg.src = img.currentSrc || img.src; lightboxImg.alt = img.alt || ""; }
    }
    /* зеркалим выбор в панели — закрыв фулвью, пользователь видит тот же кадр, что смотрел */
    selectThumb(src);
    if (src !== open3dBtn) {
      const img = $("img", src);
      if (img && galleryPhoto) galleryPhoto.src = img.currentSrc || img.src;
      show3d(false);
    } else {
      show3d(true);
    }
  };

  /* рейка фулвью = клоны миниатюр панели; собирается один раз при первом открытии */
  let railBuilt = false;
  const buildLightboxRail = () => {
    if (railBuilt || !lightboxRail) return;
    railBuilt = true;
    railThumbs.forEach((src, i) => {
      const copy = src.cloneNode(true);
      copy.removeAttribute("id");                   // id уникален — у клона его быть не должно
      copy.classList.remove("is-selected");
      copy.addEventListener("click", () => showInLightbox(i));
      lightboxRail.appendChild(copy);
    });
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    returnViewer();
    lightboxImg.hidden = false;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    lastFocusedEl?.focus();                         // фокус обратно на то, откуда открывали
    lastFocusedEl = null;
  };
  const openLightbox = () => {
    if (!lightbox || !galleryPhoto) return;
    lastFocusedEl = document.activeElement;
    buildLightboxRail();
    const cur = railThumbs.findIndex(t => t.classList.contains("is-selected"));
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    showInLightbox(cur >= 0 ? cur : 0);
    lightboxClose.focus();
  };
  galleryPhoto && galleryPhoto.addEventListener("click", openLightbox); // в 3D фото visibility:hidden — клик уходит на вьювер
  lightboxClose && lightboxClose.addEventListener("click", closeLightbox);
  /* закрытие по подложке: только САМ .lightbox. Рейка и вьювер — свои target'ы,
     клик по ним (в том числе по пустому месту gap'а рейки) сюда не долетает. */
  lightbox && lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox(); });

  /* ---------- 3e. Кейсы (блоки 10/12): миниатюра → в большую картинку ----------
     Механика галереи блока 2, перенесённая на слоёные кадры: клик по миниатюре
     копирует её слои в большой кадр, активная подсвечена. Один хендлер на все
     .case-slide — покрывает «Дизайн лабораторий» и «Примеры проектов» (близнецы).
     Столбец миниатюр прокручивается вертикально (CSS overflow-y) — до 6 при видимых ~3. */
  $$(".case-slide").forEach(slide => {
    const big = $(".slide-photo", slide);
    const thumbs = $$(".slide-thumbs .thumb", slide);
    if (!big || thumbs.length < 2) return;
    const select = t => {
      big.innerHTML = t.innerHTML;                         // слои миниатюры → в большой кадр
      thumbs.forEach(b => b.classList.toggle("is-active", b === t));
    };
    thumbs.forEach(t => {
      t.tabIndex = 0;
      t.setAttribute("role", "button");
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(t); }
      });
    });
  });

  /* ---------- 4. Кнопки «копировать адрес» ---------- */
  $$(".copy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy || "";
      try { await navigator.clipboard.writeText(text); } catch (e) { /* file:// fallback */
        const t = document.createElement("textarea"); t.value = text;
        document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); } catch (_) {}
        t.remove();
      }
      /* Канон Антона 21.07: галка держится «пару секунд» и возвращается в копи-иконку.
         Было 1200 — при живом клике это читается как мигание, а не как «зачтено». */
      btn.classList.add("copied");
      setTimeout(() => btn.classList.remove("copied"), 2000);
    });
  });

  /* ---------- 5. Стрелки-навигация горизонтальных лент ---------- */
  $$("[data-scroll]").forEach(nav => {
    /* data-scroll может нести несколько id (десктоп-полоса + моб-ряд) — рулим видимой */
    const targets = nav.dataset.scroll.split(/\s+/).map(id => $("#" + id)).filter(Boolean);
    const pick = () => targets.find(t => t.offsetParent !== null) || targets[0];

    /* №14а — ЛИСТАНИЕ РОВНО НА ОДНУ КАРТОЧКУ. Было max(280, ширина×0.7): расстояние,
       не имеющее отношения к карточкам. На рельсе блока 4 карточки РАЗНОЙ ширины
       (756/288/912/756/1692), поэтому «одна карточка» — это не число, а СЛЕДУЮЩАЯ КРОМКА:
       едем к ближайшей границе карточки в сторону нажатия. Отсюда же сам собой получается
       канон «текущая целиком + следующая чуть обрезана правым краем» и уходит баг
       «слева торчат огрызки предыдущей» — кромка всегда встаёт на левый край рельса.

       Кромки считаем от ЖИВОЙ геометрии (rect против rect + scrollLeft), а не через
       offsetLeft: offsetLeft отсчитывается от offsetParent, а у этих рельсов он разный
       (у одного — секция, у другого — позиционированная обёртка), и числа молча разъезжались.

       Один обработчик на ЧЕТЫРЁХ рельсах: преимущества · сравнительная таблица ·
       «Дизайн лабораторий» · «Примеры наших работ». Меняешь тут — проверяй все четыре. */
    /* ⚠ ЧТО СЧИТАТЬ «КАРТОЧКОЙ» — у таблицы это НЕ дети рельса. У трёх рельсов дети и есть
       карточки, а у сравнительной таблицы ребёнок ОДИН — сам <table>: кромок получалось ноль,
       и стрелка никуда не ехала (verify-14a краснел «сдвинулись на кромку #0, ждём #1»).
       Для таблицы шаг — КОЛОНКА, то есть ячейки первой строки. Отсюда развилка по содержимому,
       а не по id: рельс, у которого единственный ребёнок — таблица, меряется по ячейкам. */
    const stepItems = (t) => {
      const kids = [...t.children];
      if (kids.length === 1 && kids[0].tagName === "TABLE") {
        const row = kids[0].querySelector("tr");
        if (!row) return kids;
        /* ⚠ ПРИБИТУЮ КОЛОНКУ ИЗ ШАГА ВЫКИДЫВАЕМ. Она position: sticky и при прокрутке
           стоит на месте — её левый край всегда совпадает с краем рельса. Оставь её в списке,
           и «ближайшая кромка» вечно будет её собственной: рельс упирается в кромку #0
           и не двигается вовсе. Именно так verify-14a краснел и ПОСЛЕ перехода на ячейки. */
        return [...row.children].filter(c => getComputedStyle(c).position !== "sticky");
      }
      return kids;
    };
    const edges = (t) => {
      const base = t.getBoundingClientRect().left - t.scrollLeft;
      return stepItems(t)
        .filter(k => k.getBoundingClientRect().width > 0)
        .map(k => Math.round(k.getBoundingClientRect().left - base));
    };
    const stepOnce = (dir) => {
      const t = pick();
      const cur = t.scrollLeft;
      const max = t.scrollWidth - t.clientWidth;
      if (max <= 0) return;                       // листать нечего (таблица на 1920 влезает целиком)
      /* ⚠ SCROLL-PADDING ОБЯЗАН ВЫЧИТАТЬСЯ. У рельсов стоит scroll-snap + scroll-padding-inline
         (= поле секции). Кромка карточки и позиция скролла, при которой карточка встаёт
         к полю, — РАЗНЫЕ числа, они отличаются ровно на этот паддинг. Первая редакция
         целилась прямо в кромку (36 у блока 4), snap считал ближайшей точкой 0 и утягивал
         ленту обратно: клик «не работал» на двух рельсах из четырёх, хотя код выполнялся. */
      const pad = parseFloat(getComputedStyle(t).scrollPaddingLeft) || 0;
      const stops = edges(t).map(e => e - pad);
      /* ФОЛБЭК ДЛЯ РЕЛЬСОВ БЕЗ КАРТОЧЕК. У сравнительной таблицы прокручиваемый узел —
         ОДИН ребёнок (сама таблица), кромок карточек там нет вовсе и «одна карточка»
         как единица не определена. Для таких рельсов оставляем прежний шаг долей
         видимой ширины — это не деградация, а единственная осмысленная мера для таблицы.
         Условие по числу СТОПОВ, а не по id: появится ещё один такой рельс — сработает само. */
      if (stops.length < 2) {
        t.scrollBy({ left: dir * Math.max(280, t.clientWidth * 0.7), behavior: scrollEase() });
        return;
      }
      /* допуск 2px: дробные кромки после клампов иначе «залипают» на текущей карточке */
      const target = dir > 0 ? stops.find(e => e > cur + 2)
                             : [...stops].reverse().find(e => e < cur - 2);
      /* №14б — БЕСКОНЕЧНЫЙ ЦИКЛ (решение лида). Кромки впереди нет — значит стоим
         на последней: вправо уводим к первой, влево — к последней. При двух карточках
         это само даёт 1→2→1, отдельного случая не нужно.
         ⚠ Упор в max НЕ равен «последней карточке»: у полос с обрезанной последней
         карточкой max меньше её кромки, поэтому цикл считаем по ОТСУТСТВИЮ кромки,
         а не по достижению max — иначе последняя карточка проскакивалась бы. */
      const wrap = dir > 0 ? 0 : Math.min(stops[stops.length - 1], max);
      let to = target == null ? wrap : Math.min(Math.max(target, 0), max);
      /* ⚠ Кромка впереди ЕСТЬ, а ехать всё равно некуда: у полос, где последняя карточка
         шире остатка, её стоп больше max, кламп возвращает текущую позицию, и лента
         молча стояла бы на месте вместо цикла. Считаем «упёрлись» по ФАКТУ несдвига,
         а не по наличию кромки. */
      if (dir > 0 && to <= cur + 2) to = 0;
      if (dir < 0 && to >= cur - 2) to = Math.min(stops[stops.length - 1], max);
      t.scrollTo({ left: to, behavior: scrollEase() });
    };
    /* Стрелки — статичная разметка внутри nav, поэтому выбираем их ОДИН раз.
       Прежде querySelectorAll(".arrow-btn") стоял и здесь, и внутри sync, а sync
       висит на scroll (passive) и resize — то есть DOM опрашивался на каждый кадр
       прокрутки. Порядок [prev, next] тот же, что давала повторная выборка. */
    const arrows = [...nav.querySelectorAll(".arrow-btn")];
    arrows.forEach(b => {
      b.addEventListener("click", () => stepOnce(+b.dataset.dir));
    });
    const sync = () => {
      const t = pick();
      const [prev, next] = arrows;
      /* ЦИКЛИЧНЫЙ РЕЛЬС СТРЕЛКИ НЕ ГАСИТ. Гашение на концах и цикл — взаимоисключающие
         вещи: с №14б «конца» у карточных лент больше нет, и серая стрелка врала бы,
         что дальше некуда. Для НЕциклического рельса (таблица — один ребёнок, кромок
         карточек нет) прежнее гашение остаётся: там конец настоящий. */
      const cyclic = edges(t).length >= 2 && t.scrollWidth - t.clientWidth > 0;
      if (cyclic) { prev.disabled = false; next.disabled = false; return; }
      prev.disabled = t.scrollLeft < 8;
      next.disabled = t.scrollLeft + t.clientWidth > t.scrollWidth - 8;
    };
    targets.forEach(t => t.addEventListener("scroll", sync, { passive: true }));
    window.addEventListener("resize", sync);
    /* ⚠ СОДЕРЖИМОЕ РЕЛЬСА МОЖЕТ ПОЯВИТЬСЯ ПОЗЖЕ ЭТОГО КОДА. Сравнительная таблица строится
       здесь же, в app.js, — когда sync() отрабатывал первый раз, рельс был ещё пуст:
       scrollWidth == clientWidth, и ОБЕ стрелки честно вставали в disabled. Дальше их никто
       не пересчитывал, и таблица не листалась вовсе — verify-14a краснел «сдвинулись на
       кромку #0», хотя кромки были верные, а клик просто не доходил до мёртвой кнопки.
       ResizeObserver снимает это для ВСЕХ рельсов разом, включая те, что наполнятся потом. */
    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(sync);
      targets.forEach(t => ro.observe(t));
    }
    sync();
  });

  /* моб-доты оффер-ряда (донор 18:7148): активная полоска по прогрессу скролла */
  const offerGrid = $(".offer-grid"), offerDots = $("#offerDots");
  if (offerGrid && offerDots) offerGrid.addEventListener("scroll", () => {
    const max = offerGrid.scrollWidth - offerGrid.clientWidth;
    const i = max > 0 ? Math.min(2, Math.round(offerGrid.scrollLeft / max * 2)) : 0;
    offerDots.querySelectorAll("span").forEach((s, n) => s.classList.toggle("on", n === i));
  }, { passive: true });

  /* ---------- 5b. Горизонтальный скролл лент колесом/тачпадом ----------
     Только узкие ленты (преимущества, линейка). Широкую видео-ленту не трогаем —
     иначе вертикальный скролл страницы «залипает» над ней (reviewer 09.07). */
  $$(".adv-strip, .model-row, .case-strip").forEach(strip => {
    let snapRestore;
    strip.addEventListener("wheel", e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // уже горизонтальный жест — не вмешиваемся
      const max = strip.scrollWidth - strip.clientWidth;
      if (max <= 0) return;                                  // нечего мотать — страница скроллится
      const target = Math.max(0, Math.min(max, strip.scrollLeft + e.deltaY));
      if (Math.abs(target - strip.scrollLeft) < 1) return;   // лента на краю в эту сторону — отдаём скролл странице
      /* снап на время проводки колесом гасим: иначе мелкий тик снапится обратно к карточке
         и лента залипает на месте, забирая вертикальный скролл страницы (см. reviewer 09.07) */
      e.preventDefault();
      strip.style.scrollSnapType = "none";
      strip.scrollLeft = target;
      clearTimeout(snapRestore);
      snapRestore = setTimeout(() => { strip.style.scrollSnapType = ""; }, 180); // вернуть доводку до карточки после остановки
    }, { passive: false });
  });

  /* ---------- 5c. Полоса-скроллбар преимуществ (у линейки полосы нет — вердикт Антона 10.07) ---------- */
  [["#advStrip", "#advProgressFill"]].forEach(([stripSel, fillSel]) => {
    const strip = $(stripSel), fill = $(fillSel);
    if (!strip || !fill) return;
    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth;
      const ratio = max > 0 ? strip.scrollLeft / max : 0;
      const visible = Math.min(100, (strip.clientWidth / strip.scrollWidth) * 100);
      fill.style.width = visible + "%";
      fill.style.left = (ratio * (100 - visible)) + "%";
    };
    strip.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    /* полоса = рабочий скроллбар (вердикт Антона 10.07): клик и драг мотают ленту */
    const bar = fill.parentElement;
    const toScroll = e => {
      const r = bar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      strip.scrollLeft = ratio * (strip.scrollWidth - strip.clientWidth);
    };
    bar.addEventListener("pointerdown", e => {
      e.preventDefault(); toScroll(e);
      const move = ev => toScroll(ev);
      const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  });

  /* ---------- 6. Видео: постер → RuTube iframe ---------- */
  $$(".video-poster").forEach(poster => {
    poster.addEventListener("click", () => {
      const src = poster.dataset.embed + (poster.dataset.embed.includes("?") ? "&" : "?") + "autoplay=1";
      const f = document.createElement("iframe");
      f.src = src; f.allow = "autoplay; fullscreen"; f.setAttribute("allowfullscreen", "");
      poster.replaceWith(f);
    });
  });

  /* ---------- 7. УТП: красный градиент следует за курсором ---------- */
  const utp = $("#utpBlock"), wm = $("#utpWatermark");
  if (utp && wm) {
    const track = e => {
      const r = wm.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      wm.style.setProperty("--mx", x + "%");
      wm.style.setProperty("--my", y + "%");
    };
    utp.addEventListener("mousemove", track);
  }

  /* ---------- 8. 3D-вьювер: поворот по движению курсора над областью ----------
     Как на живом сайте: позиция курсора по X внутри вьювера выбирает кадр
     последовательности (левый край → первый ракурс, правый → последний). */
  let viewerReady = false;
  function initViewer() {
    if (viewerReady) return;
    viewerReady = true;
    const box = $("#viewer3d");
    if (!box) return;
    const total = +box.dataset.frames;
    for (let i = 1; i <= total; i++) {
      const img = new Image();
      /* ПРАВКА 22.07 (живые данные): путь к кадрам переехал с донорских assets/3d/100NN.jpg
         на живые img/360/360-frame-NN.webp. Нумерация живых кадров 01…15 — тот же цикл 1..15,
         сдвига нет, data-frames="15" в разметке менять не потребовалось.
         ⚠ Расширение тут СОБРАНО ШАБЛОНОМ, а не написано целиком: автоматическая перешивка
         ссылок под webp (to-webp.py) ищет полное имя файла и такую строку НЕ НАХОДИТ.
         Меняешь формат кадров 360° — правь эту строку РУКАМИ (22.07: пережим в webp). */
      img.src = `img/360/360-frame-${String(i).padStart(2, "0")}.webp`;
      img.alt = "";
      if (i === 1) img.classList.add("is-shown");
      box.appendChild(img);
    }
    const frames = () => $$("#viewer3d img");
    let cur = 0;
    const show = i => {
      i = (i % total + total) % total;
      if (i === cur) return;
      cur = i;
      frames().forEach((im, k) => im.classList.toggle("is-shown", k === cur));
    };
    const atX = clientX => {
      const r = box.getBoundingClientRect();
      const ratio = Math.min(0.9999, Math.max(0, (clientX - r.left) / r.width));
      box.classList.add("touched");
      show(Math.floor(ratio * total));
    };
    box.addEventListener("mousemove", e => atX(e.clientX));
    box.addEventListener("touchmove", e => atX(e.touches[0].clientX), { passive: true });
  }

  /* ============================================================
     9. КОНСТРУКТОР — ЖИВЫЕ ДАННЫЕ ОСТРОВНОГО СТОЛА (22.07)
     Структура и лейаут — донор 18:9611, все числа и имена — живая карточка
     https://simple-pro.com/catalog/stoly_laboratornye/stol_ostrovnoy/
     (снимок: research/live-stol/{data.md, data.json, constructor/options.md})
     ============================================================ */
  /* ⚠ ЦЕНЫ ТОЛЬКО ЛИТЕРАЛОМ, формулы больше нет. Донорская математика
     (BASE_PRICE + matPremium) × widthMul — рыба, и на живых числах она ВРЁТ:
     75 210 × 1.16 = 87 244, а живая цена ЛК-1200 CPL = 89 370. Наценки материала и ширины
     у Simple PRO не мультипликативны, свести их к коэффициентам нельзя — только таблица. */
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* Семплы — живые иконки 60×60 из офферс-таблицы сайта (донорские *-overlay.png не нужны:
     у донора семпл был композитом база+слой, живой ассет самодостаточен).
     descr — дословные описания материалов с сайта, уезжают в тултип «?» (title). */
  const MATERIALS = [
    { name: "CPL",      swatch: "material-swatch-cpl.webp",
      descr: "Представляет собой композитный пластик высокого давления толщиной 0,5 мм, наклеенный на влагостойкую ламинированную ДСП, торцы которой для повышения влагостойкости и износостойкости обработаны пластиковой кромкой толщиной 2 мм. Стоек к воздействию органических растворителей, разбавленных кислот и щелочей. Выдерживает воздействие температур до 140 град. С, обладает хорошей износостойкостью." },
    { name: "Керамика", swatch: "material-swatch-keramika.webp",
      descr: "Устойчив к воздействию высоких температур и влажности. Не изменяет структуру при воздействии большинства кислот и щелочей. Используемый керамогранит представляет собой плитку габаритами 300х300 мм, которая наклеена на фанеру. Для заполнения швов используется специальная химически стойкая мастика на основе эпоксидных смол. По заказу к столешнице можно добавить противопроливочные бортики." },
    { name: "GranTec",  swatch: "material-swatch-grantec.webp",
      descr: "Устойчив к воздействию высоких температур и влажности. Не изменяет структуру при воздействии большинства кислот и щелочей. Представляет собой монолитную керамогранитную плиту без швов, наклеенную на фанеру. По заказу к столешнице можно добавить противопроливочный бортик." },
    { name: "Lab HPL",  swatch: "material-swatch-lab-hpl.webp",
      descr: "Монолитный химически-стойкий пластик сверхвысокого прессования. Обладает высокой ударопрочностью, влагостойкостью, износостойкостью; обладает высокими антибактериальными свойствами. Устойчив к воздействию температур до 135 град. С, допускает незначительное по длительности воздействие более высоких температур. Проявляет высокую стойкость при длительном воздействии практически всех концентрированных кислот и щелочей. По заказу к столешнице можно добавить противопроливочные бортики." },
  ];
  /* Донор держал 6 ширин и 5 материалов (30 ячеек) — у островного стола 4×4 = 16.
     «Нерж. сталь» в списке материалов островного стола НЕТ (есть у других типов столов —
     видно в сравнительной таблице ниже), ширин 2100/2400 нет тоже. */
  const WIDTHS = [900, 1200, 1500, 1800];
  const WIDTH_PHOTO = {
    900:  "stol-ostrovnoy-width-900.webp",
    1200: "stol-ostrovnoy-width-1200.webp",
    1500: "stol-ostrovnoy-width-1500.webp",
    1800: "stol-ostrovnoy-width-1800.webp",
  };
  const PRICE = {                                            // руб. с НДС, базовая комплектация
    "CPL":      { 900:  75210, 1200:  89370, 1500: 108380, 1800: 124220 },
    "Керамика": { 900:  81200, 1200: 102950, 1500: 120330, 1800: 136800 },
    "GranTec":  { 900: 101900, 1200: 122440, 1500: 150730, 1800: 175600 },
    "Lab HPL":  { 900: 108040, 1200: 130140, 1500: 161980, 1800: 187180 },
  };

  /* дефолт = минимум матрицы 75 210 ₽ (CPL / 900), он же «от» первого экрана и ячейка
     «Цена от» нашей колонки в сравнительной таблице — три места держат ОДНО число */
  const state = { material: "CPL", width: 900, cabinets: {}, sinks: {}, sets: 1 };

  // Шаг 1: сетка «материалы слева × 4 колонки ширин»; подписей ширин под фото в доноре НЕТ,
  // угловая ячейка пустая (в ней ссылка «Сравнить…» по донору), цены — литералы матрицы PRICE.
  // ⚠ Число колонок продублировано в CSS (.matrix grid-template-columns, blocks.css + mobile.css):
  //    правишь WIDTHS — правь repeat(N,…) там же, иначе сетка разъедется на пустой трек.
  const matrix = $("#matrix");
  if (matrix) {
    const cells = [];
    // href живой: сравнение материалов столешниц у Simple PRO — отдельная страница
    cells.push(`<div class="mx-link"><a href="https://simple-pro.com/customers/materials/#tab3" target="_blank" rel="noopener" class="compare-link">Сравнить материалы столешницы</a></div>`);
    WIDTHS.forEach(w => cells.push(
      `<div class="mx-photo"><img src="img/${WIDTH_PHOTO[w]}" alt="Стол островной ЛК-${w} СО"></div>`));
    MATERIALS.forEach(m => {
      cells.push(`<div class="mat-row">
        <span class="mat-prev"><img src="img/constructor/${m.swatch}" alt=""></span>
        <span class="mat-name">${m.name}</span>
        <img class="mat-q" src="assets/figma/constructor-icon-tooltip.svg" alt="?" title="${esc(m.name)}. ${esc(m.descr)}">
      </div>`);
      WIDTHS.forEach(w => {
        const price = PRICE[m.name][w];
        const checked = (m.name === state.material && w === state.width) ? "checked" : "";
        cells.push(`<label class="mcell mx-price"><input type="radio" class="radio" name="worktop-matrix" ${checked}
          data-mat="${m.name}" data-w="${w}"><span class="price">${fmt(price)}</span></label>`);
      });
    });
    matrix.innerHTML = cells.join("");
    $$('input[name="worktop-matrix"]').forEach(r => r.addEventListener("change", () => {
      state.material = r.dataset.mat; state.width = +r.dataset.w; recalc();
    }));
  }

  /* Шаг 3 «Размер»: живой каталог тумб — 48 SKU (12 встраиваемых × 2 материала +
     3 подкатных × 2 + 9 подвесных × 2). Донор рисовал 4 одинаковые рыбы «ЛК-900 ТПД-В
     Полипропилен…» по 46 750 ₽ — сняты.
     ⚠ ВСЕ 48 сняты в состоянии «для стола 900 мм»: панель опций живого сайта перегружается
     JS при смене ширины, статичный слепок другого варианта не поймал (report.md п.3).
     Это дыра ДАННЫХ, не вёрстки: выбрав 1500 мм, пользователь увидит тумбы «для стола 900 мм».
     Закрывается вторым заходом на сайт с переключением четырёх ширин.
     Имя в карточке 288 px урезано до модели: хвост «…, для стола 900 мм» дублировал бы
     выбранную ширину, а материал и тип уже выбраны переключателями выше.
     У подвесных нет вариантов «4 ящика» — это факт каталога, а не пропуск
     (сверено со строкой сравнительной таблицы «Ящики подвесные → только h=900»). */
  const CABINETS = [
    { id: "26326", name: "ЛК-400 ТД-В (с дверками)", type: "Встраиваемые", mat: "ЛДСП", price: 9300, img: "lk-400-td-v-s-dverkami-ldsp-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26327", name: "ЛК-400 ТД-В (с дверками)", type: "Встраиваемые", mat: "Сталь", price: 17340, img: "lk-400-td-v-s-dverkami-stal-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26346", name: "ЛК-400 ТД-В (с дверками и ящиком)", type: "Встраиваемые", mat: "ЛДСП", price: 11800, img: "lk-400-td-v-s-dverkami-i-yaschikom-ldsp-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26347", name: "ЛК-400 ТД-В (с дверками и ящиком)", type: "Встраиваемые", mat: "Сталь", price: 20350, img: "lk-400-td-v-s-dverkami-i-yaschikom-stal-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26376", name: "ЛК-400 ТЯ-В (с 3 ящиками)", type: "Встраиваемые", mat: "ЛДСП", price: 15780, img: "lk-400-tya-v-s-3-yaschikami-ldsp-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26377", name: "ЛК-400 ТЯ-В (с 3 ящиками)", type: "Встраиваемые", mat: "Сталь", price: 24760, img: "lk-400-tya-v-s-3-yaschikami-stal-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26386", name: "ЛК-400 ТЯ-В (с 4 ящиками)", type: "Встраиваемые", mat: "ЛДСП", price: 17740, img: "lk-400-tya-v-s-4-yaschikami-ldsp-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26387", name: "ЛК-400 ТЯ-В (с 4 ящиками)", type: "Встраиваемые", mat: "Сталь", price: 26650, img: "lk-400-tya-v-s-4-yaschikami-stal-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26328", name: "ЛК-450 ТД-В (с дверками)", type: "Встраиваемые", mat: "ЛДСП", price: 9510, img: "lk-450-td-v-s-dverkami-ldsp-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26329", name: "ЛК-450 ТД-В (с дверками)", type: "Встраиваемые", mat: "Сталь", price: 17810, img: "lk-450-td-v-s-dverkami-stal-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26348", name: "ЛК-450 ТД-В (с дверками и ящиком)", type: "Встраиваемые", mat: "ЛДСП", price: 12270, img: "lk-450-td-v-s-dverkami-i-yaschikom-ldsp-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26349", name: "ЛК-450 ТД-В (с дверками и ящиком)", type: "Встраиваемые", mat: "Сталь", price: 21180, img: "lk-450-td-v-s-dverkami-i-yaschikom-stal-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26378", name: "ЛК-450 ТЯ-В (с 3 ящиками)", type: "Встраиваемые", mat: "ЛДСП", price: 16330, img: "lk-450-tya-v-s-3-yaschikami-ldsp-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26379", name: "ЛК-450 ТЯ-В (с 3 ящиками)", type: "Встраиваемые", mat: "Сталь", price: 24860, img: "lk-450-tya-v-s-3-yaschikami-stal-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26388", name: "ЛК-450 ТЯ-В (с 4 ящиками)", type: "Встраиваемые", mat: "ЛДСП", price: 18130, img: "lk-450-tya-v-s-4-yaschikami-ldsp-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26389", name: "ЛК-450 ТЯ-В (с 4 ящиками)", type: "Встраиваемые", mat: "Сталь", price: 27760, img: "lk-450-tya-v-s-4-yaschikami-stal-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26334", name: "ЛК-900 ТД-В (с дверками)", type: "Встраиваемые", mat: "ЛДСП", price: 14580, img: "lk-900-td-v-s-dverkami-ldsp-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26335", name: "ЛК-900 ТД-В (с дверками)", type: "Встраиваемые", mat: "Сталь", price: 25140, img: "lk-900-td-v-s-dverkami-stal-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26354", name: "ЛК-900 ТД-В (с дверками и ящиком)", type: "Встраиваемые", mat: "ЛДСП", price: 18160, img: "lk-900-td-v-s-dverkami-i-yaschikom-ldsp-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26355", name: "ЛК-900 ТД-В (с дверками и ящиком)", type: "Встраиваемые", mat: "Сталь", price: 32000, img: "lk-900-td-v-s-dverkami-i-yaschikom-stal-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26384", name: "ЛК-900 ТЯ-В (с 3 ящиками)", type: "Встраиваемые", mat: "ЛДСП", price: 23750, img: "lk-900-tya-v-s-3-yaschikami-ldsp-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26385", name: "ЛК-900 ТЯ-В (с 3 ящиками)", type: "Встраиваемые", mat: "Сталь", price: 36680, img: "lk-900-tya-v-s-3-yaschikami-stal-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26394", name: "ЛК-900 ТЯ-В (с 4 ящиками)", type: "Встраиваемые", mat: "ЛДСП", price: 26370, img: "lk-900-tya-v-s-4-yaschikami-ldsp-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26395", name: "ЛК-900 ТЯ-В (с 4 ящиками)", type: "Встраиваемые", mat: "Сталь", price: 40250, img: "lk-900-tya-v-s-4-yaschikami-stal-vstraivaemaya-dlya-stola-900-mm.webp" },
    { id: "26318", name: "ЛК-400 ТПД-В", type: "Подкатные", mat: "Сталь", price: 18150, img: "lk-400-tpd-v-stal-podkatnaya-dlya-stola-900-mm.webp" },
    { id: "26319", name: "ЛК-400 ТПД-В", type: "Подкатные", mat: "ЛДСП", price: 9520, img: "lk-400-tpd-v-ldsp-podkatnaya-dlya-stola-900-mm.webp" },
    { id: "26320", name: "ЛК-400 ТПЯ-В (3 ящика)", type: "Подкатные", mat: "Сталь", price: 24280, img: "lk-400-tpya-v-3-yaschika-stal-podkatnaya-dlya-stola-900-mm.webp" },
    { id: "26321", name: "ЛК-400 ТПЯ-В (3 ящика)", type: "Подкатные", mat: "ЛДСП", price: 16990, img: "lk-400-tpya-v-3-yaschika-ldsp-podkatnaya-dlya-stola-900-mm.webp" },
    { id: "26316", name: "ЛК-400 ТПЯ-В (4 ящика)", type: "Подкатные", mat: "ЛДСП", price: 19345, img: "lk-400-tpya-v-4-yaschika-ldsp-podkatnaya-dlya-stola-900-mm.webp" },
    { id: "26317", name: "ЛК-400 ТПЯ-В (4 ящика)", type: "Подкатные", mat: "Сталь", price: 27380, img: "lk-400-tpya-v-4-yaschika-stal-podkatnaya-dlya-stola-900-mm.webp" },
    { id: "26396", name: "ЛК-400 ТД (с дверками)", type: "Подвесные", mat: "ЛДСП", price: 8780, img: "lk-400-td-s-dverkami-ldsp-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26397", name: "ЛК-400 ТД (с дверками)", type: "Подвесные", mat: "Сталь", price: 14110, img: "lk-400-td-s-dverkami-stal-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26416", name: "ЛК-400 ТД (с дверками и ящиком)", type: "Подвесные", mat: "ЛДСП", price: 10280, img: "lk-400-td-s-dverkami-i-yaschikom-ldsp-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26417", name: "ЛК-400 ТД (с дверками и ящиком)", type: "Подвесные", mat: "Сталь", price: 17630, img: "lk-400-td-s-dverkami-i-yaschikom-stal-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26426", name: "ЛК-400 ТЯ (с 3 ящиками)", type: "Подвесные", mat: "ЛДСП", price: 13410, img: "lk-400-tya-s-3-yaschikami-ldsp-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26427", name: "ЛК-400 ТЯ (с 3 ящиками)", type: "Подвесные", mat: "Сталь", price: 20850, img: "lk-400-tya-s-3-yaschikami-stal-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26398", name: "ЛК-450 ТД (с дверками)", type: "Подвесные", mat: "ЛДСП", price: 9190, img: "lk-450-td-s-dverkami-ldsp-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26399", name: "ЛК-450 ТД (с дверками)", type: "Подвесные", mat: "Сталь", price: 15570, img: "lk-450-td-s-dverkami-stal-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26418", name: "ЛК-450 ТД (с дверками и ящиком)", type: "Подвесные", mat: "ЛДСП", price: 10630, img: "lk-450-td-s-dverkami-i-yaschikom-ldsp-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26419", name: "ЛК-450 ТД (с дверками и ящиком)", type: "Подвесные", mat: "Сталь", price: 18960, img: "lk-450-td-s-dverkami-i-yaschikom-stal-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26428", name: "ЛК-450 ТЯ (с 3 ящиками)", type: "Подвесные", mat: "ЛДСП", price: 13970, img: "lk-450-tya-s-3-yaschikami-ldsp-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26429", name: "ЛК-450 ТЯ (с 3 ящиками)", type: "Подвесные", mat: "Сталь", price: 22590, img: "lk-450-tya-s-3-yaschikami-stal-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26404", name: "ЛК-900 ТД (с дверками)", type: "Подвесные", mat: "ЛДСП", price: 12920, img: "lk-900-td-s-dverkami-ldsp-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26405", name: "ЛК-900 ТД (с дверками)", type: "Подвесные", mat: "Сталь", price: 23950, img: "lk-900-td-s-dverkami-stal-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26424", name: "ЛК-900 ТД (с дверками и ящиком)", type: "Подвесные", mat: "ЛДСП", price: 16190, img: "lk-900-td-s-dverkami-i-yaschikom-ldsp-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26425", name: "ЛК-900 ТД (с дверками и ящиком)", type: "Подвесные", mat: "Сталь", price: 28310, img: "lk-900-td-s-dverkami-i-yaschikom-stal-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26434", name: "ЛК-900 ТЯ (с 3 ящиками)", type: "Подвесные", mat: "ЛДСП", price: 20670, img: "lk-900-tya-s-3-yaschikami-ldsp-podvesnaya-dlya-stola-900-mm.webp" },
    { id: "26435", name: "ЛК-900 ТЯ (с 3 ящиками)", type: "Подвесные", mat: "Сталь", price: 32900, img: "lk-900-tya-s-3-yaschikami-stal-podvesnaya-dlya-stola-900-mm.webp" },
  ];

  /* Шаг 4: 11 живых аксессуаров вместо 8 донор-рыб. Порядок пересобран ПО СМЫСЛУ
     (электрика → рабочее место → коммуникации → раковины); порядок сайта перемешан —
     см. research/live-stol/constructor/options.md. Донорская кнопка «Показать еще»
     остаётся при деле: 8 карточек видно сразу, последние 3 раскрываются ею. */
  const SINKS = [
    { id: "21849", name: "Блок электророзеток с автоматом отключения питания", price: 5230, img: "blok-elektrorozetok-s-avtomatom-otklyucheniya-pitaniya.webp" },
    { id: "21847", name: "Светильник светодиодный", price: 4980, img: "svetilnik-svetodiodnyy.webp" },
    { id: "21884", name: "Полка под клавиатуру", price: 3400, img: "polka-pod-klaviaturu.webp" },
    { id: "21880", name: "Подставка под системный блок", price: 3530, img: "podstavka-pod-sistemnyy-blok.webp" },
    { id: "21962", name: "Кран для подвода воды", price: 14320, img: "kran-dlya-podvoda-vody.webp" },
    { id: "21927", name: "Кран для подвода газа", price: 15180, img: "kran-dlya-podvoda-gaza.webp" },
    { id: "21852", name: "Кран для сжатого воздуха/вакуума", price: 15180, img: "kran-dlya-szhatogo-vozduha-vakuuma.webp" },
    { id: "21850", name: "Кран для деионизованной воды", price: 28390, img: "kran-dlya-deionizovannoy-vody.webp" },
    { id: "21839", name: "Сливная раковина 250х100х150 Полипропилен", price: 5250, img: "slivnaya-rakovina-250h100h150-polipropilen.webp" },
    { id: "21872", name: "Сливная раковина 265х162х150 Нерж. сталь", price: 16850, img: "slivnaya-rakovina-265h162h150-nerzh-stal.webp" },
    { id: "21952", name: "Сливная раковина 255х115х100 Керамика", price: 24510, img: "slivnaya-rakovina-255h115h100-keramika.webp" },
  ];

  /* Карточка 288. Донорский композит из 3–4 слоёв ассетов заменён ОДНИМ живым кадром:
     живые png/jpg — готовые снимки товара 251²/1000², слоёв им не нужно.
     Количество берём из store, а не из нуля: карточки тумб перерисовываются при смене
     фильтра (тип × материал), и набранное пользователем обязано пережить перерисовку. */
  function constCard(item, store) {
    const el = document.createElement("div");
    el.className = "const-card";
    const qty = store[item.id] || 0;
    el.innerHTML = `
      <div class="cphoto"><img src="img/constructor/${item.img}" alt="${esc(item.name)}"></div>
      <div class="cbody">
        <p class="cname">${esc(item.name)}</p>
        <div class="cprice-row">
          <span class="cprice">${fmt(item.price)}</span>
          <div class="stepper" data-id="${item.id}">
            <button data-step="-1" aria-label="минус"><img src="assets/figma/constructor-icon-minus.svg" alt="" width="16" height="16"></button>
            <input type="text" value="${qty}" readonly aria-label="Количество">
            <button data-step="1" aria-label="плюс"><img src="assets/figma/constructor-icon-plus.svg" alt="" width="16" height="16"></button>
          </div>
        </div>
      </div>`;
    const input = $("input", el);
    el.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      const v = Math.max(0, (+input.value) + (+b.dataset.step));
      input.value = v; store[item.id] = v; recalc();
    }));
    return el;
  }

  const cabWrap = $("#cabinets"), sinkWrap = $("#sinks");
  if (cabWrap) {
    /* ПЕРЕРИСОВКА ПО ФИЛЬТРУ — новая механика, живых данных ради. У донора карточки «Размер»
       были статичны (4 одинаковые рыбы), у живого каталога набор зависит от пары
       (тип × материал): Встраиваемые 12 · Подкатные 3 · Подвесные 9 на каждый материал.
       Переключатели «Материал» и «Тип» шага 3 уже стоят в разметке — им добавлены value,
       читаем их, а не индексы: порядок карточек в HTML может измениться, значения — нет. */
    const pick = n => document.querySelector(`input[name="${n}"]:checked`)?.value || "";
    const renderCabinets = () => {
      const type = pick("cab-type"), mat = pick("cab-mat");
      const list = CABINETS.filter(c => c.type === type && c.mat === mat);
      cabWrap.innerHTML = "";
      list.forEach(c => cabWrap.appendChild(constCard(c, state.cabinets)));
    };
    $$('input[name="cab-type"], input[name="cab-mat"]').forEach(r => r.addEventListener("change", renderCabinets));
    renderCabinets();
  }
  if (sinkWrap) {
    const VISIBLE = 8;                                    // столько карточек показывал донор до «Показать еще»
    SINKS.forEach((s, i) => {
      const card = constCard(s, state.sinks);
      /* hidden-атрибут, а не свой класс: [hidden]{display:none} уже в reset токенов —
         второй способ прятать то же самое был бы лишним слоем. */
      if (i >= VISIBLE) card.hidden = true;
      sinkWrap.appendChild(card);
    });
    const more = $("#sinksMore");
    if (more) {
      if (SINKS.length <= VISIBLE) more.hidden = true;    // раскрывать нечего — кнопки нет
      more.addEventListener("click", function () {
        $$(".const-card", sinkWrap).forEach(c => { c.hidden = false; });
        this.style.display = "none";
      });
    }
  }

  // Степпер «Количество комплектов»
  const setsInput = $("#setsInput");
  $$('[data-role="sets"] button').forEach(b => b.addEventListener("click", () => {
    state.sets = Math.max(1, state.sets + (+b.dataset.step));
    setsInput.value = state.sets; recalc();
  }));

  // Панель «Ваш заказ» — сворачивание
  $("#orderToggle")?.addEventListener("click", () => $("#orderPanel")?.classList.toggle("collapsed"));

  // Пересчёт (живой — вау-механика демо)
  const linesWrap = $("#orderLines"), totalEl = $("#orderTotal");
  function recalc() {
    if (!linesWrap || !totalEl) return;
    const lines = [];
    const worktopPrice = PRICE[state.material][state.width];   // литерал матрицы, не формула
    lines.push({ nm: `Столешница ${state.material}, ${state.width} мм`, qty: 1, price: worktopPrice });
    CABINETS.forEach(c => { const q = state.cabinets[c.id] || 0; if (q) lines.push({ nm: c.name, qty: q, price: c.price }); });
    SINKS.forEach(s => { const q = state.sinks[s.id] || 0; if (q) lines.push({ nm: s.name, qty: q, price: s.price }); });
    linesWrap.innerHTML = lines.map(l =>
      `<div class="order-line"><span class="nm">${l.nm}</span><span class="qty">${l.qty} шт</span><span class="amt">${fmt(l.price * l.qty)}</span></div>`
    ).join("");
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    totalEl.textContent = fmt(subtotal * state.sets);
  }
  recalc();

  $("#addToCart")?.addEventListener("click", function () {
    const old = this.innerHTML;
    this.innerHTML = "Добавлено ✓"; this.style.background = "var(--feedback-success)";
    setTimeout(() => { this.innerHTML = old; this.style.background = ""; }, 1400);
  });

  /* ============================================================
     10. Сравнительная таблица (донор 18:8161: рыбы + мерджи соседних равных)
     ============================================================ */
  const cmpTable = $("#cmpTable");
  if (cmpTable) {
    /* ЖИВАЯ ТАБЛИЦА (22.07). Донор держал 8 рыб-колонок про вытяжные шкафы (материал шкафа,
       вытяжка, 2300 мм, вентиляторы, воздуховоды, монитор потока) — снесены целиком.
       Живой блок .compare-table-block сравнивает 13 РАЗНЫХ ТИПОВ лабораторных столов
       (не варианты ширины одного товара — такого блока на сайте нет вовсе, см. compare.md).
       Значения — машинная выгрузка data.json.compare_table, перепечатки руками нет:
       ~400 ячеек вручную = гарантированная опечатка. */
    const CMP_COLS = [
      "Стол лабораторный", "Стол лабораторный усиленный", "Стол лабораторный с полкой",
      "Стол лабораторный с двумя полками", "Стол лабораторный с надстройкой", "Стол титровальный",
      "Стол островной", "Стол торцевой", "Стол угловой", "Стол передвижной",
      "Стол весовой", "Стол весовой комбинированный", "Стол письменный",
    ];
    /* 1 = галка · 0 = прочерк/пусто · строка = текст. Порядок строк дословный, включая
       строку-подзаголовок «Дополнительная комплектация» (на сайте пустая у всех 13 колонок) —
       она и служит разделителем секций A/B, совпав с донорской развилкой «Показать еще». */
    const CMP_ROWS = [
      ["Маркировка", ["СЛ", "СЛ усиленный", "СМ", "СП", "СН", "СТ", "СО", "СЛ торцевой", "УСК", "СЛП", "СВ", "СВ комбинированный", "С"]],
      ["Название", ["Стол лабораторный", "Стол лабораторный усиленный", "Стол лабораторный с полкой", "Стол лабораторный с двумя полками", "Стол лабораторный с надстройкой", "Стол титровальный", "Стол островной", "Стол торцевой", "Стол угловой", "Стол передвижной", "Стол весовой", "Стол весовой комбинированный", "Стол письменный"]],
      ["Цена от   руб. с НДС", ["21 330 ₽", "26 650 ₽", "36 470 ₽", "41 150 ₽", "41 750 ₽", "61 470 ₽", "75 210 ₽", "65 380 ₽", "26 420 ₽", "26 590 ₽", "37 930 ₽", "67 660 ₽", "7 570 ₽"]],
      ["Варианты рабочей поверхности", ["CPL; Керамика; GranTec; Lab HPL; Нерж. сталь", "CPL; Керамика; GranTec; Lab HPL; Нерж. сталь", "CPL; Керамика; GranTec; Lab HPL; Нерж. сталь", "CPL; Керамика; GranTec; Lab HPL; Нерж. сталь", "CPL; Керамика; GranTec; Lab HPL; Нерж. сталь", "CPL; Керамика; GranTec; Lab HPL; Нерж. сталь", "CPL; Керамика; GranTec; Lab HPL", "Керамика; GranTec; Lab HPL", "CPL; Керамика; GranTec; Lab HPL", "CPL; Керамика; GranTec; Lab HPL", "Гранит", "Гранит/CPL; Гранит/Lab; HPL", "ЛДСП"]],
      ["Варианты ширины мм", ["600; 900; 1200; 1500; 1800", "900; 1200; 1500; 1800", "900; 1200; 1500; 1800", "900; 1200; 1500; 1800", "900; 1200; 1500; 1800", "900; 1200; 1500; 1800", "900; 1200; 1500; 1800", "1500", "600; 650", "600; 900; 1200", "600; 900", "1200; 1500", "1200; 1500"]],
      ["Глубина мм", ["600", "600", "650", "650", "650", "650", "1500", "750", "600", "600", "600", "600", 0]],
      ["Тумбы подкатные", [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1]],
      ["Материал тумб и ящиков", ["ЛДСП; Сталь", "ЛДСП; Сталь", "ЛДСП; Сталь", "ЛДСП; Сталь", "ЛДСП; Сталь", "ЛДСП; Сталь", "ЛДСП; Сталь", "ЛДСП; Сталь; Полипропилен", "ЛДСП; Сталь", 0, "Сталь", "ЛДСП; Сталь", "ЛДСП; Сталь"]],
      ["Высота стола мм", ["700; 900", "700; 900", "700; 900", "700; 900", "700; 900", "700; 900", "700; 900", "700; 900", "700; 900", 0, "700; 900", "700; 900", 0]],
      ["Тумбы встр. с дверками", [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]],
      ["Тумбы встр. с дверками и ящиком", [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0]],
      ["Тумбы встр. с 3 ящиками", [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0]],
      ["Тумбы встр. с 4 ящиками", ["только h=900", "только h=900", "только h=900", "только h=900", "только h=900", "только h=900", "только h=900", 0, "только h=900", 0, 0, 0, 0]],
      ["Тумбы подвесные с дверками", [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0]],
      ["Тумбы подвесные с 3 ящиками", [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0]],
      ["Ящики подвесные", ["только h=900", "только h=900", "только h=900", "только h=900", "только h=900", "только h=900", "только h=900", 0, "только h=900", 0, "только h=900", "только h=900", 0]],
      ["Тумбы подвесные с дверками и ящиком", [0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0]],
      ["Материал полок/надстройки/второй полки", [0, 0, "сталь", "сталь", "сталь; полипропилен", "сталь; полипропилен", "сталь", 0, 0, "сталь", 0, 0, 0]],
      ["Высота с полкой мм", [0, 0, "1355", "1780", "1780", "1780", "1780", 0, 0, 0, 0, 0, 0]],
      ["Дополнительная комплектация", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
      ["Две розетки 220 В с автоматом 16 А, на панели", [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0]],
      ["Выдвижная полка под клавиатуру", [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1]],
      ["Подставка под системный блок", [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1]],
      ["Светодиодный светильник", [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]],
      ["Лапки для крепления бюреток", [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]],
      ["Раковина 250х100х150 ПП", [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]],
      ["Раковина 265х162х150 нерж. сталь", [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]],
      ["Кран для газа", [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]],
      ["Кран для сжатого воздуха/вакуума", [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]],
      ["Кран для деионизованной воды", [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]],
      ["Кран для  воды", [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]],
    ];
    /* Кадры моделей (22.07). Забраны с живого каталога и пережаты в webp (13 шт., 64К на всё,
       img/models/). Связь с колонками — ПО МАРКИРОВКЕ, не по порядковому номеру: ключ словаря =
       значение из строки «Маркировка» CMP_ROWS, тем же массивом, который печатается в таблицу.
       Поэтому рассинхрон физически невозможен — кадр едет за своей маркировкой, а не за индексом:
       переставь/вставь колонку — картинка переедет вместе с ней, а промах по ключу даст
       отсутствующий кадр сразу и заметно, а не тихо сдвинутый ряд чужих фото.
       ⚠ УСК: файла ровно «УСК» в выгрузке каталога нет — взят второй ракурс ТОЙ ЖЕ модели (УСК2).
       Подварианты «УСК с полкой»/«с 2 полками» — другие товары, намеренно не подставлены. */
    const CMP_PHOTOS = {
      "СЛ": "sl.webp",
      "СЛ усиленный": "sl-usilenny.webp",
      "СМ": "sm.webp",
      "СП": "sp.webp",
      "СН": "sn.webp",
      "СТ": "st.webp",
      "СО": "so.webp",
      "СЛ торцевой": "sl-torcevoy.webp",
      "УСК": "usk.webp",
      "СЛП": "slp.webp",
      "СВ": "sv.webp",
      "СВ комбинированный": "svk.webp",
      "С": "s.webp",
    };
    const N = CMP_COLS.length;                             // 13, было 8 донорских
    /* ⚠ НАШ ТОВАР — СЕДЬМАЯ КОЛОНКА, а не первая. У донора рамка «Текущий вариант» была
       прибита к i === 0; здесь позиция вычисляется по имени, чтобы не разъехаться с данными. */
    const CURR = CMP_COLS.indexOf("Стол островной");
    const CHECK = '<img class="cmp-check" src="assets/figma/table-icon-check.svg" alt="✓">';
    const td = (t, span = 1, cls = "") => `<td${span > 1 ? ` colspan="${span}"` : ""}${cls ? ` class="${cls}"` : ""}>${t}</td>`;
    /* имена строк первоисточника несут двойные/тройные пробелы («Цена от   руб. с НДС»,
       «Кран для  воды») — в вёрстке схлопываем до одного, в отчёт уходит находкой */
    const row = (label, cells) => `<tr><th class="lbl">${esc(String(label).replace(/\s+/g, " ").trim())}</th>${cells}</tr>`;
    /* мердж соседних равных ячеек — идиома донора, но ТОЛЬКО для текстовых значений:
       галки и пустые донор тоже держал по одной на колонку (иначе строка «✓ ×7» слилась бы
       в одну широкую ячейку и перестала читаться по столбцам). */
    const cellsFor = (values) => {
      const out = [];
      for (let i = 0; i < N; i++) {
        const v = values[i];
        if (typeof v === "string" && v) {
          let span = 1;
          while (i + span < N && values[i + span] === v) span++;
          out.push(td(esc(v), span));
          i += span - 1;
        } else {
          out.push(td(v === 1 ? CHECK : ""));
        }
      }
      return out.join("");
    };
    const rowByName = nm => CMP_ROWS.find(r => r[0] === nm)[1];
    const DIV = CMP_ROWS.findIndex(r => r[0] === "Дополнительная комплектация");

    // Секция A: карточка модели (фото → маркировка → название → цена, рамка «Текущий вариант») + 16 строк характеристик
    let html = "<tbody>";
    const marks = rowByName("Маркировка");
    /* Фото у ВСЕХ 13 колонок (было — только у нашей). Кадр берётся по marks[i], то есть по той же
       маркировке, что печатается строкой ниже, — см. комментарий у CMP_PHOTOS. */
    html += row("", Array.from({ length: N }, (_, i) => td(
      (i === CURR ? '<span class="curr-badge">Текущий вариант</span>' : "")
      + `<img class="col-photo" src="img/models/${CMP_PHOTOS[marks[i]]}" alt="${esc(CMP_COLS[i])}">`,
      1, "pcell" + (i === CURR ? " curr curr-top" : ""))).join(""));
    html += row("Маркировка", Array.from({ length: N }, (_, i) => td(
      `<span class="mark-chip"><img src="assets/figma/table-icon-circle-check.svg" alt="" width="16" height="16">${esc(marks[i])}</span>`,
      1, i === CURR ? "curr" : "")).join(""));
    const names = rowByName("Название");
    html += row("Название", Array.from({ length: N }, (_, i) => td(esc(names[i]), 1, i === CURR ? "curr" : "")).join(""));
    const prices = rowByName("Цена от   руб. с НДС");
    html += row("Цена от руб. с НДС", Array.from({ length: N }, (_, i) => td(`<b>${esc(prices[i])}</b>`, 1, i === CURR ? "curr curr-bottom" : "")).join(""));
    CMP_ROWS.slice(3, DIV).forEach(([label, values]) => { html += row(label, cellsFor(values)); });
    html += `<tr class="cmp-btn-row"><th class="lbl"><button class="show-more" id="cmpMore">Показать еще</button></th>${td("", N)}</tr>`;
    html += "</tbody>";

    // Секция B (раскрывается «Показать еще»): строка-подзаголовок «Дополнительная комплектация» + 11 строк опций
    html += `<tbody id="cmpB">`;
    CMP_ROWS.slice(DIV).forEach(([label, values]) => { html += row(label, cellsFor(values)); });
    html += "</tbody>";
    cmpTable.innerHTML = html;

    $("#cmpMore").addEventListener("click", function () {
      const open = cmpTable.classList.toggle("show-all");
      this.textContent = open ? "Свернуть" : "Показать еще";
    });
  }


  /* ---------- 11b. Собственная моб-навигация — СНЯТА 21.07 ----------
     #mobNav / #mobMenu / #mmCats заменены моб-манифестацией модуля nav
     (nav-bottom-bar + nav-menu-sheet). Держать оба нельзя: два фикс-бара
     давали перекрытие 64px (замер разбора), и каталог кормился бы из ДВУХ
     источников правды — MEGA здесь и MENU в nav.js. */

  /* ---------- 12. Футер-аккордеон — СНЯТ 21.07 ----------
     Футер переехал в модуль code/footer/, аккордеон ведёт footer.js. Держать здесь второй
     обработчик нельзя: он крутил класс .open, а модуль ждёт .is-open — визуально аккордеон
     был бы мёртв при живом клике. Один источник правды. */

})();
