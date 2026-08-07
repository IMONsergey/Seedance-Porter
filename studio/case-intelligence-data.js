// Seedance Porter — Case Intelligence layer
// Analysis is separated into prompt-derived evidence and visual-review evidence.
// A case is only `deep-reviewed` after the actual source video has been visually inspected.

export const COLLECTION_GROUPS = [
  { id: 'digital', title: 'Digital / Design' },
  { id: 'commercial', title: 'Commercial' },
  { id: 'motion', title: 'Motion language' }
];

export const COLLECTIONS = [
  // Digital / Design
  { id: 'website-hero', group: 'digital', title: 'Website Hero', description: 'Short hero loops and product-first landing-page motion.' },
  { id: 'saas-ui', group: 'digital', title: 'SaaS UI', description: 'Product UI, feature proof and interface storytelling.' },
  { id: 'app-launch', group: 'digital', title: 'App Launch', description: 'Launch films, feature reveals and app-led campaign motion.' },
  { id: 'dashboard', group: 'digital', title: 'Dashboard', description: 'Data products, dashboards and state-change storytelling.' },
  { id: 'case-study-motion', group: 'digital', title: 'Case Study Motion', description: 'Portfolio and case-film narrative structures.' },
  { id: 'brand-reveal', group: 'digital', title: 'Brand Reveal', description: 'Brand-system reveals and visual-language introductions.' },
  { id: 'rebranding-transition', group: 'digital', title: 'Rebranding Transition', description: 'Old-to-new identity transitions and transformation systems.' },
  { id: 'logo-motion', group: 'digital', title: 'Logo Motion', description: 'Logo stings, symbol transformations and brand endpoints.' },
  { id: 'kinetic-type', group: 'digital', title: 'Kinetic Type', description: 'Typography-led motion and composited type systems.' },
  { id: 'interactive-web3d', group: 'digital', title: 'Interactive / Web3D', description: 'Spatial web, depth, portals and interactive-feeling scenes.' },

  // Commercial
  { id: 'packshot', group: 'commercial', title: 'Packshot', description: 'Product hero shots, feature macros and pack fidelity.' },
  { id: 'beauty', group: 'commercial', title: 'Beauty', description: 'Skincare, haircare and beauty-benefit films.' },
  { id: 'fmcg', group: 'commercial', title: 'FMCG', description: 'Fast-moving consumer goods and retail-ready product motion.' },
  { id: 'food', group: 'commercial', title: 'Food', description: 'Ingredient, cooking, serving and appetite-led storytelling.' },
  { id: 'automotive', group: 'commercial', title: 'Automotive', description: 'Vehicle launch, speed, material and road cinematography.' },
  { id: 'fashion', group: 'commercial', title: 'Fashion', description: 'Editorial, retail, garment and youth-culture motion.' },
  { id: 'sports', group: 'commercial', title: 'Sports', description: 'Performance, apparel, equipment and kinetic sports campaigns.' },
  { id: 'luxury', group: 'commercial', title: 'Luxury', description: 'Quiet luxury, fragrance, jewelry and premium material language.' },
  { id: 'electronics', group: 'commercial', title: 'Electronics', description: 'Devices, hardware, interaction details and feature proof.' },
  { id: 'real-estate', group: 'commercial', title: 'Real Estate', description: 'Architecture, interiors and property-led cinematic motion.' },

  // Motion language
  { id: 'camera', group: 'motion', title: 'Camera', description: 'Camera strategy as the primary storytelling device.' },
  { id: 'transitions', group: 'motion', title: 'Transitions', description: 'Cut logic, state changes and transition design.' },
  { id: 'morphs', group: 'motion', title: 'Morphs', description: 'Continuous transformation with inherited visual DNA.' },
  { id: 'macro', group: 'motion', title: 'Macro', description: 'Extreme detail, tactile proof and material storytelling.' },
  { id: 'material', group: 'motion', title: 'Material', description: 'Surface, liquid, fabric, glass, metal and physical response.' },
  { id: 'loop', group: 'motion', title: 'Loop', description: 'Seamless cyclic motion and return-to-origin systems.' },
  { id: 'freeze', group: 'motion', title: 'Freeze', description: 'Time suspension used for feature or identity emphasis.' },
  { id: 'scale', group: 'motion', title: 'Scale', description: 'Miniature, monumental and size-contrast storytelling.' },
  { id: 'match-cut', group: 'motion', title: 'Match Cut', description: 'Shape, motion and semantic match transitions.' },
  { id: 'first-last-frame', group: 'motion', title: 'First / Last Frame', description: 'Endpoint-controlled transformations and continuity.' }
];

const analysis = ({ collections, thesis, signatureMove, shots, causal, rhythm, references, motion, transfer, risks }) => ({
  reviewStatus: 'prompt-reviewed',
  evidence: {
    prompt: 'reviewed',
    preview: 'reviewed',
    fullVideo: 'pending-visual-review',
    note: 'Shot analysis is derived from the published source prompt and preview until the complete source video is visually reviewed.'
  },
  collections,
  thesis,
  signatureMove,
  shotBreakdown: shots,
  causalMechanics: causal,
  rhythm,
  referenceStrategy: references,
  motionLanguage: motion,
  transferablePattern: transfer,
  failureRisks: risks
});

export const CASE_INTELLIGENCE = {
  'digest-japanese-romance': analysis({
    collections: ['case-study-motion','camera'],
    thesis: 'The clip works by converting an internal emotion into tiny observable physical changes instead of relying on generic “romantic mood” language.',
    signatureMove: 'Escalation from shared space to individual reaction to intimate two-shot, while performance intensity stays deliberately low.',
    shots: [
      { n: 1, role: 'Establish tension', framing: 'medium two-shot', camera: 'very slow push-in', action: 'one character writes while the second quietly observes', why: 'The viewer first understands spatial relationship before reading micro-expression.' },
      { n: 2, role: 'Reveal hidden intent', framing: 'close-up', camera: 'fixed', action: 'hesitation, glance away, grip change, breathing shift', why: 'Small physical cues make the emotion legible without melodrama.' },
      { n: 3, role: 'Payoff', framing: 'intimate two-shot / close', camera: 'static', action: 'eye contact and restrained dialogue', why: 'The camera stops moving when the emotional uncertainty resolves.' }
    ],
    causal: [
      'Warm directional classroom light + shallow depth turns an ordinary location into an intimate controlled space.',
      'Repeated continuity anchors—face, uniform, desk position—let the viewer focus on behavior rather than model drift.',
      'Whisper-level dialogue and pauses reduce the uncanny effect that often appears with exaggerated generated acting.'
    ],
    rhythm: 'Slow → held reaction → still payoff. The lack of a large visual event is the point.',
    references: 'Best with locked character references for both subjects; environment should remain simple and stable.',
    motion: ['push-in','static reaction','micro-performance'],
    transfer: 'Use for founder/customer moments, testimonial intros, emotional brand films or any scene where subtle performance carries the message.',
    risks: ['overacting','face drift between close-ups','lip-sync overload','too many simultaneous gestures']
  }),

  'digest-haute-couture-porcelain': analysis({
    collections: ['fashion','brand-reveal','morphs','material','first-last-frame'],
    thesis: 'A single material identity—blue-and-white porcelain—acts as both costume and transition logic, so the surreal transformation still feels designed rather than random.',
    signatureMove: 'The garment does not merely disappear; its color, gloss and graphic DNA are inherited by the next form.',
    shots: [
      { n: 1, role: 'Declare material system', framing: 'low full-body editorial', camera: 'slow push / telephoto compression', action: 'model walks on a reflective plane', why: 'The first shot gives enough time to read silhouette and surface before transformation.' },
      { n: 2, role: 'Trigger transformation', framing: 'face / upper-body close-up', camera: 'locked', action: 'one crisp gesture causes garment to fragment into ink-like birds', why: 'A simple human trigger makes a complex VFX event causally understandable.' },
      { n: 3, role: 'Expand scale', framing: 'high overhead', camera: 'descending move', action: 'transformed forms enter the reflection and become an abstract vortex', why: 'The ending upgrades the effect from garment trick to world-scale brand image.' }
    ],
    causal: [
      'Minimal salt-flat environment prevents the transformation from competing with background detail.',
      'Mirror reflection doubles the transformation without adding a second visual concept.',
      'Cold monochrome palette makes the blue porcelain / black ink transition read as one coherent identity system.'
    ],
    rhythm: 'Material read → trigger → scale expansion.',
    references: 'Identity reference for model plus optional first-frame fashion still; material consistency is more important than adding many style references.',
    motion: ['material morph','overhead descent','reflection transition'],
    transfer: 'Excellent for rebrands, fashion drops, packaging-to-world transitions, logo systems and product materials becoming campaign environments.',
    risks: ['body/garment fusion','random intermediate colors','duplicate model after morph','transformation without inherited material cues']
  }),

  'digest-modern-rural': analysis({
    collections: ['food','macro','material','case-study-motion'],
    thesis: 'The visual appeal comes from a craft-process hierarchy: tactile detail first, controlled hand action second, calm human payoff last.',
    signatureMove: 'Macro material evidence is treated as the hero, not decoration.',
    shots: [
      { n: 1, role: 'Sensory hook', framing: 'extreme macro', camera: 'static', action: 'surface moisture / ingredient detail', why: 'Texture immediately establishes realism and premium care.' },
      { n: 2, role: 'Proof of craft', framing: 'work-surface detail', camera: 'lateral track', action: 'one precise preparation step', why: 'A single readable task gives the viewer causal satisfaction.' },
      { n: 3, role: 'Lifestyle resolve', framing: 'medium', camera: 'static', action: 'maker pauses with finished result', why: 'The final stillness converts process energy into calm brand feeling.' }
    ],
    causal: ['Natural daylight avoids artificial food gloss.', 'ASMR-like close sound reinforces material realism.', 'Sparse tools and fixed work surface help continuity.'],
    rhythm: 'Detail → action → rest.',
    references: 'Environment / product reference is enough; too many style references would weaken the documentary feel.',
    motion: ['macro','lateral tracking','static payoff'],
    transfer: 'Useful for food, craftsmanship, cosmetics formulation, industrial making and behind-the-scenes case films.',
    risks: ['generic rustic props','hand deformation','over-stylized lighting','rapid montage that destroys craft readability']
  }),

  'digest-street-racing': analysis({
    collections: ['automotive','camera','transitions'],
    thesis: 'Speed is built before the car moves: hand tension, cockpit framing and road anticipation create acceleration psychologically before the exterior chase begins.',
    signatureMove: 'Interior tension detail → road reveal → side-speed shot → ultra-low hero pass.',
    shots: [
      { n: 1, role: 'Pre-load', framing: 'tight interior detail', camera: 'fixed', action: 'driver tightens grip / prepares launch', why: 'A small physical cue creates tension without expensive visual complexity.' },
      { n: 2, role: 'Anticipation', framing: 'over shoulder', camera: 'push toward road', action: 'road opens ahead', why: 'Viewer orientation is established before the fast cut.' },
      { n: 3, role: 'Acceleration proof', framing: 'exterior profile', camera: 'side tracking', action: 'car accelerates with wheel / reflection continuity', why: 'Side tracking makes speed readable while preserving body shape.' },
      { n: 4, role: 'Hero payoff', framing: 'ultra-low roadside', camera: 'locked', action: 'vehicle passes into / out of tunnel', why: 'Static camera makes the final velocity feel faster by contrast.' }
    ],
    causal: ['Wet road multiplies controlled highlights and perceived speed.', 'Restrained neon keeps car silhouette readable.', 'Alternating moving and locked cameras prevents nonstop visual noise.'],
    rhythm: 'Tension → reveal → acceleration → pass.',
    references: 'Exact vehicle reference is essential; use motion/camera reference only if it has one clear job.',
    motion: ['push-in','side tracking','locked pass','motion blur'],
    transfer: 'Automotive launches, sports equipment, high-performance electronics and any campaign built around acceleration.',
    risks: ['wheel geometry drift','car morphing between shots','camera teleportation','neon overpowering product']
  }),

  'digest-mini-skincare': analysis({
    collections: ['beauty','packshot','scale','macro'],
    thesis: 'Miniature scale gives one SKU multiple campaign scenes while preserving a consistent product hero.',
    signatureMove: 'Human ambassador becomes a scale indicator for the pack instead of a conventional spokesperson.',
    shots: [
      { n: 1, role: 'Scale hook', framing: 'macro accessory', camera: 'fixed', action: 'miniature ambassador emerges with product', why: 'Viewer instantly understands the impossible scale relationship.' },
      { n: 2, role: 'Extend brand world', framing: 'surface detail', camera: 'slow lateral track', action: 'same ambassador / pack move through second accessory world', why: 'Repetition validates continuity rather than feeling like a one-off trick.' },
      { n: 3, role: 'Resolve to commerce', framing: 'packshot', camera: 'slow push', action: 'product settles on pedestal', why: 'The fantasy resolves into a usable ecommerce end frame.' }
    ],
    causal: ['Consistent miniature scale is the core illusion.', 'Neutral leather / stone surfaces signal luxury without stealing focus.', 'The final real-scale product hero grounds the surreal setup.'],
    rhythm: 'Surprise → repeat rule → clean packshot.',
    references: 'Exact pack reference plus one identity reference for ambassador; explicit scale lock is required.',
    motion: ['scale play','macro','lateral track','packshot push'],
    transfer: 'Beauty, jewelry, consumer electronics, packaging launches and social campaign systems.',
    risks: ['scale drift','duplicate ambassador','pack redesign','floating shadows / weak contact']
  }),

  'digest-radiance-serum': analysis({
    collections: ['beauty','luxury','packshot','macro','real-estate'],
    thesis: 'The sequence borrows architectural language to pre-sell brand values before showing skin benefit and product.',
    signatureMove: 'Architecture → human benefit → object proof.',
    shots: [
      { n: 1, role: 'Brand world', framing: 'wide architecture', camera: 'slow pan', action: 'light moves across stone / sheer fabric', why: 'Monumental calm signals premium positioning before the product appears.' },
      { n: 2, role: 'Benefit proof', framing: 'profile close-up', camera: 'fixed', action: 'one gentle touch to illuminated skin', why: 'The visual benefit becomes concrete and human.' },
      { n: 3, role: 'Commercial resolve', framing: 'macro packshot', camera: 'slow push-in', action: 'serum bottle on reflective stone with restrained refraction', why: 'Product arrives last, already carrying the values established by the first two shots.' }
    ],
    causal: ['Pale stone and sheer textile create quiet-luxury material vocabulary.', 'Golden-hour direction links architecture, skin and glass with one light logic.', 'Three-shot hierarchy avoids the common AI-ad problem of decorative product clutter.'],
    rhythm: 'World → benefit → product.',
    references: 'Product image must be exact; architecture can be a separate environment reference if needed.',
    motion: ['slow pan','static beauty close-up','macro push-in'],
    transfer: 'Skincare, fragrance, premium real estate, hospitality, furniture and luxury tech.',
    risks: ['fake skin gloss','invented label text','too many botanicals / particles','architecture that feels unrelated to product']
  }),

  'digest-fish-ad': analysis({
    collections: ['food','fmcg','macro','material'],
    thesis: 'A process film is satisfying when each cut advances an irreversible physical state: raw → seasoned → cooked → plated.',
    signatureMove: 'Every shot proves a transformation step rather than repeating generic food beauty shots.',
    shots: [
      { n: 1, role: 'Freshness proof', framing: 'macro', camera: 'static', action: 'ingredient under water', why: 'Water gives immediate freshness and physical realism.' },
      { n: 2, role: 'Preparation', framing: 'hand / ingredient detail', camera: 'lateral track', action: 'single seasoning action', why: 'Hands create craft and scale.' },
      { n: 3, role: 'Transformation', framing: 'cooking close-up', camera: 'fixed', action: 'heat / oil / steam changes surface', why: 'This is the highest-value sensory state change.' },
      { n: 4, role: 'Hero', framing: 'plated close-up', camera: 'push-in', action: 'steam settles', why: 'The viewer sees the result of the previous actions.' }
    ],
    causal: ['Physical state continuity makes the sequence feel causal.', 'Macro framing hides environment inconsistencies.', 'Steam and sizzling provide audio-visual freshness cues.'],
    rhythm: 'Raw → prepare → transform → serve.',
    references: 'Dish / packaging reference if branded; otherwise environment consistency matters more.',
    motion: ['macro','process cuts','steam','push-in'],
    transfer: 'Food, beverages, formulation, manufacturing and any “how it becomes” product story.',
    risks: ['ingredient teleportation','unrealistic heat physics','hands changing tools','final dish not matching process']
  }),

  'digest-moxie-curl': analysis({
    collections: ['beauty','fmcg','packshot','macro','material'],
    thesis: 'The commercial is organized around a visibly demonstrable benefit, so the product has a reason to appear in every stage.',
    signatureMove: 'Condition → application texture → transformed hair → editorial packshot.',
    shots: [
      { n: 1, role: 'Problem cue', framing: 'medium beauty', camera: 'fixed', action: 'model notices frizz / texture issue', why: 'Sets a before-state without needing on-screen claims.' },
      { n: 2, role: 'Product texture', framing: 'macro', camera: 'push-in', action: 'cream dispenses to hand', why: 'Viscosity makes the pack feel tangible and premium.' },
      { n: 3, role: 'Benefit proof', framing: 'hair close-up', camera: 'fixed', action: 'product worked through curl section', why: 'The benefit is shown where it matters physically.' },
      { n: 4, role: 'Campaign frame', framing: 'product hero', camera: 'slow orbit / restrained', action: 'pack on stone with ingredient cues', why: 'Ends in a clean reusable brand asset.' }
    ],
    causal: ['Hair strand physics is the benefit visualization.', 'Natural skin texture prevents the spot from feeling synthetic.', 'The packshot inherits the same warm light as the application scene.'],
    rhythm: 'Problem → product → proof → hero.',
    references: 'Exact product pack and identity/hair reference; anchors should include cap, label block and curl silhouette.',
    motion: ['macro dispense','hair physics','packshot'],
    transfer: 'Haircare, skincare, cleaning products, apparel performance and consumer goods with visible before/after benefit.',
    risks: ['hair morphing instead of treatment','pack label drift','beauty-filter skin','ingredient clutter']
  }),

  'digest-gold-morph': analysis({
    collections: ['logo-motion','brand-reveal','rebranding-transition','morphs','material','loop','first-last-frame'],
    thesis: 'The concept succeeds because the model is constrained by invariants—material, light, curvature—while silhouette is allowed to change freely.',
    signatureMove: 'A continuous chain of transformations that never reaches a static completed object until the loop closes.',
    shots: [
      { n: 1, role: 'Define invariant', framing: 'centered macro', camera: 'fixed', action: 'molten gold seed form appears', why: 'The viewer learns the material DNA that every later state must inherit.' },
      { n: 2, role: 'Association chain', framing: 'same', camera: 'fixed', action: 'continuous morph through multiple motifs', why: 'No cuts means coherence must come from physical inheritance rather than edit tricks.' },
      { n: 3, role: 'Loop closure', framing: 'same', camera: 'fixed', action: 'last form returns to seed silhouette', why: 'A matching endpoint turns a generative experiment into usable identity motion.' }
    ],
    causal: ['Fixed camera isolates transformation as the only variable.', 'Material invariants suppress random visual jumps.', 'Gradually increasing tempo gives the loop a designed arc.'],
    rhythm: 'Measured morph → acceleration → exact return.',
    references: 'Best with first/last frame or logo silhouette references rather than character references.',
    motion: ['continuous morph','loop','fixed macro','material inheritance'],
    transfer: 'Logo stings, rebrands, symbol systems, event identities, generative websites and product material transitions.',
    risks: ['random color changes','hard cuts disguised as morphs','topology noise','loop endpoint mismatch']
  }),

  'digest-camera-minimal': analysis({
    collections: ['website-hero','saas-ui','camera','first-last-frame'],
    thesis: 'The important lesson is subtraction: when a finished key visual already contains design, the prompt should describe only motion and endpoint.',
    signatureMove: 'One camera move + micro-motion, nothing else.',
    shots: [
      { n: 1, role: 'Animate approved design', framing: 'source composition', camera: 'single slow push-in', action: 'only plausible environmental/material micro-motion', why: 'The model has fewer opportunities to redesign a strong source frame.' }
    ],
    causal: ['Motion-only instruction preserves art direction.', 'Single camera action reduces geometry drift.', 'Explicit endpoint makes the output loop / hero-placement friendly.'],
    rhythm: 'Continuous restrained motion.',
    references: 'One approved key visual should do most of the visual work.',
    motion: ['single push-in','micro-motion','I2V'],
    transfer: 'Website hero, SaaS hero, UI mockups, campaign key visuals, packaging stills and architecture renders.',
    risks: ['restating visual content until the model redesigns it','multiple camera moves','new objects appearing','typography deformation']
  }),

  'digest-fisheye-dancer': analysis({
    collections: ['fashion','sports','camera'],
    thesis: 'A severe optical rule acts like a brand system: even varied body movement remains visually coherent because every shot shares the same lens behavior.',
    signatureMove: 'Subject deliberately invades the fisheye lens space, making distortion part of choreography.',
    shots: [
      { n: 1, role: 'Declare lens language', framing: 'low wide fisheye', camera: 'backward track', action: 'performer approaches', why: 'Perspective stretch immediately establishes the campaign look.' },
      { n: 2, role: 'Break fourth wall', framing: 'extreme close-up', camera: 'fixed', action: 'performer interacts with lens once', why: 'Direct lens interaction creates a memorable social hook.' },
      { n: 3, role: 'Movement proof', framing: 'low full-body', camera: 'lateral track', action: 'compact dance phrase', why: 'The optical rule remains stable while action expands.' }
    ],
    causal: ['Fisheye distortion unifies youth/street visual language.', 'Hard light + concrete keeps silhouettes readable.', 'Low camera makes body movement feel larger without multiple VFX ideas.'],
    rhythm: 'Approach → lens hit → release into dance.',
    references: 'Identity and wardrobe reference are important; camera reference can help but should not import subject matter.',
    motion: ['fisheye','backward tracking','lens interaction','lateral track'],
    transfer: 'Streetwear, sports, music, youth brands and energetic website hero films.',
    risks: ['anatomy distortion mistaken for lens distortion','camera spinning','wardrobe drift','duplicate performer']
  }),

  'digest-beauty-advent': analysis({
    collections: ['beauty','fmcg','packshot','macro'],
    thesis: 'The unboxing works because product hierarchy is explicit: master set first, item A second, item B third, then a human endorsement frame.',
    signatureMove: 'Focus transfer between face and product replaces flashy transitions.',
    shots: [
      { n: 1, role: 'Human hook', framing: 'fixed medium close-up', camera: 'phone-like static', action: 'creator establishes gaze and reaches below frame', why: 'Sets an authentic social grammar.' },
      { n: 2, role: 'Master pack reveal', framing: 'same', camera: 'fixed with autofocus shift', action: 'gift set enters frame and rotates', why: 'Autofocus movement makes a simple reveal feel filmed rather than generated.' },
      { n: 3, role: 'First item proof', framing: 'product close-up', camera: 'fixed', action: 'compartment opens / cleanser appears', why: 'One mechanical interaction provides product credibility.' },
      { n: 4, role: 'Second item + endorsement', framing: 'medium close', camera: 'subtle push', action: 'palette revealed next to face', why: 'Returns to human scale and closes the hierarchy.' }
    ],
    causal: ['Simple camera protects product continuity.', 'Focus breathing adds authenticity.', 'Sequential reveal prevents the model from inventing multiple items at once.'],
    rhythm: 'Face → pack → item → face+item.',
    references: 'Exact gift set image; creator identity optional depending on campaign.',
    motion: ['focus transfer','unboxing','subtle push'],
    transfer: 'Ecommerce, PR kits, subscription boxes, electronics unboxing and social launch content.',
    risks: ['extra product compartments','label drift','hinge physics','over-cinematic camera']
  }),

  'digest-suitcase': analysis({
    collections: ['packshot','luxury','macro','material'],
    thesis: 'Every shot is a feature proof. That makes the film commercially useful because each clip can also stand alone as a PDP or social asset.',
    signatureMove: 'One feature = one shot = one mechanical action.',
    shots: [
      { n: 1, role: 'Access proof', framing: 'macro', camera: 'fixed', action: 'quick-access compartment opens', why: 'Demonstrates a clear functional benefit.' },
      { n: 2, role: 'Hardware proof', framing: 'detail', camera: 'push-in', action: 'latch / lock clicks shut', why: 'Sound and precise movement imply build quality.' },
      { n: 3, role: 'Extension proof', framing: 'side detail', camera: 'fixed', action: 'handle extends to stop', why: 'Linear action is easy to verify and visually clean.' },
      { n: 4, role: 'Mobility proof', framing: 'low side', camera: 'lateral track', action: 'wheel system rolls', why: 'Camera and product move in parallel, keeping geometry readable.' },
      { n: 5, role: 'Hero', framing: 'three-quarter', camera: 'static', action: 'product rests in premium environment', why: 'Creates a clean closing frame for copy / CTA.' }
    ],
    causal: ['Tactile actions turn specifications into visible evidence.', 'Macro crops minimize background instability.', 'A single master product reference prevents feature shots from becoming different SKUs.'],
    rhythm: 'Feature ladder → hero.',
    references: 'Exact product reference is non-negotiable; storyboard can be separate if feature order matters.',
    motion: ['macro','mechanical action','lateral track','packshot'],
    transfer: 'Electronics, luggage, appliances, furniture hardware, tools and premium industrial products.',
    risks: ['hardware duplication','hinge / latch impossibility','logo drift','product dimensions changing between shots']
  }),

  'digest-blender': analysis({
    collections: ['electronics','fmcg','packshot','macro'],
    thesis: 'The structure combines spokesperson trust with visible product proof instead of asking the creator to carry the entire ad verbally.',
    signatureMove: 'Short spoken hook → physical demo → macro mechanism → taste reaction → packshot.',
    shots: [
      { n: 1, role: 'Hook / claim', framing: 'medium creator', camera: 'fixed', action: 'creator presents one benefit', why: 'Puts the value proposition before detail.' },
      { n: 2, role: 'Setup proof', framing: 'top / three-quarter', camera: 'fixed', action: 'ingredients added', why: 'Shows capacity and usability.' },
      { n: 3, role: 'Core function', framing: 'macro', camera: 'push-in', action: 'blending mechanism operates', why: 'Product performance becomes visually undeniable.' },
      { n: 4, role: 'Human confirmation', framing: 'medium', camera: 'fixed', action: 'creator drinks / reacts', why: 'Closes the proof loop with a person.' },
      { n: 5, role: 'Commerce', framing: 'packshot', camera: 'static', action: 'clean hero', why: 'Gives campaign a reusable final frame.' }
    ],
    causal: ['Simple kitchen environment supports product scale.', 'Macro mechanism shot replaces text-heavy feature explanation.', 'Short dialogue is easier to lip-sync and feels more native to social.' ],
    rhythm: 'Claim → setup → proof → reaction → product.',
    references: 'Product reference plus creator reference if identity continuity matters.',
    motion: ['creator demo','macro mechanism','packshot'],
    transfer: 'Small appliances, consumer electronics, beauty tools and any creator-led product demo.',
    risks: ['long dialogue','unrealistic blades / liquid','invented feature claims','product morph during handling']
  }),

  'digest-golden-serum': analysis({
    collections: ['beauty','luxury','packshot','macro','material'],
    thesis: 'The film compresses a whole premium brand world into three material symbols: glass, viscous liquid and faceted mineral.',
    signatureMove: 'One macro droplet becomes the bridge between pack, benefit and final jewel-like product frame.',
    shots: [
      { n: 1, role: 'Object world', framing: 'macro still life', camera: 'fixed', action: 'pack on pale stone with botanical cue', why: 'Sets premium material vocabulary.' },
      { n: 2, role: 'Benefit metaphor', framing: 'extreme macro', camera: 'push-in', action: 'single serum droplet contacts skin', why: 'Viscosity and surface tension visualize richness.' },
      { n: 3, role: 'Luxury hero', framing: 'frontal packshot', camera: 'static', action: 'pack on faceted clear pedestal', why: 'Turns the product into a jewel without needing narrative.' }
    ],
    causal: ['One warm-gold liquid color ties all shots together.', 'Few objects keep caustics and reflections readable.', 'Faceted pedestal amplifies light without adding another semantic concept.'],
    rhythm: 'Still life → liquid event → still hero.',
    references: 'Exact serum pack reference; material reference optional.',
    motion: ['macro droplet','push-in','static hero'],
    transfer: 'Skincare, fragrance, jewelry, beverages and high-end materials.',
    risks: ['floating decorative particles','unphysical liquid glow','multiple bottles','label mutation']
  }),

  'digest-fashion-mall': analysis({
    collections: ['fashion','transitions','match-cut','camera'],
    thesis: 'The source is intentionally hyperactive; the reusable lesson is to separate retail energy into discrete camera jobs and create speed in edit, not inside every generation.',
    signatureMove: 'Generate clean action modules, then use whip / match transitions in post.',
    shots: [
      { n: 1, role: 'Entrance', framing: 'low full-body', camera: 'forward track', action: 'talent enters retail space', why: 'Sets location and confidence.' },
      { n: 2, role: 'Selection', framing: 'detail', camera: 'fixed', action: 'one accessory / garment interaction', why: 'Provides a cuttable insert without outfit drift.' },
      { n: 3, role: 'Look reveal', framing: 'mirror / side', camera: 'lateral track', action: 'final styled look appears', why: 'Mirror geometry creates a natural match transition opportunity.' },
      { n: 4, role: 'Hero exit', framing: 'front full-body', camera: 'backward track', action: 'talent walks with hero accessory', why: 'Ends on a stable campaign composition.' }
    ],
    causal: ['Retail reflections create built-in transition surfaces.', 'Separating shots prevents camera-command overload.', 'Post-production carries speed, while generated clips maintain identity.' ],
    rhythm: 'Enter → detail → reveal → hero; edit supplies acceleration.',
    references: 'Talent identity + wardrobe / hero accessory references; do outfit changes outside single generated shot.',
    motion: ['tracking','match-cut setup','mirror transition','edit-driven pace'],
    transfer: 'Fashion, retail launches, app/product launch edits and agency case films.',
    risks: ['outfit morphs','too many transitions in one prompt','storefront logo hallucination','camera move stacking']
  }),

  'digest-water-skincare': analysis({
    collections: ['beauty','packshot','macro','material'],
    thesis: 'A single purity metaphor—water—connects the abstract opener, product reveal, human benefit and minimal endpoint.',
    signatureMove: 'Material metaphor repeats at different scales rather than changing concept every shot.',
    shots: [
      { n: 1, role: 'Metaphor hook', framing: 'extreme macro', camera: 'fixed', action: 'droplet hits water / ripple forms', why: 'Simple physical event communicates purity instantly.' },
      { n: 2, role: 'Product reveal', framing: 'product medium', camera: 'vertical reveal', action: 'jar rises to waterline', why: 'Transfers the metaphor directly onto the pack.' },
      { n: 3, role: 'Benefit', framing: 'beauty close-up', camera: 'fixed', action: 'cream applied once', why: 'Human proof makes the metaphor commercially meaningful.' },
      { n: 4, role: 'Symbolic endpoint', framing: 'minimal graphic', camera: 'static', action: 'single droplet suspended / settles', why: 'Creates a clean brand frame without generating text.' }
    ],
    causal: ['Consistent blue/white palette maintains semantic clarity.', 'Water physics provide motion without needing complex camera work.', 'The final abstract frame is useful for composited copy.' ],
    rhythm: 'Metaphor → product → benefit → symbol.',
    references: 'Exact jar reference; skin / model identity only if campaign continuity requires it.',
    motion: ['water ripple','vertical reveal','macro','static endpoint'],
    transfer: 'Beauty, beverages, wellness, sustainability and any product with a material purity claim.',
    risks: ['magical floating product','water clipping through pack','extra flowers / particles','fake skin texture']
  }),

  'digest-soda-monster': analysis({
    collections: ['fmcg','brand-reveal','packshot','scale','material'],
    thesis: 'The product is the cause of both character emotion and environmental state change, so branding is embedded in story mechanics.',
    signatureMove: 'Bottle opening becomes a lighting / world transformation trigger.',
    shots: [
      { n: 1, role: 'Before state', framing: 'medium mascot', camera: 'slow push', action: 'mascot bored in muted room', why: 'Creates a clear emotional and color baseline.' },
      { n: 2, role: 'Trigger', framing: 'medium / product', camera: 'fixed', action: 'mascot discovers and opens bottle', why: 'A single physical action explains the coming transformation.' },
      { n: 3, role: 'After state', framing: 'wide', camera: 'lateral track', action: 'room becomes colorful / toys activate', why: 'Benefit is expressed as environmental energy.' },
      { n: 4, role: 'Brand hero', framing: 'mascot + pack', camera: 'static', action: 'celebration settles around bottle', why: 'Ends on character emotion and pack together.' }
    ],
    causal: ['Muted-to-saturated light is more legible than adding many new objects.', 'Mascot provides emotional continuity through the VFX change.', 'Condensation / bubbles keep the beverage physically present.' ],
    rhythm: 'Low energy → discovery → burst → hero.',
    references: 'Mascot and bottle both need exact references; environment geometry should stay locked.',
    motion: ['state transformation','bubbles','character motion','packshot'],
    transfer: 'FMCG, kids/family brands, mascots, gaming launches and product-as-trigger narratives.',
    risks: ['mascot redesign','bottle duplication','room geometry reset','unreadable label']
  }),

  'digest-night-market': analysis({
    collections: ['food','fmcg','case-study-motion','camera'],
    thesis: 'The authenticity comes from specifying imperfections as a system—handheld drift, focus breathing, exposure response and live ambience—rather than adding a generic “UGC” label.',
    signatureMove: 'One stable counter / creator relationship makes many small shots feel like a continuous real visit.',
    shots: [
      { n: 1, role: 'Context', framing: 'handheld medium', camera: 'subtle phone drift', action: 'creator receives dish', why: 'Locates creator, food and stall in one spatial rule.' },
      { n: 2, role: 'Food proof', framing: 'close / macro', camera: 'fixed-ish handheld', action: 'steam / cheese / utensil detail', why: 'Makes the food tactile.' },
      { n: 3, role: 'Reaction', framing: 'medium close', camera: 'handheld', action: 'one bite + small heat reaction', why: 'Human response validates the food without scripted overacting.' },
      { n: 4, role: 'Environment insert', framing: 'detail', camera: 'fixed', action: 'one supporting market cue', why: 'Adds place without resetting the scene.' },
      { n: 5, role: 'Finish', framing: 'medium', camera: 'handheld', action: 'short natural line / satisfied settle', why: 'Feels like a real social ending rather than a commercial logo beat.' }
    ],
    causal: ['Mixed practical light and exposure breathing create device authenticity.', 'No background faces posing reduces synthetic staging.', 'Live sound gives more realism than adding cinematic music.' ],
    rhythm: 'Receive → inspect → taste → context → finish.',
    references: 'Creator identity and one location / food reference; background should remain secondary.',
    motion: ['handheld','focus breathing','UGC','ambient motion'],
    transfer: 'Restaurants, retail visits, tourism, event coverage, creator content and experiential case studies.',
    risks: ['cinematic gimbal look','background people staring at camera','overacting','counter layout drift']
  }),

  'digest-idol-homevideo': analysis({
    collections: ['case-study-motion','camera','transitions'],
    thesis: 'The story builds anticipation through mundane preparation details; withholding the main event makes the final threshold crossing emotionally useful.',
    signatureMove: 'The film ends at the moment of entering the event rather than showing the spectacle itself.',
    shots: [
      { n: 1, role: 'Private preparation', framing: 'mirror / room medium', camera: 'consumer-camcorder static/handheld', action: 'styling / recurring prop', why: 'Creates personal access.' },
      { n: 2, role: 'Transition', framing: 'vehicle window / profile', camera: 'handheld', action: 'subject watches outside', why: 'Physical travel advances story without exposition.' },
      { n: 3, role: 'Empty-before-full', framing: 'venue detail', camera: 'fixed', action: 'rehearsal / equipment interaction', why: 'Empty space creates anticipation through contrast.' },
      { n: 4, role: 'Threshold', framing: 'backstage', camera: 'handheld follow', action: 'crowd becomes audible beyond curtain', why: 'Sound reveals scale before image does.' },
      { n: 5, role: 'Payoff', framing: 'rear follow', camera: 'single follow move', action: 'subject steps into light', why: 'Stops at the strongest emotional transition.' }
    ],
    causal: ['Camcorder imperfection is motivated by private-memory framing.', 'Recurring object/detail gives visual continuity.', 'Audio grows from private room tone to crowd energy.' ],
    rhythm: 'Private → transit → rehearsal → threshold → enter.',
    references: 'Identity/wardrobe reference essential; environment can change by shot because story progression requires it.',
    motion: ['camcorder','handheld','threshold transition','audio escalation'],
    transfer: 'Agency case studies, founder stories, launch BTS, events, employee films and creator documentaries.',
    risks: ['fake VHS overlays','identity drift across locations','showing too much spectacle','generic inspirational montage']
  }),

  'digest-werewolf': analysis({
    collections: ['fashion','brand-reveal','morphs','first-last-frame'],
    thesis: 'The transformation remains readable because a few small identity anchors survive the change and the mirror gives a fixed spatial reference.',
    signatureMove: 'One-body continuous metamorphosis instead of “human cut to creature”.',
    shots: [
      { n: 1, role: 'Identity lock', framing: 'rear / mirror medium', camera: 'slow push', action: 'subject touches hair / looks at mirror', why: 'Mirror establishes both body and reflected identity before VFX.' },
      { n: 2, role: 'Metamorphosis', framing: 'mirror close-up', camera: 'locked', action: 'single material cue spreads through body', why: 'Fixed camera makes continuity errors easier to perceive, so transformation feels more physical.' },
      { n: 3, role: 'Final state', framing: 'three-quarter', camera: 'static', action: 'creature settles in same spatial direction', why: 'Maintains causal connection to the human starting pose.' }
    ],
    causal: ['Mirror acts as spatial continuity check.', 'Accessories / silhouette function as identity anchors.', 'Warm practical environment contrasts with cool transformation material.' ],
    rhythm: 'Human calm → transformation event → creature calm.',
    references: 'Identity image plus optional final-frame creature target is ideal.',
    motion: ['continuous morph','mirror','first-last-frame','slow push'],
    transfer: 'Fashion reveals, gaming characters, rebrands, product material changes and before/after transformations.',
    risks: ['second creature spawning','face swap instead of morph','mirror mismatch','accessory teleportation']
  }),

  'digest-seattle-chase': analysis({
    collections: ['case-study-motion','transitions','camera','match-cut'],
    thesis: 'The final static office beat is memorable specifically because the preceding clips are aggressively kinetic.',
    signatureMove: 'Maximum motion contrast: chase energy collapses into a deadpan static payoff.',
    shots: [
      { n: 1, role: 'Mission object', framing: 'macro', camera: 'fixed', action: 'object grabbed', why: 'Gives the chase a concrete purpose.' },
      { n: 2, role: 'Escape', framing: 'rear / side action', camera: 'handheld follow', action: 'runner exits and clears obstacle', why: 'Immediate body motion establishes urgency.' },
      { n: 3, role: 'Peak speed', framing: 'low lateral', camera: 'tracking', action: 'runner crosses urban geometry', why: 'Lateral motion reads speed clearly and cuts cleanly.' },
      { n: 4, role: 'Deadpan payoff', framing: 'wide office', camera: 'completely static', action: 'runner enters and calmly places intact object', why: 'Camera and acting both contradict the previous energy, creating humor / memorability.' }
    ],
    causal: ['One mission object ties otherwise separate locations together.', 'Different camera grammar per phase creates escalation.', 'Room tone replacing action audio makes the payoff land.' ],
    rhythm: 'Hook → accelerate → peak → hard calm.',
    references: 'Object reference is more important than city style; runner identity should be locked across generated clips.',
    motion: ['handheld chase','lateral track','hard contrast','match-cut potential'],
    transfer: 'Case films, service metaphors, logistics, tech launches, agency reels and campaign shorts.',
    risks: ['object changes shape','runner wardrobe drift','overloaded single 15s generation','final frame still too busy']
  }),

  'digest-1950s-drama': analysis({
    collections: ['fashion','case-study-motion','camera'],
    thesis: 'Period credibility is generated through blocking, aspect ratio, lens behavior and camera restraint—not by adding scratches or a sepia filter.',
    signatureMove: 'Classical master / reverse / reaction / tracking grammar applied consistently.',
    shots: [
      { n: 1, role: 'Master', framing: '4:3 wide', camera: 'fixed / dolly-stable', action: 'formal interception and bow', why: 'Lets period blocking play in real space.' },
      { n: 2, role: 'Plea', framing: 'reverse medium close', camera: 'imperceptible dolly', action: 'dialogue', why: 'Subtle push provides emphasis without modern coverage style.' },
      { n: 3, role: 'Decision', framing: 'reaction close-up', camera: 'fixed', action: 'expression warms', why: 'Performance becomes the edit point.' },
      { n: 4, role: 'Resolution', framing: 'balanced two-shot', camera: 'smooth lateral truck', action: 'prop handoff and walking', why: 'Classical movement closes the interaction in one composed frame.' }
    ],
    causal: ['4:3 geometry changes staging choices.', 'Deep-focus master + soft close-ups mimic studio grammar.', 'Restrained camera prevents the period world from feeling like modern content with a filter.' ],
    rhythm: 'Master → dialogue → reaction → departure.',
    references: 'Wardrobe / character references help; environment must exclude modern visual contamination.',
    motion: ['classical dolly','static reaction','lateral truck','blocking'],
    transfer: 'Editorial fashion, heritage brands, luxury storytelling and any campaign using historical visual grammar.',
    risks: ['modern handheld motion','fake film damage','anachronistic props','period wardrobe drift']
  }),

  'digest-tennis': analysis({
    collections: ['sports','brand-reveal','logo-motion','freeze','camera'],
    thesis: 'Peak athletic action becomes a product-inspection moment when time freezes; the final ball arrangement turns sport physics into brand composition.',
    signatureMove: 'Freeze at the exact service-contact pose, then resume into a brand-shaped endpoint.',
    shots: [
      { n: 1, role: 'Build motion', framing: 'medium athlete', camera: 'tracking', action: 'serve preparation', why: 'Creates enough kinetic context for the freeze to feel dramatic.' },
      { n: 2, role: 'Feature inspection', framing: 'overhead peak pose', camera: 'fixed', action: 'time visually freezes', why: 'Apparel, racket and footwear become readable without a separate product cutaway.' },
      { n: 3, role: 'Release energy', framing: 'side', camera: 'track', action: 'serve completes / ball crosses court', why: 'Resuming time makes the freeze feel intentional rather than a still image.' },
      { n: 4, role: 'Brand endpoint', framing: 'overhead graphic', camera: 'fixed', action: 'balls roll / settle into symbol', why: 'Physical objects create a brand frame that can be finished with exact typography in post.' }
    ],
    causal: ['Freeze creates hierarchy inside fast action.', 'Overhead view converts court / balls into graphic design.', 'Golden-hour backlight adds premium energy without complex set design.' ],
    rhythm: 'Build → freeze → release → graphic resolve.',
    references: 'Athlete identity plus exact apparel / equipment references. Final brand geometry should use a reference or be composited in post.',
    motion: ['freeze','tracking','overhead graphic','object choreography'],
    transfer: 'Sportswear, footwear, watches, performance tech and motion identity built from real objects.',
    risks: ['freeze becoming ghost trail','duplicate athlete','ball teleportation','generated wordmark errors']
  })
};

export const CASE_SOURCE_POOLS = [
  {
    id: 'youmind-seedance',
    title: 'YouMind OpenLab — Awesome Seedance 2 Prompts',
    url: 'https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts',
    license: 'CC BY 4.0 repository',
    observedScale: '5,000+ prompts in the live corpus; GitHub README exposes a bounded subset',
    priority: 5,
    strategy: 'Use author/source attribution; ingest candidates, dedupe by source URL, then deep-review video before promotion.'
  },
  {
    id: 'yang-seedance-x',
    title: 'yangyuwen-bri — Seedance Prompt Library',
    url: 'https://github.com/yangyuwen-bri/seedance-prompt-library',
    license: 'Public research corpus; preserve original X source attribution and review source terms',
    observedScale: '4,000+ prompt/video posts collected from X',
    priority: 5,
    strategy: 'High-volume discovery pool. Do not treat engagement as quality; rank by design/commercial/motion relevance.'
  },
  {
    id: 'lanshu-video-kit',
    title: 'cclank — Lanshu Awesome AI Video Kit',
    url: 'https://github.com/cclank/lanshu-awesome-ai-video-kit',
    license: 'Review repository license per imported item',
    observedScale: '543 video prompts across 15 models, including Seedance and cross-model patterns',
    priority: 4,
    strategy: 'Use as pattern-discovery and cross-model motion-language source; retain source model metadata.'
  },
  {
    id: 'evolink-seedance',
    title: 'EvoLinkAI community Seedance corpus',
    url: 'https://github.com/EvoLinkAI/awesome-seedance-2.0-prompts',
    license: 'Verify repository license before verbatim ingestion',
    observedScale: '164 curated community prompts reported by downstream guides',
    priority: 3,
    strategy: 'Use only source-verifiable entries; dedupe aggressively against YouMind/X collections.'
  },
  {
    id: 'behance-motion-2026',
    title: 'Behance 2026 Motion / SaaS / Brand cases',
    url: 'https://www.behance.net/search/projects?search=motion%20design%202026',
    license: 'Source-only analysis; no bulk reproduction',
    observedScale: 'Open-ended design-case discovery pool',
    priority: 5,
    strategy: 'Use for visual grammar, shot roles and hybrid AI+AE/C4D workflows; only quote minimal source text.'
  }
];

export const CASE_INTELLIGENCE_STATS = {
  reviewedPromptCases: Object.keys(CASE_INTELLIGENCE).length,
  deepReviewedCases: Object.values(CASE_INTELLIGENCE).filter(item => item.reviewStatus === 'deep-reviewed').length,
  collections: COLLECTIONS.length,
  sourcePools: CASE_SOURCE_POOLS.length
};
