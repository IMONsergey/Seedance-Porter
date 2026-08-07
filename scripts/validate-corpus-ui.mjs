#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const [html, sidebar, ui, css] = await Promise.all([
  readFile('studio/library.html', 'utf8'),
  readFile('studio/sidebar.js', 'utf8'),
  readFile('studio/case-corpus-ui.js', 'utf8'),
  readFile('studio/case-corpus.css', 'utf8')
]);

const failures = [];
const requireMatch = (value, pattern, message) => {
  if (!pattern.test(value)) failures.push(message);
};
const requireText = (value, text, message) => {
  if (!value.includes(text)) failures.push(message);
};

requireText(html, '/case-corpus.css', 'library.html must load case-corpus.css');
requireText(sidebar, "import './case-corpus-ui.js';", 'sidebar shell must mount case-corpus-ui.js');
requireText(ui, "fetch('./case-candidates.json'", 'Research Corpus must load the generated candidate snapshot');
requireText(ui, "window.addEventListener('porter-language-change'", 'Research Corpus must react to language changes');
requireText(ui, 'getLanguage', 'Research Corpus must use the shared language state');
requireText(ui, 'collectionLabel', 'Research Corpus must use shared localized Collection labels');
requireMatch(ui, /dataset\.caseView\s*=\s*['"]corpus['"]/, 'Research Corpus nav must use an isolated case-view attribute');
requireText(ui, 'Кандидат ≠ отобранный кейс.', 'Russian candidate-vs-curated disclosure is required');
requireText(ui, 'Candidate ≠ curated case.', 'English candidate-vs-curated disclosure is required');
requireMatch(ui, /pageSize:\s*36/, 'Research Corpus must paginate instead of rendering the whole 500–1000 corpus at once');
requireText(ui, 'corpusCollection', 'Collection filter is required');
requireText(ui, 'corpusSource', 'Source-pool filter is required');
requireText(ui, 'corpusScore', 'Research-score filter is required');
requireMatch(css, /#corpusView:not\(\[hidden\]\).*data-sidebar-view="corpus"/s, 'Corpus filters must only show while the Corpus view is active');

if (ui.includes('#digestGrid') || ui.includes('digestGrid')) {
  failures.push('Research Corpus UI must never write to or query the curated digest grid');
}
if (ui.includes('mountCaseBatch') || ui.includes('MULTI_SOURCE_CASES')) {
  failures.push('Research Corpus candidates must stay separate from the curated multi-source renderer');
}

if (failures.length) {
  console.error('Research Corpus UI contract failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  bilingual: true,
  isolatedFromCuratedDigest: true,
  snapshot: 'studio/case-candidates.json',
  pageSize: 36,
  filters: ['search', 'collection', 'sourcePool', 'researchScore']
}, null, 2));
