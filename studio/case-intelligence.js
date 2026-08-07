import { INDUSTRY_DIGEST } from './digest-data.js';

export const COLLECTION_GROUPS = [
  {
    id: 'digital-design',
    title: 'Digital / Design',
    items: ['Website Hero','SaaS UI','App Launch','Dashboard','Case Study Motion','Brand Reveal','Rebranding Transition','Logo Motion','Kinetic Type','Interactive / Web3D']
  },
  {
    id: 'commercial',
    title: 'Commercial',
    items: ['Packshot','Beauty','FMCG','Food','Automotive','Fashion','Sports','Luxury','Electronics','Real Estate']
  },
  {
    id: 'motion-language',
    title: 'Motion language',
    items: ['Camera','Transitions','Morphs','Macro','Material','Loop','Freeze','Scale','Match Cut','First / Last Frame']
  }
];

const explicitCollections = {
  'digest-japanese-romance': ['Case Study Motion','Camera'],
  'digest-haute-couture-porcelain': ['Fashion','Morphs','Material','Transitions','Scale'],
  'digest-modern-rural': ['Food','Macro','Material','Camera'],
  'digest-street-racing': ['Automotive','Camera','Transitions'],
  'digest-mini-skincare': ['Beauty','Packshot','Luxury','Scale','Macro'],
  'digest-radiance-serum': ['Beauty','Packshot','Luxury','Macro'],
  'digest-fish-ad': ['Food','FMCG','Macro','Material'],
  'digest-moxie-curl': ['Beauty','FMCG','Packshot','Macro'],
  'digest-gold-morph': ['Brand Reveal','Logo Motion','Morphs','Material','Loop'],
  'digest-camera-minimal': ['Website Hero','Case Study Motion','Camera','First / Last Frame'],
  'digest-fisheye-dancer': ['Fashion','Camera','Scale'],
  'digest-beauty-advent': ['Beauty','FMCG','Packshot','Macro'],
  'digest-suitcase': ['Packshot','Luxury','Macro','Material'],
  'digest-blender': ['FMCG','Electronics','Packshot','Macro'],
  'digest-golden-serum': ['Beauty','Luxury','Packshot','Macro','Material'],
  'digest-fashion-mall': ['Fashion','App Launch','Transitions','Match Cut'],
  'digest-water-skincare': ['Beauty','Luxury','Macro','Material'],
  'digest-soda-monster': ['FMCG','Brand Reveal','Material','Transitions'],
  'digest-night-market': ['Food','FMCG','Camera'],
  'digest-idol-homevideo': ['Case Study Motion','Camera','Transitions'],
  'digest-werewolf': ['Fashion','Morphs','Transitions','Material'],
  'digest-seattle-chase': ['Case Study Motion','Camera','Match Cut','Transitions'],
  'digest-1950s-drama': ['Fashion','Camera','Case Study Motion'],
  'digest-tennis': ['Sports','Brand Reveal','Freeze','Camera']
};

const signatureMoves = {
  'digest-japanese-romance': 'Micro-performance escalation: gaze → hesitation → shared eye contact.',
  'digest-haute-couture-porcelain': 'One material system changes state while preserving its visual DNA.',
  'digest-modern-rural': 'Tactile macro action resolves into a calm lifestyle frame.',
  'digest-street-racing': 'Tension detail escalates into speed, then resolves in one clean hero pass.',
  'digest-mini-skincare': 'Scale inversion turns the product into a navigable miniature world.',
  'digest-radiance-serum': 'Architecture establishes brand values before skin benefit and packshot.',
  'digest-fish-ad': 'Transformation is the story: raw → process → heat → plated payoff.',
  'digest-moxie-curl': 'Visible product benefit is demonstrated through material/hair physics, not copy.',
  'digest-gold-morph': 'Continuous morph loop with inherited material, reflection and curvature.',
  'digest-camera-minimal': 'The image owns art direction; the prompt only owns motion.',
  'digest-fisheye-dancer': 'A single severe optical rule unifies chaotic movement.',
  'digest-beauty-advent': 'Focus transfer becomes the transition between creator and product hierarchy.',
  'digest-suitcase': 'Each shot proves exactly one product feature.',
  'digest-blender': 'Spokesperson claim is immediately followed by visual product proof.',
  'digest-golden-serum': 'A single liquid/material metaphor connects benefit and packshot.',
  'digest-fashion-mall': 'Retail energy is created by edit grammar, not by changing the visual identity.',
  'digest-water-skincare': 'One purity metaphor repeats across opener, benefit and end frame.',
  'digest-soda-monster': 'Product activation changes both character emotion and world lighting state.',
  'digest-night-market': 'Controlled imperfection is treated as a repeatable visual system.',
  'digest-idol-homevideo': 'Mundane backstage details build anticipation before the milestone.',
  'digest-werewolf': 'Identity anchors remain stable while only one material/body state transforms.',
  'digest-seattle-chase': 'Kinetic middle is made memorable by a dead-static payoff.',
  'digest-1950s-drama': 'Period authenticity comes from blocking/composition rules, not a vintage filter.',
  'digest-tennis': 'Peak sports action freezes so the campaign can inspect apparel/product detail.'
};

const transferablePatterns = {
  'digest-japanese-romance': 'Use for founder/customer reactions, intimate testimonial scenes, character-driven case films and restrained dialogue moments.',
  'digest-haute-couture-porcelain': 'Use when a brand owns a distinctive material, texture or graphic system that can become the transformation rule.',
  'digest-modern-rural': 'Use for food, craft, hospitality, materials, manufacturing and process-driven brand films.',
  'digest-street-racing': 'Use for automotive, sports, gaming and launch sequences that need controlled escalation.',
  'digest-mini-skincare': 'Use for beauty/FMCG campaigns where one hero product needs multiple social-world variations.',
  'digest-radiance-serum': 'Use for premium products where environment can communicate brand values before the pack appears.',
  'digest-fish-ad': 'Use for any process product whose transformation is visually attractive: food, cosmetics, materials, manufacturing.',
  'digest-moxie-curl': 'Use whenever the product benefit can be shown physically rather than described.',
  'digest-gold-morph': 'Use for logo stings, brand-world transitions, website heroes and looping identity motion.',
  'digest-camera-minimal': 'Use on approved key visuals, posters, UI comps and campaign images where redesign is unwanted.',
  'digest-fisheye-dancer': 'Use for youth culture, fashion, music and sports when one lens rule should become campaign identity.',
  'digest-beauty-advent': 'Use for ecommerce unboxing, kits, feature ladders and creator-led reveal sequences.',
  'digest-suitcase': 'Use for durable goods, hardware, electronics and any product with demonstrable physical features.',
  'digest-blender': 'Use for creator ads where each spoken claim can be followed by one verifiable action.',
  'digest-golden-serum': 'Use for liquids, fragrances, skincare and premium material-led product films.',
  'digest-fashion-mall': 'Use for launch edits where multiple environments/outfits will ultimately be assembled in post.',
  'digest-water-skincare': 'Use when one simple metaphor can carry the full visual identity of a short film.',
  'digest-soda-monster': 'Use when a mascot and product need a causal relationship rather than decorative coexistence.',
  'digest-night-market': 'Use for hospitality, food and lifestyle campaigns where believable handheld imperfection, ambient sound, restrained reaction and product-in-context create authentic social proof.',
  'digest-idol-homevideo': 'Use for agency case films, launches, founders, events and process documentaries.',
  'digest-werewolf': 'Use for fashion, gaming, beauty and reveal concepts that depend on controlled metamorphosis.',
  'digest-seattle-chase': 'Use for ad/case-film narratives where a trivial objective is treated with disproportionate cinematic urgency.',
  'digest-1950s-drama': 'Use whenever a historical or genre visual language must come from cinematography rules rather than effects.',
  'digest-tennis': 'Use for sportswear, equipment and product films where action can pause to expose design details.'
};

const risksByCollection = {
  'Website Hero': ['overmoving an approved composition','generated typography drift'],
  'SaaS UI': ['invented interface controls','unreadable UI typography'],
  'App Launch': ['too many states inside one clip','screen geometry drift'],
  'Dashboard': ['fake data labels','misaligned UI hierarchy'],
  'Case Study Motion': ['generic cinematic shots with no information hierarchy','too much narrative for 15 seconds'],
  'Brand Reveal': ['logo distortion','unmotivated particle clutter'],
  'Rebranding Transition': ['old/new identity mixing unintentionally','loss of exact logo geometry'],
  'Logo Motion': ['generated letterform errors','overcomplicated transforms'],
  'Kinetic Type': ['unreadable text','model-generated spelling errors'],
  'Interactive / Web3D': ['camera movement replaces actual interaction logic','unstable UI geometry'],
  'Packshot': ['package/logo drift','duplicate product'],
  'Beauty': ['plastic skin','unrealistic hair/liquid physics'],
  'FMCG': ['packaging inconsistency','invented claims/text'],
  'Food': ['ingredient morphing','unrealistic heat/liquid behavior'],
  'Automotive': ['wheel/body deformation','reflection discontinuity'],
  'Fashion': ['wardrobe drift','body/garment fusion'],
  'Sports': ['anatomy/action physics errors','equipment deformation'],
  'Luxury': ['visual clutter reduces perceived value','CGI gloss instead of material realism'],
  'Electronics': ['port/button geometry drift','screen text artifacts'],
  'Real Estate': ['architecture morphing','impossible spatial continuity'],
  'Camera': ['compound camera moves','camera teleportation'],
  'Transitions': ['transition becomes unrelated scene change','continuity loss'],
  'Morphs': ['unmotivated topology noise','identity loss during metamorphosis'],
  'Macro': ['depth-of-field hides the actual feature','surface artifacts'],
  'Material': ['incorrect weight/reflectivity','material changes between shots'],
  'Loop': ['first/last state mismatch','visible discontinuity'],
  'Freeze': ['subject anatomy breaks during freeze','motion restart does not match'],
  'Scale': ['inconsistent relative size','contact shadows break scale illusion'],
  'Match Cut': ['AI is asked to edit instead of generating clean source shots','geometry mismatch'],
  'First / Last Frame': ['endpoint overconstrained','interpolation invents geometry']
};

function parseShots(prompt) {
  const source = String(prompt || '');
  const matches = [...source.matchAll(/Shot\s+(\d+):\s*([\s\S]*?)(?=\s+Shot\s+\d+:|\s+Visual style:|\s+Image quality:|\s+Audio:|\s+Constraints:|$)/gi)];
  if (matches.length) {
    return matches.map((match, i) => {
      const text = match[2].trim();
      const camera = text.match(/^(.*?)(?:;| while | as )/i)?.[1]?.trim() || 'controlled shot';
      return {
        index: Number(match[1]) || i + 1,
        label: i === 0 ? 'Hook / setup' : i === matches.length - 1 ? 'Payoff / endpoint' : 'Development',
        camera,
        action: text,
        visualPurpose: i === 0 ? 'Establish the visual rule and subject hierarchy.' : i === matches.length - 1 ? 'Resolve the idea into a memorable or useful endpoint.' : 'Advance one visible state change without resetting the visual logic.',
        promptCause: text,
        continuity: 'Carry forward subject identity, geometry, material and lighting rules from the previous beat.',
        whyThisShotExists: i === 0 ? 'The first beat must make the core visual grammar legible immediately.' : i === matches.length - 1 ? 'The final beat converts motion into a clear campaign, product or narrative payoff.' : 'This beat creates progression while keeping cognitive load low.'
      };
    });
  }
  const clips = [...source.matchAll(/Clip\s+([A-Z]):\s*([\s\S]*?)(?=\s+Clip\s+[A-Z]:|\s+Visual style:|\s+Audio:|\s+Constraints:|$)/gi)];
  return clips.map((match, i) => ({
    index: i + 1,
    label: i === 0 ? 'Hook / setup' : i === clips.length - 1 ? 'Payoff / endpoint' : 'Development',
    camera: match[2].trim().split(';')[0],
    action: match[2].trim(),
    visualPurpose: i === clips.length - 1 ? 'Create contrast and resolve the sequence.' : 'Advance the action with one clear camera function.',
    promptCause: match[2].trim(),
    continuity: 'Keep the same story object, identity and world logic across clips.',
    whyThisShotExists: i === clips.length - 1 ? 'The endpoint changes rhythm so the concept becomes memorable.' : 'Each clip isolates one piece of action that would be brittle if overloaded into a single generation.'
  }));
}

function defaultCollections(item) {
  const result = new Set();
  const hay = `${item.category} ${item.subcategory} ${(item.tags || []).join(' ')}`.toLowerCase();
  if (/beauty|serum|skincare|hair/.test(hay)) { result.add('Beauty'); result.add('Packshot'); }
  if (/food/.test(hay)) result.add('Food');
  if (/fashion|editorial/.test(hay)) result.add('Fashion');
  if (/automotive|racing/.test(hay)) result.add('Automotive');
  if (/sport|tennis/.test(hay)) result.add('Sports');
  if (/brand|logo/.test(hay)) result.add('Brand Reveal');
  if (/case|portfolio|bts/.test(hay)) result.add('Case Study Motion');
  if (/camera|handheld|fisheye/.test(hay)) result.add('Camera');
  if (/macro/.test(hay)) result.add('Macro');
  if (/morph|transform/.test(hay)) result.add('Morphs');
  if (/material|liquid|glass|porcelain/.test(hay)) result.add('Material');
  if (/loop/.test(hay)) result.add('Loop');
  return [...result];
}

function mechanics(item) {
  const shots = parseShots(item.porterPrompt);
  const collections = explicitCollections[item.id] || defaultCollections(item);
  const mechanicsList = [];
  if (shots.length > 1) mechanicsList.push('Separates the concept into ordered beats instead of one overloaded instruction.');
  if (collections.includes('Macro')) mechanicsList.push('Uses macro framing to turn surface/material detail into product evidence.');
  if (collections.includes('Camera')) mechanicsList.push('Assigns a clear information function to camera movement rather than using motion decoratively.');
  if (collections.includes('Morphs')) mechanicsList.push('Defines what must remain invariant while the silhouette or material state changes.');
  if (collections.includes('Packshot')) mechanicsList.push('Resolves into a stable product endpoint suitable for typography/branding in post.');
  if (collections.includes('Freeze')) mechanicsList.push('Uses rhythm interruption to create a product-inspection beat inside action.');
  return mechanicsList.length ? mechanicsList : ['Keeps one dominant visible action per beat and preserves stable subject/world anchors.'];
}

export function getCaseIntelligence(item) {
  const collections = explicitCollections[item.id] || defaultCollections(item);
  const shots = parseShots(item.porterPrompt);
  const risks = [...new Set(collections.flatMap(c => risksByCollection[c] || []))].slice(0, 6);
  return {
    collections,
    evidenceLevel: item.sourceUrl && item.archiveUrl && item.previewUrl ? 'A' : item.sourceUrl && item.previewUrl ? 'B' : 'C',
    productionScore: Math.max(1, Math.min(5, Math.round((item.designScore + (shots.length >= 3 ? 5 : 4)) / 2))),
    hook: shots[0]?.action || item.originalExcerpt,
    signatureMove: signatureMoves[item.id] || 'One clear visual rule carries the clip from setup to endpoint.',
    whyItWorks: item.why,
    shotBreakdown: shots,
    promptMechanics: mechanics(item),
    referenceStrategy: /\[Image\s+1\]/i.test(item.porterPrompt)
      ? ['Use the primary image as a strict identity/product/geometry anchor.', 'Assign each additional reference one job only.']
      : ['References are optional; if introduced, give each asset one explicit role.'],
    cameraLanguage: collections.includes('Camera') ? ['Camera movement is structural: one dominant move per shot.', 'Static shots are used deliberately where clarity matters.'] : ['Camera remains subordinate to the concept and subject hierarchy.'],
    transitionLanguage: collections.includes('Match Cut') ? ['Generate clean source shots and perform exact match cuts in post.'] : collections.includes('Transitions') ? ['Transition is motivated by the visible state change, not added as generic spectacle.'] : ['Cuts/state changes should preserve visual continuity.'],
    materialLanguage: collections.includes('Material') ? ['Material behavior, reflectivity, weight and continuity are treated as identity anchors.'] : ['Material rules should remain stable across shots.'],
    audioRole: /audio|sound|music|room tone|ambience|engine|ASMR/i.test(item.porterPrompt) ? 'Audio reinforces the visible action/rhythm and should not compete with the visual idea.' : 'Audio is secondary; add only when it clarifies rhythm or physical action.',
    postProductionExpectation: collections.some(c => ['Logo Motion','Kinetic Type','SaaS UI','Dashboard','Match Cut','Brand Reveal'].includes(c))
      ? 'Hybrid finish expected: preserve generation for motion/atmosphere and composite exact typography, UI or brand geometry in post.'
      : 'Light finishing expected: color, sound, cleanup and exact brand/text elements should remain post-production responsibilities.',
    transferablePattern: transferablePatterns[item.id] || 'Reuse the production logic and shot function while replacing the original subject matter, styling and distinctive wording.',
    failureRisks: risks.length ? risks : ['too many actions in one shot','identity/geometry drift','invented text or logos'],
    bosNotes: [
      'Use ordered Shot N blocks rather than relying on brittle exact timestamps.',
      'Keep one dominant camera movement per shot.',
      'Give every reference one explicit job and preserve stable identity/product anchors.',
      'Do not rely on Seedance for exact brand typography when post-compositing is safer.'
    ]
  };
}

export const CASE_INTELLIGENCE = INDUSTRY_DIGEST.map(item => ({ ...item, intelligence: getCaseIntelligence(item) }));

export const COLLECTION_COUNTS = Object.fromEntries(
  COLLECTION_GROUPS.flatMap(group => group.items).map(name => [name, CASE_INTELLIGENCE.filter(item => item.intelligence.collections.includes(name)).length])
);
