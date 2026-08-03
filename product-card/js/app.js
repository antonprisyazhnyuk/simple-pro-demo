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
  /* ссылка на пересборку точек галереи: heroFlow (выше по файлу) обязан дёрнуть её
     при смене состояния, а сама функция рождается ниже — в секции 3a-моб */
  let syncGalleryDots = null;
  let ticking = false;
  const heroFlow = () => {
    ticking = false;
    if (mobileMq.matches) {
      /* МОБ-ТРАНСФОРМЕР (М2, слово Антона «не два экрана, а два состояния»).
         Было: на мобе панель всегда раскрыта — компакта не существовало вовсе.
         Стало: первый экран держит рендер во весь свет, карточка наезжает снизу
         компактом; уехали на порог — раскрывается. Геометрию панели по-прежнему
         ведёт CSS (в потоке), JS только переключает состояние.
         ГИСТЕРЕЗИС (открыть 0.35vh, вернуть 0.25vh): без него на самой границе
         класс мигал бы на каждом кадре инерционного скролла, а вместе с ним
         прыгала бы высота страницы под пальцем. */
      if (panels) { panels.style.top = ""; panels.style.height = ""; }
      const y = window.scrollY, vh = window.innerHeight;
      const open = hero.classList.contains("expanded");
      let flipped = false;
      if (!open && y > vh * 0.35) { hero.classList.add("expanded"); flipped = true; }
      else if (open && y < vh * 0.25) { hero.classList.remove("expanded"); flipped = true; }
      /* Смена состояния меняет СОСТАВ ленты: 3D-слот живёт только в раскрытой.
         Точки строятся по числу ЖИВЫХ слайдов, поэтому их надо пересобрать здесь —
         иначе после расхлопа слайдов 7, а точек остаётся 6 (поймано свипом). */
      if (flipped) syncGalleryDots?.();
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
    /* подсказка «крутите пальцем» — только на мобе и только пока вьювер открыт:
       мышью и так видно по курсору, а на тач-экране аффорданса нет вовсе */
    const hint = $(".viewer-hint");
    if (hint) hint.hidden = !(on && mobileMq.matches);
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

  /* ---------- 3a-моб (М2). Точки-индикатор за текущим слайдом карусели ----------
     На мобе главного квадрата нет: рейка сама становится лентой со scroll-snap,
     а её миниатюры — слайдами. Свайп ведёт CSS, здесь только индикатор.
     Активный слайд считаем по БЛИЖАЙШЕМУ К ЦЕНТРУ ленты, а не делением scrollLeft
     на ширину: гэпы и поля сбивают арифметику (обжигались на карусели блока 4).
     Точки СТРОИМ из числа живых слайдов — разметочные span'ы это стартовое
     значение, а не источник правды (на мобе 3D-слот снят, слайдов на один меньше). */
  const galRail = $(".gallery-rail"), galDots = $("#galleryDots");
  if (galRail && galDots) {
    let dotsTick = false;
    const slides = () => railThumbs.filter(t => t.offsetParent !== null);
    const buildDots = (n) => {
      if (galDots.children.length === n) return;
      galDots.innerHTML = "";
      for (let i = 0; i < n; i++) galDots.appendChild(document.createElement("span"));
    };
    const syncDots = () => {
      if (!mobileMq.matches) return;                          // на деске карусели нет вовсе
      const list = slides();
      if (!list.length) return;
      buildDots(list.length);
      const box = galRail.getBoundingClientRect(), cx = box.left + box.width / 2;
      let best = 0, bestD = Infinity;
      list.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - cx);
        if (d < bestD) { bestD = d; best = i; }
      });
      $$("span", galDots).forEach((d, i) => d.classList.toggle("on", i === best));
      selectThumb(list[best]);                                // фулвью откроется на том кадре, что смотрели
      /* Выход из 3D на мобе. Раньше show3d(false) звался ТОЛЬКО по клику миниатюры,
         а на мобе клик по слайду ещё и открывает фулвью — то есть уехать свайпом
         с 3D-слота на фото было нельзя, вьювер оставался поверх. Ведём вьювер
         за лентой: слот под центром — открыт, любой другой слайд — закрыт. */
      show3d(list[best] === open3dBtn);
    };
    galRail.addEventListener("scroll", () => {
      if (dotsTick) return;
      dotsTick = true;
      requestAnimationFrame(() => { dotsTick = false; syncDots(); });
    }, { passive: true });
    window.addEventListener("resize", syncDots);
    syncGalleryDots = syncDots;        // отдаём ссылку наверх, см. heroFlow
    /* Состав ленты зависит от состояния карточки (в раскрытой добавляется 3D-слот),
       а состояние может менять не только heroFlow — его ставит и приёмочный скрипт,
       и любой будущий тумблер. Поэтому слушаем САМ класс, а не место, где он ставится:
       иначе точки живут по устаревшему числу слайдов (6 против 7 — поймано свипом). */
    if (hero) new MutationObserver(syncDots).observe(hero, { attributes: true, attributeFilter: ["class"] });
    syncDots();
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
  /* центр фулвью бывает ДВУХ видов: одиночная картинка панели (#lightboxImg) и
     СЛОЁНЫЙ кадр кейса (№14в) — у кейсов картинка собрана из трёх наложенных слоёв,
     одним <img> её не показать. Второй бокс, а не переключение src. */
  const lightboxLayers = $("#lightboxLayers");
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

  /* рейка фулвью наполняется КЛОНАМИ миниатюр источника.
     Источников теперь два — панель первого экрана и карточка кейса (№14в), поэтому
     вместо флага «собрана один раз» держим ИМЯ режима: пересобираем только при смене
     источника, внутри одного режима рейка живёт как раньше. */
  let railMode = null;                              // "product" | "case"
  const fillRail = (nodes, onPick) => {
    if (!lightboxRail) return;
    lightboxRail.innerHTML = "";
    nodes.forEach((src, i) => {
      const copy = src.cloneNode(true);
      copy.removeAttribute("id");                   // id уникален — у клона его быть не должно
      copy.classList.remove("is-selected", "is-active");
      copy.addEventListener("click", () => onPick(i));
      lightboxRail.appendChild(copy);
    });
  };
  const buildLightboxRail = () => {
    if (railMode === "product") return;
    fillRail(railThumbs, showInLightbox);
    railMode = "product";
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    returnViewer();
    /* слоёный кадр кейса (№14в) гасим и ОЧИЩАЕМ: иначе его слои остаются в DOM
       и всплывают на следующем открытии из панели поверх обычной картинки */
    if (lightboxLayers) { lightboxLayers.hidden = true; lightboxLayers.innerHTML = ""; }
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
  /* М2: на мобе главного квадрата НЕТ (его место заняла карусель), а вход в фулвью
     висел только на нём — тап по фото переставал открывать зум. Возвращаем вход
     самим слайдом. Порядок верный: штатный обработчик миниатюры уже позвал
     selectThumb, openLightbox берёт индекс по .is-selected. */
  railThumbs.forEach(t => {
    if (t === open3dBtn) return;
    t.addEventListener("click", () => { if (mobileMq.matches) openLightbox(); });
  });
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
  /* ---------- 3f. №14в: клик по БОЛЬШОМУ кадру кейса → фулвью-канон ----------
     Тот же слой, что у панели первого экрана (№14д), а не второй лайтбокс: рейка
     слева = миниатюры ЭТОЙ карточки, центр = слоёный кадр. Esc / крестик / подложка
     закрывают общим обработчиком выше.
     Центр открывается тем, что пользователь СЕЙЧАС видит в большом кадре (а не
     нулевой миниатюрой): у кейсов большой кадр в покое несёт собственные слои
     (…-main-overlay1), не совпадающие ни с одной миниатюрой, и прыжок на другую
     картинку в момент открытия читался бы как баг. */
  const showCaseInFullview = (thumbs, i) => {
    if (!lightboxLayers) return;
    const src = thumbs[i];
    $$(".thumb", lightboxRail).forEach((t, k) => {
      t.classList.toggle("is-selected", k === i);
      t.setAttribute("aria-current", k === i ? "true" : "false");
    });
    if (src) lightboxLayers.innerHTML = src.innerHTML;
    lightboxLayers.hidden = false;
    lightboxImg.hidden = true;
  };

  $$(".case-slide").forEach(slide => {
    const big = $(".slide-photo", slide);
    const thumbs = $$(".slide-thumbs .thumb", slide);
    if (!big) return;

    /* ФУЛВЬЮ по клику на большой кадр — работает и у слайда с одной миниатюрой
       (и вовсе без них): рейка тогда просто короткая. */
    const openCase = () => {
      if (!lightbox || !lightboxLayers) return;
      lastFocusedEl = document.activeElement;
      fillRail(thumbs, i => showCaseInFullview(thumbs, i));
      railMode = "case";
      returnViewer();                                      // 3D-вьювер тут ни при чём
      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
      const cur = thumbs.findIndex(t => t.classList.contains("is-active"));
      $$(".thumb", lightboxRail).forEach((t, k) => {
        t.classList.toggle("is-selected", k === cur);
        t.setAttribute("aria-current", k === cur ? "true" : "false");
      });
      lightboxLayers.innerHTML = big.innerHTML;            // ровно то, что смотрел пользователь
      lightboxLayers.hidden = false;
      lightboxImg.hidden = true;
      lightboxClose.focus();
    };
    big.tabIndex = 0;
    big.setAttribute("role", "button");
    big.setAttribute("aria-label", "Открыть изображение во весь экран");
    big.addEventListener("click", openCase);
    big.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCase(); }
    });

    if (thumbs.length < 2) return;
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
        t.scrollBy({ left: dir * Math.max(280, t.clientWidth * 0.7), behavior: "smooth" });
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
      t.scrollTo({ left: to, behavior: "smooth" });
    };
    nav.querySelectorAll(".arrow-btn").forEach(b => {
      b.addEventListener("click", () => stepOnce(+b.dataset.dir));
    });
    const sync = () => {
      const t = pick();
      const [prev, next] = nav.querySelectorAll(".arrow-btn");
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
      img.src = `assets/3d/100${String(i).padStart(2, "0")}.jpg`;
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

    /* ── 3D ПАЛЬЦЕМ (слово Антона: «чиним причину, а не прячем») ────────────────
       Было: один `touchmove` с passive:true. Крутить он крутил, но жест
       одновременно скроллил страницу — модель уезжала из-под пальца, и это
       читалось как «на мобе 3D не работает».

       ⚠ touch-action ставим `pan-y`, а НЕ `none`, хотя в постановке стоит none:
       вьювер на мобе занимает всю ширину экрана, и с `none` вертикальный свайп,
       начатый на нём, никуда не ведёт — страница встаёт намертво, мимо вьювера
       не проскроллить. `pan-y` отдаёт вертикаль странице, горизонталь — нам;
       это ровно то, что просит второй пункт той же постановки («преимущественно
       вертикальный свайп отдаём странице»). Задаём из JS, потому что CSS первого
       экрана правится параллельно другим агентом.

       НАМЕРЕНИЕ решается ОДИН раз за жест и держится до touchend: иначе на
       диагонали палец переключал бы режим посреди движения. */
    box.style.touchAction = "pan-y";
    const TOUCH_TH = 8;                       // порог, за которым намерение читается
    let grab = null;
    box.addEventListener("touchstart", e => {
      const t = e.touches[0];
      grab = { x0: t.clientX, y0: t.clientY, mode: null };
    }, { passive: true });
    box.addEventListener("touchmove", e => {
      if (!grab) return;
      const t = e.touches[0];
      if (!grab.mode) {
        const dx = Math.abs(t.clientX - grab.x0), dy = Math.abs(t.clientY - grab.y0);
        if (dx < TOUCH_TH && dy < TOUCH_TH) return;   // ещё непонятно, куда ведут
        grab.mode = dx > dy ? "rotate" : "scroll";
      }
      if (grab.mode !== "rotate") return;             // вертикаль — страницы, не наша
      if (e.cancelable) e.preventDefault();           // схватили — держим до конца жеста
      atX(t.clientX);
    }, { passive: false });
    const endGrab = () => { grab = null; };
    box.addEventListener("touchend", endGrab, { passive: true });
    box.addEventListener("touchcancel", endGrab, { passive: true });
  }

  /* ============================================================
     9. КОНСТРУКТОР (живой пересчёт; структура и рыбы — донор 18:9611)
     ============================================================ */
  const MATERIALS = [
    { name: "CPL",         overlay: null },
    { name: "Керамика",    overlay: "assets/figma/constructor-material-ceramic-overlay.png" },
    { name: "GranTec",     overlay: "assets/figma/constructor-material-grantec-overlay.png" },
    { name: "Lab HPL",     overlay: "assets/figma/constructor-material-labhpl-overlay.png" },
    { name: "Нерж. сталь", overlay: "assets/figma/constructor-material-steel-overlay.png" },
  ];
  const WIDTHS = [900, 1200, 1500, 1800, 2100, 2400];
  const BASE_PRICE = 198640;
  const matPremium = { "CPL": 0, "Керамика": 42000, "GranTec": 28000, "Lab HPL": 15000, "Нерж. сталь": 56000 };
  const widthMul   = { 900: 1, 1200: 1.16, 1500: 1.4, 1800: 1.62, 2100: 1.85, 2400: 2.08 };

  const state = { material: "CPL", width: 900, cabinets: {}, sinks: {}, sets: 1 };

  // Шаг 1: сетка «материалы слева × 6 колонок ширин»; подписей ширин под фото в доноре НЕТ,
  // угловая ячейка пустая (в ней ссылка «Сравнить…» по донору), цены — живая математика (вердикт)
  const matrix = $("#matrix");
  if (matrix) {
    const cells = [];
    cells.push(`<div class="mx-link"><a href="#" class="compare-link">Сравнить материалы столешницы</a></div>`);
    WIDTHS.forEach(() => cells.push(
      `<div class="mx-photo"><img src="assets/figma/constructor-photo-base.jpg" alt=""><img src="assets/figma/constructor-cabinet-overlay.png" alt=""></div>`));
    MATERIALS.forEach(m => {
      cells.push(`<div class="mat-row">
        <span class="mat-prev"><img src="assets/figma/constructor-material-cpl-base.png" alt="">${m.overlay ? `<img src="${m.overlay}" alt="">` : ""}</span>
        <span class="mat-name">${m.name}</span>
        <img class="mat-q" src="assets/figma/constructor-icon-tooltip.svg" alt="?">
      </div>`);
      WIDTHS.forEach(w => {
        const price = Math.round((BASE_PRICE + matPremium[m.name]) * widthMul[w]);
        const checked = (m.name === "CPL" && w === 900) ? "checked" : "";
        cells.push(`<label class="mcell mx-price"><input type="radio" class="radio" name="worktop-matrix" ${checked}
          data-mat="${m.name}" data-w="${w}"><span class="price">${fmt(price)}</span></label>`);
      });
    });
    matrix.innerHTML = cells.join("");
    $$('input[name="worktop-matrix"]').forEach(r => r.addEventListener("change", () => {
      state.material = r.dataset.mat; state.width = +r.dataset.w; recalc();
    }));
  }

  // Шаг 3 «Размер» и Шаг 4: карточки 288 (донор-рыбы: название/цена одинаковы во всех)
  const CARD_NAME = "ЛК-900 ТПД-В Полипропилен, Подкатная, для стола 900 мм";
  const CARD_PRICE = 46750;
  const SIZE_LAYERS = ["constructor-photo-base.jpg", "constructor-tumba-overlay.png", "constructor-tumba-size-overlay.png"];
  const SINK_LAYERS = SIZE_LAYERS.concat("constructor-sink-overlay.png");
  const CABINETS = ["c1", "c2", "c3", "c4"].map(id => ({ id, name: CARD_NAME, price: CARD_PRICE, layers: SIZE_LAYERS }));
  const SINKS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map(id => ({ id, name: CARD_NAME, price: CARD_PRICE, layers: SINK_LAYERS }));

  function constCard(item, store) {
    const el = document.createElement("div");
    el.className = "const-card";
    el.innerHTML = `
      <div class="cphoto">${item.layers.map(l => `<img src="assets/figma/${l}" alt="">`).join("")}</div>
      <div class="cbody">
        <p class="cname">${item.name}</p>
        <div class="cprice-row">
          <span class="cprice">${fmt(item.price)}</span>
          <div class="stepper" data-id="${item.id}">
            <button data-step="-1" aria-label="минус"><img src="assets/figma/constructor-icon-minus.svg" alt="" width="16" height="16"></button>
            <input type="text" value="0" readonly aria-label="Количество">
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
  if (cabWrap && sinkWrap) {
    CABINETS.forEach(c => cabWrap.appendChild(constCard(c, state.cabinets)));
    /* №12 — «Показать ещё» шага 4 стал НАСТОЯЩИМ тогглом (был: кнопка прятала сама себя).
       Рецепт зеркалит рабочий образец #cmpMore из этого же файла — один канон на две
       кнопки, третьей редакции быть не должно.
       Разрез после 4-й карточки = ряд сетки (.const-cards — 4 колонки): пряталась бы
       не «часть», а куски рядов, и кнопка читалась бы как баг. */
    SINKS.forEach((s, i) => {
      const card = constCard(s, state.sinks);
      if (i >= 4) card.classList.add("is-extra");
      sinkWrap.appendChild(card);
    });
    $("#sinksMore")?.addEventListener("click", function () {
      const open = sinkWrap.classList.toggle("show-all");
      this.textContent = open ? "Скрыть" : "Показать еще";
    });
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
    const worktopPrice = Math.round((BASE_PRICE + matPremium[state.material]) * widthMul[state.width]);
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
    const N = 8;
    const CHECK = '<img class="cmp-check" src="assets/figma/table-icon-check.svg" alt="✓">';
    const td = (t, span = 1, cls = "") => `<td${span > 1 ? ` colspan="${span}"` : ""}${cls ? ` class="${cls}"` : ""}>${t}</td>`;
    const row = (label, cells) => `<tr><th class="lbl">${label}</th>${cells}</tr>`;

    // Секция A: карточки моделей (рыба ×8, рамка «Текущий вариант» — фото→цена) + характеристики с мерджами
    let html = "<tbody>";
    html += row("", Array.from({ length: N }, (_, i) => td(
      `${i === 0 ? '<span class="curr-badge">Текущий вариант</span>' : ""}<img class="col-photo" src="assets/figma/table-column-photo.jpg" alt="">`,
      1, "pcell" + (i === 0 ? " curr curr-top" : ""))).join(""));
    const markCell = '<span class="mark-chip"><img src="assets/figma/table-icon-circle-check.svg" alt="" width="16" height="16">ШВП</span>';
    html += row("Маркировка", Array.from({ length: N }, (_, i) => td(markCell, 1, i === 0 ? "curr" : "")).join(""));
    html += row("Название", Array.from({ length: N }, (_, i) => td("Стол лабораторный преподавателя", 1, i === 0 ? "curr" : "")).join(""));
    html += row("Цена от руб. с НДС", Array.from({ length: N }, (_, i) => td("<b>148 780 ₽</b>", 1, i === 0 ? "curr curr-bottom" : "")).join(""));
    const A_ROWS = [
      ["Материал шкафа", [["Полипропилен", 1], ["Сталь", 7]]],
      ["Варианты рабочей поверхности", [["Полипропилен, GranTec, Lab HPL", 1], ["Нерж. сталь, GranTec, Lab HPL", 3], ["GranTec", 3], ["", 1]]],
      ["Варианты ширины мм", [["960, 1260, 1560, 1860", 7], ["1320, 1620, 1920", 1]]],
      ["Глубина мм", [["765", 7], ["865", 1]]],
      ["Высота мм", [["2300", 8]]],
      ["Тумбы с дверками", [["ЛК-750 ТПД-В, ЛК-900 ТПД-В, ЛК-1200 ТПД-В", 7], ["", 1]]],
      ["Тумбы с дверками и ящиком", [["ЛК-750 ТПД-В (с дверками и ящиком), ЛК-900 ТПД-В (с дверками и ящиком), ЛК-1200 ТПД-В (с дверками и ящиком)", 7], ["", 1]]],
      ["Варианты рабочей поверхности", [[CHECK, 1], [CHECK, 1], [CHECK, 1], [CHECK, 1], [CHECK, 1], [CHECK, 1], [CHECK, 1], ["", 1]]],
    ];
    A_ROWS.forEach(([label, cells]) => { html += row(label, cells.map(([t, s]) => td(t, s)).join("")); });
    html += `<tr class="cmp-btn-row"><th class="lbl"><button class="show-more" id="cmpMore">Показать еще</button></th>${td("", N)}</tr>`;
    html += "</tbody>";

    // Секция B: галки в колонках 1–7; колонка 8 пуста везде, КРОМЕ «Раковина 265х162х150 нерж. сталь»
    const B_ROWS = [
      "Вентилятор кислотостойкий D200, 1200 м3", "Вентилятор кислотостойкий D315, 1700 м3", "Регулятор скорости вентилятора",
      "Монитор воздушного потока", "Воздуховоды", "Раковина 250х100х150 ПП", "Раковина 300х300х200 ПП", "Раковина 400х400х300 ПП",
      "Раковина 265х162х150 нерж. сталь", "Раковина 255х115х100 монол. Керамика", "Раковина 392х392х310 монол. Керамика",
      "Кран для воды дистанционный", "Химический смеситель", "Кран для газа", "Кран для сжатого воздуха/вакуума",
      "Кран для деионизованной воды", "Взрывозащищенный светильник", "Доп. Блок розеток (2 шт) + Автомат с УЗО",
      "Нагревательная панель", "Автономный вентилятор",
    ];
    html += `<tbody id="cmpB">`;
    B_ROWS.forEach(name => {
      const col8 = name === "Раковина 265х162х150 нерж. сталь"; // единственное реальное отличие секции B
      html += row(name, Array.from({ length: N }, (_, i) => td(i < 7 || col8 ? CHECK : "")).join(""));
    });
    html += "</tbody>";
    cmpTable.innerHTML = html;

    $("#cmpMore").addEventListener("click", function () {
      const open = cmpTable.classList.toggle("show-all");
      this.textContent = open ? "Свернуть" : "Показать еще";
    });

    /* ── №13: ПОЛНОЕ покрытие ховера столбца, включая мердж-строки ──────────────
       Было: чистый CSS (:has() + nth-child), и он НАМЕРЕННО исключал ячейки
       с colspan — у мердж-ячейки nth-child промежуточного столбца физически
       не существует, поэтому шесть строк-спек (материал, поверхность, ширина,
       глубина, высота, тумбы) не подсвечивались вовсе.
       Стало: размечаем КАЖДУЮ ячейку диапазоном визуальных столбцов и на ховере
       красим все, чей диапазон пересекает наведённый столбец. CSS-цепочки :has()
       оставлены страховкой — они дают тот же визуал и работают, если скрипт не
       доехал; JS — основной путь.
       Диапазоны считаем ПОСТ-ОБРАБОТКОЙ готовой таблицы, а не в генераторе:
       генератор собирает строки из разных источников (A_ROWS, B_ROWS, кнопка),
       и позиция ячейки известна только когда строка уже собрана целиком. */
    const TRIGGER_ROWS = new Set([0, 2, 3]);   // фото · название · цена (те же, что у :has())
    let hoveredCol = 0;

    cmpTable.querySelectorAll("tr").forEach(tr => {
      let col = 1;                              // th.lbl — не визуальный столбец, счёт с 1
      tr.querySelectorAll("td").forEach(td => {
        const span = +td.getAttribute("colspan") || 1;
        td.dataset.colStart = String(col);
        td.dataset.colEnd = String(col + span - 1);
        col += span;
      });
    });

    const paintCol = (n) => {
      if (n === hoveredCol) return;
      hoveredCol = n;
      cmpTable.querySelectorAll("td[data-col-start]").forEach(td => {
        const a = +td.dataset.colStart, b = +td.dataset.colEnd;
        td.classList.toggle("col-hover", n >= a && n <= b);
      });
    };

    /* делегирование: строки секции B дорисовываются кликом «Показать ещё»,
       и повесить слушатели поштучно значит забыть про них */
    cmpTable.addEventListener("mouseover", e => {
      const cell = e.target.closest("td[data-col-start]");
      if (!cell) return;
      const tr = cell.parentElement;
      const rows = Array.prototype.indexOf.call(tr.parentElement.children, tr);
      /* триггер — только верхний блок (фото/название/цена) первой tbody:
         в остальных строках ховер по ячейке НЕ должен красить столбец,
         иначе подсветка спорит со строчным ховером */
      if (tr.parentElement !== cmpTable.tBodies[0] || !TRIGGER_ROWS.has(rows)) return;
      paintCol(+cell.dataset.colStart);
    });
    cmpTable.addEventListener("mouseleave", () => paintCol(0));
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
