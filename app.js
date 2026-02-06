(function () {
  'use strict';

  var CONTENT_SELECTOR = '.content-panel';
  var ACTIVE_CLASS = 'stepper-item--active';
  var DONE_CLASS = 'stepper-item--done';
  var STORAGE_KEY_LAST = 'bash-lessons-last';
  var STORAGE_KEY_DONE = 'bash-lessons-done';

  function getPageFromHash() {
    var hash = window.location.hash.slice(1) || 'landing';
    if (hash.indexOf('lesson-') === 0 && /^lesson-\d{2}$/.test(hash)) return hash;
    return 'landing';
  }

  function showPage(pageId) {
    var panels = document.querySelectorAll(CONTENT_SELECTOR);
    panels.forEach(function (el) {
      el.hidden = el.id !== pageId;
    });
    document.querySelectorAll('.stepper-item').forEach(function (el) {
      el.classList.remove(ACTIVE_CLASS);
      if (el.getAttribute('data-page') === pageId) el.classList.add(ACTIVE_CLASS);
    });
    try {
      localStorage.setItem(STORAGE_KEY_LAST, pageId);
    } catch (e) {}
  }

  function loadLastLesson() {
    try {
      var last = localStorage.getItem(STORAGE_KEY_LAST);
      if (last && last !== 'landing' && document.getElementById(last)) {
        window.location.hash = '#' + last;
        return;
      }
    } catch (e) {}
    window.location.hash = '#';
  }

  function initCompletedState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_DONE);
      var done = raw ? JSON.parse(raw) : {};
      document.querySelectorAll('.stepper-item[data-page^="lesson-"]').forEach(function (el) {
        var page = el.getAttribute('data-page');
        if (done[page]) el.classList.add(DONE_CLASS);
      });
    } catch (e) {}
  }

  function markCurrentComplete() {
    var page = getPageFromHash();
    if (page === 'landing') return;
    try {
      var raw = localStorage.getItem(STORAGE_KEY_DONE);
      var done = raw ? JSON.parse(raw) : {};
      done[page] = true;
      localStorage.setItem(STORAGE_KEY_DONE, JSON.stringify(done));
      var el = document.querySelector('.stepper-item[data-page="' + page + '"]');
      if (el) el.classList.add(DONE_CLASS);
    } catch (e) {}
  }

  function onHashChange() {
    var pageId = getPageFromHash();
    showPage(pageId);
  }

  function onLoad() {
    initCompletedState();
    if (!window.location.hash || window.location.hash === '#') loadLastLesson();
    onHashChange();
  }

  function initMenuToggle() {
    var app = document.getElementById('app');
    var toggle = document.getElementById('menu-toggle');
    if (!app || !toggle) return;
    var STORAGE_KEY_MENU = 'bash-lessons-menu-open';
    try {
      var menuOpen = localStorage.getItem(STORAGE_KEY_MENU);
      if (menuOpen === '0') app.classList.add('menu-closed');
    } catch (e) {}
    toggle.addEventListener('click', function () {
      var closed = app.classList.toggle('menu-closed');
      toggle.setAttribute('aria-expanded', closed ? 'false' : 'true');
      try {
        localStorage.setItem(STORAGE_KEY_MENU, closed ? '0' : '1');
      } catch (e) {}
    });
  }

  function initThemeToggle() {
    var themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;
    var STORAGE_KEY_THEME = 'bash-lessons-theme';
    function applyDark(dark) {
      document.body.classList.toggle('dark', dark);
      themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      themeBtn.textContent = dark ? 'Light' : 'Dark';
      themeBtn.title = dark ? 'Use light style' : 'Use dark style';
    }
    try {
      var saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark') applyDark(true);
    } catch (e) {}
    themeBtn.addEventListener('click', function () {
      var dark = document.body.classList.toggle('dark');
      applyDark(dark);
      try {
        localStorage.setItem(STORAGE_KEY_THEME, dark ? 'dark' : 'light');
      } catch (e) {}
    });
  }

  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('load', function () {
    onLoad();
    initMenuToggle();
    initThemeToggle();
  });

  window.bashLessons = {
    markComplete: markCurrentComplete
  };
})();
