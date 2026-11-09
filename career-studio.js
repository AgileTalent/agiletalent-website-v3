(() => {
  'use strict';

  /* =========================================================
     AGILETALENT CAREER STUDIO
     Frontend application logic
     ========================================================= */

  const API_BASE = 'https://agiletalent-career-studio.onrender.com';

  const MONTHLY_LIMIT = 2;
  const CHAT_LIMIT = 5;
  const MAX_FILE_SIZE = 8 * 1024 * 1024;

  const STORAGE_ID_KEY = 'agiletalent_cs_browser_id';
  const STORAGE_MONTH_KEY = 'agiletalent_cs_rebuild_month';
  const STORAGE_COUNT_KEY = 'agiletalent_cs_rebuild_count';

  const ALLOWED_EXTENSIONS = ['pdf', 'docx'];

  let sessionId = null;
  let chatExchangesUsed = 0;
  let busy = false;

  let fallbackBrowserId = null;
  let fallbackMonth = '';
  let fallbackRebuildCount = 0;

  const $ = id => document.getElementById(id);


  /* =========================================================
     SAFE BROWSER STORAGE
     ========================================================= */

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, String(value));
      return true;
    } catch (_) {
      return false;
    }
  }


  /* =========================================================
     STATUS MESSAGE
     ========================================================= */

  function status(message) {
    const node = $('cs-upload-status');

    if (node) {
      node.textContent = message;
    }
  }


  /* =========================================================
     ANONYMOUS BROWSER IDENTIFICATION
     ========================================================= */

  function createBrowserId() {
    try {
      if (
        window.crypto &&
        typeof window.crypto.randomUUID === 'function'
      ) {
        return window.crypto.randomUUID().replace(/-/g, '');
      }

      if (
        window.crypto &&
        typeof window.crypto.getRandomValues === 'function'
      ) {
        return Array.from(
          window.crypto.getRandomValues(new Uint8Array(24))
        )
          .map(value => value.toString(16).padStart(2, '0'))
          .join('');
      }

    } catch (_) {}

    return (
      'agile' +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2)
    );
  }


  function getAnonymousId() {
    let id = storageGet(STORAGE_ID_KEY);

    if (!id) {
      if (!fallbackBrowserId) {
        fallbackBrowserId = createBrowserId();
      }

      id = fallbackBrowserId;

      storageSet(STORAGE_ID_KEY, id);
    }

    return id;
  }


  /* =========================================================
     LAGOS MONTH CALCULATION
     ========================================================= */

  function lagosMonth() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit'
    }).formatToParts(new Date());

    const year = parts.find(part => part.type === 'year').value;
    const month = parts.find(part => part.type === 'month').value;

    return `${year}-${month}`;
  }


  /* =========================================================
     MONTHLY REBUILD LIMIT
     ========================================================= */

  function getLocalRebuildCount() {
    const month = lagosMonth();

    const savedMonth = storageGet(STORAGE_MONTH_KEY);

    if (savedMonth !== month) {
      fallbackMonth = month;
      fallbackRebuildCount = 0;

      storageSet(STORAGE_MONTH_KEY, month);
      storageSet(STORAGE_COUNT_KEY, '0');

      return 0;
    }

    const savedCount = storageGet(STORAGE_COUNT_KEY);

    if (savedCount === null) {
      return fallbackMonth === month
        ? fallbackRebuildCount
        : 0;
    }

    const count = Number.parseInt(savedCount, 10);

    return Number.isFinite(count) && count >= 0
      ? count
      : 0;
  }


  function setLocalRebuildCount(count) {
    const month = lagosMonth();

    fallbackMonth = month;
    fallbackRebuildCount = count;

    storageSet(STORAGE_MONTH_KEY, month);
    storageSet(STORAGE_COUNT_KEY, count);

    renderRebuildCount();
  }


  /* =========================================================
     USAGE DISPLAY
     ========================================================= */

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
    const usage = $('cs-chat-usage');
    const counter = $('cs-chat-counter');

    const exhausted = chatExchangesUsed >= CHAT_LIMIT;

    if (usage) {
      usage.textContent =
        `Conversation exchanges used: ${chatExchangesUsed} of ${CHAT_LIMIT}.`;

      if (exhausted) {
        usage.textContent +=
          ' You can still download your latest CV.';
      }
    }

    if (counter) {
      counter.textContent =
        `${chatExchangesUsed} / ${CHAT_LIMIT}`;
    }

    const input = $('cs-message');

    const submit = $('cs-chat-form')
      ?.querySelector('button[type="submit"]');

    if (input) {
      input.disabled = busy || exhausted;

      input.placeholder = exhausted
        ? 'You have used all five exchanges for this CV session.'
        : 'Tell the assistant what you would like to improve.';
    }

    if (submit) {
      submit.disabled = busy || exhausted;
    }
  }


  /* =========================================================
     BUSY STATE
     ========================================================= */

  function setBusy(value) {
    busy = value;

    const start = $('cs-start');
    const download = $('cs-download');
    const deleteButton = $('cs-delete');

    if (start && !sessionId) {
      start.disabled =
        value || getLocalRebuildCount() >= MONTHLY_LIMIT;
    }

    if (download) {
      download.disabled = value;
    }

    if (deleteButton) {
      deleteButton.disabled = value;
    }

    renderChatCount();
  }


  /* =========================================================
     CHAT MESSAGE DISPLAY
     ========================================================= */

  function addMessage(who, message) {
    const container = $('cs-messages');

    if (!container) return;

    const element = document.createElement('div');

    element.className = `cs-message ${who}`;

    // textContent prevents uploaded CV or AI content
    // from being interpreted as HTML.
    element.textContent = message;

    container.appendChild(element);

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }


  /* =========================================================
     API REQUEST HANDLER
     ========================================================= */

  async function api(path, options = {}) {
    let response;

    try {
      response = await fetch(API_BASE + path, options);

    } catch (_) {
      throw new Error(
        'Unable to connect to Career Studio. Please check your internet connection and try again.'
      );
    }

    if (!response.ok) {
      let message =
        'Something went wrong. Please try again.';

      try {
        const data = await response.json();

        if (data.detail) {
          message = Array.isArray(data.detail)
            ? data.detail.map(item => item.msg || '').join(' ')
            : String(data.detail);
        } else if (data.message) {
          message = String(data.message);
        }

      } catch (_) {}

      throw new Error(message);
    }

    return response;
  }


  /* =========================================================
     CV ELEMENT HELPERS
     ========================================================= */

  function currentAnalysisElement() {
    return $('cs-analysis-text') || $('cs-analysis');
  }


  function validateFile(file) {
    if (!file) {
      return 'Please select your CV first.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'Your CV exceeds the 8 MB file size limit. Please upload a smaller file.';
    }

    if (file.size === 0) {
      return 'The selected file is empty. Please choose another file.';
    }

    const extension = file.name
      .split('.')
      .pop()
      .toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return 'Unsupported file format. Please upload your CV as a PDF or DOCX file.';
    }

    const mimeType = file.type || '';

    if (
      extension === 'pdf' &&
      mimeType &&
      mimeType !== 'application/pdf'
    ) {
      return 'The selected file does not appear to be a valid PDF.';
    }

    if (
      extension === 'docx' &&
      mimeType &&
      mimeType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
      mimeType !== 'application/zip'
    ) {
      return 'The selected file does not appear to be a valid Word document.';
    }

    return null;
  }


  /* =========================================================
     START CV ANALYSIS AND REVAMP
     ========================================================= */

  async function startCV() {
    if (busy || sessionId) return;

    const file = $('cs-file')?.files?.[0];

    const fileError = validateFile(file);

    if (fileError) {
      return status(fileError);
    }

    if (!$('cs-consent')?.checked) {
      return status(
        'Please confirm the privacy notice before uploading.'
      );
    }

    const used = getLocalRebuildCount();

    if (used >= MONTHLY_LIMIT) {
      return renderRebuildCount();
    }

    setBusy(true);

    status(
      'Reading your CV and preparing your personalised revamp. This may take a little while…'
    );

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

      if (!data.session_id) {
        throw new Error(
          'Your CV was received, but we could not establish a session. Please try again.'
        );
      }

      // Record usage only after successful session creation.
      sessionId = data.session_id;

      setLocalRebuildCount(used + 1);

      chatExchangesUsed = Number(
        data.chat_exchanges_used || 0
      );

      const workspace = $('cs-workspace');

      if (workspace) {
        workspace.hidden = false;
      }

      const analysis = currentAnalysisElement();

      if (analysis) {
        analysis.textContent = data.analysis || '';
      }

      const preview = $('cs-cv-preview');

      if (preview) {
        preview.textContent = data.cv_text || '';
      }

      const messages = $('cs-messages');

      if (messages) {
        messages.replaceChildren();
      }

      addMessage(
        'assistant',
        data.assistant_message ||
        'Your CV has been analysed and a revised draft is ready. You can review the feedback below or tell me what you would like to improve.'
      );

      renderChatCount();

      status(
        'Your CV has been successfully analysed and revamped.'
      );

      workspace?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    } catch (error) {
      status(error.message);

    } finally {
      setBusy(false);
      renderRebuildCount();
      renderChatCount();
    }
  }


  /* =========================================================
     CHAT WITH THE CV ASSISTANT
     ========================================================= */

  async function sendChat(event) {
    event.preventDefault();

    if (
      busy ||
      !sessionId ||
      chatExchangesUsed >= CHAT_LIMIT
    ) {
      return;
    }

    const input = $('cs-message');

    if (!input) return;

    const message = input.value.trim();

    if (!message) return;

    if (message.length > 4000) {
      return addMessage(
        'assistant',
        'Your instruction is too long. Please shorten it and try again.'
      );
    }

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

      // Display the user's message only after the request succeeds.
      addMessage('user', message);

      input.value = '';

      const analysis = currentAnalysisElement();

      if (analysis) {
        analysis.textContent = data.analysis || '';
      }

      const preview = $('cs-cv-preview');

      if (preview) {
        preview.textContent = data.cv_text || '';
      }

      addMessage(
        'assistant',
        data.assistant_message ||
        'Your CV draft has been updated. You can continue giving me instructions.'
      );

      chatExchangesUsed = Number(
        data.chat_exchanges_used ?? (chatExchangesUsed + 1)
      );

      // Keep the counter within the configured limit.
      chatExchangesUsed = Math.min(
        chatExchangesUsed,
        CHAT_LIMIT
      );

      renderChatCount();

    } catch (error) {
      addMessage(
        'assistant',
        error.message
      );

      if (
        error.message
          .toLowerCase()
          .includes('five conversation exchanges')
      ) {
        chatExchangesUsed = CHAT_LIMIT;
      }

    } finally {
      setBusy(false);
      renderChatCount();
    }
  }


  /* =========================================================
     DOWNLOAD REVISED CV
     ========================================================= */

  async function downloadCV() {
    if (!sessionId || busy) return;

    setBusy(true);

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

      if (!blob.size) {
        throw new Error(
          'The downloaded document appears to be empty. Please try again.'
        );
      }

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = 'AgileTalent-Revamped-CV.docx';

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1500);

    } catch (error) {
      alert(error.message);

    } finally {
      setBusy(false);
    }
  }


  /* =========================================================
     END SESSION AND DELETE TEMPORARY DATA
     ========================================================= */

  async function endSession() {
    if (!sessionId || busy) return;

    const confirmed = window.confirm(
      'Are you sure you want to end this session and delete its temporary CV data? You will need to upload your CV again to start a new session.'
    );

    if (!confirmed) return;

    const activeSessionId = sessionId;

    setBusy(true);

    try {
      await api(
        '/api/cv/session/' + encodeURIComponent(activeSessionId),
        {
          method: 'DELETE'
        }
      );

      // Reset the frontend only after the backend confirms deletion.
      sessionId = null;
      chatExchangesUsed = 0;

      const workspace = $('cs-workspace');

      if (workspace) {
        workspace.hidden = true;
      }

      const messages = $('cs-messages');

      if (messages) {
        messages.replaceChildren();
      }

      const preview = $('cs-cv-preview');

      if (preview) {
        preview.textContent = '';
      }

      const analysis = currentAnalysisElement();

      if (analysis) {
        analysis.textContent = '';
      }

      const file = $('cs-file');

      if (file) {
        file.value = '';
      }

      const consent = $('cs-consent');

      if (consent) {
        consent.checked = false;
      }

      const input = $('cs-message');

      if (input) {
        input.value = '';
      }

      const analysisAccordion = $('cs-analysis-accordion');

      if (analysisAccordion) {
        analysisAccordion.open = false;
      }

      const previewAccordion = $('cs-preview-accordion');

      if (previewAccordion) {
        previewAccordion.open = false;
      }

      status(
        'Your session has ended and the backend has confirmed the deletion request.'
      );

      $('cs-upload-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

    } catch (error) {
      alert(error.message);

    } finally {
      setBusy(false);
      renderRebuildCount();
      renderChatCount();
    }
  }


  /* =========================================================
     FILE SELECTION FEEDBACK
     ========================================================= */

  function handleFileSelection() {
    const file = $('cs-file')?.files?.[0];

    if (!file) {
      status('');
      return;
    }

    const error = validateFile(file);

    if (error) {
      status(error);
      return;
    }

    status(
      `${file.name} selected successfully. Confirm the privacy notice to continue.`
    );
  }


  /* =========================================================
     INITIALISE APPLICATION
     ========================================================= */

  function initialise() {
    if (!$('cs-start') || !$('cs-chat-form')) {
      return;
    }

    getAnonymousId();

    renderRebuildCount();
    renderChatCount();

    $('cs-start').addEventListener(
      'click',
      startCV
    );

    $('cs-chat-form').addEventListener(
      'submit',
      sendChat
    );

    $('cs-download')?.addEventListener(
      'click',
      downloadCV
    );

    $('cs-delete')?.addEventListener(
      'click',
      endSession
    );

    $('cs-file')?.addEventListener(
      'change',
      handleFileSelection
    );
  }


  /* =========================================================
     DOM READY
     ========================================================= */

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initialise,
      { once: true }
    );

  } else {
    initialise();
  }

})();
