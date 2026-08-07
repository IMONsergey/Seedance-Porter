// Seedance Porter Design Prompt Library
// 48 original production archetypes × 4 curated visual variations = 192 cards.
// Prompts are Porter-original adaptations of industry patterns; source links are research provenance, not claims of verbatim origin.

export const SOURCES = [
  { id: 'byteplus-guide', title: 'BytePlus — Dreamina Seedance 2.0 Prompt Guide', type: 'Official guidance', authority: 5, design: 5, url: 'https://docs.byteplus.com/en/docs/ModelArk/2222480', note: 'Official Seedance engineering-style prompt formula, Shot N structure, reference roles and failure mitigation.' },
  { id: 'byteplus-tutorial', title: 'BytePlus — Seedance 2.0 Tutorial', type: 'Official guidance', authority: 5, design: 4, url: 'https://docs.byteplus.com/en/docs/ModelArk/2291680', note: 'Multimodal references, asset flow and official prompt optimization skill.' },
  { id: 'runway-prompt', title: 'Runway Academy — Prompting Guide', type: 'Official guidance', authority: 5, design: 4, url: 'https://academy.runwayml.com/guides/prompting-guide', note: 'Clear split between visual components and motion components.' },
  { id: 'runway-i2v', title: 'Runway — Image to Video Prompting Guide', type: 'Official guidance', authority: 5, design: 4, url: 'https://help.runwayml.com/hc/en-us/articles/48324313115155-Image-to-Video-Prompting-Guide', note: 'When an image sets appearance, text should focus on motion, camera and temporal progression.' },
  { id: 'runway-camera', title: 'Runway — Camera Terms, Prompts & Examples', type: 'Official camera reference', authority: 5, design: 4, url: 'https://help.runwayml.com/hc/en-us/articles/46749315925395-Camera-Terms-Prompts-Examples', note: 'Practical motion and framing vocabulary.' },
  { id: 'runway-product', title: 'Runway Dev — Product Ad Recipe', type: 'Official workflow', authority: 5, design: 5, url: 'https://docs.dev.runwayml.com/recipes/product-ad/', note: 'Product images plus concept direction become a storyboard and ad-ready motion.' },
  { id: 'runway-ad', title: 'Runway Academy — AI for Advertising', type: 'Official course', authority: 5, design: 5, url: 'https://academy.runwayml.com/course/ai-advertising', note: 'Moodboard, concept, storyboard, previs, product shots, B-roll and campaign variations.' },
  { id: 'adobe-prompt', title: 'Adobe Firefly — Effective Video Prompts', type: 'Official guidance', authority: 5, design: 4, url: 'https://helpx.adobe.com/uk/firefly/web/work-with-audio-and-video/work-with-video/writing-effective-text-prompts-for-video-generation.html', note: 'Shot + subject + action + location + aesthetic; explicit camera and temporal cues.' },
  { id: 'adobe-motion', title: 'Adobe Firefly — Camera Motion Reference', type: 'Official workflow', authority: 5, design: 5, url: 'https://helpx.adobe.com/uk/firefly/web/work-with-audio-and-video/work-with-video/match-camera-motion-to-reference-video.html', note: 'A reference can provide motion only; reinforces reference-role discipline.' },
  { id: 'google-flow', title: 'Google Flow', type: 'Creative platform', authority: 5, design: 5, url: 'https://labs.google/fx/tools/flow', note: 'Current creative-studio pattern: storyboard, ingredients, frames, editing and custom tools.' },
  { id: 'luma-best', title: 'Luma Dream Machine — Best Practices', type: 'Official guidance', authority: 5, design: 4, url: 'https://lumalabs.ai/learning-hub/best-practices', note: 'Natural-language specificity, visual intent and iterative boards.' },
  { id: 'youmind', title: 'YouMind OpenLab — Awesome Seedance 2 Prompts', type: 'Community library', authority: 3, design: 3, url: 'https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts', note: 'Large Seedance corpus and category taxonomy; CC BY 4.0 repository.' },
  { id: 'gracech', title: 'Seedance 2 Prompt Library — gracech0322', type: 'Community library', authority: 3, design: 3, url: 'https://github.com/gracech0322-cmd/seedance-2-prompt-library', note: 'Prompt + media example gallery with commercial recipes.' },
  { id: 'seedance-gallery', title: 'Seedance Gallery', type: 'Prompt gallery', authority: 2, design: 3, url: 'https://seedance.gallery/', note: 'Searchable prompt gallery with categories and aspect-ratio metadata.' },
  { id: 'higgsfield-marketing', title: 'Higgsfield Marketing Studio', type: 'Commercial platform', authority: 4, design: 5, url: 'https://higgsfield.ai/marketing-studio-intro', note: 'UGC, product demos, app demos and TV spots reflect current commercial demand.' },
  { id: 'higgsfield-ads', title: 'Higgsfield Ads', type: 'Commercial workflow', authority: 4, design: 5, url: 'https://higgsfield.ai/blog/The-Fastest-Way-to-Create-Cinematic-Product-Commercials', note: 'Product-photo-to-commercial template taxonomy.' },
  { id: 'animazzio-2026', title: 'Animazzio — Motion Design Showreel 2026', type: 'Behance case study', authority: 4, design: 5, url: 'https://www.behance.net/gallery/252033221/Motion-Design-Showreel-2026-Animazzio', note: '2026 shift toward hero video, SaaS/product motion, UI, Lottie and logo animation.' },
  { id: 'saas-avatar', title: 'SaaS Promo with AI Avatar', type: 'Behance case study', authority: 3, design: 5, url: 'https://www.behance.net/gallery/248941345/SaaS-Promo-with-AI-Avatar', note: 'Seedance footage integrated with custom SaaS UI motion and After Effects.' },
  { id: 'hyperbolic-motion', title: 'Hyperbolic AI Motion Branding', type: 'Behance case study', authority: 3, design: 5, url: 'https://www.behance.net/gallery/243104669/AI-Motion-Branding', note: 'Technology brand motion mixing contemporary AI positioning and nostalgic/nature visual language.' },
  { id: 'measure-motion', title: 'Measure — Brand Motion & Logo Animation', type: 'Behance case study', authority: 3, design: 5, url: 'https://www.behance.net/gallery/244433487/Measure-Brand-Motion-and-Logo-animation', note: 'Kinetic typography, logo choreography and rhythmic transitions.' },
  { id: 'a1-saas', title: 'A1 Mobile Launch Video', type: 'Behance case study', authority: 3, design: 5, url: 'https://www.behance.net/gallery/243834449/A1-Mobile-Launch-Video', note: 'SaaS launch storytelling with UI hierarchy and social delivery.' },
  { id: 'signal-motion', title: 'Signal — Motion Design Concept', type: 'Behance case study', authority: 3, design: 5, url: 'https://www.behance.net/gallery/246609067/Signal-Motion-Design-Concept', note: 'Minimal compositions, 3D metaphors and structured information flow.' },
  { id: 'digital-rush', title: 'Digital Rush — Rebranding Animation', type: 'Behance case study', authority: 3, design: 5, url: 'https://www.behance.net/gallery/243273181/Digital-Rush-Rebranding-Animation', note: 'Old-to-new identity transition built for digital channels.' },
  { id: 'hybrid-logo', title: 'Hybrid Logo Reveal — Generative AI + Motion', type: 'Behance case study', authority: 4, design: 5, url: 'https://www.behance.net/gallery/243175145/Hybrid-Logo-Reveal-%28Generative-AI-Motion-Design%29', note: 'Greybox/C4D foundation → AI detailing → After Effects composite.' },
  { id: 'adidas-ai', title: 'Adidas AI Film', type: 'Behance case study', authority: 3, design: 5, url: 'https://www.behance.net/gallery/250625515/Adidas-AI-Film', note: 'Seedance + Kling + post-production product-film workflow.' },
  { id: 'docusign-awwwards', title: 'Docusign Brand — Awwwards', type: 'Awarded digital design', authority: 4, design: 5, url: 'https://www.awwwards.com/sites/docusign-brand', note: 'Interactive rebrand storytelling with typography, abstract image fields and depth.' },
  { id: 'bezier-awwwards', title: 'Bezier Animation Studio — Awwwards', type: 'Awarded digital design', authority: 4, design: 5, url: 'https://www.awwwards.com/sites/bezier-animation-studio', note: 'Motion-first portfolio presentation and curve-driven interaction language.' },
  { id: 'canva-2026', title: 'Canva 2026 Trend Signal — Imperfect by Design', type: 'Trend research', authority: 3, design: 5, url: 'https://www.creativebloq.com/design/canvas-2026-trend-predictions-have-filled-me-with-hope', note: 'Retro-tech UI, tactile CGI, opt-out minimalism, motion collage and reality-warp aesthetics.' },
  { id: 'vidprom', title: 'VidProM — 1.67M Video Prompts', type: 'Research dataset', authority: 4, design: 2, url: 'https://arxiv.org/abs/2403.06098', note: 'Large-scale evidence that real video prompting is diverse, iterative and model-specific.' },
  { id: 'seedance-paper', title: 'Seedance 2.0 Technical Report', type: 'Research / first-party authors', authority: 5, design: 3, url: 'https://arxiv.org/abs/2604.14148', note: 'Model capability and multimodal evaluation context.' }
];

export const VARIATIONS = [
  {
    id: 'precision', name: 'Precision Minimal',
    values: { palette: 'graphite black, chalk white and one restrained electric-blue accent', material: 'matte polymer, satin glass and clean anti-glare surfaces', light: 'large soft studio source with controlled edge highlights', tempo: 'slow, deliberate and premium', texture: 'clean micro-detail with almost no visual noise', atmosphere: 'calm, exact and editorial' }
  },
  {
    id: 'tactile', name: 'Tactile Material',
    values: { palette: 'warm stone, cream, oxidized green and muted copper', material: 'translucent resin, brushed metal, paper fibre and soft rubber', light: 'warm directional light with broad material reflections', tempo: 'measured with tactile pauses', texture: 'visible grain, fibres, condensation and surface depth', atmosphere: 'physical, crafted and sensory' }
  },
  {
    id: 'retrotech', name: 'Retro Tech',
    values: { palette: 'acid green, cobalt blue, amber and deep charcoal', material: 'smoked acrylic, chrome, CRT phosphor and glossy black plastic', light: 'hard screen glow mixed with narrow neon edge light', tempo: 'snappy, syncopated and interface-like', texture: 'scanlines, pixel bloom and controlled analog noise', atmosphere: 'playful retro-future technology' }
  },
  {
    id: 'warp', name: 'Reality Warp',
    values: { palette: 'liminal lavender, ink black, electric coral and cold silver', material: 'liquid glass, reflective membrane and volumetric translucent forms', light: 'surreal volumetric light with realistic contact shadows', tempo: 'slow at first, then one impossible but coherent transformation', texture: 'hyper-real material detail with dreamlike spatial distortion', atmosphere: 'uncanny, elegant and high-design' }
  }
];

const archetypes = [
  // WEB / HERO MOTION
  {
    key: 'web-depth-reveal', title: 'Homepage Depth Reveal', category: 'Web / Hero', subcategory: 'Landing page', use: 'Hero animation from a finished web comp', mode: 'image-to-video', aspect: '16:9', duration: 6, difficulty: 'Intermediate', refs: ['environment'], sourceIds: ['byteplus-guide','runway-i2v','docusign-awwwards','animazzio-2026'], tags: ['web','hero','landing','depth','parallax'],
    defaults: { subject: 'a premium editorial landing page from [Image 1]', motion: 'foreground typography and image planes separate into shallow depth while preserving exact layout hierarchy', camera: 'one slow push-in', endpoint: 'the hero CTA settles closest to camera while every grid alignment remains readable' },
    template: `Core subject: {{subject}}. Scene/environment: the original page becomes a spatial design stage using {{palette}}. Shot 1: {{camera}} while {{motion}}. Interface motion stays restrained; no element changes identity or swaps position. Material language: {{material}} with {{texture}}. Lighting: {{light}}. Visual style: {{atmosphere}}, contemporary digital art direction. Image quality: crisp UI edges, stable typography blocks, coherent depth. End state: {{endpoint}}. Keep it free of invented text, duplicate buttons and unrelated UI.` ,
    why: 'Turns a static award-style hero into depth without redesigning the interface.', post: 'Replace exact text/logo in post if typography fidelity matters.'
  },
  {
    key: 'web-scroll-stack', title: 'Scroll Stack Choreography', category: 'Web / Hero', subcategory: 'Scroll storytelling', use: 'Case-study or landing-page scroll sequence', mode: 'reference-to-video', aspect: '16:9', duration: 8, difficulty: 'Advanced', refs: ['environment','motion'], sourceIds: ['bezier-awwwards','animazzio-2026','adobe-motion','byteplus-guide'], tags: ['scroll','cards','web','case-study','stack'],
    defaults: { subject: 'a stack of clean project cards based on [Image 1]', motion: 'cards advance one at a time in a strict vertical sequence, each card briefly becoming the visual focus before yielding to the next', camera: 'one smooth lateral tracking move', endpoint: 'the final card expands to a clean full-frame hero' },
    template: `Core subject: {{subject}}. Camera/action reference: use only the movement rhythm of [Video 1], not its subject matter. Scene: {{palette}} digital gallery. Shot 1: {{camera}} while {{motion}}. Card planes carry {{material}} surfaces and {{texture}}. Lighting: {{light}}. Motion rhythm: {{tempo}}. Visual style: {{atmosphere}} portfolio motion design. End state: {{endpoint}}. Preserve card proportions, spacing logic and reading order; do not generate extra cards or captions.` ,
    why: 'Encodes portfolio hierarchy rather than generic camera motion.', post: 'Overlay real case-study labels after generation.'
  },
  {
    key: 'web-portal', title: 'Interface Portal Hero', category: 'Web / Hero', subcategory: 'Immersive hero', use: 'High-impact agency / tech hero', mode: 'image-to-video', aspect: '16:9', duration: 6, difficulty: 'Advanced', refs: ['environment'], sourceIds: ['docusign-awwwards','canva-2026','byteplus-guide'], tags: ['portal','immersive','web','glass','agency'],
    defaults: { subject: 'a central rectangular interface portal from [Image 1]', motion: 'the portal opens in depth and reveals one abstract brand world behind it while the surrounding page remains anchored', camera: 'one controlled orbit of roughly twenty degrees', endpoint: 'camera stops at a three-quarter view with the interface portal still perfectly rectangular' },
    template: `Core subject: {{subject}}. Scene/environment: a minimal digital void in {{palette}}. Shot 1: {{camera}} as {{motion}}. The portal surface is {{material}}; background carries {{texture}}. Lighting: {{light}}. Motion: {{tempo}}. Visual style: {{atmosphere}}, premium interactive-design film. Image quality: exact rectangular geometry, stable grid, clean edges. End state: {{endpoint}}. No invented navigation, no duplicated portal, no random typography.` ,
    why: 'Useful for agency websites where one UI element becomes the visual world.', post: 'Composite final nav/type after output.'
  },
  {
    key: 'web-cursor-constellation', title: 'Cursor Feature Constellation', category: 'Web / Hero', subcategory: 'Feature navigation', use: 'AI/product landing hero', mode: 'image-to-video', aspect: '16:9', duration: 7, difficulty: 'Intermediate', refs: ['environment'], sourceIds: ['a1-saas','signal-motion','runway-i2v'], tags: ['cursor','features','web','navigation','saas'],
    defaults: { subject: 'a dark product interface with four feature nodes from [Image 1]', motion: 'a single cursor travels through the nodes in sequence; each visited node opens one restrained micro-panel and then collapses before the cursor moves on', camera: 'locked camera', endpoint: 'all nodes return to their original state with one primary node softly highlighted' },
    template: `Core subject: {{subject}}. Scene: {{palette}} interface environment. Shot 1: {{camera}}. {{motion}}. Micro-panels use {{material}} surfaces with {{texture}}. Lighting: {{light}}. Timing: {{tempo}}. Visual style: {{atmosphere}} SaaS motion system. End state: {{endpoint}}. Keep the cursor singular, preserve node positions and avoid generating extra text or interface controls.` ,
    why: 'Creates hierarchy and proof of interaction without turning UI into floating decoration.', post: 'Swap generated labels with exported Figma text if needed.'
  },

  // SAAS / UI
  {
    key: 'saas-dashboard-macro', title: 'Dashboard Macro Focus', category: 'SaaS / UI', subcategory: 'Dashboard', use: 'Feature launch / product video', mode: 'image-to-video', aspect: '16:9', duration: 6, difficulty: 'Intermediate', refs: ['environment'], sourceIds: ['a1-saas','animazzio-2026','runway-i2v','adobe-prompt'], tags: ['saas','dashboard','macro','feature'],
    defaults: { subject: 'a polished analytics dashboard from [Image 1]', motion: 'one KPI card lifts by a few pixels, its chart animates once from baseline to final value, then the card settles', camera: 'one slow push-in', endpoint: 'the KPI card remains emphasized while the rest of the dashboard stays unchanged' },
    template: `Core subject: {{subject}}. Scene/environment: {{palette}} clean SaaS presentation. Shot 1: {{camera}} while {{motion}}. Surfaces feel like {{material}} with {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}}, premium product motion. End state: {{endpoint}}. Preserve dashboard grid, data ownership, icon locations and panel proportions; no extra widgets.` ,
    why: 'One feature, one proof, one camera move — ideal for launch videos.', post: 'Use real data/text overlays in post.'
  },
  {
    key: 'saas-ai-assistant', title: 'AI Assistant Response Flow', category: 'SaaS / UI', subcategory: 'AI interface', use: 'AI feature demo', mode: 'image-to-video', aspect: '16:9', duration: 7, difficulty: 'Intermediate', refs: ['environment'], sourceIds: ['saas-avatar','a1-saas','google-flow','byteplus-guide'], tags: ['ai','assistant','chat','ui','product'],
    defaults: { subject: 'an AI assistant panel from [Image 1]', motion: 'a prompt chip enters, the assistant status changes from thinking to complete, and one result card expands while all other interface elements remain still', camera: 'locked camera', endpoint: 'the result card is fully open and ready for the next user action' },
    template: `Core subject: {{subject}}. Scene: {{palette}} product UI. Shot 1: {{camera}}. {{motion}}. Panel surfaces: {{material}}; micro-detail: {{texture}}. Lighting: {{light}}. Rhythm: {{tempo}}. Visual style: {{atmosphere}} digital product film. End state: {{endpoint}}. Keep status changes legible through shape and motion rather than invented copy; preserve the original interface hierarchy.` ,
    why: 'Communicates AI state progression without relying on generated prose.', post: 'Composite final prompt/result text from Figma.'
  },
  {
    key: 'saas-data-transform', title: 'Data-to-Insight Transformation', category: 'SaaS / UI', subcategory: 'Data visualization', use: 'Feature explanation / case study', mode: 'text-to-video', aspect: '16:9', duration: 8, difficulty: 'Advanced', refs: [], sourceIds: ['signal-motion','runway-prompt','adobe-prompt'], tags: ['data','chart','saas','insight','3d'],
    defaults: { subject: 'a field of raw rectangular data cells', motion: 'cells align into rows, rows compress into a single line chart, and the chart resolves into one clear insight card', camera: 'one top-down crane-like descent', endpoint: 'one insight card remains centered with the source data arranged as a quiet grid behind it' },
    template: `Core subject: {{subject}}. Scene/environment: abstract analytics space in {{palette}}. Shot 1: {{camera}} as {{motion}}. Objects use {{material}} with {{texture}}. Lighting: {{light}}. Motion rhythm: {{tempo}}. Visual style: {{atmosphere}} information design with disciplined geometry. Image quality: sharp forms, coherent alignment, stable spatial logic. End state: {{endpoint}}. No random numbers or extra charts.` ,
    why: 'A visual metaphor for product value that can sit between real UI shots.', post: 'Replace final card copy with actual product message.'
  },
  {
    key: 'saas-device-sync', title: 'Multi-Device Sync', category: 'SaaS / UI', subcategory: 'Cross-platform', use: 'App ecosystem launch', mode: 'reference-to-video', aspect: '16:9', duration: 8, difficulty: 'Advanced', refs: ['environment','environment'], sourceIds: ['a1-saas','runway-ad','adobe-prompt'], tags: ['device','sync','mobile','desktop','app'],
    defaults: { subject: 'desktop and mobile product screens from [Image 1] and [Image 2]', motion: 'one selected object leaves the desktop canvas as a glowing tile, crosses the space once and lands in the matching mobile position', camera: 'one slow lateral track', endpoint: 'desktop and mobile settle side by side showing the same synchronized object state' },
    template: `Core subjects: [Image 1] desktop UI and [Image 2] mobile UI. Scene: {{palette}} presentation stage. Shot 1: {{camera}} while {{motion}}. Devices and panels use {{material}} with {{texture}}. Lighting: {{light}}. Rhythm: {{tempo}}. Visual style: {{atmosphere}} cross-platform launch film. End state: {{endpoint}}. Preserve each UI layout and device aspect ratio; do not invent additional screens.` ,
    why: 'Makes cross-platform value visually obvious without generic device spins.', post: 'Use actual screen recordings for final fine text if necessary.'
  },

  // BRAND / LOGO
  {
    key: 'brand-material-logo', title: 'Material Logo Reveal', category: 'Brand / Logo', subcategory: 'Logo reveal', use: 'Brand film / identity launch', mode: 'image-to-video', aspect: '16:9', duration: 6, difficulty: 'Intermediate', refs: ['logo'], sourceIds: ['measure-motion','hybrid-logo','byteplus-guide'], tags: ['logo','brand','material','reveal'],
    defaults: { subject: 'the exact logo mark from [Image 1]', motion: 'the mark emerges from one continuous sheet of material, finishes forming once, then remains perfectly still', camera: 'one slow push-in', endpoint: 'the untouched logo rests centered with clean negative space around it' },
    template: `Core subject: {{subject}}. Scene: minimal field in {{palette}}. Shot 1: {{camera}} while {{motion}}. Material: {{material}}, carrying {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} identity motion. End state: {{endpoint}}. Preserve exact logo proportions and silhouette; do not invent letters, extra marks or alternate logo geometry.` ,
    why: 'Treats logo as a controlled source asset, not a model hallucination.', post: 'Composite vector logo over generated material pass for absolute fidelity.'
  },
  {
    key: 'brand-rebrand-transition', title: 'Old-to-New Rebrand Transition', category: 'Brand / Logo', subcategory: 'Rebrand', use: 'Identity case study', mode: 'reference-to-video', aspect: '16:9', duration: 8, difficulty: 'Advanced', refs: ['logo','logo'], sourceIds: ['digital-rush','docusign-awwwards','measure-motion'], tags: ['rebrand','logo','transition','case-study'],
    defaults: { subject: 'old identity from [Image 1] and new identity from [Image 2]', motion: 'the old mark decomposes into its underlying grid modules; the same modules reorder once into the new mark without introducing new shapes', camera: 'locked camera', endpoint: 'the new mark holds cleanly at center with its new spacing system visible for one beat' },
    template: `Core subjects: {{subject}}. Scene: {{palette}} identity-system canvas. Shot 1: {{camera}}. {{motion}}. Grid modules use {{material}} with {{texture}}. Lighting: {{light}}. Rhythm: {{tempo}}. Visual style: {{atmosphere}} rebrand motion case study. End state: {{endpoint}}. Preserve both source identities and make the transformation legible as one continuous design-system evolution.` ,
    why: 'Explains the logic of a rebrand rather than doing a random morph.', post: 'Vector replace both endpoint logos.'
  },
  {
    key: 'brand-system-tiles', title: 'Brand System Tile Choreography', category: 'Brand / Logo', subcategory: 'Identity system', use: 'Brand guidelines / case study hero', mode: 'text-to-video', aspect: '16:9', duration: 8, difficulty: 'Intermediate', refs: [], sourceIds: ['docusign-awwwards','hyperbolic-motion','signal-motion'], tags: ['brand-system','tiles','guidelines','motion'],
    defaults: { subject: 'a modular grid of brand tiles containing color, shape, image and icon blocks', motion: 'tiles reorganize through four clean layout states, with only one family moving at a time', camera: 'locked camera', endpoint: 'all tiles snap into one final balanced identity-system composition' },
    template: `Core subject: {{subject}}. Scene/environment: {{palette}} brand canvas. Shot 1: {{camera}} while {{motion}}. Surfaces use {{material}} and {{texture}}. Lighting: {{light}}. Motion rhythm: {{tempo}}. Visual style: {{atmosphere}} modern identity guidelines brought to life. End state: {{endpoint}}. Maintain consistent grid logic and avoid decorative elements unrelated to the system.` ,
    why: 'Turns brand guidelines into an animated system useful for case studies.', post: 'Drop in final brand images/type in AE.'
  },
  {
    key: 'brand-particle-geometry', title: 'Geometric Mark Assembly', category: 'Brand / Logo', subcategory: 'Symbol formation', use: 'Logo sting / event opener', mode: 'image-to-video', aspect: '1:1', duration: 5, difficulty: 'Intermediate', refs: ['logo'], sourceIds: ['measure-motion','hybrid-logo','runway-camera'], tags: ['symbol','particles','geometry','sting'],
    defaults: { subject: 'the exact symbol silhouette from [Image 1]', motion: 'small geometric fragments move along short straight paths and lock into the symbol from outside to inside', camera: 'locked camera', endpoint: 'all fragments become one uninterrupted exact symbol' },
    template: `Core subject: {{subject}}. Scene: {{palette}} square motion field. Shot 1: {{camera}}. {{motion}}. Fragments use {{material}} with {{texture}}. Lighting: {{light}}. Timing: {{tempo}}. Visual style: {{atmosphere}} compact brand sting. End state: {{endpoint}}. Keep fragment count controlled, preserve exact silhouette and do not generate extra lettering.` ,
    why: 'A compact social/logo animation that retains a clean endpoint.', post: 'Use generated pass as matte/texture under vector logo.'
  },

  // KINETIC TYPE
  {
    key: 'type-variable-stretch', title: 'Variable Type Stretch', category: 'Kinetic Type', subcategory: 'Variable typography', use: 'Brand manifesto / campaign title', mode: 'text-to-video', aspect: '16:9', duration: 6, difficulty: 'Advanced', refs: [], sourceIds: ['measure-motion','docusign-awwwards','canva-2026'], tags: ['type','variable-font','kinetic','manifesto'],
    defaults: { subject: 'one oversized word set in a heavy variable sans-serif', motion: 'letterforms widen together, compress vertically once, then return to their original proportions in a controlled elastic motion', camera: 'locked camera', endpoint: 'the word returns to its clean initial proportions centered in frame' },
    template: `Core subject: {{subject}}. Scene: {{palette}} typographic stage. Shot 1: {{camera}} while {{motion}}. Letter surfaces use {{material}} with {{texture}}. Lighting: {{light}}. Rhythm: {{tempo}}. Visual style: {{atmosphere}} kinetic identity motion. Image quality: clean letter edges and consistent baseline. End state: {{endpoint}}. Keep one word only; no extra copy or random glyphs.` ,
    why: 'Uses typography as motion behavior rather than decoration.', post: 'For exact wordforms, replace with animated vector type and use generation as texture/reference.'
  },
  {
    key: 'type-architecture', title: 'Typography as Architecture', category: 'Kinetic Type', subcategory: 'Spatial type', use: 'Event opener / portfolio hero', mode: 'text-to-video', aspect: '16:9', duration: 7, difficulty: 'Advanced', refs: [], sourceIds: ['docusign-awwwards','canva-2026','runway-camera'], tags: ['type','3d','architecture','hero'],
    defaults: { subject: 'three monumental letterforms forming a navigable spatial corridor', motion: 'soft light travels across the letter surfaces while the corridor subtly opens through perspective', camera: 'one smooth tracking move forward', endpoint: 'camera exits the corridor into a clean field carrying the same typographic rhythm' },
    template: `Core subject: {{subject}}. Environment: architectural void in {{palette}}. Shot 1: {{camera}} while {{motion}}. Letter structures use {{material}} and {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} editorial spatial typography. End state: {{endpoint}}. Preserve coherent letter geometry and do not introduce additional words.` ,
    why: 'Useful when a case study needs a strong typographic hero without literal UI.', post: 'Build final title in 3D/AE if exact typography is required.'
  },
  {
    key: 'type-editorial-collision', title: 'Editorial Word Collision', category: 'Kinetic Type', subcategory: 'Editorial', use: 'Fashion / culture campaign title', mode: 'text-to-video', aspect: '4:5', duration: 6, difficulty: 'Intermediate', refs: [], sourceIds: ['canva-2026','measure-motion'], tags: ['editorial','type','collision','social'],
    defaults: { subject: 'two oversized typographic blocks occupying opposite sides of frame', motion: 'the blocks slide toward each other, overlap for one beat through transparency, then settle into a new asymmetrical composition', camera: 'locked camera', endpoint: 'the overlapping composition holds with clear negative space for brand copy in post' },
    template: `Core subject: {{subject}}. Scene: {{palette}} editorial poster field. Shot 1: {{camera}}. {{motion}}. Type blocks carry {{material}} surfaces and {{texture}}. Lighting: {{light}}. Rhythm: {{tempo}}. Visual style: {{atmosphere}} fashion editorial motion. End state: {{endpoint}}. Do not generate additional words or decorative captions.` ,
    why: 'A useful moving-poster pattern for social and campaign cases.', post: 'Composite real type on top of the generated motion plate.'
  },
  {
    key: 'type-interface-ticker', title: 'Interface Ticker Typography', category: 'Kinetic Type', subcategory: 'UI typography', use: 'Tech launch / web hero', mode: 'text-to-video', aspect: '16:9', duration: 7, difficulty: 'Intermediate', refs: [], sourceIds: ['canva-2026','a1-saas','animazzio-2026'], tags: ['ticker','ui','retro-tech','type'],
    defaults: { subject: 'a grid of short typographic status labels and numeric-like blocks', motion: 'rows advance one step at a time like a mechanical information board while one highlighted row remains fixed', camera: 'locked camera', endpoint: 'all rows stop simultaneously and the highlighted row becomes the visual anchor' },
    template: `Core subject: {{subject}}. Scene: {{palette}} data-display interface. Shot 1: {{camera}} while {{motion}}. Elements use {{material}} and {{texture}}. Lighting: {{light}}. Timing: {{tempo}}. Visual style: {{atmosphere}} retro-tech information design. End state: {{endpoint}}. Treat labels as graphic blocks rather than generating legible random copy.` ,
    why: 'Captures the 2026 retro-tech / UI-as-storytelling signal.', post: 'Replace blocks with real labels in AE/Figma.'
  },

  // PRODUCT / PACKSHOT
  {
    key: 'product-pedestal-orbit', title: 'Pedestal Product Orbit', category: 'Product / Packshot', subcategory: 'Hero packshot', use: 'Launch hero / ecommerce film', mode: 'image-to-video', aspect: '16:9', duration: 6, difficulty: 'Intermediate', refs: ['product'], sourceIds: ['runway-product','higgsfield-ads','adidas-ai','byteplus-guide'], tags: ['product','orbit','packshot','launch'],
    defaults: { subject: 'the exact product from [Image 1] on a low monolithic pedestal', motion: 'the product remains physically still while one highlight travels slowly across its material surface', camera: 'one twenty-degree clockwise orbit', endpoint: 'camera stops at a premium three-quarter hero angle' },
    template: `Core subject: {{subject}}. Scene: {{palette}} studio stage. Shot 1: {{camera}} while {{motion}}. Pedestal and environment use {{material}} with {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} premium commercial photography. Image quality: stable product geometry, fine material detail, realistic contact shadow. End state: {{endpoint}}. Preserve product proportions, construction and brand colors.` ,
    why: 'One of the most reusable commercial product patterns.', post: 'Composite exact label/logo if small print matters.'
  },
  {
    key: 'product-macro-material', title: 'Macro Material Inspection', category: 'Product / Packshot', subcategory: 'Macro detail', use: 'Luxury product / case study detail', mode: 'image-to-video', aspect: '16:9', duration: 5, difficulty: 'Intermediate', refs: ['product'], sourceIds: ['runway-camera','runway-product','adidas-ai'], tags: ['macro','material','product','detail'],
    defaults: { subject: 'a tiny material detail of the exact product from [Image 1]', motion: 'condensation, fine dust or fabric fibres react subtly to air while the product itself remains rigid', camera: 'one slow macro lateral track', endpoint: 'the shot resolves on one identifiable design detail that proves material quality' },
    template: `Core subject: {{subject}}. Environment: controlled macro studio in {{palette}}. Shot 1: {{camera}} while {{motion}}. Surface behavior emphasizes {{material}} and {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} tactile luxury commercial. End state: {{endpoint}}. Preserve original design detail and avoid melting or reshaping product geometry.` ,
    why: 'Macro shots provide premium perceived value without requiring complex narrative.', post: 'Use as B-roll between wider product shots.'
  },
  {
    key: 'product-assembly', title: 'Exploded Assembly Hero', category: 'Product / Packshot', subcategory: 'Exploded view', use: 'Technology / industrial product reveal', mode: 'image-to-video', aspect: '16:9', duration: 8, difficulty: 'Advanced', refs: ['product'], sourceIds: ['runway-product','signal-motion','hybrid-logo'], tags: ['assembly','exploded-view','product','industrial'],
    defaults: { subject: 'the exact product from [Image 1] represented as a small number of major construction layers', motion: 'layers separate along one axis, hold long enough to read, then return along the same paths into the intact product', camera: 'locked camera', endpoint: 'the fully assembled product holds centered with no missing parts' },
    template: `Core subject: {{subject}}. Scene: {{palette}} technical presentation field. Shot 1: {{camera}}. {{motion}}. Components retain {{material}} surfaces and {{texture}}. Lighting: {{light}}. Timing: {{tempo}}. Visual style: {{atmosphere}} industrial design film. End state: {{endpoint}}. Keep component count controlled, preserve assembly logic and do not invent mechanisms that are not visible in the source.` ,
    why: 'Useful for industrial / hardware cases when physical construction is part of the story.', post: 'For exact engineering truth, drive from a 3D greybox or real CAD render.'
  },
  {
    key: 'product-world-reveal', title: 'Product-to-World Reveal', category: 'Product / Packshot', subcategory: 'Environmental hero', use: 'Brand campaign / launch film', mode: 'reference-to-video', aspect: '16:9', duration: 8, difficulty: 'Advanced', refs: ['product','environment'], sourceIds: ['adidas-ai','higgsfield-marketing','runway-ad'], tags: ['product','environment','campaign','hero'],
    defaults: { subject: 'the exact product from [Image 1] placed inside the visual world of [Image 2]', motion: 'environmental elements move gently around the product while the product remains the stable visual anchor', camera: 'one slow pull-out', endpoint: 'the wider environment is revealed but the product still dominates through composition and light' },
    template: `Core subject: {{subject}}. Scene: {{palette}} campaign world derived from [Image 2]. Shot 1: {{camera}} while {{motion}}. Surfaces use {{material}} with {{texture}}. Lighting: {{light}}. Rhythm: {{tempo}}. Visual style: {{atmosphere}} premium brand film. End state: {{endpoint}}. Preserve exact product identity and avoid replacing it with a generic approximation.` ,
    why: 'Connects packshot fidelity to campaign atmosphere.', post: 'Great as transition from packshot into lifestyle/campaign sequence.'
  },

  // PACKAGING / RETAIL
  {
    key: 'packaging-unfold', title: 'Packaging Unfold', category: 'Packaging / Retail', subcategory: 'Structural packaging', use: 'Packaging case study', mode: 'image-to-video', aspect: '16:9', duration: 7, difficulty: 'Advanced', refs: ['product'], sourceIds: ['runway-product','signal-motion','byteplus-guide'], tags: ['packaging','box','unfold','case-study'],
    defaults: { subject: 'the exact package from [Image 1]', motion: 'the package opens along real fold lines into a flat dieline-like arrangement, pauses, then folds back into the original volume', camera: 'one top-down view with a locked camera', endpoint: 'the package returns fully closed and aligned' },
    template: `Core subject: {{subject}}. Scene: {{palette}} design-table environment. Shot 1: {{camera}}. {{motion}}. Package material reads as {{material}} with {{texture}}. Lighting: {{light}}. Timing: {{tempo}}. Visual style: {{atmosphere}} packaging design presentation. End state: {{endpoint}}. Preserve printed panel relationships, proportions and fold logic; do not invent extra flaps.` ,
    why: 'Turns packaging structure itself into motion content.', post: 'Overlay exact print artwork if labels deform.'
  },
  {
    key: 'packaging-label-wrap', title: 'Label Wrap Detail', category: 'Packaging / Retail', subcategory: 'Label / print', use: 'Beverage / cosmetics case study', mode: 'image-to-video', aspect: '9:16', duration: 5, difficulty: 'Intermediate', refs: ['product'], sourceIds: ['higgsfield-ads','runway-product','adobe-prompt'], tags: ['label','packaging','bottle','print'],
    defaults: { subject: 'the exact package from [Image 1] with emphasis on the label edge and substrate', motion: 'one controlled specular highlight travels around the label curvature while tiny material texture becomes visible', camera: 'one slow vertical tilt upward', endpoint: 'camera lands on the primary brand area without changing its geometry' },
    template: `Core subject: {{subject}}. Scene: {{palette}} vertical product studio. Shot 1: {{camera}} while {{motion}}. Packaging surface is {{material}} with {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} premium retail macro. End state: {{endpoint}}. Preserve package shape and printed-area boundaries; generated micro-copy is not trusted for final delivery.` ,
    why: 'A vertical social-ready packaging detail shot.', post: 'Replace final label artwork if required.'
  },
  {
    key: 'retail-shelf-select', title: 'Shelf-to-Hero Selection', category: 'Packaging / Retail', subcategory: 'Retail', use: 'Retail / FMCG social ad', mode: 'reference-to-video', aspect: '9:16', duration: 7, difficulty: 'Advanced', refs: ['product','environment'], sourceIds: ['higgsfield-marketing','higgsfield-ads','runway-ad'], tags: ['retail','shelf','fmcg','social'],
    defaults: { subject: 'a retail shelf scene from [Image 2] containing the exact product from [Image 1]', motion: 'surrounding shelf depth softens while the target product advances a few centimeters toward camera and then stops', camera: 'one slow push-in', endpoint: 'the product is isolated by depth and light while the shelf context remains recognizable' },
    template: `Core subject: {{subject}}. Environment: {{palette}} retail atmosphere. Shot 1: {{camera}} while {{motion}}. Surfaces use {{material}} and {{texture}}. Lighting: {{light}}. Timing: {{tempo}}. Visual style: {{atmosphere}} modern retail commercial. End state: {{endpoint}}. Keep one target product only and preserve its package identity; do not multiply SKUs.` ,
    why: 'Simple visual selection metaphor for retail ads.', post: 'Use exact price/offer graphics in post.'
  },
  {
    key: 'packaging-material-transform', title: 'Material Transformation Pack', category: 'Packaging / Retail', subcategory: 'Sustainability', use: 'Sustainability / materials story', mode: 'image-to-video', aspect: '16:9', duration: 8, difficulty: 'Advanced', refs: ['product'], sourceIds: ['canva-2026','runway-product','signal-motion'], tags: ['sustainability','material','packaging','transform'],
    defaults: { subject: 'the exact package from [Image 1]', motion: 'the outer surface locally transitions from raw fibre texture to finished package material without changing package geometry', camera: 'one slow lateral track', endpoint: 'the finished package holds while a narrow strip still reveals the raw material origin' },
    template: `Core subject: {{subject}}. Scene: {{palette}} material laboratory. Shot 1: {{camera}} while {{motion}}. Material focus: {{material}} and {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} design-material storytelling. End state: {{endpoint}}. Preserve package form and keep the transformation physically coherent, not liquid-melting unless the actual material supports it.` ,
    why: 'Turns sustainability/material claims into a visual system.', post: 'Add verified material facts and labels in post.'
  },

  // 3D / MATERIALS
  {
    key: 'material-glass-blob', title: 'Liquid Glass Interface Object', category: '3D / Materials', subcategory: 'Glass', use: 'Tech brand hero / abstract transition', mode: 'text-to-video', aspect: '16:9', duration: 6, difficulty: 'Intermediate', refs: [], sourceIds: ['canva-2026','docusign-awwwards','signal-motion'], tags: ['glass','blob','3d','tech'],
    defaults: { subject: 'one smooth translucent volume with an embedded rectangular interface plane', motion: 'the outer volume breathes once through a subtle deformation while the internal plane remains rigid and readable', camera: 'one slow orbit', endpoint: 'the glass volume returns to a stable compact form around the interface plane' },
    template: `Core subject: {{subject}}. Scene: {{palette}} minimal space. Shot 1: {{camera}} while {{motion}}. Material: {{material}} with {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} contemporary CGI design. Image quality: crisp refraction, believable thickness, stable internal geometry. End state: {{endpoint}}.` ,
    why: 'Useful as a tech-brand visual device without resorting to generic sci-fi particles.', post: 'Composite actual UI plane if needed.'
  },
  {
    key: 'material-chrome-ribbon', title: 'Chrome Ribbon System', category: '3D / Materials', subcategory: 'Metal', use: 'Brand transition / title sequence', mode: 'text-to-video', aspect: '16:9', duration: 7, difficulty: 'Intermediate', refs: [], sourceIds: ['hyperbolic-motion','canva-2026','measure-motion'], tags: ['chrome','ribbon','brand','transition'],
    defaults: { subject: 'one continuous metallic ribbon crossing the frame', motion: 'the ribbon performs one broad controlled loop and briefly frames an empty central content area before continuing out of frame', camera: 'locked camera', endpoint: 'the content area remains clean for a logo or title composite' },
    template: `Core subject: {{subject}}. Environment: {{palette}} graphic stage. Shot 1: {{camera}} while {{motion}}. Ribbon material: {{material}} with {{texture}}. Lighting: {{light}}. Timing: {{tempo}}. Visual style: {{atmosphere}} brand motion. End state: {{endpoint}}. Keep exactly one continuous ribbon and preserve a clean compositing zone.` ,
    why: 'A reusable generative transition asset for brand films.', post: 'Use the clean center for real logo/type.'
  },
  {
    key: 'material-inflated-icon', title: 'Inflated Icon Motion', category: '3D / Materials', subcategory: 'Soft body', use: '3D icon / website asset', mode: 'image-to-video', aspect: '1:1', duration: 5, difficulty: 'Intermediate', refs: ['product'], sourceIds: ['canva-2026','signal-motion','animazzio-2026'], tags: ['icon','soft-body','inflated','web'],
    defaults: { subject: 'the exact simple icon silhouette from [Image 1]', motion: 'the icon inflates smoothly from almost flat to a soft three-dimensional volume, overshoots slightly, then settles', camera: 'locked camera', endpoint: 'the inflated icon holds centered and fully recognizable' },
    template: `Core subject: {{subject}}. Scene: {{palette}} square asset stage. Shot 1: {{camera}}. {{motion}}. Surface: {{material}} with {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} tactile 3D iconography. End state: {{endpoint}}. Preserve icon silhouette and avoid additional symbols.` ,
    why: 'Directly useful for Awwwards-style site assets, social stickers and brand systems.', post: 'Export as isolated asset; remove background in compositing.'
  },
  {
    key: 'material-clay-grid', title: 'Soft Modular Grid', category: '3D / Materials', subcategory: 'Modular forms', use: 'Brand system / explainer transition', mode: 'text-to-video', aspect: '16:9', duration: 7, difficulty: 'Intermediate', refs: [], sourceIds: ['signal-motion','canva-2026','hyperbolic-motion'], tags: ['grid','clay','modules','3d'],
    defaults: { subject: 'a four-by-four grid of soft geometric modules', motion: 'one diagonal wave compresses the modules and returns them to equal height, then one central module remains slightly elevated', camera: 'one top-down view with a locked camera', endpoint: 'the grid is orderly with only the central module emphasized' },
    template: `Core subject: {{subject}}. Scene: {{palette}} abstract system field. Shot 1: {{camera}} while {{motion}}. Modules use {{material}} and {{texture}}. Lighting: {{light}}. Timing: {{tempo}}. Visual style: {{atmosphere}} tactile information design. End state: {{endpoint}}. Maintain exact grid count and spacing.` ,
    why: 'A clean metaphor for systems, components, modular brands and product architecture.', post: 'Can bridge between UI sections or brand chapters.'
  },

  // EDITORIAL / FASHION
  {
    key: 'fashion-freeze-motion', title: 'Editorial Freeze-to-Motion', category: 'Editorial / Fashion', subcategory: 'Campaign film', use: 'Fashion / culture campaign', mode: 'image-to-video', aspect: '9:16', duration: 6, difficulty: 'Intermediate', refs: ['identity'], sourceIds: ['google-flow','canva-2026','adobe-prompt'], tags: ['fashion','editorial','portrait','social'],
    defaults: { subject: 'the styled editorial subject from [Image 1]', motion: 'the subject remains still for a beat, then turns the head slightly and lets one garment edge move naturally with air', camera: 'one slow pull-out', endpoint: 'the subject holds a wider editorial pose with unchanged styling' },
    template: `Core subject: {{subject}}. Environment: {{palette}} editorial set. Shot 1: {{camera}} while {{motion}}. Wardrobe/material response: {{material}} with {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} fashion film. Image quality: stable face, hands and wardrobe construction. End state: {{endpoint}}. Preserve exact styling and do not add accessories.` ,
    why: 'Small, believable motion protects fashion styling better than over-choreography.', post: 'Add campaign typography separately.'
  },
  {
    key: 'fashion-fabric-macro', title: 'Fabric Motion Macro', category: 'Editorial / Fashion', subcategory: 'Material detail', use: 'Fashion detail / product story', mode: 'image-to-video', aspect: '16:9', duration: 5, difficulty: 'Intermediate', refs: ['product'], sourceIds: ['adobe-prompt','runway-camera','canva-2026'], tags: ['fabric','macro','fashion','texture'],
    defaults: { subject: 'the exact fabric or garment detail from [Image 1]', motion: 'a soft air current travels once across the surface, revealing weave depth and natural fold response', camera: 'one slow macro push-in', endpoint: 'camera settles on one seam or construction detail' },
    template: `Core subject: {{subject}}. Scene: {{palette}} macro editorial space. Shot 1: {{camera}} while {{motion}}. Fabric reads through {{material}} and {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} tactile fashion photography. End state: {{endpoint}}. Preserve weave, seam and garment construction.` ,
    why: 'Material-first motion is useful for fashion, furniture and textile case studies.', post: 'Use as transition/B-roll in a longer campaign edit.'
  },
  {
    key: 'fashion-collage', title: 'Editorial Collage Layers', category: 'Editorial / Fashion', subcategory: 'Collage', use: 'Culture / fashion social identity', mode: 'reference-to-video', aspect: '4:5', duration: 7, difficulty: 'Advanced', refs: ['style','identity'], sourceIds: ['canva-2026','google-flow','docusign-awwwards'], tags: ['collage','editorial','scrapbook','fashion'],
    defaults: { subject: 'the subject from [Image 2] inside the collage language of [Image 1]', motion: 'three paper/image layers slide independently into alignment while the subject cutout remains the visual anchor', camera: 'locked camera', endpoint: 'the layers form one deliberate poster composition with space for real copy' },
    template: `Core subject: {{subject}}. Scene: {{palette}} collage field. Shot 1: {{camera}} while {{motion}}. Layer surfaces use {{material}} and {{texture}}. Lighting: {{light}}. Timing: {{tempo}}. Visual style: {{atmosphere}} editorial collage. End state: {{endpoint}}. Keep layer count controlled and avoid generating random headlines.` ,
    why: 'Maps 2026 DIY/Notes-App/texture signals into a professional motion system.', post: 'Composite real type and brand marks.'
  },
  {
    key: 'fashion-silhouette-light', title: 'Silhouette Light Reveal', category: 'Editorial / Fashion', subcategory: 'Lighting', use: 'Beauty / fashion hero', mode: 'image-to-video', aspect: '9:16', duration: 6, difficulty: 'Intermediate', refs: ['identity'], sourceIds: ['adobe-prompt','runway-camera','google-flow'], tags: ['silhouette','light','beauty','fashion'],
    defaults: { subject: 'the exact styled subject from [Image 1] in profile', motion: 'the subject remains almost still while one narrow light band travels from shoulder to face and stops at the eye line', camera: 'locked camera', endpoint: 'the subject is partially revealed with one controlled highlight defining the face and garment edge' },
    template: `Core subject: {{subject}}. Environment: {{palette}} dark studio. Shot 1: {{camera}} while {{motion}}. Wardrobe/material response: {{material}} and {{texture}}. Lighting: {{light}} shaped into one moving band. Tempo: {{tempo}}. Visual style: {{atmosphere}} luxury editorial film. End state: {{endpoint}}. Preserve identity, hairstyle and wardrobe.` ,
    why: 'High perceived production value from lighting motion rather than body complexity.', post: 'Ideal as a hero loop or transition.'
  },

  // DATA / ABSTRACT TECH
  {
    key: 'tech-data-tunnel', title: 'Data Tunnel', category: 'Data / Abstract Tech', subcategory: 'Data spatialization', use: 'AI / cloud / infrastructure hero', mode: 'text-to-video', aspect: '16:9', duration: 7, difficulty: 'Advanced', refs: [], sourceIds: ['hyperbolic-motion','signal-motion','runway-camera'], tags: ['data','tunnel','cloud','ai'],
    defaults: { subject: 'a tunnel built from repeated rectangular data frames and sparse signal points', motion: 'frames pulse once in sequence from near to far, creating a single readable propagation wave', camera: 'one smooth forward tracking move', endpoint: 'camera arrives at one calm central node representing the system output' },
    template: `Core subject: {{subject}}. Environment: {{palette}} computational space. Shot 1: {{camera}} while {{motion}}. Geometry uses {{material}} and {{texture}}. Lighting: {{light}}. Rhythm: {{tempo}}. Visual style: {{atmosphere}} abstract technology branding. End state: {{endpoint}}. Keep geometry disciplined, avoid random code or illegible data labels.` ,
    why: 'A usable AI/cloud metaphor that can remain brand-specific through palette/material.', post: 'Add exact metrics/type afterward.'
  },
  {
    key: 'tech-network-nodes', title: 'Network Node Activation', category: 'Data / Abstract Tech', subcategory: 'Network', use: 'Platform / infrastructure story', mode: 'text-to-video', aspect: '16:9', duration: 6, difficulty: 'Intermediate', refs: [], sourceIds: ['hyperbolic-motion','signal-motion','seedance-paper'], tags: ['network','nodes','platform','ai'],
    defaults: { subject: 'a sparse three-dimensional network of twelve nodes connected by clean lines', motion: 'one signal activates three nodes in a clear path; adjacent nodes remain quiet', camera: 'one slow orbit', endpoint: 'the three activated nodes form a recognizable triangular service path' },
    template: `Core subject: {{subject}}. Scene: {{palette}} infrastructure field. Shot 1: {{camera}} while {{motion}}. Nodes and lines use {{material}} with {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} technical brand motion. End state: {{endpoint}}. Preserve node count and connection logic; no random text.` ,
    why: 'Specific network behavior reads more credibly than “futuristic data particles”.', post: 'Map nodes to real system labels in post.'
  },
  {
    key: 'tech-waveform', title: 'Signal Waveform Object', category: 'Data / Abstract Tech', subcategory: 'Signal', use: 'Audio / AI / telecom identity', mode: 'reference-to-video', aspect: '16:9', duration: 6, difficulty: 'Intermediate', refs: ['audio'], sourceIds: ['byteplus-guide','hyperbolic-motion','runway-prompt'], tags: ['audio','waveform','signal','identity'],
    defaults: { subject: 'one continuous three-dimensional waveform responding to [Audio 1]', motion: 'the waveform changes amplitude with the broad rhythm of the audio while maintaining one continuous spatial path', camera: 'one slow lateral track', endpoint: 'the waveform settles into a simple brand-like signature shape at the audio tail' },
    template: `Core subject: {{subject}}. Environment: {{palette}} abstract signal space. Shot 1: {{camera}} while {{motion}}. Surface: {{material}} with {{texture}}. Lighting: {{light}}. Motion follows {{tempo}}. Visual style: {{atmosphere}} audiovisual identity. End state: {{endpoint}}. Keep one waveform only and avoid literal equalizer clutter.` ,
    why: 'Uses audio as a true functional reference instead of generic soundtrack mood.', post: 'Great for sonic-branding and event films.'
  },
  {
    key: 'tech-compute-landscape', title: 'Compute Landscape', category: 'Data / Abstract Tech', subcategory: 'AI compute', use: 'AI infrastructure / keynote visual', mode: 'text-to-video', aspect: '21:9', duration: 8, difficulty: 'Advanced', refs: [], sourceIds: ['hyperbolic-motion','google-flow','canva-2026'], tags: ['compute','landscape','ai','keynote'],
    defaults: { subject: 'a vast abstract landscape made from low rectangular compute blocks arranged like terrain', motion: 'a soft illumination front travels once across the terrain and reveals one elevated processing cluster', camera: 'one slow aerial pull-out', endpoint: 'the full system topology is visible as a calm designed landscape' },
    template: `Core subject: {{subject}}. Scene: {{palette}} computational horizon. Shot 1: {{camera}} while {{motion}}. Blocks use {{material}} and {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} keynote-scale technology art direction. End state: {{endpoint}}. Keep the topology ordered and avoid generic city buildings or random circuitry.` ,
    why: 'Abstract enough for brand use but structured enough to communicate scale.', post: 'Overlay real architecture callouts later.'
  },

  // CASE STUDY / PORTFOLIO
  {
    key: 'case-mockup-flythrough', title: 'Case Study Mockup Flythrough', category: 'Case Study / Portfolio', subcategory: 'Mockups', use: 'Behance / agency case film', mode: 'reference-to-video', aspect: '16:9', duration: 8, difficulty: 'Advanced', refs: ['environment','environment'], sourceIds: ['animazzio-2026','digital-rush','bezier-awwwards'], tags: ['case-study','mockup','portfolio','agency'],
    defaults: { subject: 'two polished project mockups from [Image 1] and [Image 2] arranged on one continuous presentation surface', motion: 'the first mockup slides away as the second occupies the exact focal position through one clean spatial handoff', camera: 'one slow forward tracking move', endpoint: 'the second mockup holds full visual priority with room for a case-study title' },
    template: `Core subjects: {{subject}}. Scene: {{palette}} agency presentation environment. Shot 1: {{camera}} while {{motion}}. Presentation surfaces use {{material}} and {{texture}}. Lighting: {{light}}. Rhythm: {{tempo}}. Visual style: {{atmosphere}} award-oriented case-study film. End state: {{endpoint}}. Preserve mockup geometry and do not invent additional screens.` ,
    why: 'Designed specifically for Behance/Awwwards case presentation rather than product advertising.', post: 'Overlay project title and credits in post.'
  },
  {
    key: 'case-before-after', title: 'Before / After Identity Split', category: 'Case Study / Portfolio', subcategory: 'Transformation', use: 'Rebrand comparison', mode: 'reference-to-video', aspect: '16:9', duration: 7, difficulty: 'Intermediate', refs: ['environment','environment'], sourceIds: ['digital-rush','docusign-awwwards'], tags: ['before-after','rebrand','case-study','split'],
    defaults: { subject: 'old design system from [Image 1] and new design system from [Image 2]', motion: 'a single vertical boundary travels across frame replacing the old system with the new one while maintaining matching content positions', camera: 'locked camera', endpoint: 'the new system fills the frame and the comparison boundary disappears' },
    template: `Core subjects: {{subject}}. Scene: {{palette}} comparison canvas. Shot 1: {{camera}} while {{motion}}. Surfaces use {{material}} and {{texture}}. Lighting: {{light}}. Timing: {{tempo}}. Visual style: {{atmosphere}} design case-study transition. End state: {{endpoint}}. Preserve one-to-one positional correspondence so the redesign difference remains legible.` ,
    why: 'A clearer rebrand proof than arbitrary morph effects.', post: 'Use real screens/brand assets at endpoints.'
  },
  {
    key: 'case-device-ui', title: 'Device UI Case Sequence', category: 'Case Study / Portfolio', subcategory: 'Product design', use: 'UX/UI portfolio video', mode: 'reference-to-video', aspect: '16:9', duration: 8, difficulty: 'Advanced', refs: ['environment','environment'], sourceIds: ['a1-saas','saas-avatar','animazzio-2026'], tags: ['ui','device','portfolio','ux'],
    defaults: { subject: 'two sequential product screens from [Image 1] and [Image 2] presented inside one device frame', motion: 'the interface performs one clear user action on the first screen, then transitions into the second screen through a native navigation gesture', camera: 'one subtle push-in', endpoint: 'the second screen holds cleanly with device perspective unchanged' },
    template: `Core subject: {{subject}}. Environment: {{palette}} product-design presentation stage. Shot 1: {{camera}} while {{motion}}. Device uses {{material}} and {{texture}}. Lighting: {{light}}. Rhythm: {{tempo}}. Visual style: {{atmosphere}} UX case-study motion. End state: {{endpoint}}. Keep device geometry, navigation hierarchy and screen ownership stable.` ,
    why: 'Useful for product designers who want motion without rebuilding a full AE sequence first.', post: 'For exact UI, composite screen captures through tracked device mattes.'
  },
  {
    key: 'case-components', title: 'Design System Component Choreography', category: 'Case Study / Portfolio', subcategory: 'Design system', use: 'Design system chapter / pitch deck', mode: 'text-to-video', aspect: '16:9', duration: 8, difficulty: 'Intermediate', refs: [], sourceIds: ['signal-motion','animazzio-2026','docusign-awwwards'], tags: ['design-system','components','tokens','ui'],
    defaults: { subject: 'a disciplined layout of buttons, fields, cards, icons and color tokens represented as clean graphic modules', motion: 'components enter by family, align to one shared baseline, then reorganize into a compact example interface', camera: 'locked camera', endpoint: 'the component set and assembled interface coexist in one balanced final composition' },
    template: `Core subject: {{subject}}. Scene: {{palette}} design-system canvas. Shot 1: {{camera}} while {{motion}}. Modules use {{material}} and {{texture}}. Lighting: {{light}}. Timing: {{tempo}}. Visual style: {{atmosphere}} structured product-design motion. End state: {{endpoint}}. Keep families visually consistent and avoid inventing random labels.` ,
    why: 'Turns invisible system thinking into motion content for cases and pitches.', post: 'Replace modules with exported real components for final fidelity.'
  },

  // UGC / MARKETING
  {
    key: 'ugc-app-demo', title: 'Creator App Demo', category: 'UGC / Marketing', subcategory: 'App UGC', use: 'Performance creative / paid social', mode: 'reference-to-video', aspect: '9:16', duration: 8, difficulty: 'Advanced', refs: ['identity','environment'], sourceIds: ['higgsfield-marketing','saas-avatar','runway-ad'], tags: ['ugc','app','creator','social'],
    defaults: { subject: 'one synthetic creator from [Image 1] holding a phone that displays the app layout from [Image 2]', motion: 'the creator glances from camera to phone, performs one simple tap, then returns eye contact with a small approving reaction', camera: 'handheld-style locked framing with only natural micro-shake', endpoint: 'creator holds the phone toward camera with the app screen clearly framed' },
    template: `Core subject: {{subject}}. Scene: {{palette}} believable creator environment. Shot 1: {{camera}} while {{motion}}. Wardrobe/props use {{material}} and {{texture}}. Lighting: {{light}}. Performance rhythm: {{tempo}}. Visual style: {{atmosphere}} authentic creator ad rather than polished studio presenter. End state: {{endpoint}}. Preserve one creator and one phone; do not invent extra devices or subtitles.` ,
    why: 'Reflects current “app demo + creator” performance creative demand.', post: 'Track and composite exact app screen + captions.'
  },
  {
    key: 'ugc-unboxing', title: 'Minimal Unboxing Moment', category: 'UGC / Marketing', subcategory: 'Product UGC', use: 'Organic/social product creative', mode: 'reference-to-video', aspect: '9:16', duration: 7, difficulty: 'Advanced', refs: ['product','identity'], sourceIds: ['higgsfield-marketing','higgsfield-ads','runway-product'], tags: ['ugc','unboxing','product','social'],
    defaults: { subject: 'the exact product from [Image 1] being handled by one synthetic creator from [Image 2]', motion: 'the creator opens the package once, pauses to look at the product, then lifts it into the center of frame', camera: 'handheld-style locked framing', endpoint: 'product is clearly visible in the creator’s hands with packaging still present below' },
    template: `Core subjects: {{subject}}. Scene: {{palette}} everyday tabletop environment. Shot 1: {{camera}} while {{motion}}. Materials read through {{material}} and {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} believable creator content. End state: {{endpoint}}. Preserve product/package identity and keep exactly one creator.` ,
    why: 'A simple UGC action that is easier to control than multi-step testimonials.', post: 'Add real voice/caption layer after selecting best take.'
  },
  {
    key: 'ugc-founder-ui', title: 'Founder + UI Proof', category: 'UGC / Marketing', subcategory: 'Founder content', use: 'SaaS founder ad / launch reel', mode: 'reference-to-video', aspect: '9:16', duration: 8, difficulty: 'Advanced', refs: ['identity','environment'], sourceIds: ['saas-avatar','higgsfield-marketing','a1-saas'], tags: ['founder','saas','ui','social'],
    defaults: { subject: 'one synthetic founder from [Image 1] with the product interface from [Image 2] appearing as a clean graphic proof panel beside them', motion: 'the founder makes one small explanatory hand gesture while the proof panel highlights one UI state change', camera: 'locked medium shot', endpoint: 'founder and proof panel hold a balanced side-by-side composition' },
    template: `Core subject: {{subject}}. Scene: {{palette}} founder-content environment. Shot 1: {{camera}} while {{motion}}. Set/wardrobe use {{material}} and {{texture}}. Lighting: {{light}}. Rhythm: {{tempo}}. Visual style: {{atmosphere}} founder-led product marketing. End state: {{endpoint}}. Keep one speaker and one proof panel; no invented subtitles or duplicate UI.` ,
    why: 'Combines trust of founder/talent content with product proof.', post: 'Composite real UI and captions, keep generated person plate.'
  },
  {
    key: 'ugc-street-reveal', title: 'Street Reaction Product Reveal', category: 'UGC / Marketing', subcategory: 'Street content', use: 'Lifestyle / social hook', mode: 'reference-to-video', aspect: '9:16', duration: 7, difficulty: 'Advanced', refs: ['product','identity'], sourceIds: ['higgsfield-marketing','runway-ad','adidas-ai'], tags: ['street','reaction','product','ugc'],
    defaults: { subject: 'one synthetic street-style creator from [Image 2] holding the exact product from [Image 1]', motion: 'the creator notices one product detail, gives a restrained genuine reaction and rotates the product slightly toward camera', camera: 'handheld close medium framing', endpoint: 'the product detail is visible and the creator’s reaction has settled' },
    template: `Core subjects: {{subject}}. Environment: {{palette}} believable outdoor or retail-adjacent setting. Shot 1: {{camera}} while {{motion}}. Product/wardrobe materials: {{material}} and {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} candid creator ad. End state: {{endpoint}}. Preserve product design and avoid exaggerated performance or extra people.` ,
    why: 'A controlled social hook without a complicated scripted scene.', post: 'Add exact hook/caption/CTA in edit.'
  },

  // VFX / TRANSITIONS
  {
    key: 'vfx-material-wipe', title: 'Material Wipe Transition', category: 'VFX / Transitions', subcategory: 'Wipe', use: 'Case-film transition / social edit', mode: 'text-to-video', aspect: '16:9', duration: 5, difficulty: 'Intermediate', refs: [], sourceIds: ['adobe-motion','hybrid-logo','adidas-ai'], tags: ['vfx','wipe','transition','material'],
    defaults: { subject: 'one continuous material sheet crossing frame edge to edge', motion: 'the sheet enters from frame-left, covers the full frame once, then exits frame-right revealing a clean empty plate', camera: 'locked camera', endpoint: 'the frame is fully clear and ready for the next shot' },
    template: `Core subject: {{subject}}. Scene: {{palette}} transition plate. Shot 1: {{camera}} while {{motion}}. Sheet material: {{material}} with {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} production VFX asset. End state: {{endpoint}}. Keep the wipe continuous with clean frame coverage and no unrelated objects.` ,
    why: 'A practical generative transition asset, not just a showcase shot.', post: 'Use as luma/matte or hard cut bridge.'
  },
  {
    key: 'vfx-matchcut-ui', title: 'Object-to-Interface Match Cut', category: 'VFX / Transitions', subcategory: 'Match cut', use: 'Product → digital experience transition', mode: 'reference-to-video', aspect: '16:9', duration: 7, difficulty: 'Advanced', refs: ['product','environment'], sourceIds: ['runway-ad','saas-avatar','adidas-ai'], tags: ['match-cut','product','ui','transition'],
    defaults: { subject: 'a circular physical product detail from [Image 1] and a matching circular UI element from [Image 2]', motion: 'the physical detail moves to exact center and grows until it fills the frame; its edge shape resolves into the matching UI element without changing screen direction', camera: 'one slow push-in', endpoint: 'the UI element is fully established inside the digital interface' },
    template: `Core subjects: {{subject}}. Scene begins in a {{palette}} product environment and resolves into the interface world. Shot 1: {{camera}} while {{motion}}. Material bridge uses {{material}} and {{texture}}. Lighting: {{light}}. Rhythm: {{tempo}}. Visual style: {{atmosphere}} product-to-digital match cut. End state: {{endpoint}}. Preserve source product and interface geometry at their respective endpoints.` ,
    why: 'Excellent for digital products connected to physical ecosystems.', post: 'Composite exact UI at final endpoint.'
  },
  {
    key: 'vfx-portal-transition', title: 'Architectural Portal Transition', category: 'VFX / Transitions', subcategory: 'Portal', use: 'Brand film / case-study chapter transition', mode: 'text-to-video', aspect: '16:9', duration: 6, difficulty: 'Advanced', refs: [], sourceIds: ['google-flow','canva-2026','docusign-awwwards'], tags: ['portal','transition','architecture','warp'],
    defaults: { subject: 'one rectangular portal standing in a minimal designed space', motion: 'the portal surface gains depth and the interior becomes a second visual environment while the outer frame remains rigid', camera: 'one smooth forward tracking move through the portal', endpoint: 'camera arrives fully inside the second environment with no visible cut' },
    template: `Core subject: {{subject}}. Environment: {{palette}} liminal design space. Shot 1: {{camera}} while {{motion}}. Portal frame uses {{material}} and {{texture}}. Lighting: {{light}}. Tempo: {{tempo}}. Visual style: {{atmosphere}} seamless chapter transition. End state: {{endpoint}}. Preserve rectangular portal geometry and keep the transformation spatially coherent.` ,
    why: 'A chapter transition suitable for award-style cases and brand films.', post: 'Use source/target plates as endpoint composites when exact continuity matters.'
  },
  {
    key: 'vfx-freeze-annotation', title: 'Freeze Frame → Annotation → Scene', category: 'VFX / Transitions', subcategory: 'Case-study annotation', use: 'Design rationale / feature breakdown', mode: 'image-to-video', aspect: '16:9', duration: 7, difficulty: 'Advanced', refs: ['environment'], sourceIds: ['signal-motion','animazzio-2026','adobe-prompt'], tags: ['annotation','freeze','case-study','feature'],
    defaults: { subject: 'a clean product or interface frame from [Image 1]', motion: 'the scene freezes, three simple graphic callout lines draw toward key areas, then the callout lines retract and the scene resumes with one subtle native motion', camera: 'locked camera', endpoint: 'the original composition is restored without callouts' },
    template: `Core subject: {{subject}}. Scene: {{palette}} case-study presentation. Shot 1: {{camera}} while {{motion}}. Callout graphics use {{material}} and {{texture}}. Lighting remains {{light}}. Rhythm: {{tempo}}. Visual style: {{atmosphere}} design-rationale motion. End state: {{endpoint}}. Callouts must be geometric lines/shapes only; do not generate random explanatory copy.` ,
    why: 'A direct bridge between beautiful motion and useful case-study explanation.', post: 'Add actual labels/type after generation.'
  }
];

function resolveTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? `{{${key}}}`);
}

function niceKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

export const PROMPTS = archetypes.flatMap((archetype, archetypeIndex) =>
  VARIATIONS.map((variation, variationIndex) => {
    const values = { ...variation.values, ...archetype.defaults };
    const variables = [...new Set([...archetype.template.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]))]
      .map(key => ({ key, label: niceKey(key), value: values[key] ?? '' }));
    const sourceObjects = archetype.sourceIds.map(id => SOURCES.find(source => source.id === id)).filter(Boolean);
    return {
      id: `${archetype.key}-${variation.id}`,
      archetype: archetype.key,
      title: `${archetype.title} — ${variation.name}`,
      baseTitle: archetype.title,
      category: archetype.category,
      subcategory: archetype.subcategory,
      use: archetype.use,
      mode: archetype.mode,
      aspect: archetype.aspect,
      duration: archetype.duration,
      difficulty: archetype.difficulty,
      refs: archetype.refs,
      tags: [...archetype.tags, variation.id],
      sourceIds: archetype.sourceIds,
      sourceTitles: sourceObjects.map(source => source.title),
      template: archetype.template,
      variables,
      values,
      prompt: resolveTemplate(archetype.template, values),
      why: archetype.why,
      post: archetype.post,
      variation: variation.name,
      origin: 'Porter original / industry-derived',
      bos: 'BOS-2026-07-17',
      featured: archetypeIndex < 12 && variationIndex === 0,
      rank: (sourceObjects.reduce((sum, source) => sum + source.authority + source.design, 0) / Math.max(1, sourceObjects.length * 2)).toFixed(1)
    };
  })
);

export const LIBRARY_STATS = {
  promptCount: PROMPTS.length,
  archetypeCount: archetypes.length,
  sourceCount: SOURCES.length,
  categories: [...new Set(PROMPTS.map(prompt => prompt.category))].length,
  standard: 'BOS-2026-07-17',
  auditDate: '2026-08-07'
};
