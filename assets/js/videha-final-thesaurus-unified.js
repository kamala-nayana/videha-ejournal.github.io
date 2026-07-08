(function () {
  const BACKEND_BASE = "https://videha-ejournal.github.io/";
  const MANIFEST_URL = BACKEND_BASE + "data/manifest.json";
  let manifest = null;
  const cache = new Map();

  function $(id) {
    return document.getElementById(id);
  }

  function norm(s) {
    return (s || "")
      .toString()
      .normalize("NFC")
      .toLowerCase()
      .replace(/[\u200c\u200d]/g, "")
      .replace(/[^\w\u0900-\u097f]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function devaLoose(s) {
    return (s || "")
      .toString()
      .normalize("NFC")
      .replace(/क़/g, "क")
      .replace(/[ख़]/g, "ख")
      .replace(/[ग़]/g, "ग")
      .replace(/[ज़]/g, "ज")
      .replace(/[फ़]/g, "फ")
      .replace(/[ऩ]/g, "न")
      .replace(/[ऱ]/g, "र")
      .replace(/[ऴ]/g, "ळ")
      .replace(/[ँं]/g, "")
      .replace(/[़]/g, "")
      .replace(/ष/g, "श")
      .replace(/श/g, "स")
      .replace(/व/g, "ब")
      .replace(/[ईी]/g, "इ")
      .replace(/[ऊू]/g, "उ")
      .replace(/[ऐै]/g, "ए")
      .replace(/[औौ]/g, "ओ")
      .replace(/[आा]/g, "अ")
      .replace(/[ॉो]/g, "ो")
      .replace(/[ॅे]/g, "े")
      .replace(/्/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function stripDiacritics(s) {
    return (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[āĀ]/g, "a")
      .replace(/[īĪ]/g, "i")
      .replace(/[ūŪ]/g, "u")
      .replace(/[ṛṚṝṜ]/g, "r")
      .replace(/[ḷḶḹḸ]/g, "l")
      .replace(/[ṅṄ]/g, "n")
      .replace(/[ñÑ]/g, "n")
      .replace(/[ṭṬ]/g, "t")
      .replace(/[ḍḌ]/g, "d")
      .replace(/[ṇṆ]/g, "n")
      .replace(/[śŚṣṢ]/g, "s")
      .replace(/[ṃṁṂṀ]/g, "m")
      .replace(/[ḥḤ]/g, "h");
  }

  function looseRoman(s) {
    return stripDiacritics(s)
      .toLowerCase()
      .replace(/sh/g, "s")
      .replace(/kh/g, "k")
      .replace(/gh/g, "g")
      .replace(/ch/g, "c")
      .replace(/jh/g, "j")
      .replace(/th/g, "t")
      .replace(/dh/g, "d")
      .replace(/ph/g, "p")
      .replace(/bh/g, "b")
      .replace(/aa/g, "a")
      .replace(/ii/g, "i")
      .replace(/uu/g, "u")
      .replace(/ee/g, "e")
      .replace(/oo/g, "o")
      .replace(/w/g, "v")
      .replace(/x/g, "ks")
      .replace(/q/g, "k")
      .replace(/ou/g, "o")
      .replace(/oo/g, "u")
      .replace(/ee/g, "i")
      .replace(/([a-z])\1+/g, "$1")
      .replace(/[^a-z0-9\u0900-\u097f]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const vowels = { a: "अ", aa: "आ", A: "आ", i: "इ", ii: "ई", I: "ई", u: "उ", uu: "ऊ", U: "ऊ", e: "ए", ai: "ऐ", o: "ओ", au: "औ", R: "ऋ", "ṛ": "ऋ" };
  const vowelMarks = { a: "", aa: "ा", A: "ा", i: "ि", ii: "ी", I: "ी", u: "ु", uu: "ू", U: "ू", e: "े", ai: "ै", o: "ो", au: "ौ", R: "ृ", "ṛ": "ृ" };
  const cons = { kh: "ख", gh: "घ", ch: "छ", jh: "झ", th: "थ", dh: "ध", ph: "फ", bh: "भ", k: "क", g: "ग", c: "च", j: "ज", T: "ट", t: "त", D: "ड", d: "द", N: "ण", n: "न", p: "प", b: "ब", m: "म", y: "य", r: "र", l: "ल", v: "व", w: "व", z: "श", s: "स", h: "ह", "ṭ": "ट", "ḍ": "ड", "ṇ": "ण", "ś": "श", "ṣ": "ष", "ñ": "ञ", "ṅ": "ङ" };

  function latinToDeva(input) {
    let s = (input || "").toString().normalize("NFC").replace(/Sh/g, "ṣ").replace(/sh/g, "ś");
    const ckeys = Object.keys(cons).sort((a, b) => b.length - a.length);
    const vkeys = Object.keys(vowels).sort((a, b) => b.length - a.length);
    let out = "";
    let i = 0;

    function matchKey(keys, pos) {
      for (const key of keys) {
        if (s.slice(pos, pos + key.length) === key) return key;
      }
      return null;
    }

    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) {
        out += " ";
        i++;
        continue;
      }
      const vk = matchKey(vkeys, i);
      if (vk) {
        out += vowels[vk];
        i += vk.length;
        continue;
      }
      const ck = matchKey(ckeys, i);
      if (ck) {
        const c = cons[ck];
        i += ck.length;
        const nextV = matchKey(vkeys, i);
        if (nextV) {
          out += c + vowelMarks[nextV];
          i += nextV.length;
        } else {
          out += c + "्";
        }
        continue;
      }
      out += ch;
      i++;
    }

    return out.replace(/्(\s|$)/g, "$1");
  }

  function hasDeva(s) {
    return /[\u0900-\u097f]/.test(s || "");
  }

  function queryForms(q) {
    const forms = new Set();
    const raw = (q || "").toString().trim();
    if (!raw) return [];
    forms.add(norm(raw));
    forms.add(looseRoman(raw));
    forms.add(norm(stripDiacritics(raw)));
    forms.add(devaLoose(raw));
    forms.add(devaLoose(latinToDeva(stripDiacritics(raw))));
    if (!hasDeva(raw)) {
      forms.add(norm(latinToDeva(raw)));
      forms.add(norm(latinToDeva(stripDiacritics(raw))));
    }
    return Array.from(forms).filter(Boolean);
  }

  function approxContains(text, form) {
    if (!text || !form) return false;
    if (text.includes(form)) return true;
    const tokens = text.split(/\s+/).filter(Boolean);
    return tokens.some((tok) => {
      if (tok === form || tok.startsWith(form) || form.startsWith(tok)) return true;
      if (form.length >= 5 && tok.length >= 5) {
        if (tok.includes(form.slice(0, -1)) || form.includes(tok.slice(0, -1))) return true;
        if (tok.includes(form.slice(1)) || form.includes(tok.slice(1))) return true;
      }
      return false;
    });
  }

  function bucketsFor(q) {
    q = norm(q);
    if (!q) return [];
    return [q.length >= 2 ? q.slice(0, 2) : q[0]];
  }

  function latinBucketCandidates(rawQ) {
    const out = new Set();
    queryForms(rawQ).forEach((form) => {
      const s = looseRoman(form).replace(/[^a-z0-9 ]/g, " ").trim();
      if (!s) return;
      const tok = s.split(/\s+/)[0] || "";
      if (!tok) return;
      out.add(tok.slice(0, 2));
      out.add(tok.slice(0, 1));
    });
    return Array.from(out).filter(Boolean);
  }

  function devaBucketCandidates(rawQ) {
    const out = new Set();
    queryForms(rawQ).forEach((form) => {
      const src = hasDeva(form) ? form : latinToDeva(form);
      const s = (src || "").replace(/[^\u0900-\u097f0-9]+/g, " ").trim();
      if (!s) return;
      const tok = s.split(/\s+/)[0] || "";
      if (!tok) return;
      out.add(tok.slice(0, 2));
      out.add(tok.slice(0, 1));
    });
    return Array.from(out).filter(Boolean);
  }

  async function loadManifest() {
    if (manifest) return manifest;
    const res = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`manifest ${res.status}`);
    manifest = await res.json();
    return manifest;
  }

  function normalizeScope(scope) {
    if (scope === "db1") return "me";
    if (scope === "db2") return "em";
    return scope || "both";
  }

  function countsFromManifest(m) {
    if (m && m.volumes && m.volumes.em && m.volumes.me) {
      return {
        em: Number(m.volumes.em.rows || 0),
        me: Number(m.volumes.me.rows || 0),
      };
    }
    const meta = (m && m.meta) || {};
    return {
      em: Number(meta.english_maithili_total || 0),
      me: Number(meta.maithili_english_total || 0),
    };
  }

  function manifestVolumeInfo(volume) {
    const modern = (((manifest || {}).volumes || {})[volume]) || null;
    if (modern) return modern;
    const dbs = ((manifest || {}).dbs) || {};
    for (const key of Object.keys(dbs)) {
      const db = dbs[key];
      if ((db && db.direction) === volume) return db;
    }
    return null;
  }

  function manifestChunksForVolume(volume) {
    const info = manifestVolumeInfo(volume);
    if (!info) return [];
    if (Array.isArray(info.chunks)) {
      return info.chunks
        .map((c) => ({ bucket: c.bucket, file: c.file }))
        .filter((c) => c.file);
    }
    const sheets = Array.isArray(info.sheets) ? info.sheets : [];
    const out = [];
    sheets.forEach((sheet) => {
      (sheet.shards || []).forEach((shard) => {
        out.push({
          bucket: shard.key || shard.bucket || "",
          file: shard.path || shard.file || "",
        });
      });
    });
    return out.filter((c) => c.file);
  }

  async function loadChunk(file) {
    const url = file.startsWith("http") ? file : BACKEND_BASE + file.replace(/^\/*/, "");
    if (cache.has(url)) return cache.get(url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} ${res.status}`);
    const arr = await res.json();
    cache.set(url, arr);
    return arr;
  }

  function textOf(r) {
    const base = [
      r.h,
      r.english_headword,
      r.m,
      r.e,
      r.syn_m,
      r.syn_en,
      r.ant_m,
      r.ant_en,
      r.hypernym_m,
      r.hypernym_en,
      r.relations_m,
      r.relations_en,
      r.sec,
      r.source_kind,
    ].join(" ");
    return {
      exact: norm(base),
      loose: looseRoman(base),
      deva: devaLoose(base),
    };
  }

  function recordTags(r) {
    const meta = norm([
      r.sec,
      r.source_kind,
      r.pos,
      r.m,
      r.e,
      r.syn_m,
      r.syn_en,
      r.ant_m,
      r.ant_en,
      r.hypernym_m,
      r.hypernym_en,
      r.relations_m,
      r.relations_en,
    ].join(" "));
    const tags = new Set();
    if (r.syn_m || r.syn_en || /synonym|पर्याय/.test(meta)) tags.add("syn");
    if (r.ant_m || r.ant_en || /antonym|विपरीत/.test(meta)) tags.add("ant");
    if (/it|ict|computer|digital|internet|software|glossary|कम्प्यूटर|कंप्यूटर|तकनीक|सूचना/.test(meta)) tags.add("it");
    if ((r.senses && r.senses.length) || /wordnet|hypernym|relation|synset|sense/.test(meta)) tags.add("wordnet");
    if (!tags.size) tags.add("base");
    return tags;
  }

  function allowByFilters(r, cfg) {
    const tags = recordTags(r);
    return (
      (cfg.base && tags.has("base")) ||
      (cfg.syn && tags.has("syn")) ||
      (cfg.ant && tags.has("ant")) ||
      (cfg.it && tags.has("it")) ||
      (cfg.wordnet && tags.has("wordnet"))
    );
  }

  function filesForVolumeQuery(q, volume) {
    const chunks = manifestChunksForVolume(volume);
    if (!chunks.length) return [];
    const wanted = new Set(volume === "em" ? latinBucketCandidates(q) : devaBucketCandidates(q));
    if (!wanted.size) return [];
    return chunks
      .filter((c) => wanted.has(c.bucket))
      .map((c) => c.file);
  }

  function allFilesForVolume(volume) {
    const chunks = manifestChunksForVolume(volume);
    return chunks.map((c) => c.file);
  }

  function sourceName(file) {
    return file.includes("/em/") || file.includes("data/chunks/em/") ? "English-Maithili" : "Maithili-English";
  }

  function htmlEscape(s) {
    return (s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  function bestMatchScore(r, forms) {
    const fields = {
      headExact: norm([r.h, r.english_headword].filter(Boolean).join(" ")),
      headLoose: looseRoman([r.h, r.english_headword].filter(Boolean).join(" ")),
      headDeva: devaLoose([r.h, r.english_headword].filter(Boolean).join(" ")),
      body: textOf(r),
    };
    let best = 0;
    for (const form of forms) {
      const exact = norm(form);
      const loose = looseRoman(form);
      const deva = devaLoose(form);
      if (fields.headExact === exact || fields.headLoose === loose || fields.headDeva === deva) best = Math.max(best, 4000);
      else if (fields.headExact.startsWith(exact) || fields.headLoose.startsWith(loose) || fields.headDeva.startsWith(deva)) best = Math.max(best, 2800);
      else if (approxContains(fields.headExact, exact) || approxContains(fields.headLoose, loose) || approxContains(fields.headDeva, deva)) best = Math.max(best, 1800);
      else if (approxContains(fields.body.exact, exact) || approxContains(fields.body.loose, loose) || approxContains(fields.body.deva, deva)) best = Math.max(best, 900);
    }
    return best;
  }

  function sortSearchHits(hits) {
    hits.sort((a, b) => {
      if ((b._score || 0) !== (a._score || 0)) return (b._score || 0) - (a._score || 0);
      return String(a.h || "").localeCompare(String(b.h || ""));
    });
    return hits;
  }

  async function runUnifiedSearch(opts) {
    const rawQ = opts.getQuery();
    const forms = queryForms(rawQ);
    if (!forms.length) {
      opts.setStatus("खोज शब्द लिखू।");
      opts.renderEmpty();
      return;
    }
    await loadManifest();
    opts.showCounts(manifest);
    const scope = normalizeScope(opts.getScope());
    const volumes = scope === "both" ? ["em", "me"] : [scope];
    const filters = opts.getFilters();
    const limit = opts.getLimit();
    let candidateFiles = [];
    let deepFiles = [];
    volumes.forEach((v) => {
      candidateFiles.push(...filesForVolumeQuery(rawQ, v));
      if (opts.getDeep()) deepFiles.push(...allFilesForVolume(v));
    });
    candidateFiles = Array.from(new Set(candidateFiles));
    deepFiles = Array.from(new Set(deepFiles.filter((file) => !candidateFiles.includes(file))));
    let files = candidateFiles.concat(deepFiles);
    if (!files.length) {
      volumes.forEach((v) => files.push(...allFilesForVolume(v)));
      files = Array.from(new Set(files));
    }

    const hits = [];
    opts.setStatus("खोज चलि रहल अछि…");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arr = await loadChunk(file);
      for (const r of arr) {
        const score = bestMatchScore(r, forms);
        if (score > 0 && allowByFilters(r, filters)) {
          hits.push({ ...r, _file: file, _score: score });
        }
      }
      sortSearchHits(hits);
      if (hits.length > limit * 3) hits.length = limit * 3;
      if (i + 1 === candidateFiles.length && hits.length) {
        const top = sortSearchHits(hits.slice()).slice(0, limit);
        const strongest = top[0] && top[0]._score >= 1800;
        if (strongest || !opts.getDeep()) {
          opts.render(top, forms, candidateFiles.length === files.length);
          opts.setStatus(`${top.length} परिणाम भेटल। ${i + 1}/${files.length} chunk देखल गेल।`);
          return;
        }
      }
      if (i % 4 === 0) {
        opts.setStatus(`${Math.min(hits.length, limit)} परिणाम भेटल। ${i + 1}/${files.length} chunk देखल गेल।`);
      }
    }
    const finalHits = sortSearchHits(hits.slice()).slice(0, limit);
    opts.render(finalHits, forms, true);
    opts.setStatus(`${finalHits.length} परिणाम भेटल। खोज पूर्ण।`);
  }

  function setupSearchPage() {
    if (!$("q") || !$("results") || !$("status")) return;
    const render = (results, forms, done) => {
      if (!results.length) {
        $("results").innerHTML = '<div class="vd-result"><h3>परिणाम नै भेटल</h3><div class="vd-body">वर्तनी, scope, filter वा विस्तृत खोज विकल्प फेर जाँचू।</div></div>';
        return;
      }
      const primary = forms[0] || "";
      $("results").innerHTML =
        results
          .map((r) => {
            let body = htmlEscape(r.b || [r.m, r.e, r.syn_m, r.syn_en, r.ant_m, r.ant_en, r.hypernym_m, r.hypernym_en, r.relations_m, r.relations_en].filter(Boolean).join(" ; "));
            let head = htmlEscape(r.h);
            const tags = Array.from(recordTags(r)).join(" · ");
            if (primary) {
              try {
                const re = new RegExp(primary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
                body = body.replace(re, "<mark>$&</mark>");
                head = head.replace(re, "<mark>$&</mark>");
              } catch (e) {}
            }
            return `<article class="vd-result"><div class="vd-source">${sourceName(r._file)} · ${htmlEscape(r.sec || "")} · ${htmlEscape(tags)}</div><h3>${head}</h3><div class="vd-body">${body}</div></article>`;
          })
          .join("") +
        (done ? "" : '<div class="vd-status">परिणाम सीमा भरि गेल; शब्द अधिक स्पष्ट करू वा सीमा बढ़ाउ।</div>');
    };

    const opts = {
      getQuery: () => $("q").value.trim(),
      getScope: () => ($("scope") ? $("scope").value : $("volume") ? $("volume").value : "both"),
      getDeep: () => !!($("deep") && $("deep").checked),
      getLimit: () => parseInt($("limit") && $("limit").value ? $("limit").value : "100", 10) || 100,
      getFilters: () => ({
        base: !($("filterBase")) || $("filterBase").checked || !($("filter-base")) || $("filter-base").checked,
        syn: !($("filterSyn")) || $("filterSyn").checked || !($("filter-syn")) || $("filter-syn").checked,
        ant: !($("filterAnt")) || $("filterAnt").checked || !($("filter-ant")) || $("filter-ant").checked,
        it: !($("filterIt")) || $("filterIt").checked || !($("filter-it")) || $("filter-it").checked,
        wordnet: !($("filterWordNet")) || $("filterWordNet").checked || !($("filter-wordnet")) || $("filter-wordnet").checked,
      }),
      setStatus: (t) => { $("status").textContent = t; },
      render,
      renderEmpty: () => { $("results").innerHTML = ""; },
      showCounts: (m) => {
        const counts = countsFromManifest(m);
        if ($("countsBox")) {
          $("countsBox").innerHTML = `<div class="vd-mini-card"><b>English-Maithili</b><br>${counts.em.toLocaleString("en-IN")} final entries</div><div class="vd-mini-card"><b>Maithili-English</b><br>${counts.me.toLocaleString("en-IN")} final entries</div><div class="vd-mini-card"><b>Source</b><br>Final combined authoritative backend</div>`;
        }
      }
    };

    const trigger = () => runUnifiedSearch(opts).catch((e) => opts.setStatus(`Search failed: ${e.message}`));
    if ($("searchBtn")) $("searchBtn").addEventListener("click", trigger);
    if ($("search")) $("search").addEventListener("click", trigger);
    if ($("q")) $("q").addEventListener("keydown", (e) => { if (e.key === "Enter") trigger(); });
    if ($("clearBtn")) $("clearBtn").addEventListener("click", () => { $("q").value = ""; $("results").innerHTML = ""; opts.setStatus("खोज शब्द लिखू।"); });
    if ($("clear")) $("clear").addEventListener("click", () => { $("q").value = ""; $("results").innerHTML = ""; opts.setStatus("खोज शब्द लिखू।"); });
    document.querySelectorAll("[data-q]").forEach((btn) => btn.addEventListener("click", () => { $("q").value = btn.getAttribute("data-q") || ""; trigger(); }));
    loadManifest().then((m) => opts.showCounts(m)).catch((e) => opts.setStatus(`Manifest load failed: ${e.message}`));
  }

  function setupWidget() {
    if (!$("vjwInput") || !$("vjwResults") || !$("vjwStatus")) return;
    const render = (results, forms, done) => {
      if (!results.length) {
        $("vjwResults").innerHTML = '<div class="vjw-empty">कोनो परिणाम नहि भेटल। filter, scope वा spelling फेर जाँचू।</div>';
        return;
      }
      const primary = forms[0] || "";
      $("vjwResults").innerHTML =
        results
          .slice(0, 60)
          .map((r) => {
            let meaning = htmlEscape(r.b || [r.m, r.e, r.syn_m, r.syn_en, r.ant_m, r.ant_en, r.hypernym_m, r.hypernym_en, r.relations_m, r.relations_en].filter(Boolean).join(" ; "));
            let head = htmlEscape(r.h);
            const tags = Array.from(recordTags(r)).join(" · ");
            if (primary) {
              try {
                const re = new RegExp(primary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
                meaning = meaning.replace(re, "<mark>$&</mark>");
                head = head.replace(re, "<mark>$&</mark>");
              } catch (e) {}
            }
            return `<div class="vjw-card"><div class="vjw-head">${head}</div><div class="vjw-meta">${sourceName(r._file)} · ${htmlEscape(r.sec || "")} · ${htmlEscape(tags)}</div><div class="vjw-meaning">${meaning}</div></div>`;
          })
          .join("") +
        (done ? "" : '<div class="vjw-status">पहिल 60 परिणाम देखाइत अछि।</div>');
    };

    const opts = {
      getQuery: () => $("vjwInput").value.trim(),
      getScope: () => ($("vjwScope") ? $("vjwScope").value : "both"),
      getDeep: () => true,
      getLimit: () => 60,
      getFilters: () => ({
        base: !($("vjwBase")) || $("vjwBase").checked,
        syn: !($("vjwSyn")) || $("vjwSyn").checked,
        ant: !($("vjwAnt")) || $("vjwAnt").checked,
        it: !($("vjwIT")) || $("vjwIT").checked,
        wordnet: !($("vjwWordNet")) || $("vjwWordNet").checked,
      }),
      setStatus: (t) => { $("vjwStatus").innerHTML = t; },
      render,
      renderEmpty: () => { $("vjwResults").innerHTML = '<div class="vjw-empty">ऊपर शब्द लिखू — final combined backend मे खोज होयत।</div>'; },
      showCounts: (m) => {
        const counts = countsFromManifest(m);
        $("vjwStatus").innerHTML = `✅ Final authoritative backend ready — EM ${counts.em.toLocaleString("en-IN")} · ME ${counts.me.toLocaleString("en-IN")}`;
      }
    };

    const trigger = () => runUnifiedSearch(opts).catch((e) => opts.setStatus(`Search failed: ${e.message}`));
    $("vjwBtn").addEventListener("click", trigger);
    $("vjwInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); trigger(); } });
    $("vjwInput").addEventListener("input", () => {
      clearTimeout(window.__videhaUnifiedWidgetTimer);
      window.__videhaUnifiedWidgetTimer = setTimeout(trigger, 350);
    });
    loadManifest().then((m) => opts.showCounts(m)).catch((e) => opts.setStatus(`Manifest load failed: ${e.message}`));
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupSearchPage();
    setupWidget();
  });
})();
