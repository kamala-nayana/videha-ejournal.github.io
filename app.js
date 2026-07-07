(() => {
  const manifest = window.VIDEHA_MANIFEST;
  const index = window.VIDEHA_INDEX || [];
  const wordnet = window.VIDEHA_WORDNET_INDEX || [];
  const allIndex = index.concat(wordnet);
  const shardCache = new Map();
  const state = { mode: "headword", results: [], selected: null };
  const $ = (id) => document.getElementById(id);

  const norm = (s) => (s || "").toString().toLocaleLowerCase()
    .replace(/[^\w\u0900-\u097f]+/g, " ").replace(/\s+/g, " ").trim();
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function init() {
    fillSections();
    renderStats();
    $("status").textContent = `${allIndex.length.toLocaleString()} indexed entries`;
    ["query", "volume", "section", "onlySyn", "onlyAnt"].forEach(id => $(id).addEventListener("input", debounce(search, 80)));
    document.querySelectorAll(".segmented button").forEach(btn => btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode;
      document.querySelectorAll(".segmented button").forEach(b => b.classList.toggle("active", b === btn));
      search();
    }));
    $("clear").addEventListener("click", () => { $("query").value = ""; search(); $("query").focus(); });
    $("exportCsv").addEventListener("click", exportCsv);
    search();
  }

  function fillSections() {
    const sections = [...new Set(allIndex.map(x => x.sec))].sort((a,b) => a.localeCompare(b));
    for (const s of sections) {
      const opt = document.createElement("option");
      opt.value = s; opt.textContent = s;
      $("section").appendChild(opt);
    }
  }

  function renderStats() {
    const v = manifest.volumes;
    $("stats").innerHTML = `
      <div class="stat"><strong>${manifest.stats.rows.toLocaleString()}</strong> total entries</div>
      <div class="stat"><strong>${v.em.rows.toLocaleString()}</strong> English-Maithili</div>
      <div class="stat"><strong>${v.me.rows.toLocaleString()}</strong> Maithili-English</div>
      <div class="stat"><strong>${wordnet.length.toLocaleString()}</strong> WordNet English</div>
      <div class="stat"><strong>${v.em.synonymRows.toLocaleString()} / ${v.me.synonymRows.toLocaleString()}</strong> synonym rows</div>
      <div class="stat"><strong>${v.em.antonymRows.toLocaleString()} / ${v.me.antonymRows.toLocaleString()}</strong> antonym rows</div>`;
  }

  function debounce(fn, wait) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

  async function loadShard(name) {
    if (shardCache.has(name)) return shardCache.get(name);
    const info = manifest.shards[name];
    if (!info) return [];
    $("status").textContent = `Loading ${name}…`;
    await new Promise((resolve, reject) => {
      const old = window.VIDEHA_SHARD_PAYLOAD;
      window.VIDEHA_SHARD_PAYLOAD = null;
      const script = document.createElement("script");
      script.src = info.file;
      script.onload = () => {
        const payload = window.VIDEHA_SHARD_PAYLOAD;
        window.VIDEHA_SHARD_PAYLOAD = old || null;
        const records = payload && payload.records ? payload.records : [];
        shardCache.set(name, records);
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    $("status").textContent = `${allIndex.length.toLocaleString()} indexed entries`;
    return shardCache.get(name) || [];
  }

  function filters() {
    return {
      q: norm($("query").value),
      raw: $("query").value.trim(),
      volume: $("volume").value,
      section: $("section").value,
      onlySyn: $("onlySyn").checked,
      onlyAnt: $("onlyAnt").checked,
    };
  }

  function pass(entry, f) {
    if (f.volume !== "all" && entry.v !== f.volume) return false;
    if (f.section !== "all" && entry.sec !== f.section) return false;
    if (f.onlySyn && !(entry.syn || entry.syn_m || entry.syn_en)) return false;
    if (f.onlyAnt && !(entry.ant || entry.ant_m || entry.ant_en)) return false;
      return true;
  }

  function volumeLabel(v) {
    if (v === "em") return "English-Maithili";
    if (v === "me") return "Maithili-English";
    if (v === "wn") return "WordNet";
    return v;
  }

  function volumeBadge(v) {
    if (v === "em") return "E-M";
    if (v === "me") return "M-E";
    if (v === "wn") return "WN";
    return v;
  }

  async function search() {
    const f = filters();
    let hits = [];
    if (!f.q) {
      hits = allIndex.filter(x => pass(x, f)).slice(0, 100);
      renderResults(hits, "Browse", "Showing first 100 entries. Type to search.");
      return;
    }
    if (state.mode === "headword") {
      hits = allIndex.filter(x => pass(x, f) && (x.n === f.q || x.n.startsWith(f.q) || x.n.includes(f.q)))
        .map(x => ({...x, score: x.n === f.q ? 0 : x.n.startsWith(f.q) ? 1 : 2}))
        .sort((a,b) => a.score - b.score || a.h.length - b.h.length)
        .slice(0, 250);
    } else {
      hits = allIndex.filter(x => pass(x, f) && (x.n.includes(f.q) || (x.m || "").includes(f.q) || (x.e || "").toLocaleLowerCase().includes(f.q) || norm([x.syn, x.ant, x.syn_m, x.ant_m, x.syn_en, x.ant_en].join(" ")).includes(f.q)))
        .slice(0, 350);
      // Search cached full shards too, giving richer full-text hits as the user explores.
      const cached = [];
      for (const [sh, records] of shardCache.entries()) {
        for (const r of records) {
          const text = norm([r.h, r.m, r.e, r.syn, r.ant, r.syn_m, r.ant_m, r.syn_en, r.ant_en].join(" "));
          if (text.includes(f.q)) cached.push({id:r.id, v:r.v, sh, sec:r.sec, h:r.h, n:norm(r.h), syn:!!(r.syn || r.syn_m || r.syn_en), ant:!!(r.ant || r.ant_m || r.ant_en)});
        }
      }
      hits = mergeHits(hits, cached).slice(0, 350);
    }
    renderResults(hits, `${hits.length.toLocaleString()} result${hits.length === 1 ? "" : "s"}`, state.mode === "headword" ? "Headword search" : "Full text search over Videha index, WordNet, and loaded shards");
  }

  function mergeHits(a, b) {
    const map = new Map();
    [...a, ...b].forEach(x => { if (!map.has(x.id)) map.set(x.id, x); });
    return [...map.values()];
  }

  function renderResults(hits, title, meta) {
    state.results = hits;
    $("resultTitle").textContent = title;
    $("resultMeta").textContent = meta;
    const q = filters().raw;
    $("results").innerHTML = hits.map((x, idx) => `
      <button class="item ${state.selected === x.id ? "active" : ""}" data-idx="${idx}">
        <div class="item-title"><span>${highlight(esc(x.h), q)}</span><span class="badge">${volumeBadge(x.v)} · ${esc(x.sec)}</span></div>
        <div class="snippet">${x.syn ? "पर्यायवाची " : ""}${x.ant ? "विपरीतार्थक " : ""}${esc(snippetFor(x))}</div>
      </button>`).join("") || `<div class="empty-detail"><h2>No matches</h2><p>Try a shorter spelling, switch volume, or use full text mode.</p></div>`;
    document.querySelectorAll(".item").forEach(btn => btn.addEventListener("click", () => selectHit(hits[Number(btn.dataset.idx)])));
  }

  function snippetFor(x) {
    const parts = [];
    if (x.m) parts.push(x.m);
    if (x.e) parts.push(x.e);
    return parts.join(" · ").slice(0, 160);
  }

  function highlight(text, q) {
    if (!q) return text;
    const safe = esc(q);
    try { return text.replace(new RegExp(`(${safe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"), "<mark>$1</mark>"); }
    catch { return text; }
  }

  async function selectHit(hit) {
    state.selected = hit.id;
    if (hit.v === "wn") {
      renderDetail(hit);
      renderResults(state.results, $("resultTitle").textContent, $("resultMeta").textContent);
      return;
    }
    const records = await loadShard(hit.sh);
    const rec = records.find(r => r.id === hit.id);
    if (!rec) return;
    renderDetail(rec);
    renderResults(state.results, $("resultTitle").textContent, $("resultMeta").textContent);
  }

  function field(title, text, cls = "") {
    if (!text) return "";
    return `<div class="field ${cls}"><h3>${title}</h3><p>${esc(text)}</p></div>`;
  }

  function renderDetail(r) {
    $("detail").innerHTML = `<article class="entry">
      <h2>${esc(r.h)}</h2>
      <div class="meta"><span class="badge">${volumeLabel(r.v)}</span><span class="badge">${esc(r.sec)}</span>${r.pos ? `<span class="badge">${esc(r.pos)}</span>` : ""}</div>
      ${field("Maithili meaning", r.m)}
      ${field("English explanation", r.e)}
      ${field("मैथिली अधिवर्ग-वृक्ष", r.hypernym_m)}
      ${field("मैथिली सम्बन्ध", r.relations_m)}
      ${field("English hypernym tree", r.hypernym_en)}
      ${field("English semantic relations", r.relations_en)}
      ${field("मैथिली पर्यायवाची", r.syn_m, "syn")}
      ${field("English synonym source", r.syn_en || (!r.syn_m ? r.syn : ""), "syn")}
      ${field("मैथिली विलोम", r.ant_m, "ant")}
      ${field("English antonym source", r.ant_en || (!r.ant_m ? r.ant : ""), "ant")}
      ${field("Source", r.source)}
    </article>`;
  }

  async function exportCsv() {
    const rows = [["Volume","Section","Headword","Maithili Meaning","English Explanation","Maithili Synonym","English Synonym Source","Maithili Antonym","English Antonym Source","Source"]];
    for (const h of state.results.slice(0, 500)) {
      if (h.v === "wn") {
        rows.push([h.v, h.sec, h.h, h.m || "", h.e, h.syn_m || "", h.syn_en || h.syn || "", h.ant_m || "", h.ant_en || h.ant || "", h.source || "WordNet 2.1, Princeton University"]);
      } else {
        const records = await loadShard(h.sh);
        const r = records.find(x => x.id === h.id);
        if (r) rows.push([r.v, r.sec, r.h, r.m, r.e, r.syn_m || "", r.syn_en || r.syn || "", r.ant_m || "", r.ant_en || r.ant || "", r.source || "Videha"]);
      }
    }
    const csv = rows.map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
    a.download = "videha-thesaurus-results.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  init();
})();
