import {
  buildPromptStudioPatchSchema,
  buildDeterministicStudioPatch,
  compilePromptProject,
  lintPromptProject,
  validatePromptStudioPatch,
  PROMPT_SECTION_DEFINITIONS
} from './prompt-studio-engine.js';

export const PROMPT_STUDIO_AI_PRESETS = Object.freeze([
  { id:'tighten', label:'Tighten prompt', labelRu:'Уплотнить промпт' },
  { id:'physical-motion', label:'Make motion physical', labelRu:'Усилить физику движения' },
  { id:'camera-cleanup', label:'Fix camera conflicts', labelRu:'Исправить камеру' },
  { id:'continuity', label:'Strengthen continuity', labelRu:'Усилить консистентность' },
  { id:'reference-locks', label:'Fix reference jobs', labelRu:'Разобрать роли референсов' },
  { id:'shorten', label:'Shorten', labelRu:'Сократить' },
  { id:'expand-shot-plan', label:'Expand shot plan', labelRu:'Развернуть шот-план' },
  { id:'constraints', label:'Add failure boundaries', labelRu:'Добавить ограничения' }
]);

const SYSTEM_PROMPT = `You are Seedance Porter Prompt Studio's production prompt editor.
You edit video-generation prompts, not marketing copy.
Return only a structured patch. Never rewrite the project silently and never claim to have seen a source image/video unless its visual content is explicitly described in the request.
Priorities:
1. one observable production objective;
2. explicit reference jobs with no cross-reference leakage;
3. one dominant camera rule per beat;
4. physically plausible motion, material response and readable settling;
5. continuity of identity, geometry, material, lighting and spatial relationships;
6. exact typography/logos/brand graphics should be reference-driven or reserved for post-production;
7. remove vague adjectives when a visible behavior can replace them;
8. preserve user custom rules;
9. do not copy source-specific character/product/location wording when adapting a research pattern;
10. change only sections that genuinely need editing.
Each change must include a concise reason. Keep final prompt language English unless the project explicitly says otherwise.`;

export async function getPromptStudioAICapabilities() {
  const languageModel = globalThis.LanguageModel;
  const translator = globalThis.Translator;
  const builtIn = await safeAvailability(languageModel, languageModel ? modelOptions() : null);
  const ruToEn = await safeAvailability(translator, translator ? { sourceLanguage:'ru', targetLanguage:'en' } : null);
  return {
    builtInAI:{ supported:Boolean(languageModel), availability:builtIn },
    translator:{ supported:Boolean(translator), availability:ruToEn, pair:'ru→en' },
    rulesEngine:{ supported:true, availability:'available' }
  };
}

export function createPromptStudioAIController(options = {}) {
  let session = null;
  let translator = null;
  let destroyed = false;
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};

  return {
    capabilities:getPromptStudioAICapabilities,
    async stageEdit(project, request = {}) {
      if (destroyed) throw new Error('Prompt Studio AI controller has been destroyed.');
      const preset = String(request.preset || '');
      const rawInstruction = String(request.instruction || presetInstruction(preset) || '').trim();
      const deterministicPreset = preset || classifyPresetFromInstruction(rawInstruction);
      const caps = await getPromptStudioAICapabilities();

      if (!rawInstruction && deterministicPreset) {
        return stageRulesPatch(project, deterministicPreset, 'No custom instruction was provided.');
      }

      if (!caps.builtInAI.supported || caps.builtInAI.availability === 'unavailable') {
        if (deterministicPreset) return stageRulesPatch(project, deterministicPreset, 'Built-in language model is unavailable; used the local deterministic rules engine.');
        return {
          ok:false,
          backend:'rules-only',
          error:'Built-in AI is unavailable in this browser. Use a preset or enable a supported on-device language model.',
          patch:null,
          warnings:['No cloud API key is used or required by Prompt Studio.']
        };
      }

      let instruction = rawInstruction;
      const containsCyrillic = /[А-Яа-яЁё]/.test(instruction);
      if (containsCyrillic) {
        try {
          translator ||= await ensureTranslator(onProgress);
          instruction = await translator.translate(instruction);
          onProgress({ phase:'translation-complete', detail:'RU → EN' });
        } catch (error) {
          if (deterministicPreset) return stageRulesPatch(project, deterministicPreset, `Local RU→EN translation is unavailable; used deterministic rules instead. ${error?.message || error}`);
          return {
            ok:false,
            backend:'built-in-ai',
            error:`Russian custom instruction requires the local Translator capability before the built-in editor can use it safely: ${error?.message || error}`,
            patch:null,
            warnings:[]
          };
        }
      }

      try {
        session ||= await ensureLanguageModel(onProgress);
        const payload = buildAIRequest(project, instruction, request);
        onProgress({ phase:'thinking', detail:'Generating structured edit patch' });
        const raw = await session.prompt(JSON.stringify(payload), {
          responseConstraint:buildPromptStudioPatchSchema()
        });
        const parsed = parseStructuredResponse(raw);
        const validation = validatePromptStudioPatch(project, parsed);
        if (!validation.ok) throw new Error(validation.errors.join('; '));
        onProgress({ phase:'complete', detail:`${validation.patch.changes.length} staged section change(s)` });
        return {
          ok:true,
          backend:'built-in-ai',
          translatedInstruction:containsCyrillic ? instruction : null,
          patch:validation.patch,
          warnings:validation.patch.warnings || [],
          usage:sessionUsage(session)
        };
      } catch (error) {
        if (deterministicPreset) return stageRulesPatch(project, deterministicPreset, `Built-in AI edit failed; used deterministic rules instead. ${error?.message || error}`);
        return { ok:false, backend:'built-in-ai', error:String(error?.message || error), patch:null, warnings:[] };
      }
    },
    async resetSession() {
      try { session?.destroy?.(); } catch {}
      try { translator?.destroy?.(); } catch {}
      session = null;
      translator = null;
      onProgress({ phase:'reset', detail:'Local AI sessions reset' });
    },
    async destroy() {
      destroyed = true;
      try { session?.destroy?.(); } catch {}
      try { translator?.destroy?.(); } catch {}
      session = null;
      translator = null;
    },
    sessionInfo() { return sessionUsage(session); }
  };
}

export function buildAIRequest(project, instruction, request = {}) {
  const lint = lintPromptProject(project);
  return {
    task:'Edit a Seedance Porter Prompt Studio project by returning changed sections only.',
    instruction:String(instruction || '').trim(),
    preset:String(request.preset || ''),
    project:{
      id:project.id,
      title:project.title,
      mode:project.mode,
      aspect:project.aspect,
      duration:project.duration,
      modelProfile:project.modelProfile,
      language:project.language,
      customRules:project.customRules || [],
      references:(project.references || []).filter(ref => ref.enabled !== false).map(ref => ({ token:ref.token, name:ref.name, mediaType:ref.mediaType, role:ref.role, locked:ref.locked, notes:ref.notes })),
      sections:(project.sections || []).map(section => ({ id:section.id, enabled:section.enabled !== false, content:section.content })),
      compiledPrompt:compilePromptProject(project),
      lint:{ score:lint.score, issues:lint.issues.slice(0,18) },
      provenance:project.source ? { kind:project.source.kind, title:project.source.title, author:project.source.author, sourceUrl:project.source.sourceUrl, riskFlags:project.source.riskFlags || [] } : null
    },
    responseRules:[
      'Return only sections that should change.',
      'Never introduce unknown section IDs.',
      'Do not invent visual facts about attached references; only use their declared jobs and notes.',
      'Do not remove explicit reference tokens unless the instruction asks to remove that reference dependency.',
      'Keep exact graphics in reference/post-production constraints rather than claiming model-perfect text.',
      'Respect every customRules entry.'
    ]
  };
}

export function classifyPresetFromInstruction(instruction) {
  const text = String(instruction || '').toLowerCase();
  if (/сократ|короче|shorten|shorter/.test(text)) return 'shorten';
  if (/уплот|tighten|убер.*повтор|remove.*repeat/.test(text)) return 'tighten';
  if (/камер|camera/.test(text)) return 'camera-cleanup';
  if (/референс|reference|ref job/.test(text)) return 'reference-locks';
  if (/консист|continuity|identity lock/.test(text)) return 'continuity';
  if (/физик|physical|инерц|inertia|материал/.test(text)) return 'physical-motion';
  if (/шот|кадр|beat|shot plan|тайминг/.test(text)) return 'expand-shot-plan';
  if (/огранич|constraint|avoid|ошиб/.test(text)) return 'constraints';
  return '';
}

async function ensureLanguageModel(onProgress) {
  const LanguageModelApi = globalThis.LanguageModel;
  if (!LanguageModelApi?.create) throw new Error('LanguageModel API is unavailable.');
  const availability = await safeAvailability(LanguageModelApi, modelOptions());
  if (availability === 'unavailable') throw new Error('Built-in language model is unavailable on this device.');
  onProgress({ phase:'model-create', availability });
  const options = {
    ...modelOptions(),
    initialPrompts:[{ role:'system', content:SYSTEM_PROMPT }],
    monitor(monitor) {
      monitor?.addEventListener?.('downloadprogress', event => onProgress({ phase:'model-download', loaded:Number(event.loaded || 0), total:Number(event.total || 1) }));
    }
  };
  try { return await LanguageModelApi.create(options); }
  catch {
    return LanguageModelApi.create({ initialPrompts:options.initialPrompts, monitor:options.monitor });
  }
}

async function ensureTranslator(onProgress) {
  const TranslatorApi = globalThis.Translator;
  if (!TranslatorApi?.create) throw new Error('Translator API is unavailable.');
  const opts = {
    sourceLanguage:'ru',
    targetLanguage:'en',
    monitor(monitor) {
      monitor?.addEventListener?.('downloadprogress', event => onProgress({ phase:'translator-download', loaded:Number(event.loaded || 0), total:Number(event.total || 1) }));
    }
  };
  const availability = await safeAvailability(TranslatorApi, opts);
  if (availability === 'unavailable') throw new Error('Russian → English on-device translation is unavailable.');
  onProgress({ phase:'translator-create', availability });
  return TranslatorApi.create(opts);
}

async function safeAvailability(api, options) {
  if (!api) return 'unavailable';
  try {
    const value = typeof api.availability === 'function' ? await api.availability(options || undefined) : 'available';
    return normalizeAvailability(value);
  } catch { return 'unknown'; }
}

function normalizeAvailability(value) {
  const raw = String(value || '').toLowerCase();
  if (['available','readily','yes'].includes(raw)) return 'available';
  if (raw.includes('download')) return raw.includes('ing') ? 'downloading' : 'downloadable';
  if (raw.includes('unavailable') || raw === 'no') return 'unavailable';
  return raw || 'unknown';
}

function modelOptions() {
  return {
    expectedInputs:[{ type:'text', languages:['en'] }],
    expectedOutputs:[{ type:'text', languages:['en'] }]
  };
}

function parseStructuredResponse(raw) {
  if (raw && typeof raw === 'object') return raw;
  const text = String(raw || '').trim();
  if (!text) throw new Error('Built-in AI returned an empty response.');
  try { return JSON.parse(text); }
  catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) return JSON.parse(fenced);
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error('Built-in AI response was not valid structured JSON.');
  }
}

function stageRulesPatch(project, preset, warning) {
  const patch = buildDeterministicStudioPatch(project, preset);
  const validation = validatePromptStudioPatch(project, patch);
  return {
    ok:validation.ok,
    backend:'rules-engine',
    patch:validation.ok ? validation.patch : null,
    error:validation.ok ? null : validation.errors.join('; '),
    warnings:[warning, ...(validation.patch?.warnings || [])].filter(Boolean)
  };
}

function presetInstruction(id) {
  return ({
    tighten:'Tighten the prompt. Remove repeated and generic prose but preserve all important production controls and reference tokens.',
    shorten:'Make the prompt materially shorter without losing objective, reference jobs, dominant motion, continuity or critical constraints.',
    'physical-motion':'Rewrite motion/material instructions so acceleration, contact, inertia, mass, fluid/fabric behavior and settling are physically legible.',
    'camera-cleanup':'Resolve camera contradictions. Keep one dominant camera rule per beat and remove compound or redundant camera moves.',
    continuity:'Strengthen identity, geometry, material, lighting and spatial continuity across the clip.',
    'reference-locks':'Clarify exactly what every reference controls and explicitly prevent cross-reference leakage.',
    'expand-shot-plan':'Create a concise beat/shot plan with one readable purpose per beat and a stable endpoint.',
    constraints:'Add high-value failure boundaries without bloating the rest of the prompt.'
  })[id] || '';
}

function sessionUsage(session) {
  if (!session) return null;
  return {
    contextUsage:Number(session.contextUsage ?? session.inputUsage ?? 0) || null,
    contextWindow:Number(session.contextWindow ?? session.inputQuota ?? 0) || null
  };
}
