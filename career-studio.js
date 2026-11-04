(() => {
  'use strict';

  const API_BASE = 'https://agiletalent-career-studio.onrender.com';
  const MONTHLY_LIMIT = 2;
  const CHAT_LIMIT = 5;

  const STORAGE_ID_KEY = 'agiletalent_cs_browser_id';
  const STORAGE_MONTH_KEY = 'agiletalent_cs_rebuild_month';
  const STORAGE_COUNT_KEY = 'agiletalent_cs_rebuild_count';

  let sessionId = null;
  let chatExchangesUsed = 0;
  let busy = false;

  const $ = id => document.getElementById(id);

  const status = message => {
    const node = $('cs-upload-status');
    if (node) node.textContent = message;
  };

  function getAnonymousId() {
    let id = localStorage.getItem(STORAGE_ID_KEY);

    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID().replace(/-/g, '')
        : Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(value => value.toString(16).padStart(2, '0')).join('');

      localStorage.setItem(STORAGE_ID_KEY, id);
    }

    return id;
  }

  function lagosMonth() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit'
    }).formatToParts(new Date());

    return `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}`;
  }

  function getLocalRebuildCount() {
    const month = lagosMonth();

    if (localStorage.getItem(STORAGE_MONTH_KEY) !== month) {
      localStorage.setItem(STORAGE_MONTH_KEY, month);
      localStorage.setItem(STORAGE_COUNT_KEY, '0');
    }

    const count = Number.parseInt(
      localStorage.getItem(STORAGE_COUNT_KEY) || '0',
      10
    );

    return Number.isFinite(count) && count >= 0 ? count : 0;
  }

  function setLocalRebuildCount(count) {
    localStorage.setItem(STORAGE_MONTH_KEY, lagosMonth());
    localStorage.setItem(STORAGE_COUNT_KEY, String(count));
    renderRebuildCount();
  }

  function ensureUsageUI() {
    if (!$('cs-rebuild-usage')) {
      const usage = document.createElement('p');
      usage.id = 'cs-rebuild-usage';
      usage.className = 'cs-usage';
      usage.setAttribute('aria-live', 'polite');

      $('cs-upload-panel')?.insertBefore(usage, $('cs-start'));
    }

    if (!$('cs-chat-usage')) {
      const usage = document.createElement('p');
      usage.id = 'cs-chat-usage';
      usage.className = 'cs-usage';
      usage.setAttribute('aria-live', 'polite');

      const form = $('cs-chat-form');
      if (form) form.insertBefore(usage, form.firstChild);
    }
  }

  function renderRebuildCount() {
    const count = getLocalRebuildCount();
    const node = $('cs-rebuild-usage');

    if (node) {
      node.textContent =
        `Free CV rebuilds used this month on this browser: ${count} of ${MONTHLY_LIMIT}.`;
    }

    const button = $('cs-start');

    if (button && !sessionId) {
      button.disabled = busy || count >= MONTHLY_LIMIT;
    }

    if (count >= MONTHLY_LIMIT && !sessionId) {
      status(
        'You have used your two free CV rebuilds for this month on this browser. You can try again next month.'
      );
    }
  }

  function renderChatCount() {
    const node = $('cs-chat-usage');
    const exhausted = chatExchangesUsed >= CHAT_LIMIT;

    if (node) {
      node.textContent =
        `Conversation exchanges used: ${chatExchangesUsed} of ${CHAT_LIMIT}.`;

      if (exhausted) {
        node.textContent += ' You can still download your latest CV.';
      }
    }

    const input = $('cs-message');
    const submit = $('cs-chat-form')
      ?.querySelector('button[type="submit"]');

    if (input) {
      input.disabled = exhausted || busy;

      if (exhausted) {
        input.placeholder =
          'You have used all five exchanges for this CV session.';
      }
    }

    if (submit) {
      submit.disabled = exhausted || busy;
    }
  }

  function addMessage(who, message) {
    const container = $('cs-messages');

    if (!container) return;

    const element = document.createElement('div');
    element.className = `cs-message ${who}`;
    element.textContent = message;

    container.appendChild(element);

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }

  async function api(path, options = {}) {
    const response = await fetch(API_BASE + path, options);

    if (!response.ok) {
      let message = 'Something went wrong. Please try again.';

      try {
        const data = await response.json();
        message = data.detail || message;
      } catch (_) {}

      throw new Error(message);
    }

    return response;
  }

  function setBusy(value) {
    busy = value;

    const start = $('cs-start');

    if (start && !sessionId) {
      start.disabled = value || getLocalRebuildCount() >= MONTHLY_LIMIT;
    }

    renderChatCount();
  }

  function currentAnalysisElement() {
    return $('cs-analysis-text') || $('cs-analysis');
  }

  async function startCV() {
    if (busy || sessionId) return;

    const file = $('cs-file')?.files?.[0];

    if (!file) {
      return status('Please select your CV first.');
    }

    if (!$('cs-consent')?.checked) {
      return status('Please confirm the privacy notice before uploading.');
    }

    const used = getLocalRebuildCount();

    if (used >= MONTHLY_LIMIT) {
      return renderRebuildCount();
    }

    setBusy(true);

    status('Reading your CV and preparing your personalised revamp…');

    try {
      const form = new FormData();

      form.append('file', file);
      form.append('consent', 'true');

      const response = await api('/api/cv/upload', {
        method: 'POST',
        headers: {
          'X-Anonymous-ID': getAnonymousId()
        },
        body: form
      });

      const data = await response.json();

      // A successful initial rebuild consumes one monthly use.
      setLocalRebuildCount(used + 1);

      sessionId = data.session_id;

      chatExchangesUsed = Number(data.chat_exchanges_used || 0);

      $('cs-workspace').hidden = false;

      if (currentAnalysisElement()) {
        currentAnalysisElement().textContent = data.analysis || '';
      }

      $('cs-cv-preview').textContent = data.cv_text || '';

      addMessage(
        'assistant',
        data.assistant_message || 'Your revised CV is ready.'
      );

      $('cs-workspace').scrollIntoView({
        behavior: 'smooth'
      });

      status('Your CV has been analysed and revamped.');

    } catch (error) {
      status(error.message);

    } finally {
      setBusy(false);
      renderRebuildCount();
      renderChatCount();
    }
  }

  async function sendChat(event) {
    event.preventDefault();

    if (busy || !sessionId || chatExchangesUsed >= CHAT_LIMIT) {
      return;
    }

    const input = $('cs-message');
    const message = input.value.trim();

    if (!message) return;

    setBusy(true);

    try {
      const response = await api('/api/cv/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: message
        })
      });

      const data = await response.json();

      input.value = '';

      addMessage('user', message);

      if (currentAnalysisElement()) {
        currentAnalysisElement().textContent = data.analysis || '';
      }

      $('cs-cv-preview').textContent = data.cv_text || '';

      addMessage(
        'assistant',
        data.assistant_message || 'Your CV draft has been updated.'
      );

      chatExchangesUsed = Number(
        data.chat_exchanges_used ?? (chatExchangesUsed + 1)
      );

    } catch (error) {
      addMessage('assistant', error.message);

      if (
        error.message.toLowerCase().includes('five conversation exchanges')
      ) {
        chatExchangesUsed = CHAT_LIMIT;
      }

    } finally {
      setBusy(false);
      renderChatCount();
    }
  }

  async function downloadCV() {
    if (!sessionId || busy) return;

    const button = $('cs-download');
    button.disabled = true;

    try {
      const response = await api('/api/cv/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId
        })
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = 'AgileTalent-Revamped-CV.docx';

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    } catch (error) {
      alert(error.message);

    } finally {
      button.disabled = false;
    }
  }

  async function endSession() {
    if (!sessionId || busy) return;

    const button = $('cs-delete');

    if (button) button.disabled = true;

    try {
      await api(
        '/api/cv/session/' + encodeURIComponent(sessionId),
        { method: 'DELETE' }
      );

      sessionId = null;
      chatExchangesUsed = 0;

      $('cs-workspace').hidden = true;
      $('cs-messages').replaceChildren();
      $('cs-cv-preview').textContent = '';

      if (currentAnalysisElement()) {
        currentAnalysisElement().textContent = '';
      }

      $('cs-file').value = '';
      $('cs-consent').checked = false;

      status('Your session has ended. Temporary session data has been deleted.');

    } catch (error) {
      alert(error.message);

    } finally {
      if (button) button.disabled = false;

      renderRebuildCount();
      renderChatCount();
    }
  }

  function initialise() {
    if (!$('cs-start') || !$('cs-chat-form')) return;

    ensureUsageUI();

    getAnonymousId();

    renderRebuildCount();
    renderChatCount();

    $('cs-start').addEventListener('click', startCV);
    $('cs-chat-form').addEventListener('submit', sendChat);

    $('cs-download')?.addEventListener('click', downloadCV);
    $('cs-delete')?.addEventListener('click', endSession);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise, {
      once: true
    });
  } else {
    initialise();
  }

})();
