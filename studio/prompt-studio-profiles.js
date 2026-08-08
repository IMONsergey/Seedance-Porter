export const PROMPT_STUDIO_PROFILES = Object.freeze([
  {
    id:'seedance-general',
    label:'General Production',
    labelRu:'Базовый Production',
    description:'Balanced production rules for most Seedance prompts.',
    descriptionRu:'Базовые production-правила для большинства Seedance-промптов.',
    rules:[
      'Use one dominant visual event per beat; do not overload short clips with unrelated actions.',
      'Use one dominant camera rule per beat and avoid compound camera moves unless the transition is intentional.',
      'Preserve subject identity, geometry, material response, lighting direction and spatial relationships across the clip.',
      'Describe observable motion, contact and settling instead of relying on generic words such as dynamic or cinematic.',
      'Keep exact typography, logos and brand-critical graphics reference-driven or reserve them for post-production.'
    ]
  },
  {
    id:'product-precision',
    label:'Product Precision',
    labelRu:'Точный Product',
    description:'Geometry-first packshots, product films and ecommerce heroes.',
    descriptionRu:'Packshot, продуктовые ролики и ecommerce hero с приоритетом точной геометрии.',
    rules:[
      'Product silhouette, proportions, seams, openings, controls and construction geometry are non-negotiable when a geometry reference is present.',
      'Use a single product instance unless duplication is explicitly requested.',
      'Do not morph product topology to create transitions; move camera, light, material or environment instead.',
      'Label and logo fidelity must come from a graphics reference or post-production, not invented generated lettering.',
      'Use lighting and reflections to reveal material quality without changing the underlying product shape.',
      'Finish on a stable hero endpoint with enough hold time for an edit, supers or post-production.'
    ]
  },
  {
    id:'character-continuity',
    label:'Character Continuity',
    labelRu:'Персонаж / Continuity',
    description:'Identity, wardrobe and spatial continuity across character shots.',
    descriptionRu:'Идентичность, одежда и пространственная консистентность персонажа между шотами.',
    rules:[
      'Character face identity, age, body proportions, hairstyle and defining features must remain stable unless transformation is explicitly requested.',
      'Wardrobe construction, color and accessories must remain consistent across adjacent beats.',
      'Do not introduce extra limbs, duplicate people or spontaneous accessory changes.',
      'Keep screen direction, eyeline and subject position coherent across cuts unless the shot plan explicitly resets geography.',
      'Use motion references for motion behavior only; do not let them overwrite character identity.',
      'Treat identity references as locked across the entire clip.'
    ]
  },
  {
    id:'ui-motion',
    label:'UI / Interface Motion',
    labelRu:'UI / Interface Motion',
    description:'Interface motion where hierarchy matters more than generated microcopy.',
    descriptionRu:'Интерфейсное движение, где важнее иерархия и motion logic, а не сгенерированный микротекст.',
    rules:[
      'Preserve information hierarchy, component geometry and layout relationships before adding decorative motion.',
      'Animate one primary interface state change at a time and keep secondary motion subordinate.',
      'Do not rely on generated readable microcopy for critical UI; use reference graphics or replace text in post-production.',
      'Keep cursor, scroll, drag and panel motion physically coherent with the interface interaction.',
      'Use camera motion only when it clarifies spatial hierarchy; avoid cinematic camera movement that fights interface legibility.',
      'End on a readable interface state rather than mid-transition.'
    ]
  },
  {
    id:'first-last-frame',
    label:'First / Last Frame',
    labelRu:'First / Last Frame',
    description:'Endpoint-constrained transitions with strict composition locks.',
    descriptionRu:'Переходы между двумя утверждёнными endpoint-кадрами с жёсткими композиционными локами.',
    rules:[
      'The first-frame reference is authoritative for the starting composition and identity.',
      'The last-frame reference is authoritative for the final composition and identity.',
      'Do not treat endpoint references as loose style references; preserve their assigned composition jobs.',
      'Use the simplest causal transition that can connect the endpoints without inventing unnecessary intermediate subjects.',
      'Continuity changes should be explainable by visible motion, material transformation or camera movement.',
      'Reserve enough duration for the final state to settle and match the last-frame reference.'
    ]
  },
  {
    id:'material-beauty',
    label:'Material / Beauty',
    labelRu:'Material / Beauty',
    description:'Macro beauty, liquid, glass, skin, fabric and material-response shots.',
    descriptionRu:'Macro beauty, liquid, glass, skin, fabric и материальные эффекты.',
    rules:[
      'Material response must respect gravity, surface tension, viscosity, elasticity, contact and scene lighting.',
      'Macro motion should remain slow enough to inspect surface detail and avoid unstable micro-geometry.',
      'Use one material event at a time: droplet, fold, splash, condensation movement or light sweep.',
      'Skin and beauty surfaces should keep anatomy stable; material effects must not alter facial identity or body topology.',
      'Transparent and reflective materials must keep consistent light direction and plausible reflection behavior.',
      'Finish material events with readable settling rather than endless motion.'
    ]
  }
]);

const ALL_PACK_RULES = new Set(PROMPT_STUDIO_PROFILES.flatMap(profile => profile.rules));

export function getPromptStudioProfile(id) {
  return PROMPT_STUDIO_PROFILES.find(profile => profile.id === id) || PROMPT_STUDIO_PROFILES[0];
}

export function applyPromptStudioProfile(project, profileId) {
  const profile = getPromptStudioProfile(profileId);
  const userRules = (project.customRules || []).filter(rule => !ALL_PACK_RULES.has(rule));
  return {
    ...JSON.parse(JSON.stringify(project)),
    modelProfile:profile.id,
    customRules:[...userRules, ...profile.rules]
  };
}

export function promptStudioUserRules(project) {
  return (project.customRules || []).filter(rule => !ALL_PACK_RULES.has(rule));
}

export function promptStudioProfileRules(project) {
  const profile = getPromptStudioProfile(project.modelProfile);
  return (project.customRules || []).filter(rule => profile.rules.includes(rule));
}

export function promptStudioProfileCoverage(project) {
  const profile = getPromptStudioProfile(project.modelProfile);
  const current = new Set(project.customRules || []);
  return {
    profileId:profile.id,
    expected:profile.rules.length,
    active:profile.rules.filter(rule => current.has(rule)).length,
    missing:profile.rules.filter(rule => !current.has(rule))
  };
}
