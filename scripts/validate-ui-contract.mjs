import fs from 'node:fs';

const html = fs.readFileSync('studio/library.html', 'utf8');
const js = fs.readFileSync('studio/library.js', 'utf8');

const idsInHtml = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]));
const queriedIds = new Set([...js.matchAll(/\$\(["']#([^"']+)["']/g)].map(match => match[1]));

const missing = [...queriedIds].filter(id => !idsInHtml.has(id)).sort();
if (missing.length) {
  console.error(`UI contract validation failed. library.js references missing DOM ids: ${missing.join(', ')}`);
  process.exit(1);
}

for (const required of ['digestGrid', 'promptGrid', 'sourceGrid', 'drawer', 'drawerContent']) {
  if (!idsInHtml.has(required)) {
    console.error(`UI contract validation failed. Missing required mount: ${required}`);
    process.exit(1);
  }
}

console.log(JSON.stringify({ ok: true, queriedIds: queriedIds.size, htmlIds: idsInHtml.size }, null, 2));
