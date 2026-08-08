import fs from 'node:fs';
import { INDUSTRY_DIGEST } from '../studio/digest-data.js';
import { getCaseLocale } from '../studio/case-locales.js';
import { workflowPublishesStudioAsset } from './pages-publish-policy.mjs';

const fail = (message) => {
  console.error(`experience validation failed: ${message}`);
  process.exitCode = 1;
};

const files = {
  i18n: fs.readFileSync('studio/i18n.js', 'utf8'),
  media: fs.readFileSync('studio/media-embed.js', 'utf8'),
  experience: fs.readFileSync('studio/experience.js', 'utf8'),
  sidebar: fs.readFileSync('studio/sidebar.js', 'utf8'),
  pages: fs.readFileSync('.github/workflows/pages.yml', 'utf8')
};

for (const required of ['ru:', 'en:', "'nav.digest'", "'media.play'", "'case.usePattern'"]) {
  if (!files.i18n.includes(required)) fail(`i18n dictionary missing ${required}`);
}
if (!files.sidebar.includes("import './experience.js'")) fail('sidebar does not bootstrap experience.js');
if (!files.sidebar.includes("import './case-translation-runtime.js'")) fail('sidebar does not bootstrap bilingual case analysis');
for (const name of ['experience.js','experience.css','i18n.js','media-embed.js','case-locales.js','case-translation-runtime.js']) {
  if (!workflowPublishesStudioAsset(files.pages,name)) fail(`Pages workflow does not publish ${name}`);
}
if (!files.media.includes('cloudflarestream.com')) fail('Cloudflare Stream iframe resolver missing');
if (!files.media.includes('platform.twitter.com/embed/Tweet.html')) fail('X embedded-post iframe resolver missing');

let cloudflare = 0;
let x = 0;
let localizedCases = 0;
for (const item of INDUSTRY_DIGEST) {
  const hasCloudflare = /cloudflarestream\.com/i.test(item.previewUrl || '');
  const hasX = /(?:x|twitter)\.com\/[^/]+\/status\/\d+/i.test(item.sourceUrl || '');
  if (hasCloudflare) cloudflare += 1;
  else if (hasX) x += 1;
  else fail(`${item.id} has no supported in-page iframe strategy`);

  const ru = getCaseLocale(item.id, 'ru');
  if (!ru) fail(`${item.id} has no Russian Case Intelligence copy`);
  else {
    for (const field of ['title','why','signature','transferable']) if (!ru[field]) fail(`${item.id} Russian copy missing ${field}`);
    localizedCases += 1;
  }
}

if (!process.exitCode) {
  console.log(JSON.stringify({
    ok: true,
    digestEntries: INDUSTRY_DIGEST.length,
    localizedCases,
    cloudflareStreamEmbeds: cloudflare,
    xEmbeddedPostFallbacks: x,
    languages: ['ru','en'],
    promptsRemainSourceLanguage: true,
    publicationPolicy:'shared'
  }, null, 2));
}
