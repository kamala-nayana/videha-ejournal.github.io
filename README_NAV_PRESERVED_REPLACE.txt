WORDNET JS DATA UPDATE 001-109 — NAV-PRESERVED PACKAGE
========================================================

This package was built using your uploaded Batch 001-014 app/index.html as the base.
The index.html BODY / visible layout / navigation has been preserved. Only the <head>
data-loading script list was expanded so that Batch 001-014 and repaired Batch 015-109
index shards are loaded together.

WHAT TO COPY INTO GITHUB REPO ROOT
----------------------------------
1. Replace index.html with this package's index.html.
2. Replace app.js with this package's app.js.
   - This app.js keeps the same UI and adds display fields for WordNet relation data:
     Maithili hypernym tree, Maithili relations, English hypernym tree, English relations.
3. Replace data/manifest.js with this package's data/manifest.js.
4. Copy all other files from this package's data/ into your existing data/ folder.
   - Do NOT delete your existing data folder.
   - Keep your existing Batch 001-014 files and base files.

IMPORTANT
---------
Your existing 001-014 files should remain in place:
  data/index_part_7_pilot_001.js ... data/index_part_20_pilot_014.js
  data/em_wn_pilot_001_*.js ... data/em_wn_pilot_014_*.js
  data/me_wn_pilot_001_*.js ... data/me_wn_pilot_014_*.js
  data/wordnet_part_1.js and data/wordnet_part_2.js

This package adds/references:
  data/index_part_21_pilot_015.js ... data/index_part_115_pilot_109.js
  data/em_wn_pilot_015_*.js ... data/em_wn_pilot_109_*.js
  data/me_wn_pilot_015_*.js ... data/me_wn_pilot_109_*.js

GitHub upload:
  git add index.html app.js data/
  git commit -m "Add repaired WordNet JS batches 015-109 with original index navigation"
  git push origin main
