export const PROMPT_STUDIO_PROJECT_KIND = 'seedance-porter-prompt-studio-project';
export const PROMPT_STUDIO_SCHEMA_VERSION = 1;

export const PROMPT_STUDIO_MODES = Object.freeze([
  'text-to-video',
  'image-to-video',
  'first-last-frame',
  'multi-reference'
]);

export const REFERENCE_ROLES = Object.freeze([
  'identity',
  'geometry',
  'style',
  'material',
  'motion',
  'camera',
  'first-frame',
  'last-frame',
  'graphics',
  'pattern',
  'environment',
  'other'
]);

export const PROMPT_SECTION_DEFINITIONS = Object.freeze([
  { id:'objective', label:'Objective', labelRu:'Задача', required:true },
  { id:'subject', label:'Subject', labelRu:'Объект', required:false },
  { id:'environment', label:'Environment', labelRu:'Среда', required:false },
  { id:'composition', label:'Composition / framing', labelRu:'Композиция / кадр', required:false },
  { id:'camera', label:'Camera', labelRu:'Камера', required:false },
  { id:'action', label:'Action / motion', labelRu:'Действие / движение', required:true },
  { id:'timing', label:'Timing / shot plan', labelRu:'Тайминг / шоты', required:false },
  { id:'lighting', label:'Lighting', labelRu:'Свет', required:false },
  { id:'materials', label:'Materials / physics', labelRu:'Материалы / физика', required:false },
  { id:'style', label:'Visual style', labelRu:'Визуальный стиль', required:false },
  { id:'continuity', label:'Continuity locks', labelRu:'Локи консистентности', required:false },
  { id:'constraints', label:'Constraints', labelRu:'Ограничения', required:false },
  { id:'avoid', label:'Avoid / failure boundaries', labelRu:'Избегать / риски', required:false }
]);

const SECTION_IDS = new Set(PROMPT_SECTION_DEFINITIONS.map(item => item.id));
const CAMERA_MOVES = ['orbit','pan','tilt','dolly','truck','tracking','track','push-in','push in','pull-back','pull back','zoom','crane','handheld','roll','arc'];
const GENERIC_WORDS = ['cinematic','beautiful','stunning','epic','premium','professional','amazing','dynamic','high quality','high-quality','realistic','engaging','smooth'];
const LEGACY_REFERENCE = /\[(Image|Video)\s*(\d+)\]/gi;
const STUDIO_REFERENCE = /@ref\d{2,}/gi;

export function createPromptStudioProject(seed = {}) {
  const now = new Date(seed.now || Date.now()).toISOString();
  const id = String(seed.id || `studio-${randomId()}`);
  const sections = normalizeSections(seed.sections || []);
  const project = {
    schemaVersion:PROMPT_STUDIO_SCHEMA_VERSION,
    kind:PROMPT_STUDIO_PROJECT_KIND,
    id,
    title:String(seed.title || 'Untitled Prompt Project'),
    createdAt:String(seed.createdAt || now),
    updatedAt:now,
    mode:normalizeMode(seed.mode || 'text-to-video'),
    aspect:String(seed.aspect || '16:9'),
    duration:clampNumber(seed.duration ?? 6, 1, 30),
    language:String(seed.language || 'en'),
    modelProfile:String(seed.modelProfile || 'seedance-general'),
    source:normalizeSource(seed.source || null),
    sections,
    references:normalizeReferences(seed.references || []),
    customRules:uniqueStrings(seed.customRules || []),
    tags:uniqueStrings(seed.tags || []),
    notes:String(seed.notes || ''),
    lastPatch:null
  };
  return refreshCompiled(project, now);
}

export function forkPromptStudioSource(input = {}) {
  const kind = String(input.kind || 'manual');
  const source = input.source || input.item || {};
  if (kind === 'curated') return forkCuratedCase(source, input);
  if (kind === 'original') return forkPorterOriginal(source, input);
  if (kind === 'research') return forkResearchCandidate(source, input);
  return forkManualPrompt(source, input);
}

export function forkCuratedCase(item = {}, options = {}) {
  const rawPrompt = String(item.porterPrompt || item.prompt || '').trim();
  const references = inferReferencesFromPrompt(rawPrompt, item.refs || []);
  const sections = decomposePrompt(rawPrompt, references);
  const intelligence = item.intelligence || {};
  if (!sectionContent(sections, 'objective')) {
    setSectionContent(sections, 'objective', String(intelligence.whyItWorks || item.why || `Rebuild the production mechanism of ${item.title || item.id} as an independent Porter prompt.`));
  }
  if (!sectionContent(sections, 'timing') && Array.isArray(intelligence.shotBreakdown) && intelligence.shotBreakdown.length) {
    setSectionContent(sections, 'timing', intelligence.shotBreakdown.map(shot => `Beat ${shot.index || ''}: ${shot.action || shot.label || ''}`.trim()).join('\n'));
  }
  if (!sectionContent(sections, 'continuity')) {
    const continuity = (intelligence.shotBreakdown || []).map(shot => shot.continuity).filter(Boolean)[0];
    if (continuity) setSectionContent(sections, 'continuity', continuity);
  }
  return createPromptStudioProject({
    title:`${item.title || item.id || 'Curated case'} — Studio fork`,
    mode:inferMode(rawPrompt, item.mode),
    aspect:item.aspect || '16:9',
    duration:item.duration || inferDuration(rawPrompt) || 6,
    sections,
    references,
    tags:[...(item.tags || []), ...(intelligence.collections || item.collections || [])],
    source:{
      kind:'curated',
      id:item.id || '',
      title:item.title || '',
      author:item.author || '',
      sourceUrl:item.sourceUrl || '',
      archiveUrl:item.archiveUrl || '',
      sourcePlatform:item.sourcePlatform || 'x',
      rawPrompt,
      excerpt:item.originalExcerpt || item.sourceExcerpt || '',
      importedAt:new Date(options.now || Date.now()).toISOString()
    },
    now:options.now
  });
}

export function forkPorterOriginal(item = {}, options = {}) {
  const rawPrompt = String(item.prompt || '').trim();
  const references = inferReferencesFromPrompt(rawPrompt, item.refs || []);
  const sections = decomposePrompt(rawPrompt, references);
  if (!sectionContent(sections, 'objective')) setSectionContent(sections, 'objective', String(item.use || item.why || `Create ${item.baseTitle || item.title || 'the intended video'}.`));
  return createPromptStudioProject({
    title:`${item.title || item.id || 'Porter Original'} — Studio fork`,
    mode:normalizeMode(item.mode),
    aspect:item.aspect || '16:9',
    duration:item.duration || 6,
    sections,
    references,
    tags:item.tags || [],
    source:{
      kind:'original',
      id:item.id || '',
      title:item.title || '',
      sourceUrl:'',
      sourceIds:item.sourceIds || [],
      rawPrompt,
      excerpt:item.why || '',
      importedAt:new Date(options.now || Date.now()).toISOString()
    },
    now:options.now
  });
}

export function forkResearchCandidate(item = {}, options = {}) {
  const collections = uniqueStrings(item.collections || []);
  const objective = `Create an independent Seedance production prompt after reviewing the source candidate “${item.title || item.id || 'Untitled candidate'}”. Preserve only verified transferable production logic; do not copy source-specific subject matter or wording.`;
  const notes = [
    item.excerpt ? `Research excerpt (provenance only, not a prompt): ${item.excerpt}` : '',
    collections.length ? `Research Collections: ${collections.join(', ')}` : ''
  ].filter(Boolean).join('\n');
  return createPromptStudioProject({
    title:`${item.title || item.id || 'Research candidate'} — Studio brief`,
    mode:'text-to-video',
    aspect:'16:9',
    duration:6,
    sections:[
      { id:'objective', content:objective },
      { id:'action', content:'' }
    ],
    tags:collections,
    notes,
    source:{
      kind:'research',
      id:item.id || '',
      title:item.title || '',
      author:item.author || '',
      sourceUrl:item.sourceUrl || '',
      archiveUrl:item.archiveUrl || '',
      sourcePool:item.sourcePool || '',
      sourcePoolLabel:item.sourcePoolLabel || '',
      excerpt:item.excerpt || '',
      riskFlags:item.riskFlags || [],
      score:Number(item.score || 0),
      importedAt:new Date(options.now || Date.now()).toISOString()
    },
    now:options.now
  });
}

export function forkManualPrompt(input = {}, options = {}) {
  const rawPrompt = typeof input === 'string' ? input : String(input.prompt || input.rawPrompt || '');
  const references = inferReferencesFromPrompt(rawPrompt, []);
  const sections = decomposePrompt(rawPrompt, references);
  if (!rawPrompt.trim()) setSectionContent(sections, 'objective', 'Describe the intended result and production purpose.');
  return createPromptStudioProject({
    title:typeof input === 'object' && input.title ? input.title : 'New Prompt Studio project',
    mode:inferMode(rawPrompt, typeof input === 'object' ? input.mode : null),
    aspect:typeof input === 'object' ? input.aspect : '16:9',
    duration:typeof input === 'object' ? input.duration : 6,
    sections,
    references,
    source:rawPrompt.trim()?{kind:'manual',id:'',title:'Manual prompt',rawPrompt,importedAt:new Date(options.now || Date.now()).toISOString()}:null,
    now:options.now
  });
}

export function decomposePrompt(rawPrompt, references = []) {
  const text = rewriteLegacyReferenceTokens(String(rawPrompt || ''), references).trim();
  const sections = normalizeSections([]);
  if (!text) return sections;

  const patterns = [
    ['subject', /(?:^|\n|\.\s*)(?:Core subject|Subject):\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Story objective|Scene\/environment|Scene|Environment|Composition|Framing|Camera|Shot\s*\d+|Lighting|Material language|Materials|Visual style|Image quality|Continuity|Constraints|End state|Avoid):|$)/i],
    ['objective', /(?:^|\n|\.\s*)(?:Story objective|Objective|Goal):\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Core subject|Scene\/environment|Scene|Environment|Composition|Framing|Camera|Shot\s*\d+|Lighting|Material language|Materials|Visual style|Image quality|Continuity|Constraints|End state|Avoid):|$)/i],
    ['environment', /(?:^|\n|\.\s*)(?:Scene\/environment|Scene|Environment):\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Core subject|Story objective|Composition|Framing|Camera|Shot\s*\d+|Lighting|Material language|Materials|Visual style|Image quality|Continuity|Constraints|End state|Avoid):|$)/i],
    ['composition', /(?:^|\n|\.\s*)(?:Composition|Framing):\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Camera|Shot\s*\d+|Lighting|Material language|Materials|Visual style|Image quality|Continuity|Constraints|End state|Avoid):|$)/i],
    ['camera', /(?:^|\n|\.\s*)Camera:\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Shot\s*\d+|Action|Continuous action|Core motion|Lighting|Material language|Materials|Visual style|Image quality|Continuity|Constraints|End state|Avoid):|$)/i],
    ['lighting', /(?:^|\n|\.\s*)Lighting:\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Material language|Materials|Visual style|Image quality|Continuity|Constraints|End state|Avoid):|$)/i],
    ['materials', /(?:^|\n|\.\s*)(?:Material language|Materials):\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Lighting|Visual style|Image quality|Continuity|Constraints|End state|Avoid):|$)/i],
    ['style', /(?:^|\n|\.\s*)Visual style:\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Image quality|Continuity|Constraints|End state|Avoid):|$)/i],
    ['continuity', /(?:^|\n|\.\s*)Continuity(?: locks?)?:\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Constraints|End state|Avoid):|$)/i],
    ['constraints', /(?:^|\n|\.\s*)Constraints:\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Avoid|End state):|$)/i],
    ['avoid', /(?:^|\n|\.\s*)Avoid:\s*([\s\S]*?)$/i]
  ];
  for (const [id, pattern] of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) setSectionContent(sections, id, cleanCaptured(match[1]));
  }

  const shots = [...text.matchAll(/(?:^|\n|\.\s*)(Shot\s*\d+|Beat\s*\d+):\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Shot\s*\d+|Beat\s*\d+|Lighting|Material language|Materials|Visual style|Image quality|Continuity|Constraints|End state|Avoid):|$)/gi)]
    .map(match => `${match[1]}: ${cleanCaptured(match[2])}`);
  const endState = text.match(/(?:^|\n|\.\s*)End state:\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Visual style|Image quality|Continuity|Constraints|Avoid):|$)/i)?.[1];
  if (shots.length || endState) setSectionContent(sections, 'timing', [...shots, endState ? `End state: ${cleanCaptured(endState)}` : ''].filter(Boolean).join('\n'));

  const continuous = text.match(/(?:^|\n|\.\s*)(?:Continuous action|Core motion|Action):\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Rule|Final state|End state|Visual style|Image quality|Lighting|Constraints|Avoid):|$)/i)?.[1];
  if (continuous) setSectionContent(sections, 'action', cleanCaptured(continuous));
  if (!sectionContent(sections, 'action') && shots.length) setSectionContent(sections, 'action', 'Execute the shot plan below with one clearly readable action or state change per beat.');

  const quality = text.match(/(?:^|\n|\.\s*)Image quality:\s*([\s\S]*?)(?=(?:\n|\.\s*)(?:Continuity|Constraints|End state|Avoid):|$)/i)?.[1];
  if (quality) setSectionContent(sections, 'constraints', joinNonDuplicate(sectionContent(sections, 'constraints'), `Image quality: ${cleanCaptured(quality)}`));

  const populated = sections.filter(section => section.content.trim()).length;
  if (populated < 2) {
    setSectionContent(sections, 'objective', 'Restructure this source prompt into explicit production controls before generation.');
    setSectionContent(sections, 'action', text);
  }
  return sections;
}

export function compilePromptProject(project, options = {}) {
  const p = normalizeProject(project);
  const lines = [];
  if (options.includeHeader !== false) lines.push(`OBJECTIVE\n${sectionValue(p,'objective') || 'Create a controlled production-ready video generation.'}`);
  const refs = p.references.filter(ref => ref.enabled !== false);
  if (refs.length) {
    lines.push(`REFERENCE JOBS\n${refs.map(ref => `${ref.token} — ${referenceJob(ref)}`).join('\n')}`);
  }
  for (const def of PROMPT_SECTION_DEFINITIONS) {
    if (def.id === 'objective') continue;
    const section = p.sections.find(item => item.id === def.id);
    if (!section || section.enabled === false || !section.content.trim()) continue;
    lines.push(`${def.label.toUpperCase()}\n${section.content.trim()}`);
  }
  if (p.customRules.length && options.includeEditorRules === true) lines.push(`EDITOR RULES\n${p.customRules.map(rule => `- ${rule}`).join('\n')}`);
  return lines.join('\n\n').trim();
}

export function lintPromptProject(project) {
  const p = normalizeProject(project);
  const compiled = compilePromptProject(p, { includeHeader:true });
  const issues = [];
  const push = (severity, id, message, sectionId = null) => issues.push({ severity, id, message, sectionId });
  const objective = sectionValue(p,'objective');
  const action = sectionValue(p,'action');
  const camera = sectionValue(p,'camera');
  const continuity = sectionValue(p,'continuity');
  const constraints = sectionValue(p,'constraints');
  const timing = sectionValue(p,'timing');

  if (tokenCount(objective) < 5) push('error','missing-objective','Define the production objective in observable terms.','objective');
  if (tokenCount(action) < 5 && !timing.trim()) push('error','missing-action','Describe the visible action, motion or shot progression.','action');

  const enabledRefs = p.references.filter(ref => ref.enabled !== false);
  if (p.mode === 'image-to-video' && !enabledRefs.some(ref => ['image','unknown'].includes(ref.mediaType))) push('error','image-reference-required','Image-to-video mode requires at least one enabled image reference.');
  if (p.mode === 'first-last-frame') {
    if (!enabledRefs.some(ref => ref.role === 'first-frame')) push('error','first-frame-required','First / last frame mode requires a first-frame reference.');
    if (!enabledRefs.some(ref => ref.role === 'last-frame')) push('error','last-frame-required','First / last frame mode requires a last-frame reference.');
  }
  if (p.mode === 'multi-reference' && enabledRefs.length < 2) push('error','multi-reference-required','Multi-reference mode requires at least two enabled references.');

  const duplicateTokens = duplicates(enabledRefs.map(ref => ref.token));
  if (duplicateTokens.length) push('error','duplicate-reference-token',`Duplicate reference tokens: ${duplicateTokens.join(', ')}.`);
  for (const ref of enabledRefs) {
    if (!REFERENCE_ROLES.includes(ref.role)) push('error','invalid-reference-role',`${ref.token} has an invalid reference role.`);
    if (!ref.role || ref.role === 'other') push('warning','weak-reference-role',`${ref.token} needs a precise job: identity, geometry, motion, camera, material, etc.`);
    if (['identity','geometry','first-frame','last-frame','graphics'].includes(ref.role) && !ref.locked) push('warning','reference-not-locked',`${ref.token} controls ${ref.role} but is not marked as a lock.`);
  }

  const activeTokens = new Set(enabledRefs.map(ref => ref.token.toLowerCase()));
  const referencedTokens = new Set((compiled.match(STUDIO_REFERENCE) || []).map(value => value.toLowerCase()));
  for (const token of referencedTokens) if (!activeTokens.has(token)) push('error','unresolved-reference',`${token} is used in the prompt but has no enabled reference.`);
  for (const ref of enabledRefs) if (!referencedTokens.has(ref.token.toLowerCase())) push('info','unused-reference',`${ref.token} is attached but not referenced by an enabled prompt section.`);
  if (LEGACY_REFERENCE.test(compiled)) push('warning','legacy-reference-token','Legacy [Image N] / [Video N] token remains. Convert it to a Studio @ref token.');
  LEGACY_REFERENCE.lastIndex = 0;
  if (/\{\{\w+\}\}/.test(compiled)) push('warning','unresolved-variable','Template variables remain unresolved.');

  const moves = CAMERA_MOVES.filter(term => normalizeText(camera).includes(term));
  const locked = /\b(locked|static|fixed)\b/i.test(camera);
  if (locked && moves.length) push('warning','camera-conflict',`Camera is described as locked/static and also requests ${uniqueStrings(moves).join(', ')}.`,'camera');
  if (uniqueStrings(moves).length > 2) push('warning','too-many-camera-moves','More than two camera moves are competing in one prompt. Choose one dominant move.','camera');

  const genericRatio = genericLanguageRatio([objective,action,camera,sectionValue(p,'style'),sectionValue(p,'materials')].join(' '));
  if (genericRatio >= 0.18) push('warning','generic-language','The prompt relies heavily on generic quality adjectives. Replace them with observable visual or physical behavior.');

  const hasGraphicsRef = enabledRefs.some(ref => ref.role === 'graphics');
  if (/\b(exact|readable|legible)\s+(text|type|typography|logo|wordmark|label)|\bexact logo\b/i.test(compiled) && !hasGraphicsRef) push('warning','exact-graphics-without-reference','Exact text/logo/label fidelity is requested without a graphics reference. Prefer a reference or post-production workflow.');

  const beatCount = countBeats(timing);
  if (beatCount > Math.max(3, Math.ceil(p.duration / 2))) push('warning','shot-density',`${beatCount} beats are dense for a ${p.duration}s clip. Reduce events or increase duration.`,'timing');
  if (p.duration <= 5 && beatCount > 3) push('warning','short-duration-overload','More than three beats in a very short clip will likely compress or drop actions.','timing');

  if (enabledRefs.some(ref => ['identity','geometry'].includes(ref.role)) && tokenCount(continuity) < 6) push('warning','continuity-lock-needed','Identity/geometry references are present but continuity locks are weak or missing.','continuity');
  if (tokenCount(constraints) < 4) push('info','constraints-thin','Add explicit failure boundaries for geometry, duplication, typography, impossible physics or camera conflicts.','constraints');

  const words = tokenCount(compiled);
  if (words < 30) push('info','prompt-short','Compiled prompt is very short; confirm that camera, action and constraints are sufficiently explicit.');
  if (words > 450) push('warning','prompt-long',`Compiled prompt is ${words} words. Consider tightening hierarchy and removing redundant prose.`);

  for (const rule of p.customRules) {
    if (rule.length < 8) push('info','custom-rule-vague',`Custom editor rule is unusually vague: “${rule}”.`);
  }

  const penalties = issues.reduce((sum, issue) => sum + ({ error:18, warning:8, info:2 }[issue.severity] || 0), 0);
  const score = Math.max(0, Math.min(100, 100 - penalties));
  return {
    schemaVersion:1,
    kind:'seedance-porter-prompt-studio-lint',
    projectId:p.id,
    score,
    grade:score >= 90 ? 'A' : score >= 78 ? 'B' : score >= 64 ? 'C' : score >= 48 ? 'D' : 'F',
    errors:issues.filter(item => item.severity === 'error').length,
    warnings:issues.filter(item => item.severity === 'warning').length,
    infos:issues.filter(item => item.severity === 'info').length,
    issues,
    metrics:{ words, references:enabledRefs.length, beats:beatCount, cameraMoves:uniqueStrings(moves).length, genericRatio:Number(genericRatio.toFixed(3)) }
  };
}

export function buildPromptStudioPatchSchema() {
  return {
    type:'object',
    additionalProperties:false,
    required:['summary','changes','warnings'],
    properties:{
      summary:{type:'string'},
      changes:{
        type:'array',
        maxItems:PROMPT_SECTION_DEFINITIONS.length,
        items:{
          type:'object',
          additionalProperties:false,
          required:['sectionId','content','reason'],
          properties:{
            sectionId:{type:'string',enum:PROMPT_SECTION_DEFINITIONS.map(item => item.id)},
            content:{type:'string'},
            reason:{type:'string'}
          }
        }
      },
      warnings:{type:'array',items:{type:'string'}}
    }
  };
}

export function validatePromptStudioPatch(project, patch) {
  const errors = [];
  const value = patch && typeof patch === 'object' && !Array.isArray(patch) ? patch : {};
  if (!String(value.summary || '').trim()) errors.push('Patch summary is required.');
  if (!Array.isArray(value.changes)) errors.push('Patch changes must be an array.');
  const changes = [];
  const seen = new Set();
  for (const change of value.changes || []) {
    const sectionId = String(change?.sectionId || '');
    if (!SECTION_IDS.has(sectionId)) { errors.push(`Unknown sectionId: ${sectionId || '(empty)'}.`); continue; }
    if (seen.has(sectionId)) { errors.push(`Duplicate section patch: ${sectionId}.`); continue; }
    seen.add(sectionId);
    changes.push({ sectionId, content:String(change?.content || ''), reason:String(change?.reason || '') });
  }
  return { ok:errors.length===0, errors, patch:{ summary:String(value.summary || ''), changes, warnings:uniqueStrings(value.warnings || []) } };
}

export function applyPromptStudioPatch(project, patch, options = {}) {
  const validation = validatePromptStudioPatch(project, patch);
  if (!validation.ok) throw new Error(validation.errors.join(' '));
  const next = normalizeProject(project);
  for (const change of validation.patch.changes) setSectionContent(next.sections, change.sectionId, change.content);
  next.lastPatch = {
    appliedAt:new Date(options.now || Date.now()).toISOString(),
    backend:String(options.backend || 'manual'),
    summary:validation.patch.summary,
    changes:validation.patch.changes,
    warnings:validation.patch.warnings
  };
  return refreshCompiled(next, next.lastPatch.appliedAt);
}

export function buildDeterministicStudioPatch(project, preset = 'tighten') {
  const p = normalizeProject(project);
  const changes = [];
  const change = (sectionId, content, reason) => {
    const current = sectionValue(p, sectionId).trim();
    const next = String(content || '').trim();
    if (!next || next === current) return;
    changes.push({ sectionId, content:next, reason });
  };

  const id = String(preset || '').toLowerCase();
  if (id === 'tighten' || id === 'shorten') {
    for (const section of p.sections) {
      if (!section.enabled || !section.content.trim()) continue;
      const tightened = tightenText(section.content, id === 'shorten' ? 2 : 5);
      change(section.id, tightened, id === 'shorten' ? 'Reduce verbosity while preserving the production instruction.' : 'Remove repetition and low-information adjectives.');
    }
  } else if (id === 'continuity') {
    const refs = p.references.filter(ref => ref.enabled !== false && ['identity','geometry','first-frame','last-frame'].includes(ref.role));
    const lock = refs.length ? ` Lock ${refs.map(ref => `${ref.token} ${ref.role}`).join(', ')} across the complete clip.` : '';
    change('continuity', joinNonDuplicate(sectionValue(p,'continuity'), `Preserve identity, geometry, material response, lighting direction and spatial relationships across every beat.${lock}`), 'Make cross-shot continuity explicit.');
  } else if (id === 'reference-locks') {
    const lockLines = p.references.filter(ref => ref.enabled !== false).map(ref => `${ref.token}: ${referenceJob(ref)}`);
    if (lockLines.length) {
      change('continuity', joinNonDuplicate(sectionValue(p,'continuity'), `Reference locks:\n${lockLines.join('\n')}`), 'Make every reference job explicit and prevent cross-reference leakage.');
      change('constraints', joinNonDuplicate(sectionValue(p,'constraints'), 'Do not let one reference silently control properties assigned to another reference.'), 'Prevent ambiguous reference blending.');
    }
  } else if (id === 'camera-cleanup') {
    const current = sectionValue(p,'camera');
    const moves = uniqueStrings(CAMERA_MOVES.filter(term => normalizeText(current).includes(term)));
    const dominant = moves[0] || 'one controlled camera move';
    change('camera', `Use ${dominant} as the single dominant camera rule. Keep camera height, lens character and movement direction coherent; do not stack competing pan/orbit/zoom/tracking instructions.`, 'Reduce camera conflicts and establish one dominant move.');
  } else if (id === 'physical-motion') {
    change('action', joinNonDuplicate(sectionValue(p,'action'), 'Motion must show plausible acceleration, deceleration, inertia, contact, weight and settling. Change one dominant physical variable at a time and allow a readable endpoint.'), 'Make motion physically legible instead of relying on generic “dynamic” language.');
    change('materials', joinNonDuplicate(sectionValue(p,'materials'), 'Material deformation, liquid, fabric, reflections and particles must respond consistently to gravity, contact, surface tension, mass and the scene lighting.'), 'Add material-specific physical constraints.');
  } else if (id === 'expand-shot-plan') {
    if (!sectionValue(p,'timing').trim()) {
      const action = sectionValue(p,'action') || 'perform the core visible action';
      change('timing', `Beat 1 — establish the subject and spatial rule; hold long enough to read identity.\nBeat 2 — ${lowerFirst(action)}\nBeat 3 — stop adding new events and settle into a stable endpoint suitable for edit or post-production.`, 'Turn the core action into a simple three-beat temporal plan.');
    }
  } else if (id === 'constraints') {
    change('constraints', joinNonDuplicate(sectionValue(p,'constraints'), 'One subject instance unless duplication is intentional. No topology drift, identity swap, impossible contact, random particles, invented text or unrequested camera move. Keep brand-critical typography and exact graphics reference-driven or in post-production.'), 'Add common high-value failure boundaries.');
  }

  return {
    summary:deterministicPresetLabel(id),
    changes,
    warnings:changes.length ? [] : ['No deterministic change was necessary for this preset.']
  };
}

export function refreshPromptStudioProject(project, now = Date.now()) {
  return refreshCompiled(normalizeProject(project), new Date(now).toISOString());
}

export function projectSnapshot(project) {
  const p = normalizeProject(project);
  const snapshot = JSON.parse(JSON.stringify(p));
  snapshot.lastPatch = null;
  return snapshot;
}

export function referenceToken(index) {
  return `@ref${String(index + 1).padStart(2,'0')}`;
}

export function inferReferencesFromPrompt(rawPrompt, roleHints = []) {
  const text = String(rawPrompt || '');
  const refs = [];
  const legacy = [...text.matchAll(new RegExp(LEGACY_REFERENCE.source, 'gi'))];
  for (const match of legacy) {
    const mediaType = match[1].toLowerCase() === 'video' ? 'video' : 'image';
    const legacyNumber = Number(match[2]);
    const existing = refs.find(ref => ref.legacyNumber === legacyNumber && ref.mediaType === mediaType);
    if (existing) continue;
    const context = text.slice(Math.max(0, match.index - 90), Math.min(text.length, match.index + match[0].length + 90));
    refs.push({
      id:`ref-${randomId()}`,
      token:referenceToken(refs.length),
      name:`${match[1]} ${legacyNumber}`,
      mediaType,
      role:normalizeReferenceRole(roleHints[refs.length] || inferReferenceRole(context, mediaType)),
      locked:/exact|preserve|lock|identity|geometry|first frame|last frame/i.test(context),
      uri:'',
      localAssetKey:'',
      notes:`Imported from ${match[0]}`,
      enabled:true,
      legacyNumber
    });
  }
  const studioTokens = [...new Set((text.match(STUDIO_REFERENCE) || []).map(token => token.toLowerCase()))];
  for (const token of studioTokens) {
    if (refs.some(ref => ref.token.toLowerCase() === token)) continue;
    refs.push({ id:`ref-${randomId()}`, token, name:token, mediaType:'unknown', role:'other', locked:false, uri:'', localAssetKey:'', notes:'Imported Studio reference token', enabled:true });
  }
  const normalized=normalizeReferences(refs);
  return normalized.map((ref,index)=>{
    const original=refs[index];
    return original?.legacyNumber ? {...ref,legacyNumber:original.legacyNumber} : ref;
  });
}

export function normalizeMode(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('first') && raw.includes('last')) return 'first-last-frame';
  if (raw === 'reference-to-video' || raw.includes('multi')) return 'multi-reference';
  if (raw.includes('image')) return 'image-to-video';
  if (PROMPT_STUDIO_MODES.includes(raw)) return raw;
  return 'text-to-video';
}

function normalizeProject(project) {
  if (project?.kind === PROMPT_STUDIO_PROJECT_KIND) {
    return {
      ...JSON.parse(JSON.stringify(project)),
      schemaVersion:PROMPT_STUDIO_SCHEMA_VERSION,
      mode:normalizeMode(project.mode),
      sections:normalizeSections(project.sections || []),
      references:normalizeReferences(project.references || []),
      customRules:uniqueStrings(project.customRules || []),
      tags:uniqueStrings(project.tags || []),
      source:normalizeSource(project.source || null)
    };
  }
  return createPromptStudioProject(project || {});
}

function normalizeSections(items) {
  const map = new Map((items || []).map(item => [String(item.id || ''), item]));
  return PROMPT_SECTION_DEFINITIONS.map((def, index) => {
    const source = map.get(def.id) || {};
    return { id:def.id, label:def.label, order:index, enabled:source.enabled !== false, content:String(source.content || '') };
  });
}

function normalizeReferences(items) {
  const used = new Set();
  return (items || []).map((item, index) => {
    let token = String(item.token || referenceToken(index)).toLowerCase();
    if (!/^@ref\d{2,}$/.test(token) || used.has(token)) token = nextFreeReferenceToken(used);
    used.add(token);
    return {
      id:String(item.id || `ref-${randomId()}`),
      token,
      name:String(item.name || token),
      mediaType:['image','video','unknown'].includes(String(item.mediaType)) ? String(item.mediaType) : 'unknown',
      role:normalizeReferenceRole(item.role),
      locked:Boolean(item.locked),
      uri:String(item.uri || ''),
      localAssetKey:String(item.localAssetKey || ''),
      notes:String(item.notes || ''),
      enabled:item.enabled !== false
    };
  });
}

function normalizeSource(value) {
  if (!value) return null;
  return JSON.parse(JSON.stringify({ ...value, kind:String(value.kind || 'manual') }));
}

function refreshCompiled(project, now) {
  const p = project;
  p.updatedAt = String(now || new Date().toISOString());
  p.compiledPrompt = compilePromptProject(p, { includeHeader:true });
  const lint = lintPromptProject(p);
  p.quality = { score:lint.score, grade:lint.grade, errors:lint.errors, warnings:lint.warnings, infos:lint.infos };
  return p;
}

function sectionContent(sections, id) { return String(sections.find(item => item.id === id)?.content || ''); }
function sectionValue(project, id) { return sectionContent(project.sections || [], id); }
function setSectionContent(sections, id, value) { const section=sections.find(item => item.id === id); if (section) section.content=String(value || '').trim(); }

function rewriteLegacyReferenceTokens(text, references) {
  const byLegacy = new Map();
  for (const ref of references || []) if (ref.legacyNumber) byLegacy.set(`${ref.mediaType}:${ref.legacyNumber}`, ref.token);
  return String(text || '').replace(new RegExp(LEGACY_REFERENCE.source, 'gi'), (full, type, number) => byLegacy.get(`${String(type).toLowerCase()}:${Number(number)}`) || full);
}

function referenceJob(ref) {
  const roleText = {
    identity:'identity, face/character/product identity only',
    geometry:'exact shape, proportions and construction geometry',
    style:'visual style and art-direction cues only',
    material:'surface/material response only',
    motion:'motion rhythm/action behavior only; do not copy subject matter',
    camera:'camera movement/framing behavior only',
    'first-frame':'authoritative first-frame composition and identity',
    'last-frame':'authoritative final-frame composition and identity',
    graphics:'exact graphics/type/logo layout reference',
    pattern:'transferable production pattern only; replace source subject matter',
    environment:'environment/spatial design only',
    other:'use only for the explicitly described reference job'
  }[ref.role] || 'use only for the explicitly described reference job';
  return `${roleText}${ref.locked ? '; LOCK this property across the clip' : ''}${ref.notes ? `; note: ${ref.notes}` : ''}`;
}

function inferReferenceRole(context, mediaType) {
  const text = normalizeText(context);
  if (/first frame|start frame/.test(text)) return 'first-frame';
  if (/last frame|end frame|endpoint/.test(text)) return 'last-frame';
  if (/camera|movement rhythm|motion reference|action reference/.test(text) && mediaType === 'video') return /camera/.test(text) ? 'camera' : 'motion';
  if (/exact|geometry|silhouette|proportion|construction/.test(text)) return 'geometry';
  if (/identity|face|character|same person|same product/.test(text)) return 'identity';
  if (/material|surface|texture/.test(text)) return 'material';
  if (/style|palette|art direction|aesthetic/.test(text)) return 'style';
  if (/logo|typography|label|graphics|wordmark/.test(text)) return 'graphics';
  if (/environment|scene|location|layout/.test(text)) return 'environment';
  return mediaType === 'video' ? 'motion' : 'other';
}

function normalizeReferenceRole(value) {
  const raw = String(value || '').toLowerCase();
  const aliases = { character:'identity', product:'geometry', shape:'geometry', look:'style', texture:'material', movement:'motion', first:'first-frame', last:'last-frame', environment:'environment' };
  const mapped = aliases[raw] || raw;
  return REFERENCE_ROLES.includes(mapped) ? mapped : 'other';
}

function inferMode(rawPrompt, explicit) {
  if (explicit) return normalizeMode(explicit);
  const text = String(rawPrompt || '');
  if (/first[ /-]*last|first frame[\s\S]*last frame/i.test(text)) return 'first-last-frame';
  const refs = inferReferencesFromPrompt(text);
  if (refs.length >= 2) return 'multi-reference';
  if (refs.some(ref => ref.mediaType === 'image')) return 'image-to-video';
  return 'text-to-video';
}

function inferDuration(text) {
  const match = String(text || '').match(/\b(\d{1,2})\s*(?:s|sec|seconds?)\b/i);
  return match ? clampNumber(Number(match[1]),1,30) : null;
}

function countBeats(value) {
  const text = String(value || '');
  const explicit = [...text.matchAll(/(?:^|\n)\s*(?:Shot|Beat)\s*\d+/gi)].length;
  if (explicit) return explicit;
  return text.trim() ? text.split(/\n+/).filter(line => line.trim()).length : 0;
}

function genericLanguageRatio(text) {
  const normalized = normalizeText(text);
  if (!normalized) return 0;
  const words = normalized.split(/\s+/).filter(Boolean);
  let hits = 0;
  for (const generic of GENERIC_WORDS) if (normalized.includes(generic)) hits += generic.split(/\s+/).length;
  return words.length ? hits / words.length : 0;
}

function tightenText(value, maxSentences = 5) {
  const raw = String(value || '').replace(/\s+/g,' ').trim();
  if (!raw) return '';
  const sentences = raw.split(/(?<=[.!?])\s+/).filter(Boolean);
  const seen = new Set();
  const kept = [];
  for (const sentence of sentences) {
    const key = normalizeText(sentence).replace(/\b(cinematic|beautiful|stunning|amazing|professional|high quality|premium)\b/g,'').replace(/\s+/g,' ').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const cleaned = sentence
      .replace(/\b(very|really|extremely)\s+/gi,'')
      .replace(/\b(stunning|amazing|beautiful)\b\s*/gi,'')
      .replace(/\s+/g,' ')
      .trim();
    if (cleaned) kept.push(cleaned);
    if (kept.length >= maxSentences) break;
  }
  return kept.join(' ');
}

function deterministicPresetLabel(id) {
  return ({
    tighten:'Tighten wording and remove repetition',
    shorten:'Shorten the prompt while preserving production controls',
    continuity:'Strengthen continuity locks',
    'reference-locks':'Clarify reference jobs and locks',
    'camera-cleanup':'Reduce camera conflicts',
    'physical-motion':'Make motion and material behavior more physical',
    'expand-shot-plan':'Expand the core action into a three-beat shot plan',
    constraints:'Add common failure boundaries'
  })[id] || 'Deterministic Prompt Studio patch';
}

function cleanCaptured(value) { return String(value || '').replace(/^[-–—\s]+|[-–—\s]+$/g,'').trim(); }
function joinNonDuplicate(a,b) { const left=String(a||'').trim();const right=String(b||'').trim();if(!left)return right;if(!right||normalizeText(left).includes(normalizeText(right)))return left;return `${left}\n${right}`; }
function uniqueStrings(values) { return [...new Set((Array.isArray(values)?values:[values]).flat(Infinity).map(value=>String(value??'').trim()).filter(Boolean))]; }
function duplicates(values) { const seen=new Set();const dup=new Set();for(const value of values){if(seen.has(value))dup.add(value);seen.add(value);}return[...dup]; }
function nextFreeReferenceToken(used) { let index=0;while(used.has(referenceToken(index)))index++;return referenceToken(index); }
function tokenCount(value) { return String(value || '').trim().split(/\s+/).filter(Boolean).length; }
function normalizeText(value) { return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9@]+/g,' ').replace(/\s+/g,' ').trim(); }
function clampNumber(value,min,max) { const n=Number(value);return Math.max(min,Math.min(max,Number.isFinite(n)?n:min)); }
function lowerFirst(value) { const text=String(value||'').trim();return text?text[0].toLowerCase()+text.slice(1):''; }
function randomId() { try { return globalThis.crypto?.randomUUID?.().slice(0,12) || Math.random().toString(36).slice(2,14); } catch { return Math.random().toString(36).slice(2,14); } }
