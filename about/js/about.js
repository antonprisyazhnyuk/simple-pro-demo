/* Страница «О компании» — поведение, которого нет в модулях nav/footer:
   постер видео · дроп региона в CTA-полосе · копи-кнопки. */
(() => {
  /* ── видео: постер меняется на iframe только по клику (не грузим плеер зря) ── */
  document.querySelectorAll(".video-poster[data-embed]").forEach((poster) => {
    const play = poster.querySelector(".video-poster-play");
    if (!play) return;
    play.addEventListener("click", () => {
      const frame = document.createElement("iframe");
      frame.src = poster.dataset.embed + "?autoplay=1";
      frame.title = "Видео о производстве Simple PRO";
      frame.allow = "autoplay; fullscreen; picture-in-picture";
      frame.setAttribute("allowfullscreen", "");
      poster.replaceChildren(frame);
    });
  });

  /* ── регион в CTA: номер, tel: и data-copy едут за выбором ──
     номера — с макета (блок «Закажите экскурсию»), «Регионы» = дефолт CTA-полосы */
  const REGIONS = [
    { name: "Москва",          tel: "+7 (495) 323 59 64" },
    { name: "Санкт-Петербург", tel: "+7 (812) 614 65 41" },
    { name: "Регионы",         tel: "+7 (800) 600 40 69" },
  ];
  document.querySelectorAll("[data-region-phone]").forEach((box) => {
    const btn   = box.querySelector("[data-region-btn]");
    const label = box.querySelector("[data-region-label]");
    const menu  = box.querySelector("[data-region-menu]");
    const tel   = box.querySelector("[data-region-tel]");
    const copy  = box.querySelector("[data-region-copy]");
    if (!btn || !label || !menu || !tel) return;

    const close = () => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); };
    const open  = () => { menu.hidden = false; btn.setAttribute("aria-expanded", "true"); };

    REGIONS.forEach((r) => {
      const item = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", "false");
      b.textContent = r.name;
      b.addEventListener("click", () => {
        label.textContent = r.name;
        tel.textContent = r.tel;
        tel.href = "tel:" + r.tel.replace(/[^\d+]/g, "");
        if (copy) copy.dataset.copy = r.tel;
        menu.querySelectorAll("button").forEach((el) => el.setAttribute("aria-selected", String(el === b)));
        close();
        btn.focus();
      });
      item.append(b);
      menu.append(item);
    });

    btn.addEventListener("click", (e) => { e.stopPropagation(); menu.hidden ? open() : close(); });
    document.addEventListener("click", (e) => { if (!box.contains(e.target)) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  });

  /* ── копи-кнопки: одна механика на всю страницу ── */
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(btn.dataset.copy); } catch { /* без буфера — молча */ }
    });
  });

  /* ══════════ ВЫСТАВКИ (блок 6): годы-табы · карусель карточек · фулвью ══════════
     Слово Антона: «наша карточка, принцип работы как у карточек с блока Дизайн
     лабораторий». Механика снята с канона продуктовой и повторена один-в-один:
     · product-card/js/app.js §3e — миниатюра выбирает кадр большого фото,
       выбор одиночный (.is-active);
     · §5 — листание РОВНО НА ОДНУ карточку по ближайшей кромке от живой геометрии,
       с вычетом левого поля и цикличным рельсом (№14б: конца у ленты нет);
     · §3d — фулвью (эталон 2184:36730): рейка миниатюр слева строится КЛОНАМИ
       миниатюр карточки, соответствие по индексу; Esc/крестик/подложка закрывают.

     ⚠ Блок обязан стоять ВЫШЕ секции «свайп-карусели: точки-индикатор»: та обходит
     [data-rail] один раз на загрузке, а карточки рождаются здесь. Стоит ниже —
     на мобе не будет точек (сама карусель работать будет).

     РАЗМЕТКА КАРТОЧЕК СТРОИТСЯ ТУТ, а не в index.html: 100 кадров = ~370 строк
     однообразного html и второй источник правды о наборах. Тот же приём, что у
     сравнительной таблицы продуктовой (<table id="cmpTable"> пустая, строит app.js).
     Без JS секция остаётся заголовком без карусели — на Битриксе цикл шаблона
     отрисует те же карточки серверно по этой же формуле имён. */
  (() => {
    const root = document.querySelector(".about-expo");
    if (!root) return;
    const tabsBox  = root.querySelector(".about-expo-years");
    const panesBox = root.querySelector(".about-expo-panes");
    if (!tabsBox || !panesBox) return;

    /* Наборы = ЗАМЕР папки about/img/expo: 104 файла, имена expo-<год>-<N>.webp,
       нумерация в каждом году подряд без дыр (проверено пофайлово).
       Годов 2019–2021 в списке НЕТ: на живом сайте таких табов не существует —
       таб без содержимого хуже отсутствующего.
       ЯВНЫЕ НОМЕРА, а не количество: решением лида четыре кадра из карусели
       исключены (файлы на диске ОСТАЮТСЯ) — три скана сертификатов (2013-9,
       2015-1, 2016-4) и пустая парковка 2025-23. Набор с дырой количеством не
       описать: перебор 1…N дал бы битую ссылку на исключённый номер.
       Массив пар, а не объект: у объекта числовые ключи сортируются по возрастанию
       и порядок табов (2026 первым — активный по умолчанию, как на живом) молча
       развернулся бы. */
    const range = (last, skip = []) =>
      Array.from({ length: last }, (_, i) => i + 1).filter((n) => !skip.includes(n));
    const YEARS = [
      ["2026", range(8)],
      ["2025", range(27, [23])],
      ["2024", range(5)],
      ["2023", range(4)],
      ["2022", range(4)],
      ["2018", range(9)],
      ["2017", range(10)],
      ["2016", range(6, [4])],
      ["2015", range(15, [1])],
      ["2014", range(7)],
      ["2013", range(9, [9])],
    ];
    const PER_CARD = 3;                       // колонка миниатюр макета — 3 кадра
    /* база пути задаётся разметкой: на странице «img/expo/», в демке кухни путь
       другой, а файл скрипта обязан быть тем же самым, что меряли */
    const BASE = panesBox.dataset.expoBase || "img/expo/";
    const frame = (year, n) => `${BASE}expo-${year}-${n}.webp`;
    /* alt НЕЙТРАЛЬНЫЙ (решение лида): на живом у фото выставок нет ни подписей,
       ни названий мероприятий — названия запрошены у клиента, выдумывать их нельзя. */
    const label = (year) => `Выставка ${year}`;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    /* .matches читаем в момент вызова, а не на загрузке: системная настройка
       меняется на лету, и закешированный флаг соврал бы */
    const flow = () => (reduce.matches ? "auto" : "smooth");

    /* Нарезка набора года на карточки: групп ceil(N/3), размеры ВЫРАВНИВАЕМ.
       Жадная нарезка «по 3, остаток отдельно» давала бы карточки-огрызки
       (9 → 3+3+3 против 4+4+1 у жадной; 5 → 3+2 против 3+1+1). */
    const chunks = (n) => {
      const groups = Math.ceil(n / PER_CARD);
      const size = Math.floor(n / groups), extra = n % groups;
      return Array.from({ length: groups }, (_, i) => size + (i < extra ? 1 : 0));
    };

    /* ---------- карточка ----------
       nums — НОМЕРА ФАЙЛОВ этой карточки (с дырами исключённых кадров),
       pos  — порядковый номер её первого кадра В НАБОРЕ года (для счётчика и
              ярлыков): по файлам считать нельзя, номера не сплошные. */
    const buildCard = (year, total, pos, nums) => {
      const card = document.createElement("article");
      card.className = "expo-card";
      /* ⚠ ЗАГЛУШКА, ЖДЁМ КЛИЕНТА. .expo-card-head — слот, который макет отводит под
         ОПИСАНИЕ выставки (название мероприятия + текст). Описаний нет ни у нас, ни на
         живом сайте (замер: 104 анкера с data-caption=""), придумывать их нельзя —
         запрошены у клиента. До них в слоте стоит служебная строка «Фото N–M из K»:
         она не заголовок и по виду не претендует (мелкая, приглушённая — about.css).
         Года в шапке НЕТ намеренно: он уже стоит в активном табе прямо над карточкой,
         а один год даёт до девяти карточек подряд — было девять одинаковых «2025».
         Придёт текст клиента — встаёт сюда же вместо счётчика. */
      card.innerHTML =
        '<div class="expo-card-head">' +
          `<p class="expo-card-count">Фото ${pos}–${pos + nums.length - 1} из ${total}</p>` +
        "</div>" +
        '<div class="expo-card-media">' +
          '<button class="expo-card-main" type="button" aria-label="Открыть кадр крупно">' +
            `<img src="${frame(year, nums[0])}" alt="${label(year)}" loading="lazy">` +
          "</button>" +
          /* data-rail висит на КОЛОНКЕ МИНИАТЮР, а не на .expo-card-media: на мобе
             именно она становится свайп-лентой кадров, а строитель точек в about.js
             меряет шаг по firstElementChild рельса. Повесь его на медиа — первым
             ребёнком там окажется скрытый большой кадр шириной 0, шаг посчитается
             как один гэп (замер: 8 вместо 344) и точка перестанет попадать в кадр. */
          '<div class="expo-card-thumbs" data-rail>' +
            nums.map((n, i) =>
              `<button class="expo-thumb" type="button" aria-label="${label(year)} — кадр ${pos + i} из ${total}">` +
              `<img src="${frame(year, n)}" alt="" loading="lazy"></button>`
            ).join("") +
          "</div>" +
        "</div>";

      const main    = card.querySelector(".expo-card-main");
      const mainImg = main.querySelector("img");
      const thumbs  = [...card.querySelectorAll(".expo-thumb")];

      /* Портрет/ландшафт — по ФАКТИЧЕСКИМ пропорциям файла, не по имени и не на глаз:
         часть кадров вертикальные, в слоте 912×512 при cover от них остаётся ~37 %.
         .is-portrait переводит кадр в contain (см. about.css). */
      const orient = (box, img) => {
        const mark = () => box.classList.toggle("is-portrait", img.naturalHeight > img.naturalWidth);
        if (img.complete && img.naturalWidth) mark();
        else img.addEventListener("load", mark, { once: true });
      };

      const select = (i) => {
        mainImg.src = frame(year, nums[i]);
        mainImg.alt = label(year);
        orient(main, mainImg);
        thumbs.forEach((t, k) => t.classList.toggle("is-active", k === i));
      };

      thumbs.forEach((t, i) => {
        orient(t, t.querySelector("img"));
        t.addEventListener("click", () => {
          /* На мобе большой кадр скрыт (mobile.css §6), миниатюры сами стали слайдами —
             выбор там нечего показывать, поэтому тап открывает фулвью. Развилка по
             ЖИВОЙ геометрии (offsetParent === null), а не по ширине окна: тот же приём,
             что pick() у канон-стрелок §5. */
          if (main.offsetParent === null) openFullview(thumbs, year, nums, i);
          else select(i);
        });
      });
      main.addEventListener("click", () =>
        openFullview(thumbs, year, nums, Math.max(0, thumbs.findIndex((t) => t.classList.contains("is-active")))));

      select(0);
      return card;
    };

    /* ---------- табы + рельсы (по рельсу на год) ---------- */
    YEARS.forEach(([year, list]) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "expo-year";
      tab.id = `expo-tab-${year}`;
      tab.dataset.year = year;
      tab.textContent = year;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", `expo-pane-${year}`);
      tabsBox.append(tab);

      const pane = document.createElement("div");
      pane.className = "about-expo-rail";
      pane.id = `expo-pane-${year}`;
      pane.dataset.year = year;
      pane.tabIndex = 0;
      pane.setAttribute("role", "tabpanel");
      pane.setAttribute("aria-labelledby", tab.id);
      let at = 0;
      chunks(list.length).forEach((size) => {
        pane.append(buildCard(year, list.length, at + 1, list.slice(at, at + size)));
        at += size;
      });
      panesBox.append(pane);
    });

    const tabs  = [...tabsBox.querySelectorAll(".expo-year")];
    const panes = [...panesBox.querySelectorAll(".about-expo-rail")];

    const selectYear = (year, focusTab) => {
      tabs.forEach((t) => {
        const on = t.dataset.year === year;
        t.classList.toggle("is-selected", on);
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;              // роверный фокус: по табам ходят стрелками, не Tab'ом
        if (!on) return;
        if (focusTab) t.focus();
        /* активный таб в свайп-строке моба подтягиваем сами: scrollIntoView утянул бы
           и страницу по вертикали. Позицию берём от живой геометрии, не от offsetLeft
           (у него другой отсчёт — от offsetParent, а не от скролл-контейнера). */
        if (tabsBox.scrollWidth > tabsBox.clientWidth) {
          const r = t.getBoundingClientRect(), box = tabsBox.getBoundingClientRect();
          tabsBox.scrollTo({ left: r.left - box.left + tabsBox.scrollLeft - (box.width - r.width) / 2, behavior: flow() });
        }
      });
      panes.forEach((p) => {
        p.hidden = p.dataset.year !== year;
        if (!p.hidden) p.scrollTo({ left: 0, behavior: "auto" });
      });
    };

    tabs.forEach((t) => t.addEventListener("click", () => selectYear(t.dataset.year, false)));
    tabsBox.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      let to = d ? (i + d + tabs.length) % tabs.length : -1;
      if (e.key === "Home") to = 0;
      if (e.key === "End") to = tabs.length - 1;
      if (to < 0) return;
      e.preventDefault();
      selectYear(tabs[to].dataset.year, true);
    });

    /* ---------- стрелки: листание ровно на одну карточку (канон §5) ---------- */
    const nav = root.querySelector(".about-expo-nav");
    const visiblePane = () => panes.find((p) => !p.hidden) || panes[0];
    /* кромки считаем от ЖИВОЙ геометрии (rect против rect + scrollLeft): offsetLeft
       отсчитывается от offsetParent и на разных предках молча разъезжается */
    const edges = (t) => {
      const b = t.getBoundingClientRect().left - t.scrollLeft;
      return [...t.children]
        .filter((k) => k.getBoundingClientRect().width > 0)
        .map((k) => Math.round(k.getBoundingClientRect().left - b));
    };
    const stepOnce = (dir) => {
      const t = visiblePane();
      const cur = t.scrollLeft;
      const max = t.scrollWidth - t.clientWidth;
      if (max <= 0) return;                                  // весь набор влез — листать нечего
      /* ПОЛЕ ОБЯЗАНО ВЫЧИТАТЬСЯ: кромка карточки и позиция скролла, при которой карточка
         встаёт к полю, отличаются ровно на него (грабля канона №14а — целились в кромку,
         snap утягивал ленту обратно).
         ⚠ Канон берёт поле через parseFloat(getComputedStyle(t).scrollPaddingLeft) — здесь
         это НЕ РАБОТАЕТ: у рельса поле записано математической функцией
         max(--about-pad, (100% − 1848)/2), getComputedStyle отдаёт её НЕРАСКРЫТОЙ строкой
         («max(36px, 50% - 924px)»), parseFloat даёт NaN, а канонное `|| 0` молча превращает
         его в ноль. Замер: клик «вперёд» целился в 36 вместо 1093, mandatory-snap возвращал
         ленту на 0 — стрелка «не работала», хотя код отрабатывал.
         Берём поле из ЖИВОЙ геометрии: первая кромка и есть левое поле (у карточек нет
         margin), а scroll-padding у рельса задан ТЕМ ЖЕ выражением, что и padding. */
      const raw = edges(t);
      const stops = raw.map((e) => e - raw[0]);
      if (stops.length < 2) return;                          // одна карточка — шага нет
      const target = dir > 0 ? stops.find((e) => e > cur + 2)
                             : [...stops].reverse().find((e) => e < cur - 2);
      /* №14б — цикл: кромки впереди нет, значит стоим на последней. Считаем именно по
         ОТСУТСТВИЮ кромки, а не по упору в max: у ленты с обрезанной последней карточкой
         max меньше её кромки, и последняя карточка проскакивалась бы. */
      const wrap = dir > 0 ? 0 : Math.min(stops[stops.length - 1], max);
      let to = target == null ? wrap : Math.min(Math.max(target, 0), max);
      if (dir > 0 && to <= cur + 2) to = 0;
      if (dir < 0 && to >= cur - 2) to = Math.min(stops[stops.length - 1], max);
      t.scrollTo({ left: to, behavior: flow() });
    };
    if (nav) {
      const btns = [...nav.querySelectorAll("[data-expo-dir]")];
      btns.forEach((b) => b.addEventListener("click", () => stepOnce(Number(b.dataset.expoDir))));
      /* цикличный рельс стрелки НЕ гасит (канон): «конца» у ленты нет и серая стрелка
         врала бы. Гасим только когда листать реально нечего — набор влез целиком. */
      const sync = () => {
        const t = visiblePane();
        const dead = !(edges(t).length >= 2 && t.scrollWidth - t.clientWidth > 0);
        btns.forEach((b) => { b.disabled = dead; });
      };
      panes.forEach((p) => p.addEventListener("scroll", sync, { passive: true }));
      window.addEventListener("resize", sync);
      /* рельсы наполняются и показываются позже первого sync (скрытый рельс = 0 ширины) —
         ResizeObserver снимает это разом для всех */
      if (typeof ResizeObserver === "function") {
        const ro = new ResizeObserver(sync);
        panes.forEach((p) => ro.observe(p));
      }
      sync();
    }

    /* ---------- фулвью (эталон 2184:36730) ---------- */
    const fv      = root.querySelector(".expo-fullview");
    const fvImg   = root.querySelector(".expo-fullview-img");
    const fvRail  = root.querySelector(".expo-fullview-rail");
    const fvClose = root.querySelector(".expo-fullview-close");
    let fvYear = null, fvNums = [], fvIndex = 0, fvReturn = null;

    const fvShow = (i) => {
      if (!fvNums.length) return;
      fvIndex = i;
      fvImg.src = frame(fvYear, fvNums[i]);
      fvImg.alt = label(fvYear);
      [...fvRail.children].forEach((t, k) => {
        t.classList.toggle("is-selected", k === i);
        t.setAttribute("aria-current", k === i ? "true" : "false");
      });
    };
    /* рейка фулвью — КЛОНЫ миниатюр карточки, а не копия разметки: статичный дубль
       разъедется при первой же смене набора фото. Соответствие держим по ИНДЕКСУ,
       не по src (файлы в наборе могут повторяться). */
    const openFullview = (thumbs, year, nums, index) => {
      if (!fv) return;
      fvYear = year;
      fvNums = nums;
      fvRail.replaceChildren(...thumbs.map((t, i) => {
        const copy = t.cloneNode(true);
        copy.classList.remove("is-active");
        copy.removeAttribute("id");
        copy.addEventListener("click", () => fvShow(i));
        return copy;
      }));
      fvReturn = document.activeElement;
      fv.hidden = false;
      document.body.classList.add("expo-fullview-open");
      fvShow(index);
      fvClose.focus();
    };
    const closeFullview = () => {
      if (!fv || fv.hidden) return;
      fv.hidden = true;
      document.body.classList.remove("expo-fullview-open");
      fvRail.replaceChildren();
      /* src СНИМАЕМ, а не обнуляем: src="" резолвится в URL страницы, браузер честно
         тянет её как картинку и роняет ошибку в консоль (грабля канона). */
      fvImg.removeAttribute("src");
      if (fvReturn && fvReturn.isConnected) fvReturn.focus();
      fvReturn = null;
    };
    if (fv) {
      fvClose.addEventListener("click", closeFullview);
      fv.addEventListener("click", (e) => { if (e.target === fv) closeFullview(); });
      document.addEventListener("keydown", (e) => {
        if (fv.hidden) return;
        if (e.key === "Escape") { closeFullview(); return; }
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        fvShow((fvIndex + d + fvNums.length) % fvNums.length);
      });
    }

    selectYear(YEARS[0][0], false);
  })();

  /* ── свайп-карусели: точки-индикатор (моб-канон п.4 — точки вместо реек миниатюр) ──
     Разметку точек строим здесь, а не в HTML: количество кадров у рельса меняется
     от ширины (у выставок на мобе к главному кадру добавляются три миниатюры через
     display:contents), да и на десктопе точек нет вовсе. Без JS рельс остаётся
     обычным свайп-рельсом — деградация мягкая. */
  document.querySelectorAll("[data-rail]").forEach((rail) => {
    const dots = document.createElement("div");
    dots.className = "rail-dots";
    dots.setAttribute("aria-hidden", "true");   /* декор: листаем свайпом, дубля-навигации не заводим */
    rail.after(dots);

    /* Шаг = ширина первого слайда + гэп ленты. Считаем от живой геометрии, а не от
       числа детей: у выставок обёртка миниатюр — display:contents, её детей в
       children нет, а слайдами они становятся. */
    const step = () => {
      const first = rail.firstElementChild;
      const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
      const w = first ? first.getBoundingClientRect().width : rail.clientWidth;
      return w + gap;
    };

    const build = () => {
      const count = rail.clientWidth ? Math.round(rail.scrollWidth / rail.clientWidth) : 0;
      dots.hidden = count < 2;                  /* один кадр — индикатор бессмысленен */
      if (dots.childElementCount !== count) {
        dots.replaceChildren(...Array.from({ length: Math.max(count, 0) }, () => document.createElement("span")));
      }
      mark();
    };

    const mark = () => {
      const s = step();
      const i = s > 0 ? Math.round(rail.scrollLeft / s) : 0;
      [...dots.children].forEach((el, n) => el.classList.toggle("is-on", n === i));
    };

    rail.addEventListener("scroll", () => {
      window.cancelAnimationFrame(rail._dotRaf);
      rail._dotRaf = window.requestAnimationFrame(mark);
    }, { passive: true });

    if (window.ResizeObserver) new ResizeObserver(build).observe(rail);
    build();
  });

  /* ── цифры производства: докрутка при первом входе в кадр ──
     Откуда→куда лежит в data-* разметки (data-count-from / -to / -decimals), на экран
     печатаем русский формат — десятая через ЗАПЯТУЮ. Пуск РОВНО один: наблюдатель
     отписывается первым же срабатыванием, повторный скролл ничего не перезапускает.
     prefers-reduced-motion (или нет IntersectionObserver) → в разметке уже стоят
     финальные значения, мы их просто не трогаем. Глобальный reduced-motion-блок
     tokens.css тут НЕ помощник: он гасит CSS-анимации, а докрутка живёт на rAF.

     Блок-скоуп — потому что about.js пишут несколько рук: общие имена (ru/ease/jobs/step)
     в теле IIFE столкнулись бы с чужим куском. */
  {
  const counters = [...document.querySelectorAll("[data-count-to]")];
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
             || !("IntersectionObserver" in window);

  if (counters.length && !still) {
    const COUNT_MS = 1400;
    const ru   = (v, d) => v.toFixed(d).replace(".", ",");
    const ease = (t) => 1 - Math.pow(1 - t, 3);          /* easeOutCubic: резкий старт, мягкая посадка */

    /* Русский счёт: обратная докрутка 30 → 15 проходит через 24…21, где «дней» обязано
       стать «дня»/«день» — иначе полсекунды на экране висит «22 ДНЕЙ». Формы берём из
       data-plural («день|дня|дней»), слово стоит ПОСЛЕДНИМ в строке, так что его ширина
       никого не двигает и запирать её не нужно. */
    const plural = (n, forms) => {
      const h = Math.abs(n) % 100, t = h % 10;
      if (h > 10 && h < 20) return forms[2];
      if (t === 1) return forms[0];
      if (t > 1 && t < 5) return forms[1];
      return forms[2];
    };

    const jobs = counters.map((el) => {
      const lock = el.parentElement;                     /* .stat-item-count — замок ширины */
      const unit = lock.parentElement.querySelector("[data-plural]");
      return {
        el, lock, unit,
        forms: unit ? unit.dataset.plural.split("|") : null,
        from:  parseFloat(el.dataset.countFrom),
        to:    parseFloat(el.dataset.countTo),
        d:     Number(el.dataset.countDecimals) || 0,
      };
    });

    /* Согласуем слово с тем, что РЕАЛЬНО на экране: форму берём от уже округлённой
       строки, иначе на 21.6 число покажет «22», а слово согласуется с 21. */
    const show = (j, v) => {
      const s = ru(v, j.d);
      j.el.textContent = s;
      if (j.unit) j.unit.textContent = plural(Number(s.replace(",", ".")), j.forms);
    };

    jobs.forEach((j) => show(j, j.from));               /* старт ставим сразу: блок глубоко под сгибом */

    /* Самая широкая цифра шрифта — ЗАМЕРОМ, не на глаз. Догадка тут ломается:
       в Simplepro Display шире всех «4» (29.47px), а привычное «8» — 27.55px, и маска
       «8888» (110.14px) оказалась бы УЖЕ финального «6000» (113.94px), то есть замок
       не удержал бы ничего. Числа — при канонном кегле цифры 52 (перемерены 22.07, когда
       кегль привели к макету); сам вывод от кегля не зависит, «4» шире «8» на любом.
       Меряем в момент пуска: к этой прокрутке вебшрифт загружен. */
    const widestDigit = (host) => {
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
      host.append(probe);
      let best = "0", max = -1;
      for (const dg of "0123456789") {
        probe.textContent = dg;
        const w = probe.getBoundingClientRect().width;
        if (w > max) { max = w; best = dg; }
      }
      probe.remove();
      return best;
    };

    const io = new IntersectionObserver((entries, obs) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      obs.disconnect();                                   /* один прогон на жизнь страницы */

      /* Замок: двойник самой длинной строки диапазона, все разряды — самой широкой цифрой.
         Держим ТОЛЬКО на время докрутки и снимаем на финише: покой обязан быть 1:1 макетом,
         без лишнего зазора перед единицей измерения. */
      const dg = widestDigit(counters[0]);
      jobs.forEach((j) => {
        const a = ru(j.from, j.d), b = ru(j.to, j.d);
        j.lock.dataset.lock = (a.length >= b.length ? a : b).replace(/\d/g, dg);
      });

      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / COUNT_MS, 1);
        const k = ease(p);
        jobs.forEach((j) => show(j, j.from + (j.to - j.from) * k));
        if (p < 1) { requestAnimationFrame(step); return; }
        jobs.forEach((j) => { delete j.lock.dataset.lock; });
      };
      requestAnimationFrame(step);
    }, { rootMargin: "0px 0px -15% 0px" });               /* пуск, когда верх блока прошёл 85% высоты кадра */

    io.observe(counters[0].closest(".about-production-stats") || counters[0]);
  }
  }

  /* ── панорама задников: фото ездит по горизонтали, пока секция идёт через кадр ──
     Считаем только прогресс (число −1…1) и кладём его в --pano-p; всю геометрию
     (запас по краям, амплитуду, отключение на мобе и под reduced-motion) держит CSS —
     одна ручка --pano-amp. Поэтому здесь НЕТ проверки prefers-reduced-motion:
     при --pano-amp:0 множитель обнуляет ход, что бы ни насчитал этот код. */
  const panos = document.querySelectorAll("[data-pano]");
  if (panos.length) {
    const live = new Set();
    let raf = 0;

    const paint = () => {
      raf = 0;
      const vh = window.innerHeight;
      live.forEach((img) => {
        /* меряем СЕКЦИЮ, а не само фото: фото уже сдвинуто трансформом,
           мерить его — считать собственный хвост. */
        const box = img.parentElement.getBoundingClientRect();
        const span = vh + box.height;
        const t = span > 0 ? (vh - box.top) / span : 0.5;   /* 0 — секция входит снизу, 1 — вышла сверху */
        const p = 1 - 2 * Math.min(Math.max(t, 0), 1);      /* +1 … −1 */
        img.style.setProperty("--pano-p", p.toFixed(4));
      });
    };
    const tick = () => { if (!raf) raf = window.requestAnimationFrame(paint); };

    /* считаем только пока секция в кадре — на остальной странице ход бесплатный */
    /* rootMargin в пол-экрана: без него секция вылетает из live РОВНО на кромке кадра,
       и крайние значения прогресса (p → ±1) никогда не успевают отрисоваться — ход
       обрезается с обоих концов. Замер до правки на 360: пред-футерный блок отдавал
       p ∈ [−0.12 … 0.97] вместо [−1 … 1], то есть амплитуду 13 вместо 24. Запас в 50%
       даёт дорисовать края и стоит ноль: за пределами этой зоны ход по-прежнему не считается. */
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? live.add(e.target) : live.delete(e.target)));
      tick();
    }, { rootMargin: "50% 0px" });
    panos.forEach((img) => io.observe(img));

    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick, { passive: true });
    tick();
  }
})();

/* ── СЦЕНА ПЕРВОГО ЭКРАНА: фото завода → маска-вордмарк → серый вордмарк ──
   Макет-секция 2222:138436 (кадры step1…step4). Идиома — home/js/block4.js: длинный
   трек + липкий пин, прогресс из getBoundingClientRect, никаких таймеров и слушателя
   мыши. Скрипт считает ОДНО число p (0…1) и раскладывает его по CSS-переменным;
   вся геометрия живёт в css/about.css §1a.

   ФАЗЫ (границы подобраны по кадрам макета, не на глаз):
     p 0.00…0.30  состояние 1 → 2: масштаб фото 1.76 → 1.00 (1.00 = object-fit:cover,
                  то есть панорама целиком, кадр всё равно фулскрин);
     p 0.30…0.60  состояние 2 → 3: белое сходится к логотипу — гаснет фото без маски,
                  проявляется то же фото под маской-вордмарком, приходит заголовок;
     p 0.60…0.86  состояние 3 → 4: фото под маской гаснет, из-под него остаются
                  СВЕТЛО-СЕРЫЕ буквы — тот самый .about-hero-watermark;
     p 0.86…1.00  выстой на состоянии 4, чтобы отлипание пина не пришлось на движение.
   Дальше пин отлипает, а вордмарк с ТОЙ ЖЕ экранной позиции подхватывает статика
   (блок ниже) — и страница идёт поверх него.

   ⛔ prefers-reduced-motion:reduce — сцена НЕ рождается вовсе (ни слушателей, ни
   data-scene): страница сразу показывает состояние 4. Трек и фото-слои вдобавок
   погашены правилами в about.css — статика держится, даже если JS не доехал. */
(() => {
  const scene = document.querySelector("[data-hero-scene]");
  const pin = scene && scene.querySelector("[data-pin]");
  if (!scene || !pin) return;

  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const wide = matchMedia("(min-width: 45.0625rem)");   /* тот же порог, что у моб-слоя */

  const SCALE_FROM = 1.76;      /* замер кадров макета: step1 крупнее step2 в 1.76 раза */
  const A = 0.30, B = 0.60, C = 0.86;
  let raf = 0, live = false;

  /* доля отрезка [a…b], зажатая в 0…1 */
  const norm = (p, a, b) => Math.min(Math.max((p - a) / (b - a), 0), 1);
  /* smoothstep: у краёв мягко, середину проскакиваем быстрее (идиома block4) */
  const ease = (t) => t * t * (3 - 2 * t);

  const paint = () => {
    raf = 0;
    /* Меряем КОРОБКУ-ОГРАНИЧИТЕЛЬ пина (.about-hero-scene), а не секцию: у секции
       есть ещё нижнее поле --about-block, и по ней трек считался бы длиннее, чем пин
       на самом деле держится. Трек = коробка минус пин — ровно столько скролла
       пин стоит наверху. */
    const host = pin.parentElement;
    const travel = host.offsetHeight - pin.offsetHeight;
    if (travel <= 0) return;
    const p = Math.min(Math.max(-host.getBoundingClientRect().top / travel, 0), 1);

    const scale = SCALE_FROM + (1 - SCALE_FROM) * ease(norm(p, 0, A));
    const fullO = 1 - norm(p, A, B);
    /* маскированное фото проявляется БЫСТРЕЕ, чем гаснет полноэкранное: иначе на
       середине перехода внутри букв стояла бы полупрозрачная каша из двух копий
       одного кадра поверх белого. Так внутри букв всегда чистое фото, а меняется
       только то, что СНАРУЖИ них. */
    const wordO = norm(p, A, A + (B - A) * 0.4) * (1 - norm(p, B, C));
    const textO = norm(p, A + (B - A) * 0.45, B);

    scene.style.setProperty("--intro-scale", scale.toFixed(4));
    scene.style.setProperty("--intro-full-o", fullO.toFixed(4));
    scene.style.setProperty("--intro-word-o", wordO.toFixed(4));
    scene.style.setProperty("--intro-text-o", textO.toFixed(4));

    /* служебные метки для приёмки — читаются из браузера числами, а не «на глаз» */
    scene.dataset.progress = p.toFixed(4);
    scene.dataset.scale = scale.toFixed(3);
    scene.dataset.photo = fullO.toFixed(3);
    scene.dataset.word = wordO.toFixed(3);
    scene.dataset.heading = textO.toFixed(3);
    scene.dataset.state = p < A ? "1-2" : p < B ? "2-3" : p < C ? "3-4" : "4";
  };

  const tick = () => { if (!raf) raf = requestAnimationFrame(paint); };

  const on = () => {
    if (live) return;
    live = true;
    scene.dataset.scene = "on";
    addEventListener("scroll", tick, { passive: true });
    addEventListener("resize", tick);
    paint();
  };
  const off = () => {
    if (!live) return;
    live = false;
    removeEventListener("scroll", tick);
    removeEventListener("resize", tick);
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    delete scene.dataset.scene;
    ["--intro-scale", "--intro-full-o", "--intro-word-o", "--intro-text-o"]
      .forEach((n) => scene.style.removeProperty(n));
    ["progress", "scale", "photo", "word", "heading", "state"]
      .forEach((n) => delete scene.dataset[n]);
  };

  const sync = () => (!still.matches && wide.matches ? on() : off());
  sync();
  still.addEventListener("change", sync);
  wide.addEventListener("change", sync);
})();

/* ── СТАТИЧНЫЙ ХЕРО-ВОРДМАРК (пункт 5 механики секции 2222:138436) ──
   Слово Антона: «лого должно оставаться статичным». Вордмарк стоит НЕПОДВИЖНО
   относительно окна, контент идёт поверх него; у верха футера — отпускаем.
   Геометрия и весь стекинг — в css/about.css §7, здесь только одно число.

   ⛔ ТУТ БЫЛ ПАРАЛЛАКС K=0.8 (сдвиг `(1-K)*(scrollY-enter)`, разгон 0 → 153.64px
   на 1728×900 и 0 → 24.5px на 360×800) — СНЯТ 22.07 вместе с machinery enter/span:
   «статично» и параллакс взаимоисключающи. Ход стал ровно обратным — сдвиг не
   отстаёт от страницы на 0.2, а компенсирует её целиком.

   ТРИ ЧИСЛА, ВСЕ ИЗ ЖИВЫХ ЭЛЕМЕНТОВ, НИ ОДНОГО ПРИБИТОГО:
   · target — экранная высота покоя. Это смещение вордмарка ВНУТРИ пина, оно же
     макетный отступ --about-hero-top (1728 → 250.5, 360 → 24). Ровно на ней сцена
     первого экрана оставляет вордмарк, когда пин прилип к inset-block-start:0, —
     поэтому шов «конец сцены → статика» бесшовен ПО ПОСТРОЕНИЮ: пока пин держит,
     natural совпадает с target и сдвиг тождественно 0. Центр окна тут НЕ при чём:
     прибей мы вордмарк к центру — на стыке был бы скачок (на 1728×900 это 450−250.5
     = 199.5px, замер).
   · natural — где вордмарк оказался бы БЕЗ нашего сдвига. getBoundingClientRect
     у сдвинутого элемента уже включает transform, поэтому текущий сдвиг вычитаем:
     не вычесть — значит дать замеру гнать самого себя.
   · footTop — верх футера, живым rect'ом каждый кадр. НЕ константа: замер одной
     ширины (9063 на 1728) прибитый в код разъехался бы на первой правке контента.
     Когда верх футера поднимается выше низа вордмарка, разность уходит в минус и
     ВЫТАЛКИВАЕТ вордмарк вверх со скоростью страницы — то самое «держать до верха
     футера, там отпускать». У футера свой вордмарк, два лого в кадре — брак,
     поэтому граница именно его верх, а не его середина и не низ страницы.

   ⛔ prefers-reduced-motion:reduce — скрипт работает ТОЖЕ. Статика есть отсутствие
   движения: заглушить её под reduce значило бы вернуть вордмарку езду. Под reduce
   гасятся сцена первого экрана и панорама задников — настоящее движение.
   Ни таймеров, ни слушателя мыши: один passive-scroll → один rAF на кадр. */
(() => {
  const el = document.querySelector("[data-hold]");
  const slot = document.querySelector(".about-hero-wm-slot");
  if (!el || !slot) return;

  /* ЗАЧЕМ ТАК, А НЕ ТРАНСФОРМОМ. Прежний держатель считал позицию ОТНОСИТЕЛЬНО ПИНА
     (box.top - pin.top) и потому ехал вместе с ним: замер лида — на scrollY 4000
     вордмарк был уже на -1769. Здесь он прибит к ОКНУ (position:fixed), а место
     в потоке держит .about-hero-wm-slot. Горизонталь берём у слота, чтобы лого
     стояло ровно в полосе контента на любой ширине и не разъезжалось с сеткой. */
  const main = document.querySelector("main");
  let foot = null;
  const footEl = () => {
    /* футер приезжает скриптом модуля — ищем лениво; фолбэк на низ main, чтобы
       при его отсутствии лого всё равно не заползло за пределы страницы */
    if (!foot || !foot.isConnected) foot = document.querySelector(".site-footer");
    return foot || main;
  };

  let raf = 0;
  const paint = () => {
    raf = 0;
    const sb = slot.getBoundingClientRect();
    const h = sb.width * 405 / 1848;                 // пропорция макета 1848×405
    /* Коробку пишем в КОРЕНЬ, а не только на сам вордмарк: её обязана читать ещё
       и фото-маска сцены (.about-hero-photo--word). Пока у них были РАЗНЫЕ системы
       координат (маска считала center/--about-hero-top, вордмарк — центр окна),
       на состояниях 3–4 в кадре оказывались ДВА лого сразу. Один источник — одно лого. */
    const root = document.documentElement.style;
    root.setProperty("--wm-left", sb.left.toFixed(2) + "px");
    root.setProperty("--wm-w", sb.width.toFixed(2) + "px");
    root.setProperty("--wm-h", h.toFixed(2) + "px");
    /* ВЕРТИКАЛЬ — ОТ СЛОТА, как и горизонталь (№18). Было «по центру окна»: лого
       садилось ниже своего места в макете и НАЕЗЖАЛО на H1 — замер до правки
       −23.5px @1920×1200, −19.3 @1440×900, −16.3 @1280×800.
       Слот стоит ровно на --about-hero-top (замер: 278 / 208.8 / 185.6 при
       --about-hero-top 278 / 208.8 / 185.6), поэтому «от слота» = «от --about-hero-top»,
       но без парсинга clamp() из переменной — берём живую геометрию.
       Статичность не теряется: элемент по-прежнему position:fixed, число в
       координатах ДОКУМЕНТА постоянно, так что лого стоит неподвижно в окне. */
    const wmTop = sb.top + scrollY;
    root.setProperty("--wm-top", wmTop.toFixed(2) + "px");

    /* ОТПУСК: как только верх футера поднялся выше низа прибитого лого, дальше
       не идём — переводим в absolute РОВНО в той точке документа, где стояли. */
    const f = footEl();
    if (!f) return;
    const fTopDoc = f.getBoundingClientRect().top + scrollY;
    /* scrollY, на котором низ лого достаёт футер. Формула общая: лого висит на wmTop
       от верха окна, значит его низ в документе = scrollY + wmTop + h. Прежняя запись
       (innerHeight + h)/2 была тем же самым, но ЗАШИТА под центрирование по окну —
       с переездом вертикали на слот (№18) она разъехалась бы с реальной позицией. */
    const release = fTopDoc - (wmTop + h);
    if (scrollY > release) {
      el.classList.add("is-released");
      el.style.setProperty("--wm-abs-top", (release + wmTop).toFixed(2) + "px");
    } else {
      el.classList.remove("is-released");
    }
  };

  const tick = () => { if (!raf) raf = requestAnimationFrame(paint); };
  addEventListener("scroll", tick, { passive: true });
  addEventListener("resize", tick);
  /* раскладка меняется и без скролла: футер приезжает скриптом, ленивые картинки
     догружаются, карусель истории меняет высоту */
  if (window.ResizeObserver) new ResizeObserver(tick).observe(document.documentElement);
  addEventListener("load", tick);
  paint();
})();
