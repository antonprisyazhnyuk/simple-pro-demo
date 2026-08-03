/* ============================================================
   ЛАБОРАТОРИЯ ПОД КЛЮЧ — таймлапс на ховере (узел 2201:127130)
   ============================================================
   Механика словом Антона: покой = ПОСЛЕДНИЙ кадр видео (готовая лаборатория,
   он же постер), ховер → таймлапс проигрывается С НАЧАЛА, уход курсора →
   возврат к последнему кадру.

   Что здесь ЕСТЬ и чего намеренно НЕТ:
   · Постер и reduced-motion живут в разметке и css, не тут. Видео при reduce
     не грузится вовсе (у обоих <source> media="(prefers-reduced-motion:
     no-preference)" — не подходит ни один), поэтому js вообще не запускается.
   · Ленивой загрузки руками тоже нет: preload="metadata" тянет только заголовок
     файла, а сами данные запрашивает первый же play() — то есть первый ховер.
   · Кадр 0 таймлапса — ПУСТАЯ бетонная коробка, кадр последний — готовая
     лаборатория. Поэтому видео проявляется не по факту вызова play(), а по
     факту первого отрисованного кадра: иначе на первом ховере поверх постера
     моргнёт пустой чёрный слой, пока едут данные.
   · Возврат к покою = просто гасим слой видео, постер под ним. currentTime на
     уходе НЕ сбрасываем — во время затухания это показало бы кадр 0 (пустую
     коробку); перемотка живёт в start(), перед самым запуском.
   ============================================================ */
(function () {
  "use strict";

  var card = document.querySelector("[data-lab-card]");
  if (!card) return;
  var video = card.querySelector(".lab-card-video");
  if (!video) return;

  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hovered = false;

  function reveal() {
    if (hovered) card.classList.add("is-playing");
  }

  function start() {
    if (reduce.matches) return;
    hovered = true;
    // readyState 0 = метаданных ещё нет, перематывать нечего: видео и так с нуля
    if (video.readyState > 0 && video.currentTime !== 0) video.currentTime = 0;

    var played = video.play();
    if (played && typeof played.catch === "function") {
      played.catch(function () { card.classList.remove("is-playing"); });
    }
    // Проявляем слой по ПЕРВОМУ реальному кадру, а не по вызову play()
    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(reveal);
    } else {
      video.addEventListener("playing", reveal, { once: true });
    }
  }

  function stop() {
    hovered = false;
    card.classList.remove("is-playing");
    video.pause();
  }

  // Мышь: только на устройствах с настоящим курсором. На тач-экране
  // pointerenter приходит от тапа — там карточке положено остаться постером
  // и просто отработать переход по ссылке.
  card.addEventListener("pointerenter", function () { if (fine.matches) start(); });
  card.addEventListener("pointerleave", stop);

  // Клавиатура: карточка — ссылка, при табе на неё показываем то же, что мыши.
  // Проверку на курсор тут НЕ ставим (у тач-устройства бывает клавиатура).
  card.addEventListener("focusin", start);
  card.addEventListener("focusout", stop);
})();
