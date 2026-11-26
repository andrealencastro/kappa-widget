
// Kappa Widget MVP — κ-only (local, no storage, no network)
// Modes: discovery | confidence | poetic
// Heuristic, lightweight, language-agnostic with small EN/PT wordlists.

(function() {
  if (window.__kappaWidgetLoaded__) return;
  window.__kappaWidgetLoaded__ = true;

  // --- Small common wordlists (EN/PT) for rough lexical rarity ---
  const commonEN = new Set([
    "the","be","to","of","and","a","in","that","have","i","it","for","not","on","with",
    "he","as","you","do","at","this","but","his","by","from","they","we","say","her",
    "she","or","an","will","my","one","all","would","there","their","what","so","up",
    "out","if","about","who","get","which","go","me"
  ]);
  const commonPT = new Set([
    "o","a","os","as","de","do","da","um","uma","e","ou","em","para","por","com","não",
    "que","ser","ter","ele","ela","você","eu","no","na","nos","nas","se","ao","à",
    "como","mais","menos","isso","isto","aquilo","sua","seu","suas","seus","há","dos","das"
  ]);

  const idioms = [
    // PT
    "ao pé da letra","mão na massa","quebrar o galho","chutar o balde","fazer vista grossa",
    "bola fora","pôr a mão no fogo","olho por olho",
    // EN
    "piece of cake","break a leg","kick the bucket","hit the sack","once in a blue moon",
    "a dime a dozen","beat around the bush","under the weather"
  ];

  function tokenizeWords(txt) {
    return (txt.toLowerCase().match(/[a-záàâãçéêíóôõúü]+/gi) || []);
  }

  function hasIdiom(txt) {
    const low = txt.toLowerCase();
    return idioms.some(id => low.includes(id));
  }

  function metaphorFlag(txt) {
    // extremely naive: simile markers in EN/PT
    const low = txt.toLowerCase();
    return (/\blike a\b|\bas (a|an)\b|\bcomo um\b|\bcomo uma\b/.test(low));
  }

  function lexicalRarityRatio(words) {
    if (words.length === 0) return 0;
    let rare = 0;
    for (const w of words) {
      const basic = commonEN.has(w) || commonPT.has(w);
      if (!basic && w.length >= 8) rare++;
    }
    return rare / words.length;
  }

  function entityContextGap(txt) {
    // simple proxy: number of mid-sentence Capitals / length
    const caps = (txt.match(/\b[A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ][a-záàâãçéêíóôõúü]+\b/g) || []).length;
    const len = Math.max(1, txt.split(/\s+/).length);
    return Math.min(1, caps / len);
  }

  function estimateKappa(sentence) {
    const words = tokenizeWords(sentence);
    const rarity = lexicalRarityRatio(words);              // 0..1
    const idiom = hasIdiom(sentence) ? 0.4 : 0;            // bump
    const metaph = metaphorFlag(sentence) ? 0.25 : 0;      // bump
    const gap = entityContextGap(sentence);                // 0..1

    // Weighted sum → sigmoid-like squash
    const z = 2.2*rarity + idiom + metaph + 1.3*gap - 0.4; // bias
    const kappa = 1 / (1 + Math.exp(-3*z));                // steeper
    return Math.max(0, Math.min(1, kappa));
  }

  // Extract text nodes → sentences (very rough split)
  function getSentences() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        const txt = node.nodeValue.trim();
        if (!txt) return NodeFilter.FILTER_REJECT;
        if (txt.length < 30) return NodeFilter.FILTER_SKIP; // skip tiny nodes
        // Exclude code/pre/script/style
        if (node.parentElement && /^(SCRIPT|STYLE|CODE|PRE|NOSCRIPT)$/.test(node.parentElement.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  // UI state
  let mode = "discovery"; // discovery | confidence | poetic
  let threshold = 0.4;

  function makePanel() {
    const panel = document.createElement("div");
    panel.id = "kappa-panel";
    panel.innerHTML = `
      <div class="kp-row">
        <strong>κ</strong>
        <button data-mode="discovery" class="kp-btn kp-active">Descoberta</button>
        <button data-mode="confidence" class="kp-btn">Confiança</button>
        <button data-mode="poetic" class="kp-btn">Poético</button>
        <span class="kp-tip">local · sem logs</span>
      </div>
    `;
    document.documentElement.appendChild(panel);
    panel.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-mode]");
      if (!btn) return;
      mode = btn.getAttribute("data-mode");
      for (const b of panel.querySelectorAll(".kp-btn")) b.classList.remove("kp-active");
      btn.classList.add("kp-active");
      // Refresh annotations
      annotate(true);
    });
  }

  function makeBadge(kappa) {
    const el = document.createElement("span");
    el.className = "kappa-badge";
    el.textContent = renderBadgeText(kappa);
    el.style.setProperty("--kappa", kappa.toFixed(2));
    return el;
  }

  function renderBadgeText(k) {
    if (mode === "poetic") {
      if (k < 0.33) return "baixa névoa";
      if (k < 0.66) return "névoa";
      return "bruma";
    }
    // discovery/confidence numeric
    return `κ≈${k.toFixed(2)}`;
  }

  function annotate(force=false) {
    const nodes = getSentences();
    for (const node of nodes) {
      let span = node.parentElement;
      // Wrap node in a span if needed
      if (!span || !span.classList || !span.classList.contains("kappa-span")) {
        const wrapper = document.createElement("span");
        wrapper.className = "kappa-span";
        node.parentNode.insertBefore(wrapper, node);
        wrapper.appendChild(node);
        span = wrapper;
      }
      // Compute once
      if (force || span.dataset.kappa === undefined) {
        const k = estimateKappa(span.innerText);
        span.dataset.kappa = k.toFixed(2);
      }
      const kappa = parseFloat(span.dataset.kappa);

      // Cleanup existing badge
      const old = span.querySelector(":scope > .kappa-badge");
      if (old) old.remove();

      // Mode-specific display
      if (mode === "discovery") {
        // Only show on hover
        span.classList.add("kappa-hover");
      } else if (mode === "confidence") {
        span.classList.remove("kappa-hover");
        if (kappa >= threshold) {
          const b = makeBadge(kappa);
          span.appendChild(b);
        }
      } else if (mode === "poetic") {
        span.classList.remove("kappa-hover");
        const b = makeBadge(kappa);
        span.appendChild(b);
      }
    }
  }

  // Inject styles and panel
  function injectStyles() {
    if (document.getElementById("kappa-styles")) return;
    const link = document.createElement("link");
    link.id = "kappa-styles";
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles.css");
    document.documentElement.appendChild(link);
  }

  injectStyles();
  makePanel();
  annotate(true);
  // Re-annotate on DOM changes
  const obs = new MutationObserver((muts) => {
    // throttle
    if (window.__kappaThrottle__) return;
    window.__kappaThrottle__ = true;
    setTimeout(() => { window.__kappaThrottle__ = false; annotate(); }, 500);
  });
  obs.observe(document.body, {subtree:true, childList:true, characterData:true});

})();
