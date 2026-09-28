(function (global) {
  const CLOTHS_CATALOG = (typeof window !== 'undefined' && Array.isArray(window.CLOTHS_CATALOG) && window.CLOTHS_CATALOG.length)
    ? window.CLOTHS_CATALOG
    : [
      {
        id: 'tshirt_black',
        keywords: ['tshirt', 't-shirt', 'tee', 'round neck', 'black', 'men'],
        desc: 'Roadster Men Black Round Neck T-shirt with Striped Sleeves, Size: XL',
        qty: 1,
        gross: 699,
        discount: 144.76,
        gstRate: 5,
        gender: 'men'
      }
    ];

  const COURSE_CATALOG = (typeof window !== 'undefined' && Array.isArray(window.COURSE_CATALOG) && window.COURSE_CATALOG.length)
    ? window.COURSE_CATALOG
    : [
      {
        id: 'jee_advanced',
        keywords: ['jee', 'advanced', 'iit'],
        name: 'JEE Advanced 2023 purchase',
        price: 3999
      }
    ];

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s+-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function scoreItem(query, item) {
    const q = normalize(query);
    if (!q) return 0;
    let score = 0;
    const tokens = q.split(' ');
    item.keywords.forEach((kw) => {
      const key = normalize(kw);
      if (q.includes(key)) score += 3;
      tokens.forEach((token) => {
        if (token.length > 2 && key.includes(token)) score += 1;
      });

    });
    const hay = normalize((item.desc || item.name || '') + ' ' + item.keywords.join(' '));
    tokens.forEach((token) => {
      if (token.length > 2 && hay.includes(token)) score += 1;
    });
    return score;
  }

  function findSuggestions(mode, query, limit) {
    const catalog = mode === 'course' ? COURSE_CATALOG : CLOTHS_CATALOG;
    const ranked = catalog
      .map((item) => ({ item, score: scoreItem(query, item) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit || 3)
      .map((row) => row.item);

    if (ranked.length) return ranked;

    // Fallback top catalog items when no keyword match
    return catalog.slice(0, limit || 3);
  }

  function formatSuggestionText(mode, item) {
    if (mode === 'course') {
      return `${item.name}\nPrice: ₹${item.price}`;
    }
    return `${item.desc}\nGross: ₹${item.gross} | Discount: ₹${item.discount} | GST: ${item.gstRate}%`;
  }

  function createMessageEl(role, text) {
    const el = document.createElement('div');
    el.className = `suggestion-chat-msg ${role}`;
    el.textContent = text;
    return el;
  }

  function init(options) {
    const mode = options.mode === 'course' ? 'course' : 'cloths';
    const onApply = typeof options.onApply === 'function' ? options.onApply : function () {};
    const onAdd = typeof options.onAdd === 'function' ? options.onAdd : onApply;
    const title = mode === 'course' ? 'Course Suggest Assistant' : 'Product Suggest Assistant';
    const welcome =
      mode === 'course'
        ? 'Ask for a course suggestion.\nExamples: NestJS, Next.js, SQL, PostgreSQL, MongoDB, React'
        : 'Ask for a clothing product suggestion.\nExamples: men t-shirt, women dress, jeans, kurti, sneakers';
    const chips = mode === 'course'
      ? ['NestJS', 'Next.js', 'SQL', 'PostgreSQL', 'MongoDB', 'Python']
      : ['Men T-shirt', 'Women Dress', 'Jeans', 'Kurti', 'Sneakers', 'Hoodie'];

    const root = document.createElement('div');
    root.className = 'suggestion-chat-root';
    root.innerHTML = `
      <div class="suggestion-chat-panel" data-testid="${mode}_suggestion_chat_panel" aria-hidden="true">
        <div class="suggestion-chat-header">
          <h3>${title}</h3>
          <button type="button" class="suggestion-chat-close" data-testid="${mode}_suggestion_chat_close_button" aria-label="Close chat">&times;</button>
        </div>
        <div class="suggestion-chat-messages" data-testid="${mode}_suggestion_chat_messages"></div>
        <div class="suggestion-chat-chips"></div>
        <div class="suggestion-chat-input-row">
          <input type="text" class="suggestion-chat-input" data-testid="${mode}_suggestion_chat_input"
            placeholder="${mode === 'course' ? 'e.g. JEE course under 4000' : 'e.g. black t-shirt'}" />
          <button type="button" class="suggestion-chat-send" data-testid="${mode}_suggestion_chat_send_button">Send</button>
        </div>
      </div>
      <button type="button" class="suggestion-chat-toggle" data-testid="${mode}_suggestion_chat_toggle_button" aria-label="Open suggestion chat">AI</button>
    `;
    document.body.appendChild(root);

    const panel = root.querySelector('.suggestion-chat-panel');
    const toggle = root.querySelector('.suggestion-chat-toggle');
    const closeBtn = root.querySelector('.suggestion-chat-close');
    const messages = root.querySelector('.suggestion-chat-messages');
    const input = root.querySelector('.suggestion-chat-input');
    const sendBtn = root.querySelector('.suggestion-chat-send');
    const chipsWrap = root.querySelector('.suggestion-chat-chips');

    function setOpen(isOpen) {
      panel.classList.toggle('is-open', isOpen);
      panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }

    function appendBot(text) {
      messages.appendChild(createMessageEl('bot', text));
      messages.scrollTop = messages.scrollHeight;
    }

    function appendUser(text) {
      messages.appendChild(createMessageEl('user', text));
      messages.scrollTop = messages.scrollHeight;
    }

    function renderSuggestions(items, queryHadNoMatch) {
      const intro = queryHadNoMatch
        ? 'No exact match. Here are popular suggestions:'
        : `Found ${items.length} suggestion(s):`;
      appendBot(intro);

      items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        card.setAttribute('data-testid', `${mode}_suggestion_card_${item.id}`);

        const titleEl = document.createElement('strong');
        titleEl.textContent = mode === 'course' ? 'Course suggestion' : 'Product suggestion';

        const body = document.createElement('p');
        body.textContent = formatSuggestionText(mode, item);

        const actions = document.createElement('div');
        actions.className = 'suggestion-card-actions';

        const applyBtn = document.createElement('button');
        applyBtn.type = 'button';
        applyBtn.className = 'suggestion-apply-btn';
        applyBtn.setAttribute('data-testid', `${mode}_suggestion_apply_button_${item.id}`);
        applyBtn.textContent = mode === 'course' ? 'Apply to form' : 'Replace first item';
        applyBtn.addEventListener('click', function () {
          onApply(item);
          appendBot(mode === 'course'
            ? `Applied: ${item.name} at ₹${item.price}`
            : `Replaced first product with: ${item.desc}`);
        });
        actions.appendChild(applyBtn);

        if (mode === 'cloths') {
          const addBtn = document.createElement('button');
          addBtn.type = 'button';
          addBtn.className = 'suggestion-add-btn';
          addBtn.setAttribute('data-testid', `${mode}_suggestion_add_button_${item.id}`);
          addBtn.textContent = 'Add as new item';
          addBtn.addEventListener('click', function () {
            onAdd(item);
            appendBot(`Added product: ${item.desc}`);
          });
          actions.appendChild(addBtn);
        }

        card.appendChild(titleEl);
        card.appendChild(body);
        card.appendChild(actions);
        messages.appendChild(card);
        messages.scrollTop = messages.scrollHeight;
      });
    }

    function handleQuery(rawQuery) {
      const query = String(rawQuery || '').trim();
      if (!query) return;
      appendUser(query);
      input.value = '';

      const catalog = mode === 'course' ? COURSE_CATALOG : CLOTHS_CATALOG;
      const matched = catalog
        .map((item) => ({ item, score: scoreItem(query, item) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((row) => row.item);

      const noMatch = matched.length === 0;
      const items = noMatch ? catalog.slice(0, 3) : matched;
      renderSuggestions(items, noMatch);
    }

    chips.forEach((label) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'suggestion-chat-chip';
      chip.setAttribute('data-testid', `${mode}_suggestion_chip_${normalize(label).replace(/\s+/g, '_')}`);
      chip.textContent = label;
      chip.addEventListener('click', function () {
        handleQuery(label);
      });
      chipsWrap.appendChild(chip);
    });

    toggle.addEventListener('click', function () {
      setOpen(!panel.classList.contains('is-open'));
    });
    closeBtn.addEventListener('click', function () {
      setOpen(false);
    });
    sendBtn.addEventListener('click', function () {
      handleQuery(input.value);
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleQuery(input.value);
      }
    });

    appendBot(welcome);
  }

  global.SuggestionChatbot = {
    init: init,
    findSuggestions: findSuggestions
  };
})(window);
