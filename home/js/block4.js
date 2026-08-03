/* ============================================================
   БЛОК «УСТРОЙСТВО ВЫТЯЖНОГО ШКАФА» — скролл-сцена главной
   ------------------------------------------------------------
   Врезано 22.07 из принятой демки `_demo-block4-scroll.html`
   (демо-страница остаётся ЭТАЛОНОМ механики — не сносить).
   Отдельный файл, а не дописка в home.js: у сцены свои данные и свой
   жизненный цикл, а параллельная работа по home.js шла в те же часы.
   Стили — секция «БЛОК УСТРОЙСТВО…» в css/home.css, кадры — assets/anim-b4/.
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     ДАННЫЕ СЦЕНЫ
     ------------------------------------------------------------
     FRAMES — 10 рендеров клиента в порядке движения камеры
     (общий план → вверх к вентилятору → вниз по внутренностям →
      двери → тумбочка). Порядок подобран по кадрам глазами.

     CARDS — 8 карточек. Тексты ДОСЛОВНО из клиентской pptx.
     Карточка может занимать ДВА кадра (`frames: [i, j]`) —
     тогда внутри одного смыслового шага камера доезжает
     (вентилятор: подлёт → крупный план) или что-то происходит
     (петли: дверка закрыта → дверка открыта).
     ============================================================ */

  var FRAMES = [
    '01-overview',        /* 0 — общий вид (1).jpg */
    '02-fan-approach',    /* 1 — срок службы вентилятора 2.jpg (подлёт, вентилятор мелко) */
    '03-fan-closeup',     /* 2 — срок службы вентилятора .jpg (вентилятор крупно) */
    '04-capsule',         /* 3 — Нет коррозии от хим.jpg */
    '05-drip-tray',       /* 4 — Кислотные испарения не стекают.jpg */
    '06-airflow-monitor', /* 5 — Нет отравления персонала (1).jpg */
    '07-exhaust-slots',   /* 6 — Хорошая тяга вредного воздуха.jpg */
    '08-hinge',           /* 7 — Петли не ржавеют (1).jpg (двери закрыты) */
    '09-door-open',       /* 8 — Петли не ржавеют 2.jpg (дверка открыта) */
    '10-cart-out'         /* 9 — Легко помыть пол (1).jpg */
  ];

  var CARDS = [
    { frames: [0],    hero: 0,
      title: 'Общий вид',
      body:  'Вытяжной шкаф Simple PRO. Экран поднят.' },

    /* ⚠ «ХХ лет» — РЫБА КЛИЕНТА. Число срока службы вентилятора ЖДЁМ ОТ КЛИЕНТА,
       своё не выдумываем. Заменить здесь — данные у деска и моба одни. */
    { frames: [1, 2], hero: 2,
      title: 'Срок службы вентилятора ХХ лет',
      body:  'Кислотостойкий вентилятор из пластика.' },

    { frames: [3],    hero: 3,
      title: 'Нет коррозии от хим. реактивов',
      body:  'Полипропиленовая капсула без металла.' },

    { frames: [4],    hero: 4,
      title: 'Кислотные испарения не стекают на рабочую поверхность',
      body:  'Каплесборник со специальной ёмкостью для химикатов.' },

    /* ⚠ Слайды 5 и 6 клиента («монитор воздушного потока» и «зона зелёная/красная,
       лампочка горит зелёным») сведены в ОДНУ карточку: отдельного рендера с горящей
       зелёной лампочкой в присланных 10 файлах НЕТ (в pptx он в списке нужных есть).
       Придёт рендер — разводим обратно на две карточки. */
    { frames: [5],    hero: 5,
      title: 'Нет отравления персонала',
      body:  'Монитор воздушного потока: зона зелёная и красная, лампочка горит зелёным.' },

    { frames: [6],    hero: 6,
      title: 'Хорошая тяга вредного воздуха',
      body:  'На модели видны вытяжные щели, экран поднят.' },

    { frames: [7, 8], hero: 8,
      title: 'Петли не ржавеют',
      body:  'Вечная полипропиленовая петля, патент SimplePro. Дверка открывается.' },

    { frames: [9],    hero: 9,
      title: 'Легко помыть пол',
      body:  'Тумбочка катается на колёсах и выезжает из-под шкафа.' }
  ];

  /* кадр → индекс карточки (обратная таблица, чтобы не искать в цикле) */
  var FRAME_CARD = [];
  CARDS.forEach(function (c, ci) { c.frames.forEach(function (f) { FRAME_CARD[f] = ci; }); });

  /* Лестница ширин webp. sizes описывает РЕАЛЬНУЮ ширину сцены, а не вьюпорт:
     на деске картинка живёт в колонке «вьюпорт минус карточка 28rem минус поля»,
     поэтому на 1x-деске браузер берёт 1920, на 2x — 2560, на мобе — 1080. */
  var SRCSET_W = [1080, 1920, 2560];
  var SIZES_STAGE = '(max-width: 47.9375rem) 100vw, calc(100vw - 34rem)';
  var SIZES_THUMB = '28rem';

  function srcsetFor(slug) {
    return SRCSET_W.map(function (w) {
      return 'assets/anim-b4/' + slug + '-' + w + '.webp ' + w + 'w';
    }).join(', ');
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ============================================================
     REDUCED MOTION — список фич вместо сцены
     ============================================================ */
  function buildStatic() {
    var ul = document.getElementById('b4StaticList');
    if (!ul || ul.children.length) return;
    /* Общий вид — тот же srcset, что у сцены и у моб-слайдов: прибитый 1920 тянул
       40 КБ в слот 358px на мобиле (замер 30.07: 1080 = 18 КБ). Соседний код уже
       умел srcsetFor — здесь он просто не был позван. */
    var hero = document.createElement('img');
    /* srcset и sizes — ДО src: иначе загрузка стартует по src, и выбор кандидата
       уже не отменяет начатый запрос. */
    hero.srcset = srcsetFor('01-overview');
    /* Колонка reduced-грида: моб — вьюпорт минус поля 16×2; деск — половина от
       «вьюпорт минус поля 48×2 минус гэп 48» (css/home.css §b4-static). */
    hero.sizes = '(max-width: 47.9375rem) calc(100vw - 2rem), calc((100vw - 9rem) / 2)';
    hero.src = 'assets/anim-b4/01-overview-1920.webp';   /* фолбэк без srcset */
    hero.alt = 'Вытяжной шкаф Simple PRO, общий вид, экран поднят';
    document.getElementById('b4StaticPic').appendChild(hero);
    CARDS.forEach(function (c) {
      var li = document.createElement('li');
      var img = document.createElement('img');
      img.src = 'assets/anim-b4/' + FRAMES[c.hero] + '-1080.webp';
      img.alt = '';
      var box = document.createElement('div');
      var h = document.createElement('h4'); h.textContent = c.title;
      var p = document.createElement('p');  p.textContent = c.body;
      box.appendChild(h); box.appendChild(p);
      li.appendChild(img); li.appendChild(box);
      ul.appendChild(li);
    });
  }
  if (reduced.matches) buildStatic();   /* в обычном режиме этот блок не нужен вовсе */

  /* ============================================================
     МОБ: свайп-слайды тех же кадров + точки
     Слайдов 8 — по карточке, кадр берём геройский (для «петель» это
     уже открытая дверка, для вентилятора — крупный план).
     ============================================================ */
  function buildMob() {
    var track = document.getElementById('b4MobTrack');
    var dots  = document.getElementById('b4Dots');
    if (!track || track.children.length) return;

    CARDS.forEach(function (c, i) {
      var slide = document.createElement('div');
      slide.className = 'b4-slide';

      var pic = document.createElement('div');
      pic.className = 'b4-slide-pic';
      var img = document.createElement('img');
      img.src = 'assets/anim-b4/' + FRAMES[c.hero] + '-1080.webp';
      img.alt = c.title;
      /* первые два слайда грузим сразу, остальные — лениво:
         свайп до третьего требует времени, за него всё догрузится */
      img.loading = i < 2 ? 'eager' : 'lazy';
      img.decoding = 'async';
      pic.appendChild(img);

      var txt = document.createElement('div');
      txt.className = 'b4-slide-text';
      var h = document.createElement('h4'); h.textContent = c.title;
      var p = document.createElement('p');  p.textContent = c.body;
      txt.appendChild(h); txt.appendChild(p);

      slide.appendChild(pic); slide.appendChild(txt);
      track.appendChild(slide);

      var dot = document.createElement('span');
      if (i === 0) dot.className = 'on';
      dots.appendChild(dot);
    });

    /* активная точка — по ближайшему к центру слайду (надёжнее, чем деление
       scrollLeft на ширину: gap и padding сбивают арифметику) */
    var raf = 0;
    track.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var mid = track.scrollLeft + track.clientWidth / 2;
        var best = 0, bestD = Infinity;
        for (var i = 0; i < track.children.length; i++) {
          var el = track.children[i];
          var c = el.offsetLeft + el.offsetWidth / 2;
          var d = Math.abs(c - mid);
          if (d < bestD) { bestD = d; best = i; }
        }
        for (var j = 0; j < dots.children.length; j++) {
          dots.children[j].className = (j === best) ? 'on' : '';
        }
        track.dataset.active = String(best);   /* для приёмки/замера */
      });
    }, { passive: true });
  }
  buildMob();

  /* ============================================================
     ДЕСК: липкая сцена с кроссфейдом по прогрессу скролла
     ============================================================ */
  var scene  = document.getElementById('b4Scene');
  var stage  = document.getElementById('b4Stage');
  var frames = stage ? Array.prototype.slice.call(stage.querySelectorAll('.b4-frame')) : [];
  var cardPic   = document.getElementById('b4CardPic');
  var cardTitle = document.getElementById('b4CardTitle');
  var cardBody  = document.getElementById('b4CardBody');
  var stepsBox  = document.getElementById('b4Steps');
  var hint      = document.getElementById('b4Hint');

  /* блока на странице нет (или разметку сняли) — молча уходим, а не падаем
     необработанным исключением: pageerror ловится кухней и красит смок */
  if (!scene || !stage || !cardPic || !stepsBox) return;

  /* мини-превью в карточке — такая же стопка, opacity переключаем скачком:
     это не анимация, а смена иллюстрации шага */
  var thumbs = [];
  FRAMES.forEach(function (slug) {
    var im = document.createElement('img');
    im.alt = '';
    im.dataset.slug = slug;
    im.decoding = 'async';
    cardPic.appendChild(im);
    thumbs.push(im);
  });

  /* сегменты прогресса — по одному на карточку */
  CARDS.forEach(function (_, i) {
    var s = document.createElement('span');
    if (i === 0) s.className = 'on';
    stepsBox.appendChild(s);
  });

  /* ---------- ПРЕДЗАГРУЗКА ----------
     Кадр не имеет права «проявляться»: перед показом он обязан быть в кэше.
     Порядок: 0 и 1 сразу → на простое догружаем остальные по очереди →
     при смене шага принудительно подтягиваем соседей (i−1, i, i+1). */
  var loaded = [];
  function ensure(i) {
    if (i < 0 || i >= FRAMES.length || loaded[i]) return;
    loaded[i] = true;
    var slug = FRAMES[i];
    var img = frames[i];
    img.sizes = SIZES_STAGE;
    img.srcset = srcsetFor(slug);
    img.src = 'assets/anim-b4/' + slug + '-1920.webp';   /* фолбэк для древних браузеров */
    var th = thumbs[i];
    th.sizes = SIZES_THUMB;
    th.srcset = srcsetFor(slug);
    th.src = 'assets/anim-b4/' + slug + '-1080.webp';
  }
  ensure(0); ensure(1);

  var idleQueue = 2;
  function idleFill() {
    if (idleQueue >= FRAMES.length) return;
    ensure(idleQueue++);
    (window.requestIdleCallback || function (f) { setTimeout(f, 120); })(idleFill);
  }
  (window.requestIdleCallback || function (f) { setTimeout(f, 300); })(idleFill);

  /* ---------- ПРОГРЕСС ----------
     p — доля пройденного трека, 0…1.
     HOLD = 0.05: первые и последние 5% трека сцена держит крайний кадр.
     Зачем: вход в липкость и выход из неё не должны совпадать с началом/
     концом перелистывания, иначе кадр «дёргается» ровно в момент прилипания. */
  var HOLD = 0.05;
  var lastCard = -1;
  var ticking = false;

  function render() {
    ticking = false;
    var rect = scene.getBoundingClientRect();
    var travel = rect.height - window.innerHeight;   /* 400vh «топлива» */
    if (travel <= 0) return;

    var p = (-rect.top) / travel;
    p = p < 0 ? 0 : (p > 1 ? 1 : p);

    /* сжимаем рабочий диапазон внутрь HOLD-полей */
    var q = (p - HOLD) / (1 - 2 * HOLD);
    q = q < 0 ? 0 : (q > 1 ? 1 : q);

    /* u — дробная позиция по кадрам: 0 = первый, N−1 = последний */
    var u = q * (FRAMES.length - 1);
    var i = Math.floor(u);
    if (i > FRAMES.length - 2) i = FRAMES.length - 2;
    var tl = u - i;                      /* 0…1 — линейная доля перехода i → i+1 */
    /* smoothstep: у краёв перехода мягко, середину проскакиваем быстрее.
       Зачем: крупность у соседних кадров разная, и середина кроссфейда —
       единственное место, где видно «двойную экспозицию». Ускоряя её,
       глаз читает движение камеры, а не наложение двух картинок.
       Полная остановка (hold) тут хуже: кадр «замерзает» посреди скролла. */
    var t = tl * tl * (3 - 2 * tl);

    /* КРОССФЕЙД. Текущий кадр держим непрозрачным, входящий проявляем на t.
       Так и работает cross-dissolve при обычном наложении: если гасить и
       нижний тоже, между ними на середине проступил бы фон сцены.

       ПЛЮС микро-наезд PUSH=3%: входящий кадр приходит чуть крупнее и садится
       на место, уходящий чуть отъезжает. Ракурс один, но крупность у кадров
       разная — без этого середина перехода читается как двойная экспозиция,
       а с ним как движение камеры. 3% — потолок: больше уже заметно «дышит». */
    var PUSH = 0.03;
    for (var k = 0; k < frames.length; k++) {
      var o = 0, sc = 1;
      if (k === i)          { o = 1; sc = 1 - PUSH * t; }
      else if (k === i + 1) { o = t; sc = 1 + PUSH * (1 - t); }
      frames[k].style.opacity = o;
      frames[k].style.transform = 'scale(' + sc.toFixed(4) + ')';
    }

    ensure(i - 1); ensure(i); ensure(i + 1); ensure(i + 2);

    /* карточка переключается по «ведущему» кадру — тому, что виден больше */
    var lead = t > 0.5 ? i + 1 : i;
    var ci = FRAME_CARD[lead];
    if (ci !== lastCard) {
      lastCard = ci;
      var c = CARDS[ci];
      cardTitle.textContent = c.title;
      cardBody.textContent  = c.body;
      for (var m = 0; m < thumbs.length; m++) thumbs[m].style.opacity = (m === c.hero) ? 1 : 0;
      for (var s = 0; s < stepsBox.children.length; s++) {
        stepsBox.children[s].className = (s === ci) ? 'on' : '';
      }
      scene.dataset.card = String(ci);
    }

    /* служебные метки для приёмки — читаются из браузера числами */
    scene.dataset.progress = p.toFixed(4);
    scene.dataset.frame = String(lead);
    scene.dataset.pair = i + ':' + t.toFixed(3);
    scene.dataset.u = u.toFixed(3);

    if (hint) hint.style.opacity = p > 0.02 ? 0 : 1;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  function start() {
    if (reduced.matches) return;          /* другой режим подачи — сцены нет */
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    render();
  }
  start();

  /* если пользователь переключил настройку прямо на странице — перечитываем режим */
  if (reduced.addEventListener) {
    reduced.addEventListener('change', function () { location.reload(); });
  }
})();
