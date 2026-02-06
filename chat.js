(function () {
  'use strict';

  // Convex HTTP actions are at .convex.site (not .convex.cloud). Chat proxy: POST /api/chat
  // Production deployment
  var CHAT_PROXY_URL = 'https://brainy-setter-166.convex.site';
  var OPENROUTER_MODEL = 'arcee-ai/trinity-large-preview:free';
  var OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  var STORAGE_KEY_API = 'bash-lessons-openrouter-key';
  var STORAGE_KEY_SIZE = 'bash-lessons-chat-size';

  var LESSON_INDEX = [
    { id: 'lesson-01', title: 'Welcome to the Terminal' },
    { id: 'lesson-02', title: 'Files and Directories' },
    { id: 'lesson-03', title: 'Reading and Searching Files' },
    { id: 'lesson-04', title: 'Pipes and Redirection' },
    { id: 'lesson-05', title: 'Permissions and Ownership' },
    { id: 'lesson-06', title: 'Your First Bash Script' },
    { id: 'lesson-07', title: 'Conditionals and Logic' },
    { id: 'lesson-08', title: 'Loops and Iteration' },
    { id: 'lesson-09', title: 'Functions and Script Organisation' },
    { id: 'lesson-10', title: 'Text Processing Power Tools' },
    { id: 'lesson-11', title: 'Process Management and Job Control' },
    { id: 'lesson-12', title: 'Real-World Scripting' }
  ];

  function getPageId() {
    var hash = window.location.hash.slice(1) || 'landing';
    if (hash.indexOf('lesson-') === 0 && /^lesson-\d{2}$/.test(hash)) return hash;
    return 'landing';
  }

  function getVisiblePanel() {
    var id = getPageId();
    return document.getElementById(id) || document.getElementById('landing');
  }

  function getPageText(maxLen) {
    var panel = getVisiblePanel();
    if (!panel) return '';
    var text = (panel.innerText || panel.textContent || '').trim();
    maxLen = maxLen || 12000;
    return text.length > maxLen ? text.slice(0, maxLen) + '\n\n[Content truncated.]' : text;
  }

  function getHeadings() {
    var panel = getVisiblePanel();
    if (!panel) return [];
    var nodes = panel.querySelectorAll('h2[id], h3[id]');
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.id) out.push({ id: el.id, text: (el.textContent || '').trim() });
    }
    return out;
  }

  function buildSystemPrompt() {
    var pageId = getPageId();
    var headings = getHeadings();
    var headingList = headings.map(function (h) { return h.id + ' -> ' + h.text; }).join('\n');
    var lessonList = LESSON_INDEX.map(function (l) { return l.id + ' -> ' + l.title; }).join('; ');
    var content = getPageText();
    return 'You are a helpful assistant for the "Bashing through Bash" course. Answer using ONLY the provided course content. When you refer to another lesson, use a markdown link: [Lesson N: Title](#lesson-NN). When you refer to a section on the current page, use [Section title](#heading-id). Use only hash links (e.g. #lesson-03 or #navigating-the-filesystem).\n\nCurrent page: ' + pageId + '.\nHeadings on this page (for links):\n' + headingList + '\n\nLesson index: ' + lessonList + '\n\n---\nContent of current page:\n\n' + content;
  }

  function markdownToHtml(md) {
    if (!md) return '';
    var s = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n\n+/g, '\n\n');
    var out = '';
    var i = 0;
    var len = s.length;
    while (i < len) {
      if (s.slice(i, i + 2) === '**') {
        var end = s.indexOf('**', i + 2);
        if (end !== -1) {
          out += '<strong>' + s.slice(i + 2, end) + '</strong>';
          i = end + 2;
          continue;
        }
      }
      if (s.slice(i, i + 1) === '`' && s.slice(i + 1).indexOf('`') !== -1) {
        var end = s.indexOf('`', i + 1);
        out += '<code>' + s.slice(i + 1, end) + '</code>';
        i = end + 1;
        continue;
      }
      if (s.slice(i, i + 2) === '\n\n') {
        out += '</p><p>';
        i += 2;
        continue;
      }
      if (s.slice(i, i + 1) === '\n') {
        out += '<br>';
        i += 1;
        continue;
      }
      var linkStart = s.indexOf('[', i);
      var linkEnd = s.indexOf('](#', linkStart);
      if (linkStart !== -1 && linkEnd !== -1 && linkStart === i) {
        var closeBracket = s.indexOf(']', linkStart);
        var closeParen = s.indexOf(')', linkEnd);
        if (closeBracket !== -1 && closeParen !== -1) {
          var linkText = s.slice(linkStart + 1, closeBracket);
          var href = s.slice(linkEnd + 2, closeParen);
          if (href.indexOf('#') === 0) {
            out += '<a href="' + href + '">' + linkText + '</a>';
            i = closeParen + 1;
            continue;
          }
        }
      }
      out += s[i];
      i += 1;
    }
    return '<p>' + out + '</p>';
  }

  function getApiKey() {
    try {
      return localStorage.getItem(STORAGE_KEY_API) || '';
    } catch (e) {
      return '';
    }
  }

  function chatRequest(messages) {
    var body = {
      model: OPENROUTER_MODEL,
      messages: messages,
      max_tokens: 1024
    };
    var url = CHAT_PROXY_URL ? (CHAT_PROXY_URL.replace(/\/$/, '') + '/api/chat') : OPENROUTER_URL;
    var opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    };
    if (!CHAT_PROXY_URL && getApiKey()) {
      opts.headers['Authorization'] = 'Bearer ' + getApiKey();
    }
    return fetch(url, opts);
  }

  function showError(container, msg) {
    var div = document.createElement('div');
    div.className = 'chat-widget__msg chat-widget__msg--assistant';
    div.innerHTML = '<p><strong>Error:</strong> ' + (msg || 'Something went wrong.') + '</p>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function appendMessage(container, role, content, isHtml) {
    var div = document.createElement('div');
    div.className = 'chat-widget__msg chat-widget__msg--' + role;
    if (role === 'assistant' && isHtml) {
      div.innerHTML = content;
    } else {
      div.textContent = content;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function sendMessage() {
    var panel = document.querySelector('.chat-widget__panel');
    var messagesEl = document.querySelector('.chat-widget__messages');
    var input = document.querySelector('.chat-widget__input');
    var sendBtn = document.querySelector('.chat-widget__send');
    if (!panel || !messagesEl || !input || !sendBtn) return;
    var text = (input.value || '').trim();
    if (!text) return;
    if (!CHAT_PROXY_URL && !getApiKey()) {
      showError(messagesEl, 'Set your Convex proxy URL in chat.js (CHAT_PROXY_URL) or add your OpenRouter API key in Settings.');
      return;
    }
    input.value = '';
    sendBtn.disabled = true;
    appendMessage(messagesEl, 'user', text, false);
    var history = [];
    var bubbles = messagesEl.querySelectorAll('.chat-widget__msg');
    for (var i = 0; i + 1 < bubbles.length; i += 2) {
      var u = bubbles[i];
      var a = bubbles[i + 1];
      if (u.classList.contains('chat-widget__msg--user') && a && a.classList.contains('chat-widget__msg--assistant') && !a.querySelector('strong')) {
        history.push({ role: 'user', content: (u.textContent || '').trim() });
        history.push({ role: 'assistant', content: (a.textContent || '').trim() });
      }
    }
    var systemContent = buildSystemPrompt();
    var apiMessages = [{ role: 'system', content: systemContent }].concat(history).concat([{ role: 'user', content: text }]);
    chatRequest(apiMessages)
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) { throw new Error(res.status + ' ' + (t || res.statusText)); });
        }
        return res.json();
      })
      .then(function (data) {
        var raw = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
        appendMessage(messagesEl, 'assistant', markdownToHtml(raw), true);
      })
      .catch(function (err) {
        showError(messagesEl, err.message || String(err));
      })
      .finally(function () {
        sendBtn.disabled = false;
      });
  }

  function getStoredSize() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_SIZE);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.w === 'number' && typeof parsed.h === 'number') {
          return { w: parsed.w, h: parsed.h };
        }
      }
    } catch (e) {}
    return null;
  }

  function storeSize(w, h) {
    try {
      localStorage.setItem(STORAGE_KEY_SIZE, JSON.stringify({ w: w, h: h }));
    } catch (e) {}
  }

  function initChat() {
    var widget = document.getElementById('chat-widget');
    var toggle = widget && widget.querySelector('.chat-widget__toggle');
    var panel = widget && widget.querySelector('.chat-widget__panel');
    var closeBtn = widget && widget.querySelector('.chat-widget__close');
    var messagesEl = widget && widget.querySelector('.chat-widget__messages');
    var input = widget && widget.querySelector('.chat-widget__input');
    var sendBtn = widget && widget.querySelector('.chat-widget__send');
    var settingsWrap = widget && widget.querySelector('.chat-widget__settings');
    var settingsBtn = widget && widget.querySelector('.chat-widget__settings-btn');
    var keyInput = document.getElementById('chat-api-key');
    var saveKeyBtn = widget && widget.querySelector('.chat-widget__save-key');
    if (!widget || !toggle || !panel) return;

    var stored = getStoredSize();
    if (stored) {
      panel.style.width = stored.w + 'px';
      panel.style.height = stored.h + 'px';
    }
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function () {
        storeSize(panel.offsetWidth, panel.offsetHeight);
      });
      ro.observe(panel);
    }

    toggle.addEventListener('click', function () {
      panel.hidden = false;
      input.focus();
    });
    closeBtn && closeBtn.addEventListener('click', function () {
      panel.hidden = true;
    });
    sendBtn && sendBtn.addEventListener('click', sendMessage);
    input && input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    if (settingsBtn && settingsWrap) {
      settingsBtn.addEventListener('click', function () {
        settingsWrap.hidden = !settingsWrap.hidden;
        if (keyInput && !settingsWrap.hidden) keyInput.value = getApiKey();
      });
    }
    if (saveKeyBtn && keyInput) {
      saveKeyBtn.addEventListener('click', function () {
        try {
          localStorage.setItem(STORAGE_KEY_API, (keyInput.value || '').trim());
        } catch (e) {}
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }
})();
