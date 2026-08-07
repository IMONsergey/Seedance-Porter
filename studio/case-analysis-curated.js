// Bespoke analysis overlay for the 24 curated Digest cases.
// IMPORTANT: every current entry is prompt-reviewed, not deep-reviewed.
// We analyze the published prompt + source preview. Full-video observation must be
// completed before `reviewStatus` may become `deep-reviewed`.

const promptReviewed = (value) => ({
  reviewStatus: 'prompt-reviewed',
  evidence: {
    prompt: 'reviewed',
    preview: 'reviewed',
    fullVideo: 'pending-visual-review',
    note: 'Analysis is grounded in the published prompt and source preview. It does not claim unobserved full-video details.'
  },
  ...value
});

export const CURATED_CASE_ANALYSIS = {
  'digest-japanese-romance': promptReviewed({
    thesis: 'The prompt converts an internal emotion into small observable physical changes instead of relying on a generic “romantic mood”.',
    signatureMove: 'Shared space → individual reaction → intimate shared payoff, while acting intensity stays deliberately low.',
    rhythm: 'Slow establish → held reaction → still emotional payoff.',
    causalMechanics: [
      'The first shared composition establishes spatial relationship before the edit asks the viewer to read micro-expression.',
      'Breathing, gaze, grip and hesitation are concrete performance events, so the model has visible behavior to generate instead of abstract emotion.',
      'The camera becomes quieter as the emotional uncertainty resolves, concentrating attention on faces rather than motion.'
    ],
    referenceStrategy: 'Lock both character identities and wardrobe. Keep classroom geometry simple; character continuity matters more than adding style references.',
    motionLanguage: ['slow push-in','static reaction','micro-performance'],
    shotFunctions: [
      ['Establish tension','medium two-shot','very slow push-in','Writing and quiet observation share one frame.','The viewer must understand who is watching whom before close-ups begin.'],
      ['Reveal hidden intent','close-up','static','A glance, grip change and breathing shift expose hesitation.','Micro-actions make the emotion legible without melodrama.'],
      ['Emotional payoff','intimate two-shot / close','static','Eye contact and restrained dialogue resolve the setup.','Stopping camera motion makes the emotional beat feel more important than spectacle.']
    ]
  }),
  'digest-haute-couture-porcelain': promptReviewed({
    thesis: 'One material identity—blue-and-white porcelain—acts as costume, transition rule and world-building system, so the surreal transformation stays coherent.',
    signatureMove: 'The next form inherits color, gloss and graphic DNA instead of becoming an unrelated VFX object.',
    rhythm: 'Material read → trigger → scale expansion.',
    causalMechanics: [
      'The minimal reflective environment gives the viewer time to understand garment silhouette and surface before transformation.',
      'A single human gesture supplies a clear causal trigger for a very complex visual event.',
      'Reflection doubles the transformation while preserving the same concept rather than introducing a second visual idea.'
    ],
    referenceStrategy: 'Use a strict model/wardrobe reference and optionally a first-frame fashion still. Material continuity is more valuable than many style references.',
    motionLanguage: ['material morph','locked trigger beat','overhead scale expansion'],
    shotFunctions: [
      ['Declare material system','low full-body editorial','slow push / compressed lens','Model walks while the liquid-porcelain garment is fully readable.','The transformation only feels meaningful after the viewer understands the original material rule.'],
      ['Trigger transformation','face / upper-body close','locked','One crisp gesture breaks the garment into related forms.','A simple trigger makes the complex effect causally understandable.'],
      ['Expand brand world','high overhead','descending move','The transformed forms enter the reflective plane and become a larger abstract system.','The final beat upgrades a garment trick into a campaign-scale brand image.']
    ]
  }),
  'digest-modern-rural': promptReviewed({
    thesis: 'The prompt treats tactile craft evidence as the hero: detail first, one precise hand action second, calm human payoff last.',
    signatureMove: 'Macro material proof is structural, not decorative B-roll.',
    rhythm: 'Detail → action → rest.',
    causalMechanics: [
      'Macro framing turns moisture, surface texture and ingredient state into immediate realism cues.',
      'One readable preparation task gives the middle beat causal satisfaction without overloading hands or props.',
      'A quiet ending converts process energy into a controlled lifestyle feeling.'
    ],
    referenceStrategy: 'One environment/product reference is enough. Excess style references would weaken the documentary-craft character.',
    motionLanguage: ['extreme macro','lateral work-surface track','static payoff'],
    shotFunctions: [
      ['Sensory hook','extreme macro','static','Surface moisture and ingredient detail establish tactility.','Texture creates the premium signal before any narrative action.'],
      ['Proof of craft','work-surface detail','lateral track','One preparation action changes the ingredient state.','A single task is easy to read and keeps hands/props stable.'],
      ['Lifestyle resolve','medium','static','The maker pauses with the finished result.','Stillness lets the viewer absorb the result rather than ending on another process cut.']
    ]
  }),
  'digest-street-racing': promptReviewed({
    thesis: 'The sequence creates speed before the exterior chase by using cockpit tension and road anticipation as a pre-load.',
    signatureMove: 'Interior tension → road reveal → lateral speed proof → low static hero pass.',
    rhythm: 'Pre-load → reveal → accelerate → pass.',
    causalMechanics: [
      'A small grip/preparation cue creates tension without needing immediate high-speed action.',
      'Side tracking makes velocity readable while preserving vehicle body proportions.',
      'A static final camera makes the pass feel faster by contrast with the moving shots.'
    ],
    referenceStrategy: 'Exact vehicle geometry is essential. If using a camera-motion video reference, give it only the camera job and never product identity.',
    motionLanguage: ['cockpit detail','side tracking','locked low pass','controlled motion blur'],
    shotFunctions: [
      ['Pre-load','tight cockpit detail','static','Driver/controls prepare for launch.','The viewer feels imminent acceleration before the car moves.'],
      ['Orient the road','over-shoulder / windshield','slow push','The road opens ahead.','Spatial orientation prevents the next fast exterior cut from feeling arbitrary.'],
      ['Prove speed','exterior profile','side tracking','Vehicle accelerates while silhouette remains readable.','Parallel camera motion conveys speed without deforming the product.'],
      ['Hero payoff','ultra-low roadside','locked','Vehicle passes and exits through a strong environmental frame.','Locked camera turns velocity into a clean final campaign beat.']
    ]
  }),
  'digest-mini-skincare': promptReviewed({
    thesis: 'Miniature scale lets one product inhabit multiple campaign worlds while the ambassador acts as a constant scale reference.',
    signatureMove: 'The human figure becomes a scale indicator for the pack instead of a conventional spokesperson.',
    rhythm: 'Scale surprise → repeat the rule → commercial packshot.',
    causalMechanics: [
      'The first impossible scale relationship is understood instantly because a familiar human figure stands beside the pack.',
      'Repeating the same scale rule in a second surface validates the visual system instead of making it a one-off gag.',
      'The final real-scale product frame grounds the surreal setup in commerce.'
    ],
    referenceStrategy: 'Lock the exact pack and one ambassador identity. Add explicit relative-scale and contact-shadow constraints.',
    motionLanguage: ['miniature scale','macro surface travel','packshot push'],
    shotFunctions: [
      ['Scale hook','macro accessory world','static','Miniature ambassador appears beside the hero product.','The first frame must teach the scale rule immediately.'],
      ['Extend the rule','macro surface detail','slow lateral track','The same ambassador/product relationship moves to another brand surface.','Repetition proves continuity and makes the idea feel like a campaign system.'],
      ['Resolve to commerce','packshot','slow push','The product settles into a clean hero composition.','The fantasy ends with an asset that can actually carry copy and CTA.']
    ]
  }),
  'digest-radiance-serum': promptReviewed({
    thesis: 'Architecture pre-sells brand values, then skin demonstrates benefit, then the pack inherits both the material and lighting language.',
    signatureMove: 'Brand world → human benefit → hero object.',
    rhythm: 'World → benefit → product.',
    causalMechanics: [
      'Monumental pale architecture signals premium calm before the SKU appears.',
      'One skin-touch action converts abstract “radiance” into a visible benefit cue.',
      'The same warm directional light links stone, skin and glass so the three shots feel like one brand world.'
    ],
    referenceStrategy: 'Exact product pack is non-negotiable. Use architecture as an environment reference only if it serves the brand-world job.',
    motionLanguage: ['slow architectural pan','static beauty close-up','macro product push'],
    shotFunctions: [
      ['Establish brand world','wide architecture','slow pan','Light moves through stone and fabric.','The environment communicates luxury before product evidence appears.'],
      ['Prove benefit','profile close-up','static','One gentle touch highlights illuminated skin texture.','The benefit becomes human and specific rather than an abstract claim.'],
      ['Commercial resolve','macro packshot','slow push-in','Serum pack rests on a material surface with restrained refraction.','The pack arrives already carrying the visual values established earlier.']
    ]
  }),
  'digest-fish-ad': promptReviewed({
    thesis: 'The process remains satisfying because each beat advances an irreversible physical state: raw → prepared → cooked → plated.',
    signatureMove: 'Every shot proves a state change instead of repeating generic food beauty shots.',
    rhythm: 'Raw → prepare → transform → serve.',
    causalMechanics: [
      'Water provides an immediate freshness cue and believable micro-physics.',
      'Hands create craft and scale while one action per beat protects continuity.',
      'Steam/sizzle make the cooking state visually and sonically different from preparation.'
    ],
    referenceStrategy: 'Use a branded food/package reference only when needed. Otherwise prioritize consistent kitchen/work-surface geometry.',
    motionLanguage: ['food macro','process cut','heat/steam event','hero push'],
    shotFunctions: [
      ['Freshness proof','macro','static','Raw ingredient is cleaned / shown with water.','The opening establishes believable freshness and surface detail.'],
      ['Preparation','hand detail','lateral / restrained','One seasoning/prep action changes the surface.','The viewer sees a causal step, not decorative kitchen movement.'],
      ['Transformation','cooking close-up','static','Heat changes color/texture while steam or oil reacts.','This is the highest-value sensory state change in the sequence.'],
      ['Hero result','plated close-up','slow push','Finished dish settles with visible freshness cues.','The endpoint is meaningful because the viewer has seen how it was produced.']
    ]
  }),
  'digest-moxie-curl': promptReviewed({
    thesis: 'The product earns every appearance because the sequence is organized around a demonstrable before/application/after benefit.',
    signatureMove: 'Condition → product texture → hair physics proof → editorial packshot.',
    rhythm: 'Problem → product → proof → hero.',
    causalMechanics: [
      'A small frizz/texture cue creates a before-state without requiring generated claim text.',
      'Macro cream viscosity makes the formula tactile and premium.',
      'Hair-strand response visualizes the benefit where it physically matters.'
    ],
    referenceStrategy: 'Lock exact pack geometry/label and a hair/identity reference. Stable curl silhouette and pack proportions should be explicit anchors.',
    motionLanguage: ['macro dispense','hair-strand physics','restrained packshot'],
    shotFunctions: [
      ['Problem cue','medium beauty','static','Hair condition is visible before application.','The product needs a clear reason to enter the story.'],
      ['Texture proof','macro','push-in','Cream dispenses into the hand.','Viscosity and hand pressure communicate formulation quality.'],
      ['Benefit proof','hair close-up','static','Product is worked through one curl section.','Visible hair response is stronger evidence than generic “glow” language.'],
      ['Campaign frame','pack hero','slow restrained move','Pack settles with ingredient/material cues.','The sequence ends in a reusable brand asset.']
    ]
  }),
  'digest-gold-morph': promptReviewed({
    thesis: 'The prompt gives the model freedom over silhouette but removes freedom over material, light and continuity, turning open-ended morphing into a designed system.',
    signatureMove: 'Continuous transformation never fully rests until it returns to the exact starting state.',
    rhythm: 'Measured morph → acceleration → exact return.',
    causalMechanics: [
      'Fixed camera isolates transformation as the only major changing variable.',
      'Gold color/reflectivity/curvature act as invariants that suppress random visual jumps.',
      'A return-to-origin endpoint converts generative exploration into usable looping identity motion.'
    ],
    referenceStrategy: 'Best with first/last-frame or logo-silhouette anchors; character references are unnecessary.',
    motionLanguage: ['fixed macro','continuous morph','material inheritance','seamless loop'],
    shotFunctions: [
      ['Define invariant','centered macro','fixed','A molten-gold seed form establishes material DNA.','The viewer needs to learn what must remain constant before forms begin changing.'],
      ['Association chain','same frame','fixed','Shapes continuously transform while retaining gold material/light behavior.','No cuts force coherence to come from inherited physical properties.'],
      ['Loop closure','same frame','fixed','The final transformation returns to the original seed.','Matching endpoint makes the result useful as identity motion rather than a one-way demo.']
    ]
  }),
  'digest-camera-minimal': promptReviewed({
    thesis: 'The lesson is subtraction: when the approved image already owns composition/style, the prompt should spend tokens only on motion and endpoint.',
    signatureMove: 'One camera move plus plausible micro-motion, nothing else.',
    rhythm: 'Continuous restrained motion.',
    causalMechanics: [
      'Not re-describing the source image reduces the model’s incentive to redesign approved art direction.',
      'One camera action reduces geometry drift.',
      'A clear endpoint makes the clip easier to use as a website hero or loop.'
    ],
    referenceStrategy: 'One approved key visual should do almost all appearance work; avoid redundant style references.',
    motionLanguage: ['single push-in','micro-motion','image-to-video'],
    shotFunctions: [
      ['Animate approved design','source composition','single slow push-in','Only physically plausible environmental/material micro-motion is added.','The model has fewer opportunities to change typography, layout or product geometry.']
    ]
  }),
  'digest-fisheye-dancer': promptReviewed({
    thesis: 'A severe optical rule acts like a visual identity system, so varied body movement still feels coherent.',
    signatureMove: 'The performer deliberately enters the distorted near-lens space, making optics part of choreography.',
    rhythm: 'Approach → lens interaction → release into full-body motion.',
    causalMechanics: [
      'Fisheye distortion supplies a consistent youth/street visual signature across shots.',
      'Low perspective amplifies movement without needing multiple VFX concepts.',
      'A single lens interaction creates a memorable social hook.'
    ],
    referenceStrategy: 'Lock identity and wardrobe. A camera reference may control movement/lens feel only; it should not import subject matter.',
    motionLanguage: ['severe fisheye','backward track','lens interaction','low lateral move'],
    shotFunctions: [
      ['Declare lens language','low wide fisheye','backward track','Performer approaches the lens.','Perspective stretch immediately establishes the campaign grammar.'],
      ['Break the fourth wall','extreme close-up','static','One controlled interaction touches/grabs the lens area.','Direct lens interaction turns the optical treatment into a memorable action.'],
      ['Movement proof','low full-body','lateral track','A compact dance phrase expands motion while lens behavior stays stable.','The system remains coherent because optics—not random edits—provide identity.']
    ]
  }),
  'digest-beauty-advent': promptReviewed({
    thesis: 'The unboxing is legible because hierarchy is explicit: person → master pack → item → person+item, with focus transfer doing transition work.',
    signatureMove: 'Autofocus shifts replace flashy transitions.',
    rhythm: 'Face → pack → item → face + item.',
    causalMechanics: [
      'A mostly fixed camera protects product geometry across several interactions.',
      'Focus breathing adds device authenticity while guiding attention.',
      'Sequential reveal prevents the model from inventing many products simultaneously.'
    ],
    referenceStrategy: 'Use an exact gift-set image; creator identity is optional unless campaign continuity requires the same person.',
    motionLanguage: ['fixed creator framing','focus transfer','single-object unboxing','subtle final push'],
    shotFunctions: [
      ['Human hook','fixed medium close','static / phone-like','Creator establishes gaze and reaches below frame.','A familiar social grammar makes the later product handling feel less staged.'],
      ['Master pack reveal','same framing','static + focus shift','Gift set enters and rotates once.','The viewer understands the parent object before individual SKUs appear.'],
      ['Item proof','product close-up','static','One compartment opens and one item is revealed.','A single mechanical interaction supplies credibility without overloading hands.'],
      ['Endorsement frame','medium close','subtle push','Final item is held beside the face.','Returns the product to human scale and closes the hierarchy.']
    ]
  }),
  'digest-suitcase': promptReviewed({
    thesis: 'The commercial is commercially useful because every beat proves one physical feature and can also survive as a standalone PDP/social clip.',
    signatureMove: 'One feature = one shot = one mechanical action.',
    rhythm: 'Feature ladder → clean hero.',
    causalMechanics: [
      'Macro crops isolate mechanical proof and reduce background instability.',
      'Click/extension/rolling actions translate specifications into visible evidence.',
      'One master product reference prevents feature shots from drifting into different SKUs.'
    ],
    referenceStrategy: 'Exact product reference is mandatory. Use storyboard/reference order only when feature sequencing matters.',
    motionLanguage: ['feature macro','mechanical action','parallel tracking','static product hero'],
    shotFunctions: [
      ['Access proof','macro','static','Quick-access compartment opens once.','Shows a functional benefit with minimal ambiguity.'],
      ['Hardware proof','detail','small push','Latch/lock closes with a precise stop.','Mechanical sound/motion implies build quality.'],
      ['Extension proof','side detail','static','Handle extends linearly and stops.','Linear action is easy for both model and viewer to verify.'],
      ['Mobility proof','low side','lateral track','Wheels roll while camera moves in parallel.','Product geometry remains readable during motion.'],
      ['Hero','three-quarter product','static','Product rests in the premium environment.','Creates a clean endpoint for brand copy in post.']
    ]
  }),
  'digest-blender': promptReviewed({
    thesis: 'The structure combines creator trust with visible mechanical proof instead of asking dialogue to carry the whole ad.',
    signatureMove: 'Short claim → physical demo → macro mechanism → human confirmation → packshot.',
    rhythm: 'Claim → setup → proof → reaction → product.',
    causalMechanics: [
      'The spoken benefit appears before detail so viewers know what the demonstration is proving.',
      'A mechanism close-up replaces text-heavy feature explanation.',
      'Returning to the creator after the demo closes the proof loop.'
    ],
    referenceStrategy: 'Use exact product geometry; add creator identity only when a recurring campaign person matters. Keep dialogue short for lip-sync reliability.',
    motionLanguage: ['creator demo','ingredient handling','mechanism macro','static packshot'],
    shotFunctions: [
      ['Hook / claim','medium creator','static','Creator presents one product benefit.','The audience understands the value proposition immediately.'],
      ['Setup proof','top / three-quarter detail','static','Ingredients enter the device.','Shows capacity and operation without exposition.'],
      ['Core function','macro mechanism','push-in','Blending action visibly changes ingredient state.','The mechanical event is the strongest product-performance evidence.'],
      ['Human confirmation','medium creator','static','Creator tastes the result and reacts once.','Adds human validation after visible proof.'],
      ['Commerce','clean product hero','static','Device finishes alone/in clear hierarchy.','Supplies a reusable closing frame.']
    ]
  }),
  'digest-golden-serum': promptReviewed({
    thesis: 'Three premium material symbols—glass, viscous liquid and faceted mineral—carry the whole brand world without narrative clutter.',
    signatureMove: 'A single serum droplet bridges object, benefit and final jewel-like hero frame.',
    rhythm: 'Still life → liquid event → still hero.',
    causalMechanics: [
      'One warm-gold liquid color links all shots.',
      'Few objects keep caustics and reflections legible.',
      'A faceted pedestal amplifies light without adding a new semantic concept.'
    ],
    referenceStrategy: 'Exact serum pack reference; optional material reference only when viscosity/caustics are central.',
    motionLanguage: ['macro droplet','small push','static hero'],
    shotFunctions: [
      ['Object world','macro still life','static','Pack sits on pale material with restrained botanical cue.','The first beat establishes premium surface language.'],
      ['Benefit metaphor','extreme macro','push-in','One viscous droplet contacts skin/surface.','Surface tension visualizes richness more directly than text.'],
      ['Luxury hero','frontal product','static','Pack settles on a faceted clear pedestal.','The product becomes jewel-like while remaining compositionally clean.']
    ]
  }),
  'digest-fashion-mall': promptReviewed({
    thesis: 'The reusable lesson is not “more camera moves”; it is to generate clean retail action modules and create speed in the edit.',
    signatureMove: 'Motion energy comes from post-production transitions between stable generated modules.',
    rhythm: 'Enter → detail → look reveal → hero; edit supplies acceleration.',
    causalMechanics: [
      'Separating wardrobe/actions across clips prevents identity and outfit morphs.',
      'Retail reflections and mirrors naturally provide transition surfaces.',
      'Fast pacing is safer in post than asking one generation for whip, orbit, zoom and hyperlapse simultaneously.'
    ],
    referenceStrategy: 'Lock talent, wardrobe and hero accessory. Generate each outfit/state as a clean module; assemble transitions afterward.',
    motionLanguage: ['tracking module','mirror transition setup','match-cut setup','edit-driven pace'],
    shotFunctions: [
      ['Entrance','low full-body','forward track','Talent enters the retail environment.','Sets location and confidence without changing look.'],
      ['Selection detail','insert / detail','static','One garment/accessory interaction.','Provides a clean cutaway without wardrobe instability.'],
      ['Look reveal','mirror / side','lateral track','Final look becomes the dominant frame.','Mirror geometry creates a natural match-transition opportunity.'],
      ['Hero exit','front full-body','backward track','Talent moves toward camera with one hero accessory.','Ends in a stable campaign composition.']
    ]
  }),
  'digest-water-skincare': promptReviewed({
    thesis: 'One purity metaphor—water—repeats at different scales, linking abstract opener, product, human benefit and endpoint.',
    signatureMove: 'The same material metaphor changes scale instead of changing concept.',
    rhythm: 'Metaphor → product → benefit → symbol.',
    causalMechanics: [
      'A simple droplet/ripple gives motion without requiring complex camera choreography.',
      'Blue/white material continuity keeps four different shot functions semantically connected.',
      'A minimal abstract endpoint is safe for composited copy in post.'
    ],
    referenceStrategy: 'Exact jar reference; add model identity only when campaign continuity requires a recurring person.',
    motionLanguage: ['water ripple','vertical product reveal','beauty close-up','static symbolic endpoint'],
    shotFunctions: [
      ['Metaphor hook','extreme macro','static','Droplet impacts water and creates a controlled ripple.','Purity is communicated in one physical event.'],
      ['Product reveal','product medium','vertical reveal','Jar enters the same water/material language.','The metaphor is transferred directly to the SKU.'],
      ['Benefit','beauty close-up','static','One application action shows hydrated skin response.','Human use makes the material metaphor commercially meaningful.'],
      ['Symbolic endpoint','minimal graphic frame','static','One droplet/state settles against clean color.','Creates an uncluttered brand frame for typography in post.']
    ]
  }),
  'digest-soda-monster': promptReviewed({
    thesis: 'The product is causal: opening it changes both mascot emotion and the environment, so branding becomes story mechanics rather than decoration.',
    signatureMove: 'Bottle opening is the trigger for a lighting/world-state transformation.',
    rhythm: 'Low energy → discovery → transformation burst → hero.',
    causalMechanics: [
      'A muted before-state makes the color/energy change immediately legible.',
      'The mascot provides emotional continuity through the environment transformation.',
      'Bubbles/condensation keep the beverage physically present while the world changes.'
    ],
    referenceStrategy: 'Lock both mascot and bottle. Preserve room geometry so the transformation reads as the same world changing state.',
    motionLanguage: ['state transformation','bubble physics','character reaction','packshot settle'],
    shotFunctions: [
      ['Before state','medium mascot','slow push','Mascot sits in a muted room.','Creates emotional and color baseline.'],
      ['Trigger','mascot + product','static','Mascot discovers and opens the bottle.','One physical action explains the transformation.'],
      ['After state','wide','lateral / restrained','Room becomes colorful while mascot becomes active.','The benefit is visualized as environmental energy.'],
      ['Brand hero','mascot + pack','static','Celebration settles around the bottle.','Ends with both emotional payoff and product hierarchy intact.']
    ]
  }),
  'digest-night-market': promptReviewed({
    thesis: 'Authenticity comes from defining imperfections as a system—handheld drift, autofocus behavior, exposure response and live ambience—not from the word “UGC”.',
    signatureMove: 'A stable creator/counter relationship supports multiple informal detail shots without feeling like a new set each cut.',
    rhythm: 'Receive → inspect → taste → environment → finish.',
    causalMechanics: [
      'Mixed practical light plus exposure breathing creates a device-captured feel.',
      'Keeping background people incidental prevents the scene from looking staged for camera.',
      'Live environmental audio reinforces reality more than cinematic music would.'
    ],
    referenceStrategy: 'Lock creator identity and one location/food reference. Background detail should remain secondary to the counter relationship.',
    motionLanguage: ['natural handheld','focus breathing','small reframing errors','ambient motion'],
    shotFunctions: [
      ['Context','handheld medium','subtle drift','Creator receives food at a stable counter position.','Establishes spatial rule and creator/food hierarchy.'],
      ['Food proof','close / macro','handheld-static','Steam, utensil or texture becomes the focal event.','Tactile detail makes the food believable.'],
      ['Reaction','medium close','handheld','One bite and restrained heat/pleasure reaction.','Human response validates the product without commercial overacting.'],
      ['Place insert','environment detail','static-ish','One market cue adds context.','Expands location without resetting the scene.'],
      ['Finish','medium','handheld settle','Short natural line/reaction ends the visit.','The ending feels like real social content rather than a forced logo beat.']
    ]
  }),
  'digest-idol-homevideo': promptReviewed({
    thesis: 'Anticipation is built through mundane preparation details; the film withholds the main event until the final threshold crossing.',
    signatureMove: 'The payoff is entering the event, not showing the event itself.',
    rhythm: 'Private → transit → empty venue → threshold → enter.',
    causalMechanics: [
      'Camcorder imperfection is motivated by private-memory framing rather than applied as a decorative filter.',
      'Changing locations advances time while a stable identity/wardrobe keeps the story continuous.',
      'Audio can reveal crowd scale before the picture does, making the backstage threshold stronger.'
    ],
    referenceStrategy: 'Identity/wardrobe reference is essential. Environments may change by beat because location progression is part of the narrative.',
    motionLanguage: ['consumer camcorder','handheld memory framing','threshold follow','audio escalation'],
    shotFunctions: [
      ['Private preparation','mirror / room medium','camcorder static/handheld','Styling or preparation detail.','Creates personal access before public spectacle.'],
      ['Transit','vehicle profile/window','handheld','Subject travels toward venue.','Physical movement advances story without exposition.'],
      ['Empty-before-full','venue/rehearsal','static','One rehearsal/equipment interaction in empty space.','Contrast creates anticipation for the unseen audience.'],
      ['Threshold','backstage','handheld follow','Crowd becomes audible beyond curtain.','Sound reveals scale before image does.'],
      ['Payoff','rear follow','single follow','Subject steps into stage light.','Stops on the strongest emotional transition instead of diluting it with more spectacle.']
    ]
  }),
  'digest-werewolf': promptReviewed({
    thesis: 'A mirror and surviving visual anchors make a one-body metamorphosis easier to read as continuity rather than a cut to a different subject.',
    signatureMove: 'The same body transforms continuously while spatial orientation remains fixed.',
    rhythm: 'Human calm → transformation event → creature calm.',
    causalMechanics: [
      'The mirror creates a second spatial consistency check for pose and identity.',
      'Accessories/silhouette anchors help the viewer track continuity through the changing body state.',
      'A locked transformation camera prevents camera motion from hiding continuity failures.'
    ],
    referenceStrategy: 'Use an identity start image and, when possible, an explicit final-state target / last frame.',
    motionLanguage: ['mirror lock','continuous morph','single slow push','first-last-frame logic'],
    shotFunctions: [
      ['Identity lock','rear + mirror medium','slow push','Human subject settles in a clearly readable pose.','The viewer needs a strong starting identity before metamorphosis.'],
      ['Metamorphosis','mirror close','locked','One material/body cue spreads continuously through the same body.','Fixed camera makes the transformation read as physical continuity.'],
      ['Final state','three-quarter','static','Creature settles in the same spatial direction.','The endpoint remains causally connected to the original pose.']
    ]
  }),
  'digest-seattle-chase': promptReviewed({
    thesis: 'The comic/business payoff depends on motion contrast: a disproportionately kinetic middle collapses into a perfectly calm final beat.',
    signatureMove: 'Chase energy → dead-static office payoff.',
    rhythm: 'Hook → accelerate → peak → hard calm.',
    causalMechanics: [
      'One mission object provides continuity across different locations and action modules.',
      'Different camera grammar per phase creates escalation without needing random VFX.',
      'A silent/static end frame becomes memorable because every preceding beat trained the viewer to expect continued motion.'
    ],
    referenceStrategy: 'Lock the mission object and runner identity. Generate action as separate clips rather than one overloaded 15-second request.',
    motionLanguage: ['macro mission hook','handheld chase','lateral speed track','hard static contrast'],
    shotFunctions: [
      ['Mission object','macro','static','Object is grabbed / establishes purpose.','The chase needs a concrete reason that can survive location changes.'],
      ['Escape','rear / side action','handheld follow','Runner exits and clears one obstacle.','Immediate body movement creates urgency.'],
      ['Peak speed','low lateral','tracking','Runner crosses strong urban geometry.','Lateral motion reads speed and cuts cleanly.'],
      ['Deadpan payoff','wide office','completely static','Runner calmly places the intact object.','Camera and acting both contradict the chase, creating the memorable reversal.']
    ]
  }),
  'digest-1950s-drama': promptReviewed({
    thesis: 'Period credibility comes from aspect ratio, staging and camera restraint—not from simulated scratches or sepia treatment.',
    signatureMove: 'Classical master → reverse dialogue → reaction → balanced tracking resolution.',
    rhythm: 'Master → dialogue → reaction → departure.',
    causalMechanics: [
      '4:3 composition changes blocking and headroom, making the scene feel structurally period-specific.',
      'A stable master lets formal gestures play in real space before coverage begins.',
      'Subtle dolly emphasis and reaction shots reproduce classical studio grammar without modern handheld energy.'
    ],
    referenceStrategy: 'Wardrobe/character references help. Environment references must exclude modern visual contamination.',
    motionLanguage: ['classical dolly','static reaction','balanced two-shot','lateral truck'],
    shotFunctions: [
      ['Master','4:3 wide','stable dolly / static','Formal interception and bow play in full body.','Period blocking needs room to be read instead of being cut immediately.'],
      ['Dialogue plea','reverse medium close','imperceptible dolly','One restrained line is delivered.','A tiny push creates emphasis while keeping classical grammar.'],
      ['Decision','reaction close','static','Expression changes from assessment to warmth.','Performance—not camera movement—becomes the edit point.'],
      ['Resolution','balanced two-shot','smooth lateral truck','Prop handoff and departure occur in one composed action.','Closes the relationship spatially and stylistically.']
    ]
  }),
  'digest-tennis': promptReviewed({
    thesis: 'Peak athletic action becomes a product-inspection moment when time freezes, then physical objects convert the sports world into a graphic brand endpoint.',
    signatureMove: 'Freeze at service-contact pose → resume energy → overhead object choreography.',
    rhythm: 'Build → freeze → release → graphic resolve.',
    causalMechanics: [
      'The moving setup creates enough kinetic context for the freeze to feel dramatic.',
      'Freezing the athlete exposes apparel/equipment detail without requiring a separate product cutaway.',
      'An overhead court view converts sport objects into graphic composition suitable for branding in post.'
    ],
    referenceStrategy: 'Lock athlete identity, apparel and equipment. Exact final wordmark/brand geometry should be referenced or composited after generation.',
    motionLanguage: ['tracking serve','time freeze','energy release','overhead object choreography'],
    shotFunctions: [
      ['Build motion','medium athlete','tracking','Serve preparation creates directional energy.','The viewer must feel motion before it can be meaningfully interrupted.'],
      ['Feature inspection','overhead peak pose','fixed','Time freezes at contact.','Pause turns performance into a product/detail-reading beat.'],
      ['Release energy','side / follow','tracking','Serve completes and ball travels.','Resuming time makes the freeze feel designed rather than a still frame.'],
      ['Brand endpoint','overhead graphic','fixed','Balls/objects settle into a controlled graphic arrangement.','Physical choreography creates a clean endpoint for exact branding in post.']
    ]
  })
};
