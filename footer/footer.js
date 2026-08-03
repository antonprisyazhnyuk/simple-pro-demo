/* Футер-модуль: колонки-аккордеон в моб-манифестации.
   Порог живёт ТОЛЬКО в CSS (@media футера) и приезжает сюда флагом --foot-accordion:
   дублировать число в скрипте нельзя — разъедется при пересчёте свипом.
   Выше порога списки открыты всегда, поэтому aria-expanded снимается (иначе врёт). */
(function () {
  const cols = [...document.querySelectorAll(".footer-col")];
  if (!cols.length) return;

  const isAccordion = () =>
    getComputedStyle(document.documentElement).getPropertyValue("--foot-accordion").trim() === "1";

  const sync = () => {
    const live = isAccordion();
    for (const col of cols) {
      const title = col.querySelector(".fc-title");
      if (!title) continue;
      if (live) {
        title.setAttribute("aria-expanded", String(col.classList.contains("is-open")));
        title.removeAttribute("tabindex");
      } else {
        /* выше порога списки раскрыты всегда: заголовок ничего не делает, и держать его
           в tab-order — обещать интерактив, которого нет (кольцо фокуса на пустышке) */
        title.removeAttribute("aria-expanded");
        title.setAttribute("tabindex", "-1");
      }
    }
  };

  for (const col of cols) {
    const title = col.querySelector(".fc-title");
    if (!title) continue;
    title.addEventListener("click", () => {
      if (!isAccordion()) return;
      col.classList.toggle("is-open");
      sync();
    });
  }

  window.addEventListener("resize", sync);
  sync();
})();

/* ФОРМА «Проверить статус заказа» — предохранитель отправки.
   Отдельной обёрткой, а НЕ внутри блока колонок: тот выходит по `if (!cols.length) return`,
   и форма осталась бы без обработчика на любой странице без .footer-col.

   Панель стала <form> (было <div>): без формы кнопка ничем не управляла, Enter в поле
   не работал, у полей не было name — то есть ввод было некуда деть даже теоретически.
   Форма без action отправляется GET'ом на тот же адрес: страница перезагружается,
   введённые номер счёта и email теряются, футер уезжает из вида. Гасим это.

   ⚠ Ответа тут НЕТ и не будет догадкой: бэкенда на демо нет, а выдуманный «заказ найден»
   запрещён прямо (класс href="#", слово Антона 31.07). Что показывать после валидной
   отправки — вкусовой вопрос, ушёл файлом taste-vecher-3107.md, не в код.
   Родная валидация браузера при этом жива: на пустых/кривых полях до этого обработчика
   дело не доходит, реакцию даёт сам браузер. */
(function () {
  const form = document.querySelector("form.status-panel");
  if (!form) return;
  form.addEventListener("submit", (e) => e.preventDefault());
})();
