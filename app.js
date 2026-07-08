let manifest = null;
const cache = new Map();

const $ = (id) => document.getElementById(id);
const norm = (s) =>
  (s || "")
    .toString()
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\u200c\u200d]/g, "")
    .replace(/[^\w\u0900-\u097f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

const vowels = { a: "अ", aa: "आ", A: "आ", i: "इ", ii: "ई", I: "ई", u: "उ", uu: "ऊ", U: "ऊ", e: "ए", ai: "ऐ", o: "ओ", au: "औ", R: "ऋ", ṛ: "ऋ" };
const vowelMarks = { a: "", aa: "ा", A: "ा", i: "ि", ii: "ी", I: "ी", u: "ु", uu: "ू", U: "ू", e: "े", ai: "ै", o: "ो", au: "ौ", R: "ृ", ṛ: "ृ" };
const cons = { kh: "ख", gh: "घ", ch: "छ", jh: "झ", th: "थ", dh: "ध", ph: "फ", bh: "भ", k: "क", g: "ग", c: "च", j: "ज", T: "ट", t: "त", D: "ड", d: "द", N: "ण", n: "न", p: "प", b: "ब", m: "म", y: "य", r: "र", l: "ल", v: "व", w: "व", z: "श", s: "स", h: "ह", ṭ: "ट", ḍ: "ड", ṇ: "ण", ś: "श", ṣ: "ष", ñ: "ञ", ṅ: "ङ" };

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

function editDistanceWithin(a, b, max) {
  a = a || "";
  b = b || "";
  if (a === b) return true;
  if (!a || !b) return false;
  if (Math.abs(a.length - b.length) > max) return false;
  const dp = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) dp[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    let rowMin = dp[0];
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = temp;
      if (dp[j] < rowMin) rowMin = dp[j];
    }
    if (rowMin > max) return false;
  }
  return dp[b.length] <= max;
}

function approxContains(text, form) {
  if (!text || !form) return false;
  if (text.includes(form)) return true;
  const tokens = text.split(/\s+/).filter(Boolean);
  const max = form.length >= 8 ? 2 : 1;
  return tokens.some((tok) => {
    if (tok === form || tok.startsWith(form) || form.startsWith(tok)) return true;
    return form.length >= 4 && editDistanceWithin(tok, form, max);
  });
}

function esc(s) {
  return (s || "")
    .toString()
    .replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);
}

async function loadManifest() {
  if (manifest) return manifest;
  const res = await fetch("data/manifest.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`manifest ${res.status}`);
  manifest = await res.json();
  $("status").textContent = `EM ${manifest.volumes.em.rows.toLocaleString()} · ME ${manifest.volumes.me.rows.toLocaleString()}`;
  return manifest;
}

function bucketsFor(q) {
  q = norm(q);
  if (!q) return [];
  return [q.length >= 2 ? q.slice(0, 2) : q[0]];
}

async function loadChunk(file) {
  if (cache.has(file)) return cache.get(file);
  const res = await fetch(file);
  if (!res.ok) throw new Error(`${file} ${res.status}`);
  const arr = await res.json();
  cache.set(file, arr);
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

function filterEnabled(id) {
  const el = $(id);
  return !el || el.checked;
}

function allowRecord(r) {
  const tags = recordTags(r);
  return (
    (filterEnabled("filter-base") && tags.has("base")) ||
    (filterEnabled("filter-syn") && tags.has("syn")) ||
    (filterEnabled("filter-ant") && tags.has("ant")) ||
    (filterEnabled("filter-it") && tags.has("it")) ||
    (filterEnabled("filter-wordnet") && tags.has("wordnet"))
  );
}

async function search() {
  const rawQ = $("q").value;
  const q = norm(rawQ);
  const vol = $("volume").value;
  if (!q) {
    $("results").innerHTML = '<div class="empty">Type a word to search.</div>';
    return;
  }

  try {
    await loadManifest();
    let chunks = manifest.volumes[vol].chunks;
    if (!$("deep").checked) {
      const bs = new Set(bucketsFor(q));
      chunks = chunks.filter((c) => bs.has(c.bucket));
      if (!chunks.length && q.length > 1) {
        const b1 = q[0];
        chunks = manifest.volumes[vol].chunks.filter((c) => c.bucket === b1);
      }
    }
    if (!chunks.length) chunks = manifest.volumes[vol].chunks;

    $("status").textContent = `Searching ${chunks.length} small chunk${chunks.length === 1 ? "" : "s"}...`;

    const forms = queryForms(rawQ);
    const hits = [];
    for (let i = 0; i < chunks.length; i++) {
      const arr = await loadChunk(chunks[i].file);
      for (const r of arr) {
        const text = textOf(r);
        const matched = forms.some((form) => {
          const loose = looseRoman(form);
          const deva = devaLoose(form);
          return (
            approxContains(text.exact, form) ||
            approxContains(text.loose, loose) ||
            approxContains(text.deva, deva)
          );
        });
        if (matched && allowRecord(r)) {
          hits.push(r);
          if (hits.length >= 100) {
            render(hits, vol);
            $("status").textContent = `100 results; searched ${i + 1}/${chunks.length} chunks`;
            return;
          }
        }
      }
      if (i % 3 === 0) {
        $("status").textContent = `${hits.length} results; searched ${i + 1}/${chunks.length} chunks`;
      }
    }

    render(hits, vol);
    $("status").textContent = `${hits.length} results; search complete`;
  } catch (e) {
    console.error(e);
    $("status").textContent = `Search failed: ${e.message}`;
  }
}

function field(label, text) {
  return text ? `<div class="field"><b>${esc(label)}</b> ${esc(text)}</div>` : "";
}

function render(rows, vol) {
  $("results").innerHTML =
    rows
      .map((r) => {
        const tags = Array.from(recordTags(r));
        return `<article class="item">
          <h2>${esc(r.h)}${r.english_headword ? ` <small>(${esc(r.english_headword)})</small>` : ""}</h2>
          <div class="meta">
            <span class="badge">${esc(r.sec || "")}</span>
            <span class="badge">${esc(r.source_kind || "")}</span>
            ${r.pos ? `<span class="badge">${esc(r.pos)}</span>` : ""}
            ${tags.map((tag) => `<span class="badge">${esc(tag)}</span>`).join("")}
            ${r.senses ? `<span class="badge">${r.senses.length} WordNet sense${r.senses.length === 1 ? "" : "s"}</span>` : ""}
          </div>
          ${field(vol === "em" ? "Maithili meaning:" : "Meaning / gloss:", r.m)}
          ${field("English explanation:", r.e)}
          ${field("मैथिली पर्यायवाची:", r.syn_m)}
          ${field("English synonyms:", r.syn_en)}
          ${field("मैथिली विपरीतार्थक:", r.ant_m)}
          ${field("English antonyms:", r.ant_en)}
          ${field("मैथिली अधिवर्ग:", r.hypernym_m)}
          ${field("English hypernym:", r.hypernym_en)}
          ${field("मैथिली सम्बन्ध:", r.relations_m)}
          ${field("English relations:", r.relations_en)}
          ${
            r.senses
              ? `<div class="field"><b>WordNet senses</b>${r.senses
                  .slice(0, 5)
                  .map(
                    (s) => `<div class="sense">
                        <b>${esc(s.sense_no + ". " + s.pos)}</b>
                        ${field("मैथिली अर्थ:", s.definition_mi)}
                        ${field("English:", s.definition_en)}
                        ${field("मैथिली hypernym:", s.hypernym_mi)}
                        ${field("English hypernym:", s.hypernym_en)}
                        ${field("मैथिली relations:", s.relations_mi)}
                        ${field("English relations:", s.relations_en)}
                      </div>`
                  )
                  .join("")}
                ${
                  r.senses.length > 5
                    ? `<div class="sense">Additional senses are included in the record data and Excel/DOCX/PDF parts.</div>`
                    : ""
                }
              </div>`
              : ""
          }
        </article>`;
      })
      .join("") || '<div class="empty">No matches.</div>';
}

document.addEventListener("DOMContentLoaded", () => {
  loadManifest().catch((e) => {
    $("status").textContent = `Manifest load failed: ${e.message}`;
    console.error(e);
  });

  $("search").onclick = search;
  $("q").onkeydown = (e) => {
    if (e.key === "Enter") search();
  };
  $("clear").onclick = () => {
    $("q").value = "";
    $("results").innerHTML = "";
  };

  document.querySelectorAll("[data-q]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("q").value = btn.getAttribute("data-q") || "";
      search();
    });
  });
});
