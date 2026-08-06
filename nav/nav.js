/* Simple PRO — nav-семья (стенд): данные меню + поведение.
   Один источник данных кормит мега-меню (деск) и оверлей (моб). */

/* Данные сняты с живого simple-pro.com 20.07 (curl /catalog/ + страница каждого раздела):
   7 разделов, 59 пунктов, порядок — как в меню сайта. Рыбу не держим: расхождения
   были боевые (СЛЕМА→CHEMA, СТ-15→СТ-13, раздевалки целиком, «Стол пристенный» и
   «химический с тех. приставкой» не существуют).
   «Тумбы» в /catalog/ есть, но в меню сайта НЕ выведены — сюда не берём (слово Антона 20.07).
   Пункт «Шкаф вытяжной демонстрационный» на сайте клиента написан с ЛАТИНСКИМИ «o»
   (3 шт) — у себя пишем чистой кириллицей, клиенту это отдельной находкой. */
const MENU = [
  { title: "Вытяжные шкафы", items: [
    "Шкаф вытяжной химический", "Шкаф вытяжной металлический", "Шкаф вытяжной панорамный",
    "Шкаф вытяжной напольный", "Шкаф вытяжной для\u00A0муфельных печей", "Зонты вытяжные",
    "Кислотостойкий вентилятор",
  ]},
  { title: "Столы лабораторные", items: [
    "Стол лабораторный", "Стол лабораторный усиленный", "Стол лабораторный с\u00A0полкой",
    "Стол лабораторный с\u00A0двумя полками", "Стол лабораторный с\u00A0шкафом-надстройкой",
    "Стол островной", "Стол титровальный", "Стол торцевой", "Стол передвижной",
    "Стол письменный", "Стол лабораторный угловой", "Стол лабораторный угловой с\u00A0полкой",
    "Стол лабораторный угловой с\u00A0двумя полками", "Стол весовой",
    "Стол весовой комбинированный", "Тележка передвижная",
  ]},
  { title: "Шкафы лабораторные", items: [
    "Шкаф для\u00A0реактивов кислотостойкий", "Шкаф для\u00A0реактивов", "Шкаф с\u00A0выдвижной колонной",
    "Шкаф для\u00A0приборов", "Шкаф для\u00A0лабораторной посуды", "Шкаф гардеробный",
    "Шкаф для\u00A0документов", "Шкаф навесной", "Шкаф для\u00A0газовых баллонов",
    "Стеллаж лабораторный СТ-12", "Стеллаж лабораторный с\u00A0ограничителями СТ-13",
  ]},
  { title: "Мойки лабораторные", items: [
    "Мойки лабораторные химические", "Мойки лабораторные металлические", "Мойки лабораторные",
    "Столы-мойки", "Столы-мойки торцевые", "Стол-мойка (угловой)",
    "Стол-мойка (угловой) с\u00A0полкой", "Стол-мойка (угловой) с\u00A0двумя полками",
    "Настенный сушильный стеллаж",
  ]},
  { title: "Кабинеты химии/физики", items: [
    "Шкаф вытяжной демонстрационный", "Стол учащегося", "Стол лабораторный учащегося",
    "Стол лабораторный преподавателя", "Стол лабораторный демонстрационный",
  ]},
  { title: "Стулья лабораторные", items: [
    "Стул лабораторный CHEMA", "Стул антистатический CHEMA ESD", "Стул лабораторный С2",
    "Табурет лабораторный ДЕКО", "Табурет антистатический ДЕКО ESD", "Табурет лабораторный Т2",
  ]},
  { title: "Раздевалки", items: [
    "Шкаф для\u00A0раздевалок односекционный", "Шкаф для\u00A0раздевалок двухсекционный",
    "Шкаф для\u00A0раздевалок односекционный со\u00A0скамейкой",
    "Шкаф для\u00A0хранения четырехсекционный", "Скамейка",
  ]},
];

const THUMBS = [
  "../assets/figma/adv-pic1.png", "../assets/figma/adv-pic2.png",
  "../assets/figma/adv-pic3.png", "../assets/figma/adv-pic4.png",
];
const thumb = (i) => THUMBS[i % THUMBS.length];

/* ---------- деск: категории + мега-меню ---------- */
function buildCats(rowEl, compact) {
  MENU.forEach((cat, ci) => {
    const wrap = document.createElement("div");
    wrap.className = "cat-wrap";
    const btn = document.createElement("button");
    btn.className = "menu-btn menu-btn--cat";
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-haspopup", "true");
    btn.textContent = cat.title;
    const panel = document.createElement("div");
    panel.className = "nav-mega-menu";
    panel.setAttribute("role", "menu");
    /* Пункты — ТОЛЬКО текстом (правка Антона 29.07, №6: «миниатюры убираем из меню
       полностью»). Картинки были заглушками adv-pic*.png, к товарам отношения не имели. */
    cat.items.forEach((name) => {
      const a = document.createElement("a");
      a.className = "mega-item";
      a.href = "#";
      a.setAttribute("role", "menuitem");
      a.textContent = name;
      panel.append(a);
    });
    wrap.append(btn, panel);
    rowEl.append(wrap);

    let closeTimer = null;
    const open = () => {
      clearTimeout(closeTimer);
      closeAllMega();
      wrap.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      /* флаг всегда левый; если панель вылезает за экран — сдвигаем ровно на перелив */
      panel.style.left = "0";
      const over = panel.getBoundingClientRect().right - (window.innerWidth - edgeGap());
      if (over > 0) panel.style.left = `-${over / rootFs()}rem`;
    };
    const close = () => {
      wrap.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    };
    const closeSoon = () => { closeTimer = setTimeout(close, 250); };
    btn.addEventListener("click", () => (wrap.classList.contains("is-open") ? close() : open()));
    wrap.addEventListener("mouseenter", open);
    wrap.addEventListener("mouseleave", closeSoon);
    wrap.addEventListener("focusout", (e) => { if (!wrap.contains(e.relatedTarget)) close(); });
  });
}
function closeAllMega() {
  document.querySelectorAll(".cat-wrap.is-open").forEach((w) => {
    w.classList.remove("is-open");
    w.querySelector(".menu-btn--cat").setAttribute("aria-expanded", "false");
  });
}

document.querySelectorAll("[data-cats]").forEach((el) => buildCats(el));

/* ---------- Регион: дропдаун (список перенесён с продуктовой) ---------- */
const REGIONS = ["Москва", "Санкт-Петербург", "Регионы"];

function buildRegion(wrap) {
  const btn = wrap.querySelector("[data-region-btn]");
  const label = wrap.querySelector("[data-region-label]");
  const menu = wrap.querySelector("[data-region-menu]");
  if (!btn || !menu) return;

  const close = () => { wrap.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); };
  const open = () => {
    closeAllMega();               // категории и регион не висят открытыми вдвоём
    closeAllRegions(wrap);
    wrap.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    /* панель прижата влево; вылезла за экран — сдвигаем ровно на перелив (как у мега) */
    menu.style.left = "0";
    const over = menu.getBoundingClientRect().right - (window.innerWidth - edgeGap());
    if (over > 0) menu.style.left = `-${over / rootFs()}rem`;
  };

  REGIONS.forEach((name) => {
    const item = document.createElement("button");
    item.className = "mega-item";
    item.type = "button";
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", String(name === label.textContent));
    item.textContent = name;
    item.addEventListener("click", () => {
      label.textContent = name;
      menu.querySelectorAll(".mega-item").forEach((el) =>
        el.setAttribute("aria-selected", String(el === item)));
      close();
      btn.focus();
    });
    menu.append(item);
  });

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    wrap.classList.contains("is-open") ? close() : open();
  });
  wrap.addEventListener("focusout", (e) => { if (!wrap.contains(e.relatedTarget)) close(); });
  wrap._closeRegion = close;
}

function closeAllRegions(except) {
  document.querySelectorAll(".region-wrap").forEach((w) => { if (w !== except) w._closeRegion?.(); });
}

document.querySelectorAll(".region-wrap").forEach(buildRegion);

/* клик мимо и Esc гасят всё открытое разом */
document.addEventListener("click", (e) => {
  if (!e.target.closest(".region-wrap")) closeAllRegions();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeAllMega(); closeAllRegions(); closeOverlay(); }
});

/* ---------- поиск: раскрытие строки влево до лого ----------
   Ширину считаем живьём: «до лого» = до левого края .nav-rows. Прибить её в CSS
   нельзя — расстояние зависит от ширины окна и от кегля чипов. */
document.querySelectorAll("[data-search]").forEach((wrap) => {
  const field = wrap.querySelector(".search-field");
  const btn = wrap.querySelector("[data-search-btn]");
  const rows = wrap.closest(".nav-rows");
  if (!field || !rows) return;

  const open = () => {
    const w = wrap.getBoundingClientRect().right - rows.getBoundingClientRect().left;
    field.style.width = `${w / rootFs()}rem`;
    field.tabIndex = 0;
    wrap.classList.add("is-open");
  };
  const close = () => {
    field.style.width = "0";
    field.tabIndex = -1;
    wrap.classList.remove("is-open");
  };
  /* уводим мышь — сворачиваем, но только если внутри не сидит фокус (набирают текст) */
  const closeIfIdle = () => { if (!wrap.contains(document.activeElement)) close(); };

  wrap.addEventListener("mouseenter", open);
  wrap.addEventListener("mouseleave", closeIfIdle);
  btn.addEventListener("click", () => { open(); field.focus(); });
  field.addEventListener("focus", open);
  field.addEventListener("blur", close);
  field.addEventListener("keydown", (e) => { if (e.key === "Escape") { close(); btn.focus(); } });
  /* окно поехало при раскрытом поиске — пересчитываем, иначе строка «промахнётся» мимо лого */
  window.addEventListener("resize", () => { if (wrap.classList.contains("is-open")) open(); });
});

/* ---------- хедер: НАПРАВЛЕННЫЙ скролл (механика по образцу живого simple-pro.com) ----------
   Отдельного короткого хедера нет — один и тот же узел в трёх видах:
     верх страницы   → полный, подложки нет;
     скролл ВНИЗ     → .is-collapsed: остаётся ряд категорий на подложке;
     скролл ВВЕРХ    → полный закреплённый (.is-pinned), подложка есть.
   Хедер fixed, поэтому переключение не двигает контент вообще — дёргаться нечему.

   Два независимых порога, и путать их нельзя:
     PIN_AT  — «верх страницы»: выше него подложки нет, состояние всегда полное;
     DIR_EPS — антидребезг НАПРАВЛЕНИЯ. Дельту не сбрасываем, пока она меньше порога,
               а КОПИМ: иначе инерция и микроскролл трекпада дёргали бы хедер на ±2px,
               а медленный, но настоящий скролл не сработал бы вовсе. */
const fullHeader = document.querySelector(".nav-header");
const PIN_AT = 8;
const DIR_EPS = 9;

/* Режим — стендовый тумблер (см. index.html), дефолт направленный. Клиент выбирает
   на созвоне; после выбора проигравшая ветка УДАЛЯЕТСЯ, а не остаётся флагом. */
/* ⚠ REM-ЗУМ (21.07). На полосе 768–1230 стоит html { font-size: 1.25vw }, то есть
   1rem ТАМ НЕ РАВЕН 16px (9.6px@768). Любой хардкод «px → rem делением на 16» и любой
   отступ, прибитый в px, под зумом разъезжаются с вёрсткой. Поэтому:
   · rootFs() — фактический корневой кегль, единственный законный делитель px→rem;
   · edgeGap() — поле от края экрана в ТЕХ ЖЕ единицах, что и вёрстка (1.5rem), а не «24».
   Подробности — ../../ds/rem-zoom-plan.md §③. */
const rootFs = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
const edgeGap = () => 1.5 * rootFs();          /* было прибито 24px = 1.5rem при кегле 16 */

const headerMode = () => document.documentElement.dataset.navMode || "directional";

let lastY = window.scrollY;
let wantCollapsed = false;
let ticking = false;

const applyHeader = () => {
  /* тот же закон общей земли, что и у листа: страница-хозяин может не иметь
     деск-хедера вовсе (моб-only шаблон), и падать из-за этого модуль не вправе */
  if (!fullHeader) return;
  const atTop = window.scrollY <= PIN_AT;
  const collapsed = !atTop && wantCollapsed && headerMode() === "directional";
  fullHeader.classList.toggle("is-pinned", !atTop);
  fullHeader.classList.toggle("is-collapsed", collapsed);
  /* в свёрнутом виде верхнего ряда нет — открытый дропдаун региона висел бы в пустоте */
  if (collapsed) closeAllRegions();
};

const readScroll = () => {
  ticking = false;
  const y = Math.max(0, window.scrollY);
  if (y <= PIN_AT) { wantCollapsed = false; lastY = y; applyHeader(); return; }
  const dy = y - lastY;
  if (Math.abs(dy) < DIR_EPS) return;   // дребезг: направление ещё не набралось
  lastY = y;
  wantCollapsed = dy > 0;
  applyHeader();
};

window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(readScroll);
}, { passive: true });
/* переключение тумблера на стенде: перерисовать состояние без ожидания скролла */
window.addEventListener("nav:mode", applyHeader);
applyHeader();

/* ---------- копи-кнопки ⧉ ---------- */
document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      /* Канон Антона 21.07: галка держится «пару секунд». Держим ту же длительность,
         что и копи-кнопки продуктовой (app.js) — состояние одно, значит и время одно.
         ⚠ ДВА ИМЕНИ, и это не дубль: `.is-copied` — словарь модуля, на него отвечает
         только `.nav-header` (nav.css §КАНОН «СКОПИРОВАНО»); `copied` — общий канон
         дома (`components.css: .copy-btn.copied`). Копи-кнопки на страницах-хозяевах
         (хаб «Покупателю» и др.) грузят nav.js, но НЕ app.js — без второго имени галка
         у них не рисовалась вовсе, и это ровно пункт A11 резки. Вне `.copy-btn` имя
         инертно, поэтому в шапке ничего не меняется. */
      btn.classList.add("is-copied", "copied");
      setTimeout(() => btn.classList.remove("is-copied", "copied"), 2000);
    } catch { /* clipboard недоступен (http) — молча */ }
  });
});

/* ---------- моб: лист меню над баром, два экрана, бургер ↔ X ---------- */
/* ⚠ ОБЩАЯ ЗЕМЛЯ: модуль подключён скриптом и к стенду, и к продуктовой. Узлы,
   которые на одной странице есть, а на другой могут не появиться, берём с
   null-guard'ом на КАЖДОМ — один упавший querySelector рвёт весь файл, и вместе
   с меню умирают хедер, регион и копи-кнопки, которые к нему отношения не имеют. */
const ARROW_SVG = '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';

const sheet = document.querySelector(".nav-menu-sheet");
const bottomBar = document.querySelector(".nav-bottom-bar");
const burger = document.querySelector("[data-burger]");
const rootPanel = sheet?.querySelector("[data-panel-root]") || null;
const catPanel = sheet?.querySelector("[data-panel-cat]") || null;
const catTitle = catPanel?.querySelector("[data-cat-title]") || null;
const catHero = catPanel?.querySelector("[data-cat-hero]") || null;
const catList = catPanel?.querySelector("[data-cat-list]") || null;

function openSheet() {
  if (!sheet) return;
  sheet.classList.add("is-open");
  bottomBar?.classList.add("is-menu-open");
  burger?.setAttribute("aria-expanded", "true");
  showRoot();
}
/* Имя историческое (оверлей был отдельным узлом) — зовётся ещё и из общего
   Esc-обработчика выше, поэтому оно обязано быть безопасным при отсутствии листа. */
function closeOverlay() {
  if (!sheet) return;
  sheet.classList.remove("is-open");
  bottomBar?.classList.remove("is-menu-open");
  burger?.setAttribute("aria-expanded", "false");
}
function showRoot() {
  if (!rootPanel || !catPanel) return;
  rootPanel.hidden = false;
  catPanel.hidden = true;
}
function showCat(cat) {
  if (!rootPanel || !catPanel || !catList) return;
  rootPanel.hidden = true;
  catPanel.hidden = false;
  if (catTitle) catTitle.textContent = cat.title;
  if (catHero) catHero.src = thumb(MENU.indexOf(cat));
  catList.innerHTML = "";
  cat.items.forEach((name) => {
    const a = document.createElement("a");
    a.className = "sheet-flat-item";
    a.href = "#";
    a.textContent = name;
    catList.append(a);
  });
  /* Скроллит ПАНЕЛЬ, а не лист (см. nav.css: у второго уровня едет только список).
     Возврат к началу нужен обоим: без него список подкатегорий открывался бы
     domотанным до места, где юзер бросил предыдущую категорию. */
  catList.scrollTop = 0;
  rootPanel.scrollTop = 0;
}

/* Строка листа — только текст: миниатюры сняты из меню целиком (№6, Антон 29.07),
   поэтому параметра thumbSrc у строки больше нет. */
function sheetRow(label, { onClick = null } = {}) {
  const el = document.createElement(onClick ? "button" : "a");
  el.className = "sheet-item";
  if (onClick) { el.type = "button"; el.addEventListener("click", onClick); } else { el.href = "#"; }
  const lead = document.createElement("span");
  lead.className = "item-lead";
  lead.append(document.createTextNode(label));
  el.append(lead);
  el.insertAdjacentHTML("beforeend", ARROW_SVG);
  return el;
}

const rootList = rootPanel?.querySelector("[data-root-list]");
if (rootList) {
  MENU.forEach((cat) => rootList.append(sheetRow(cat.title, { onClick: () => showCat(cat) })));
}

const secondaryList = rootPanel?.querySelector("[data-secondary-list]");
if (secondaryList) {
  ["Компания", "Проекты", "Гарантии", "Цены", "Контакты"].forEach((label) => secondaryList.append(sheetRow(label)));
}

burger?.addEventListener("click", () => (sheet?.classList.contains("is-open") ? closeOverlay() : openSheet()));
catPanel?.querySelector(".sheet-back")?.addEventListener("click", showRoot);

/* ---------- закрытие листа: три пути, все ведут в closeOverlay ----------
   1. КРЕСТИК — обязателен и главный: бургер на месте не гаснет, а превращается в X
      (см. nav.css .is-menu-open). Кнопка открытия и закрытия — одна и та же точка
      экрана, промахнуться некуда, и она в зоне большого пальца.
   2. Esc — уже висит в общем обработчике выше вместе с мега-меню и регионом.
      Нужен не телефону, а клавиатуре и тестам: лист — role="dialog", и уход по Esc
      для диалога ожидаем по умолчанию.
   3. СВАЙП ВНИЗ — родной жест для листа, наехавшего снизу; на длинном телефоне
      увести лист пальцем дешевле, чем тянуться к бару.
   Затемнения-подложки и закрытия кликом мимо НЕТ — и это не пропуск: в каноне
   подложки нет (first-2: за листом видно живой контент, не затемнённый), а мимо
   листа остаётся полоска 8px по бокам — целиться в неё пальцем невозможно, такая
   зона закрытия была бы фикцией. */
if (sheet) {
  const SWIPE_MIN = 4;      /* rem — порог «это жест, а не дрожь пальца» */
  const SWIPE_SLOPE = 1.2;  /* dy должен быть заметно больше dx: вниз, а не вбок */
  let sy = 0, sx = 0, armed = false;

  /* Свайп разрешён ТОЛЬКО когда прокручиваемая область стоит в самом верху.
     Иначе жест «листаю список вверх» на первом же пикселе закрывал бы меню —
     ровно та беда, из-за которой свайп-закрытие обычно и ненавидят.
     ⚠ Спрашиваем АКТИВНУЮ панель, а не предков точки касания. Первый заход шёл
     вверх от e.target и ловился на дыре: палец, попавший в собственный padding
     листа, давал e.target === sheet, подъём заканчивался мгновенно, «прокрутки
     нет» — и меню закрывалось поверх домотанного списка. Приёмка это поймала
     (afterSwipeWhileScrolled: false вместо true). У листа ровно две прокрутки
     и обе известны поимённо — спросить их прямо и надёжнее, и короче. */
  const activeScroller = () => (catPanel && !catPanel.hidden ? catList : rootPanel);

  sheet.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    sy = t.clientY;
    sx = t.clientX;
    armed = sheet.classList.contains("is-open") && (activeScroller()?.scrollTop ?? 0) <= 0;
  }, { passive: true });

  sheet.addEventListener("touchend", (e) => {
    if (!armed) return;
    armed = false;
    const t = e.changedTouches[0];
    const dy = t.clientY - sy;
    const dx = Math.abs(t.clientX - sx);
    if (dy > SWIPE_MIN * rootFs() && dy > dx * SWIPE_SLOPE) closeOverlay();
  }, { passive: true });
}

/* ---------- избранное: счётчик в хедере + состояние кнопки товара ----------
   №5-б, слово Антона 29.07: «в хедере должны появляться циферки справа в верхнем
   углу типа сколько добавилось, если ничего – то как сейчас grey 60, если что то –
   то сердце должно заполняться фирменным красным и показывать количество».

   Живёт ЗДЕСЬ, а не отдельным файлом: хедер один на все страницы nav-модуля, этот
   модуль уже подключён каждой из них, а счёт обязан быть сквозным — добавил на
   продуктовой, увидел цифру на главной. Сервера у стенда нет → счёт локальный.
   ⚠ Донорская сборка (корневой index.html) сюда НЕ входит: она nav.js не подключает
   и каноном не является (см. _stands.html). Её хедер живёт своей жизнью.

   Бейдж рисует сам модуль: иначе один и тот же кусок разметки пришлось бы держать
   в шести index.html и синхронизировать руками. Кнопку ищем по aria-label — так
   разметку страниц не трогаем вовсе. */
const FAV_KEY = "sp-fav-ids";
const FAV_ICON_OFF = "header-heart.svg";
const FAV_ICON_ON = "header-heart-filled.svg";

const favRead = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }   /* приватный режим / битый JSON: стенд живёт, счёт просто не переживает переход */
};
const favWrite = (ids) => { try { localStorage.setItem(FAV_KEY, JSON.stringify(ids)); } catch { /* стенду не критично */ } };

/* Ключ товара: явный data-fav-id, иначе адрес страницы — на стенде одна карточка = одна страница. */
const favId = (btn) => btn.dataset.favId || location.pathname.replace(/index\.html$/, "");

const favPaintHeader = (count) => {
  document.querySelectorAll('.menu-btn[aria-label^="Избранное"]').forEach((btn) => {
    btn.classList.add("menu-btn--fav");
    btn.classList.toggle("is-on", count > 0);

    let badge = btn.querySelector(".fav-count");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "fav-count";
      badge.setAttribute("aria-hidden", "true");   /* число дублируется в aria-label кнопки */
      btn.append(badge);
    }
    badge.textContent = count > 99 ? "99+" : String(count);

    const img = btn.querySelector("img");
    if (img) {
      const next = img.getAttribute("src").replace(/header-heart(-filled)?\.svg$/, count > 0 ? FAV_ICON_ON : FAV_ICON_OFF);
      if (next !== img.getAttribute("src")) img.setAttribute("src", next);
    }
    btn.setAttribute("aria-label", count > 0 ? `Избранное, товаров: ${count}` : "Избранное");
  });
};

/* Карточка товара красится ТЕМ ЖЕ ходом, что и хедер (слово Антона 30.07, №29-⑨:
   «в избранном» — везде сердцем): не плашкой под знаком, а заливкой самого знака.
   Ассет-пара у карточки своя по имени (icon-heart-outline.svg), но геометрия та же
   24×24 — контур и filled различаются только заливкой, сверено файлами. */
const CARD_ICON_OFF = "icon-heart-outline.svg";

const favPaintCards = (ids) => {
  document.querySelectorAll(".fav-btn").forEach((btn) => {
    const on = ids.includes(favId(btn));
    btn.classList.toggle("is-fav", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");

    const img = btn.querySelector("img");
    if (img) {
      const next = img.getAttribute("src").replace(
        new RegExp(`(${CARD_ICON_OFF}|${FAV_ICON_ON})$`), on ? FAV_ICON_ON : CARD_ICON_OFF);
      if (next !== img.getAttribute("src")) img.setAttribute("src", next);
    }
  });
};

const favSync = () => {
  const ids = favRead();
  favPaintHeader(ids.length);
  favPaintCards(ids);
};

document.addEventListener("click", (e) => {
  const btn = e.target.closest?.(".fav-btn");
  if (!btn) return;
  e.preventDefault();
  const ids = favRead();
  const id = favId(btn);
  const at = ids.indexOf(id);
  if (at === -1) ids.push(id); else ids.splice(at, 1);
  favWrite(ids);
  favSync();
});

/* соседняя вкладка стенда поменяла счёт — этот хедер обязан догнать */
window.addEventListener("storage", (e) => { if (e.key === FAV_KEY) favSync(); });

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", favSync);
else favSync();
