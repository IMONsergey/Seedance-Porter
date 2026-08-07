// Seedance Porter — Industry Digest
// Source prompt text is intentionally stored as a short excerpt with a direct link to the full original.
// The YouMind OpenLab corpus is marked CC BY 4.0 and preserves creator/source attribution.
// Porter Adaptations below are independently written production prompts derived from the underlying creative pattern.

export const DIGEST_META = {
  auditedAt: '2026-08-07',
  corpusTitle: 'YouMind OpenLab — Awesome Seedance 2 Prompts',
  corpusUrl: 'https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts',
  corpusLicense: 'CC BY 4.0',
  corpusLicenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  note: 'Digest cards preserve original creator/source attribution. Full original prompt is read at the linked source; Porter Adaptation is a separate reusable production prompt.'
};

export const INDUSTRY_DIGEST = [
  {
    id: 'digest-japanese-romance', title: 'Japanese Romance Micro-Performance', category: 'Narrative / Performance', subcategory: 'Micro acting', model: 'Seedance 2.0', aspect: '16:9', published: '2026-03-15', featured: true, designScore: 4,
    author: 'AIGC｜阳家豪', authorUrl: 'https://x.com/JiahaoYang_art', sourceUrl: 'https://x.com/JiahaoYang_art/status/2033119940216344616', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=1402',
    previewUrl: 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/7f63ad253175a9ad1dac53de490efac8/thumbnails/thumbnail.jpg',
    originalExcerpt: '15-second cinematic Japanese drama pure love ambiguous short film, ultra-realistic quality, warm golden sunlight in an empty classroom in the afternoon.',
    why: 'Useful reference for physicalizing emotion through breathing, gaze, fingers, pauses and tiny facial reactions instead of abstract mood words.',
    tags: ['micro-expression','dialogue','editorial','cinematic','performance'],
    variables: { characterA: 'a reserved student', characterB: 'a second student hiding affection', location: 'a quiet sunlit classroom', emotionalTurn: 'mutual realization without melodrama' },
    porterPrompt: `Core subjects: {{characterA}} and {{characterB}}. Scene/environment: {{location}}, with stable desk positions, warm directional window light and restrained background detail. Shot 1: one slow push-in from a medium two-shot while Character A performs a quiet repetitive task; show {{emotionalTurn}} through breathing, eye focus and one small hand movement. Shot 2: fixed close-up on Character B; one visible hesitation, one glance away, then a controlled return of eye contact. Shot 3: static intimate two-shot; both characters notice each other and physically settle rather than overacting. Visual style: naturalistic youth drama, subtle film texture, shallow depth without beauty-filter skin. Image quality: stable faces, hands and wardrobe. Audio: quiet room tone plus minimal environmental detail. Constraints: no subtitles, no duplicate characters, no exaggerated blush effects, no sudden camera changes.`
  },
  {
    id: 'digest-haute-couture-porcelain', title: 'Porcelain Couture → Ink Transformation', category: 'Fashion / Editorial', subcategory: 'Material transformation', model: 'Seedance 2.0', aspect: '16:9', published: '2026-02-23', featured: true, designScore: 5,
    author: 'John', authorUrl: 'https://x.com/johnAGI168', sourceUrl: 'https://x.com/johnAGI168/status/2025849650654122348', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=594',
    previewUrl: 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/e066fab457509bc6809ea212ae5d6a51/thumbnails/thumbnail.jpg',
    originalExcerpt: 'Hollywood Haute Couture Fantasy blockbuster, 8K ultra-clear, Photorealistic, High-fashion Editorial Style, Unreal Engine 5 fluid rendering, visual illusion.',
    why: 'Strong fashion-case pattern: a recognizable material system becomes the narrative device, then transforms into a second visual language.',
    tags: ['fashion','material','transformation','editorial','VFX'],
    variables: { garmentMaterial: 'liquid porcelain with cobalt ornament', transformation: 'a flock of ink-like birds', environment: 'a mirror-flat salt plain under storm clouds', finalState: 'an abstract monochrome fluid vortex' },
    porterPrompt: `Core subject: a high-fashion model wearing a sculptural garment made from {{garmentMaterial}}. Scene/environment: {{environment}} with a simple horizon and strong reflection logic. Shot 1: one low-angle push-in as the model walks slowly; preserve garment mass, surface response and body silhouette. Shot 2: locked close-up; the model stops and makes one crisp hand gesture, triggering {{transformation}} from the garment while preserving her body and face. Shot 3: one overhead descent as the transformed material enters the reflective surface and resolves into {{finalState}}. Visual style: luxury editorial campaign, photoreal material physics, restrained palette. Image quality: clean edges, coherent reflections, no garment/body fusion. Constraints: one model only, no invented typography or logos, transformation must inherit color/material cues from the previous state.`
  },
  {
    id: 'digest-modern-rural', title: 'Modern Rural Craft Commercial', category: 'Editorial / Lifestyle', subcategory: 'Craft process', model: 'Seedance 2.0', aspect: '16:9', published: '2026-02-12', featured: true, designScore: 4,
    author: 'John', authorUrl: 'https://x.com/johnAGI168', sourceUrl: 'https://x.com/johnAGI168/status/2021818021354848258', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=288',
    previewUrl: 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/ce508b28e505ffce07247e2ab036d6f1/thumbnails/thumbnail.jpg',
    originalExcerpt: 'Modern Rural Aesthetics, Cinematic Commercial quality, shot with Sony A7S3/cinema camera, 4K/8K ultra-clear, Extreme Macro, natural transparent lighting, healing ASMR.',
    why: 'A useful design-case structure: establish the maker, isolate one tactile craft action, then resolve into a quiet lifestyle payoff.',
    tags: ['craft','lifestyle','macro','ASMR','editorial'],
    variables: { maker: 'a contemporary maker in understated linen', craft: 'preparing a seasonal ingredient', environment: 'a minimal farmhouse kitchen opening to a garden', heroDetail: 'surface moisture and fine material texture' },
    porterPrompt: `Core subject: {{maker}} performing {{craft}}. Scene/environment: {{environment}}, clean but lived-in, natural daylight only. Shot 1: fixed macro composition on the source material; show {{heroDetail}} and one deliberate hand action. Shot 2: one lateral tracking move across the work surface while the maker performs a single precise craft step; keep tools and object positions consistent. Shot 3: static medium shot after the process is complete; allow steam, cloth movement or foliage to provide subtle motion. Visual style: modern rural editorial, tactile documentary realism, warm-neutral grade. Image quality: natural surface detail, believable hands and food/material physics. Audio: close ASMR texture plus quiet exterior ambience. Constraints: no rustic cliché props, no generated text, no rapid montage.`
  },
  {
    id: 'digest-street-racing', title: 'Street Racing Kinetic Sequence', category: 'Motion / Camera', subcategory: 'High-speed choreography', model: 'Seedance 2.0', aspect: '16:9', published: '2026-04-02', featured: false, designScore: 4,
    author: 'Pierrick Chevallier | IA', authorUrl: 'https://x.com/CharaspowerAI', sourceUrl: 'https://x.com/CharaspowerAI/status/2039651574297792688', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=2530',
    previewUrl: 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/3a7fb0a6d706b9f568479bb720ce1ad4/thumbnails/thumbnail.jpg',
    originalExcerpt: 'cinematic street racing sequence at night, a focused driver inside a high-performance car grips the steering wheel, intense eye focus, city lights reflecting.',
    why: 'Demonstrates escalation through shot-function changes: tension detail → road reveal → acceleration → speed abstraction.',
    tags: ['automotive','camera','speed','night','kinetic'],
    variables: { vehicle: 'a high-performance coupe', city: 'a wet neon financial district', trigger: 'the driver engages launch control', payoff: 'a clean hero pass through a tunnel exit' },
    porterPrompt: `Core subject: {{vehicle}} at night. Scene/environment: {{city}}, wet asphalt, clear lane geometry and controlled reflections. Shot 1: fixed interior close-up; driver tightens grip and prepares for {{trigger}}. Shot 2: one over-shoulder push-in toward the road as engine vibration builds. Shot 3: one exterior side-tracking move as acceleration begins; preserve exact vehicle geometry and wheel placement. Shot 4: locked ultra-low roadside angle for the {{payoff}}. Visual style: premium automotive launch film, realistic motion blur and reflections, restrained neon. Image quality: stable body panels, wheels, windows and lighting continuity. Audio: engine build, tire texture and one acceleration transient. Constraints: no camera teleportation, no vehicle morphing, no multiple camera moves inside one shot, no generated brand marks.`
  },
  {
    id: 'digest-mini-skincare', title: 'Miniature Ambassador Product World', category: 'Product / Beauty', subcategory: 'Scale play', model: 'Seedance 2.0', aspect: '9:16', published: '2026-08-06', featured: true, designScore: 5,
    author: 'Avelyrah', authorUrl: 'https://x.com/AvelyrahnAI', sourceUrl: 'https://x.com/AvelyrahnAI/status/2085232751699968019', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8549',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2085232483684040704/img/rQAxMqd5vcr_WMWt.jpg',
    originalExcerpt: 'Cinematic multi-scene commercial: Macro shot of a luxury taupe leather handbag, glowing golden zipper opens as a tiny woman in a white silk dress.',
    why: 'Scale inversion is immediately legible in campaign thumbnails and gives a product system multiple short social scenes without changing the hero SKU.',
    tags: ['skincare','miniature','campaign','product','social'],
    variables: { product: 'a premium serum bottle from [Image 1]', ambassador: 'one miniature brand ambassador', accessoryWorld: 'neutral leather accessories and polished stone', botanical: 'white flowers and translucent aloe forms' },
    porterPrompt: `Core subject: {{product}}, preserve exact bottle geometry, material and cap proportions from [Image 1]. Secondary subject: {{ambassador}}, always the same scale and wardrobe. Scene/environment: {{accessoryWorld}}. Shot 1: fixed macro view of an accessory opening; the miniature ambassador emerges carrying the product. Shot 2: one slow lateral track across a second accessory surface; maintain the same product/character scale relationship. Shot 3: one slow push-in to a clean product hero on a clear pedestal with {{botanical}}. Visual style: luxury beauty campaign with restrained magical realism. Image quality: crisp product edges, realistic contact shadows, coherent miniature scale. Constraints: no duplicate ambassador, no product redesign, no generated label copy; composite exact branding in post.`
  },
  {
    id: 'digest-radiance-serum', title: 'Architecture → Skin → Serum', category: 'Product / Beauty', subcategory: 'Luxury sequence', model: 'Seedance 2.0', aspect: '9:16', published: '2026-08-06', featured: true, designScore: 5,
    author: 'Avelyrah', authorUrl: 'https://x.com/AvelyrahnAI', sourceUrl: 'https://x.com/AvelyrahnAI/status/2085213286925266973', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8551',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2085212971555323904/img/-hEELc-AfZgY2Gvv.jpg',
    originalExcerpt: 'A cinematic 8k luxury skincare commercial sequence. It begins with a slow pan across a sunlit minimalist hallway featuring massive concrete pillars.',
    why: 'Classic brand-film grammar: architecture establishes values, skin demonstrates benefit, then packshot resolves the message.',
    tags: ['beauty','architecture','packshot','golden-hour','editorial'],
    variables: { product: 'a clear premium serum bottle from [Image 1]', architecture: 'monolithic pale stone and sheer fabric', benefit: 'calm hydrated luminosity', surface: 'light reflective travertine' },
    porterPrompt: `Core subject: {{product}} and one beauty model. Scene language: {{architecture}} with warm late-day light. Shot 1: one slow pan across the architectural space; keep it sparse and scale-consistent. Shot 2: fixed profile close-up of the model demonstrating {{benefit}} through natural skin texture and one gentle touch. Shot 3: one slow push-in to {{product}} on {{surface}}, with a single silk form and small refracted highlights. Visual style: quiet luxury skincare editorial, neutral warm grade, no CGI gloss. Image quality: realistic pores, glass, liquid and reflections. Constraints: exact product geometry, no invented label text, one model only, no floating decorative clutter, final branding handled in post.`
  },
  {
    id: 'digest-fish-ad', title: 'Ingredient-to-Plate Process Film', category: 'Food / Commercial', subcategory: 'Process storytelling', model: 'Seedance 2.0', aspect: '16:9', published: '2026-08-06', featured: false, designScore: 3,
    author: 'liana', authorUrl: 'https://x.com/Lianaalane', sourceUrl: 'https://x.com/Lianaalane/status/2085204051013304461', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8550',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2085203850819211264/img/N6enhcU4Vds6UZad.jpg',
    originalExcerpt: 'Create a 14-second cinematic fish cooking advertisement in 16:9 landscape, ultra-realistic 4K quality with warm cinematic lighting, rich food textures.',
    why: 'A clear reusable commercial arc: source material → transformation process → plated hero → human confirmation.',
    tags: ['food','process','macro','commercial','texture'],
    variables: { dish: 'a fresh hero dish', preparation: 'seasoning and high-heat cooking', kitchen: 'a clean contemporary kitchen', finish: 'a restrained plated presentation' },
    porterPrompt: `Core subject: {{dish}} progressing through {{preparation}}. Scene/environment: {{kitchen}} with warm motivated task lighting and a fixed work surface. Shot 1: static macro on the raw ingredient under running water; capture droplets and surface detail. Shot 2: one lateral tracking move across the preparation stage while hands perform a single coating or cutting action. Shot 3: fixed close-up on the cooking transformation; emphasize believable heat, steam and oil/water behavior. Shot 4: one slow push-in to {{finish}} with subtle steam. Visual style: premium food advertising, appetizing but natural color. Image quality: stable ingredient geometry, clean hands/tools, realistic liquid and heat physics. Constraints: no slogan generation, no impossible ingredient changes, no excessive slow motion.`
  },
  {
    id: 'digest-moxie-curl', title: 'Beauty Benefit Demonstration', category: 'Product / Beauty', subcategory: 'Haircare', model: 'Seedance 2.0', aspect: '9:16', published: '2026-08-05', featured: true, designScore: 5,
    author: 'shah_zadii', authorUrl: 'https://x.com/sha_zdiii', sourceUrl: 'https://x.com/sha_zdiii/status/2085010715862061224', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8555',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2085010649235480576/img/Uw5C6gfl9ukoy8hZ.jpg',
    originalExcerpt: 'Create an ultra-realistic 15-second premium beauty commercial featuring the uploaded MOXIE Beauty Super Defining Curl Cream exactly as provided.',
    why: 'Pairs strict pack fidelity with a visible before/after benefit and an editorial final packshot—very reusable for FMCG and beauty cases.',
    tags: ['haircare','beauty','benefit','packaging','macro'],
    variables: { product: 'the exact haircare pack from [Image 1]', hairType: 'natural textured curls', benefit: 'defined hydrated curl structure', ingredients: 'two or three abstract ingredient cues' },
    porterPrompt: `Core subject: {{product}}, exact packaging reference from [Image 1], plus one model with {{hairType}}. Shot 1: fixed medium close-up; model notices a specific hair condition without exaggerated acting. Shot 2: one macro push-in as the product dispenses into a palm; preserve viscosity and packaging geometry. Shot 3: fixed side close-up while product is worked through one section of hair; reveal {{benefit}} through realistic strand physics. Shot 4: one slow orbit around the product on a pale stone pedestal with {{ingredients}} used only as restrained environmental cues. Visual style: premium editorial beauty, natural skin and hair texture. Constraints: no pack redesign, no generated label changes, no duplicate product, no floating ingredient clutter, exact slogan added in post.`
  },
  {
    id: 'digest-gold-morph', title: 'Material Association Loop', category: 'VFX / Transitions', subcategory: 'Continuous morph', model: 'Seedance 2.0', aspect: '1:1', published: '2026-08-05', featured: true, designScore: 5,
    author: '妖精アーヤさん', authorUrl: 'https://x.com/aiehon_aya', sourceUrl: 'https://x.com/aiehon_aya/status/2084975640005292197', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8576',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084974470473887745/img/NK7AhWnpMYUAcAcV.jpg',
    originalExcerpt: 'Start with a drop of molten gold floating against a jet-black background and begin a chain of free associations.',
    why: 'Excellent motion-identity pattern: preserve material DNA while the silhouette changes, then close the loop. Useful for logo stings and brand worlds.',
    tags: ['morph','loop','material','brand-motion','macro'],
    variables: { material: 'molten brushed gold', motif: 'a compact abstract seed form', transformationRule: 'each form inherits curvature, reflectivity and color from the previous one', loopState: 'the original seed form' },
    porterPrompt: `Core subject: {{motif}} made entirely from {{material}} against a clean dark field. Camera: fixed macro composition for the whole clip. Continuous action: the object never cuts or teleports; it undergoes one uninterrupted chain of transformations. Rule: {{transformationRule}}. Each intermediate state must remain physically connected to the previous state and immediately begin becoming the next. Tempo starts measured and gradually increases without changing camera position. Final state: the transformation resolves seamlessly into {{loopState}} with matching silhouette and highlight direction. Visual style: premium abstract motion identity, photoreal material response, deep controlled blacks. Image quality: clean topology, coherent reflections, no melted noise. Constraints: no text, logos, people, cuts or unrelated color changes.`
  },
  {
    id: 'digest-camera-minimal', title: 'Minimal Commercial Camera Skeleton', category: 'Motion / Camera', subcategory: 'Prompt minimalism', model: 'Seedance 2.0', aspect: '16:9', published: '2026-08-05', featured: false, designScore: 4,
    author: 'AI Video Workflow', authorUrl: 'https://x.com/imagvio_video', sourceUrl: 'https://x.com/imagvio_video/status/2084952082902294812', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8563',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084952063486861312/img/DPo9ZzuBncAT2nN-.jpg',
    originalExcerpt: 'A cinematic commercial with natural camera movement, ultra-realistic lighting, smooth motion, premium quality.',
    why: 'A useful counterexample to overprompting: when the reference image already carries art direction, motion-only direction can be stronger.',
    tags: ['camera','minimal','I2V','commercial','motion'],
    variables: { source: 'the approved key visual in [Image 1]', motion: 'one slow controlled push-in', microMotion: 'subtle material and environmental micro-motion', endpoint: 'a stable final composition matching the source hierarchy' },
    porterPrompt: `Use [Image 1] as the exact visual source; do not redesign its subject, palette or composition. Core motion: {{motion}}. Add only {{microMotion}} where physically plausible. Preserve subject identity, product geometry, typography blocks and spatial hierarchy. Lighting should remain consistent with the source image; animate reflections or atmosphere only when already motivated. End state: {{endpoint}}. Image quality: crisp design edges, stable shapes, natural motion blur. Constraints: no new objects, no invented text, no secondary camera move, no unexpected depth rearrangement. This is an image-to-video motion instruction, not a new art-direction prompt.`
  },
  {
    id: 'digest-fisheye-dancer', title: 'Fisheye Street Editorial', category: 'Fashion / Editorial', subcategory: 'Youth culture', model: 'Seedance 2.0', aspect: '16:9', published: '2026-08-05', featured: false, designScore: 4,
    author: 'BMX', authorUrl: 'https://x.com/bmx_ai13', sourceUrl: 'https://x.com/bmx_ai13/status/2084854408286789707', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8500',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084758502803918848/img/s2xp6ZrVlwkFJNIc.jpg',
    originalExcerpt: 'A cinematic ultra realistic 15 second video in 16 9 aspect ratio shot on a severe fisheye lens A young male street dancer.',
    why: 'Shows how a strong optical rule can unify otherwise chaotic youth-culture motion and become a recognizable campaign device.',
    tags: ['fisheye','streetwear','dance','editorial','youth'],
    variables: { performer: 'one street performer in [Image 1]', location: 'a concrete skatepark with metallic graffiti accents', wardrobe: 'oversized sport-tech styling', gesture: 'one direct interaction with the lens' },
    porterPrompt: `Core subject: {{performer}}, exact identity and {{wardrobe}} from the reference. Scene/environment: {{location}}, hard midday light and graphic concrete planes. Optical rule: severe fisheye perspective throughout. Shot 1: one low backward tracking move as the performer approaches camera. Shot 2: fixed close-up; the performer makes {{gesture}} once, then releases. Shot 3: one low lateral track during a compact dance phrase; keep body mechanics realistic and readable. Visual style: street-fashion editorial, high-contrast color, authentic texture. Image quality: stable limbs, face and clothing, deliberate fisheye distortion only. Audio: heavy rhythmic bass without lyric text. Constraints: no camera spin plus pan inside one shot, no wardrobe change, no duplicate performer.`
  },
  {
    id: 'digest-beauty-advent', title: 'Beauty Unboxing Product Ladder', category: 'UGC / Marketing', subcategory: 'Beauty unboxing', model: 'Seedance 2.0', aspect: '16:9', published: '2026-08-04', featured: false, designScore: 4,
    author: 'BMX', authorUrl: 'https://x.com/bmx_ai13', sourceUrl: 'https://x.com/bmx_ai13/status/2084701148871832040', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8494',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084494928151986176/img/4JiuP6YoZODet3W8.jpg',
    originalExcerpt: 'Create a fifteen second ultra realistic social beauty vlog in a cinematic 16:9 frame, four K detail, thirty frames per second.',
    why: 'Strong ecommerce pattern: keep camera grammar simple, reveal products in a deliberate hierarchy and use focus transfer as the visual transition.',
    tags: ['UGC','beauty','unboxing','ecommerce','focus'],
    variables: { creator: 'one beauty creator', heroPack: 'a premium gift set from [Image 1]', itemA: 'a cleanser', itemB: 'a compact palette' },
    porterPrompt: `Core subjects: {{creator}} and {{heroPack}}. Scene/environment: bright lived-in room with one seasonal background cue and mixed cool window/warm practical light. Camera stays fixed at eye level with subtle phone-camera imperfections. Shot 1: creator establishes eye contact, then looks down toward the product. Shot 2: she lifts {{heroPack}} into frame and rotates it once; autofocus transfers from face to pack. Shot 3: fixed close-up as she opens one compartment and reveals {{itemA}}. Shot 4: fixed medium close-up as she reveals {{itemB}}, then returns gaze to camera. Visual style: believable premium social content, natural skin and object handling. Constraints: exact pack geometry, no extra items, no generated labels, no over-polished studio motion.`
  },
  {
    id: 'digest-suitcase', title: 'Feature-by-Feature Product Macro', category: 'Product / Packshot', subcategory: 'Durable goods', model: 'Seedance 2.0', aspect: '9:16', published: '2026-08-04', featured: true, designScore: 5,
    author: 'EcomBos', authorUrl: 'https://x.com/Ecombos_Ai', sourceUrl: 'https://x.com/Ecombos_Ai/status/2084686018104488168', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8506',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084685934402945024/img/mXfR09AJP--73pDA.jpg',
    originalExcerpt: 'Luxury cinematic commercial for the Monos Carry-On Pro in matte black. Premium 4K vertical product advertisement built from slow macro close-ups.',
    why: 'One of the most reusable ecommerce structures: every shot proves one physical feature, and all shots inherit one master product reference.',
    tags: ['product','ecommerce','macro','feature','packshot'],
    variables: { product: 'a premium hard-shell travel case from [Image 1]', featureA: 'quick-access compartment', featureB: 'precision latch or lock', featureC: 'telescopic handle', featureD: 'silent wheel system' },
    porterPrompt: `Core subject: {{product}}, exact master geometry from [Image 1]. Scene/environment: warm minimal interior with pale stone and soft daylight. Shot 1: fixed macro; demonstrate {{featureA}} with one clean hand interaction. Shot 2: one slow push-in on {{featureB}} completing a single mechanical action. Shot 3: fixed side detail as {{featureC}} extends to its final stop. Shot 4: one low lateral tracking move as {{featureD}} rolls across a smooth floor. Shot 5: fixed three-quarter product hero. Visual style: quiet luxury ecommerce film, tactile realism, shallow depth used selectively. Image quality: precise seams, shell texture and hardware. Constraints: no product redesign, no incorrect text/logo, no impossible hinges or duplicate hardware; exact branding composited or reference-locked.`
  },
  {
    id: 'digest-blender', title: 'Creator-Led Product Demo', category: 'UGC / Marketing', subcategory: 'Feature demo', model: 'Seedance 2.0', aspect: '9:16', published: '2026-08-04', featured: false, designScore: 4,
    author: 'Nyla Carter', authorUrl: 'https://x.com/TheAmmadFiles', sourceUrl: 'https://x.com/TheAmmadFiles/status/2084609046418788489', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8505',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084608926797152256/img/4XqJxUl8cTvM0xzJ.jpg',
    originalExcerpt: 'A beautiful young woman named Aria is standing in a bright, modern kitchen wearing a stylish cream outfit.',
    why: 'Combines spokesperson, product proof and final packshot in a single social-ad arc while keeping each action easy to verify visually.',
    tags: ['UGC','product-demo','kitchen','creator','social-ad'],
    variables: { creator: 'a confident creator', product: 'a portable appliance from [Image 1]', ingredients: 'three visually distinct ingredients', benefit: 'one concrete portability or speed benefit' },
    porterPrompt: `Core subjects: {{creator}} and {{product}}, with the product locked to [Image 1]. Scene: bright contemporary kitchen with natural window light. Shot 1: fixed medium close-up; creator introduces {{benefit}} in one short line while holding the product at chest height. Shot 2: fixed top/three-quarter product view; she adds {{ingredients}} in sequence with believable weight. Shot 3: one macro push-in on the device performing its core function; preserve blades, container and liquid physics. Shot 4: fixed medium shot; creator uses the result once and gives a restrained positive reaction. Shot 5: clean packshot. Constraints: no invented feature claims on screen, no malformed hands, no product/logo drift, dialogue concise and lip-syncable.`
  },
  {
    id: 'digest-golden-serum', title: 'Droplet-to-Pack Beauty System', category: 'Product / Beauty', subcategory: 'Macro liquid', model: 'Seedance 2.0', aspect: '9:16', published: '2026-08-04', featured: false, designScore: 5,
    author: 'Zyrella', authorUrl: 'https://x.com/Zyrellix', sourceUrl: 'https://x.com/Zyrellix/status/2084566509351735661', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8509',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084563534877429760/img/331mlq2jFWkKsSNL.jpg',
    originalExcerpt: 'Cinematic luxury skincare commercial. Starts with a clear glass dropper bottle containing golden serum on a white marble surface, surrounded by delicate white jasmine.',
    why: 'A compact symbolic system—liquid macro, skin contact, gemstone-like packshot—creates brand equity without needing a complex story.',
    tags: ['serum','liquid','macro','luxury','beauty'],
    variables: { product: 'a clear glass serum pack from [Image 1]', liquid: 'a translucent warm-gold serum', botanical: 'one restrained white botanical cue', pedestal: 'a faceted clear mineral pedestal' },
    porterPrompt: `Core subject: {{product}} containing {{liquid}}. Shot 1: fixed macro product composition on pale stone with {{botanical}} and a few real droplets; use warm directional light. Shot 2: one macro push-in as a single droplet leaves a pipette and contacts skin; show viscosity and surface tension, not magical glow. Shot 3: fixed frontal hero of {{product}} on {{pedestal}}, with shallow background bokeh and controlled caustics. Visual style: high-end skincare still-life translated into motion, minimal and tactile. Image quality: realistic glass, liquid, skin and refraction. Constraints: no extra bottles, no floating particles unless physically motivated, no generated label changes, no text or logo invention.`
  },
  {
    id: 'digest-fashion-mall', title: 'Retail Fashion Energy Edit', category: 'Fashion / Editorial', subcategory: 'Retail launch', model: 'Seedance 2.0', aspect: '9:16', published: '2026-08-04', featured: false, designScore: 4,
    author: 'Melina Vale', authorUrl: 'https://x.com/MelinaVale14', sourceUrl: 'https://x.com/MelinaVale14/status/2084530530310132179', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8502',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084530434000502784/img/A1LI8FdtV8S3zqV2.jpg',
    originalExcerpt: 'Ultra-cinematic luxury fashion commercial, IMAX-quality, 4K HDR, premium mall lighting, Vogue editorial aesthetic, extremely fast-paced editing, energetic pop soundtrack.',
    why: 'The source is deliberately maximal. The Porter version demonstrates how to retain retail energy while separating camera moves into clean, producible shots.',
    tags: ['fashion','retail','mall','edit','campaign'],
    variables: { talent: 'one fashion talent from [Image 1]', wardrobeSystem: 'one coordinated seasonal wardrobe family', retailSpace: 'a modern luxury retail atrium', heroAccessory: 'one hero bag or eyewear piece' },
    porterPrompt: `Core subject: {{talent}}, identity locked, moving through {{retailSpace}} in {{wardrobeSystem}}. Shot 1: one low forward tracking move through the entrance. Shot 2: fixed detail montage concept generated as a single shot—hands select {{heroAccessory}} and one garment; do not change outfit yet. Shot 3: one mirror-side lateral track revealing the final styled look. Shot 4: one forward hero track as talent exits into the atrium carrying the accessory. Visual style: contemporary luxury fashion retail, crisp reflections, energetic but controlled pacing. Image quality: stable face, wardrobe, bags and architecture. Constraints: no hyperlapse inside generated shots, no compound orbit/pan/zoom, no invented storefront logos, no sudden outfit morph; do match cuts in post.`
  },
  {
    id: 'digest-water-skincare', title: 'Purity Metaphor Beauty Film', category: 'Product / Beauty', subcategory: 'Water metaphor', model: 'Seedance 2.0', aspect: '9:16', published: '2026-08-04', featured: false, designScore: 4,
    author: 'ayzalnoor', authorUrl: 'https://x.com/ayzalnooor24521', sourceUrl: 'https://x.com/ayzalnooor24521/status/2084483345350889723', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8439',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084482970732384256/img/Zf28UpI6tFa95wCv.jpg',
    originalExcerpt: 'Create a 15-second ultra-luxury skincare commercial in photorealistic cinematic style. Open with a crystal-clear water droplet falling in slow motion into pure blue water.',
    why: 'A single material metaphor can connect opener, benefit shot and final brand frame without requiring complex narrative continuity.',
    tags: ['water','skincare','purity','macro','brand-metaphor'],
    variables: { product: 'a premium cream jar from [Image 1]', color: 'clean mineral blue', benefit: 'hydrated natural skin', endingSymbol: 'one suspended clear droplet' },
    porterPrompt: `Core subject: {{product}}. Color system: {{color}} with white and transparent materials. Shot 1: fixed macro; one clear droplet falls into water and creates a realistic ripple. Shot 2: one slow vertical reveal as {{product}} rises to the waterline; maintain mass, reflections and label geometry. Shot 3: fixed beauty close-up showing {{benefit}} through real texture and one gentle application gesture. Shot 4: static abstract end frame containing {{endingSymbol}} against the clean color field. Visual style: minimal luxury skincare, controlled highlights, no fantasy particles. Image quality: precise glass/plastic, water and skin physics. Constraints: no product duplication, no logo/text invention, no floating flowers unless reference-directed.`
  },
  {
    id: 'digest-soda-monster', title: 'Character-Led Beverage Transformation', category: '3D / Materials', subcategory: 'Branded character', model: 'Seedance 2.0', aspect: '16:9', published: '2026-08-03', featured: true, designScore: 5,
    author: 'Ima Studio', authorUrl: 'https://x.com/ImaStudio_ai', sourceUrl: 'https://x.com/ImaStudio_ai/status/2084239859284111659', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8450',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084224883618390016/img/0ItKpR7_Lqq24GvC.jpg',
    originalExcerpt: 'Create a 15-second 16:9 premium stylized 3D animated soda commercial with a cute, cinematic family-animation look.',
    why: 'Excellent branded-content pattern: character emotion and lighting state change at the exact moment the product benefit enters the story.',
    tags: ['3D','beverage','character','brand','transformation'],
    variables: { mascot: 'one round brand mascot from [Image 1]', product: 'the exact beverage bottle from [Image 2]', room: 'a dim toy-filled room', transformation: 'the room shifts from muted to colorful after the product opens' },
    porterPrompt: `Core subjects: {{mascot}} and {{product}}, both exact references. Scene/environment: {{room}} with stable toy positions. Shot 1: one slow push-in; mascot sits bored and notices a small light cue. Shot 2: fixed medium shot; mascot finds the product and opens it once. Product action triggers {{transformation}} through believable practical-light change plus bubbles, without changing room geometry. Shot 3: one lateral track as mascot moves through the newly active space. Shot 4: fixed final product/mascot hero. Visual style: premium stylized 3D family animation, rounded forms, realistic condensation and soft volumetrics. Constraints: one mascot, one bottle, label/reference lock, no unreadable invented copy, no toy duplication, no abrupt cuts inside a shot.`
  },
  {
    id: 'digest-night-market', title: 'Authentic Product-in-Context Vlog', category: 'UGC / Marketing', subcategory: 'Food / travel', model: 'Seedance 2.0', aspect: '9:16', published: '2026-08-06', featured: false, designScore: 3,
    author: 'Anissa', authorUrl: 'https://x.com/SimplyAnnisa', sourceUrl: 'https://x.com/SimplyAnnisa/status/2085185518774685846', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8553',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2085185160220184576/img/_ERi0sNCq3Q7HC6O.jpg',
    originalExcerpt: '7-shot cinematic handheld smartphone food vlog, ultra-photorealistic, authentic travel VLOG aesthetic. Natural handheld movement with subtle focus breathing, casual framing, realistic exposure shifts.',
    why: 'Useful for digital cases because “imperfection” is specified as a system: handheld, exposure breathing, ambient audio and restricted background faces.',
    tags: ['UGC','food','phone','authentic','social'],
    variables: { creator: 'one creator from [Image 1]', location: 'a lively but believable evening market', dish: 'one visually distinctive street-food dish', reaction: 'a small genuine heat/taste reaction' },
    porterPrompt: `Core subject: {{creator}} trying {{dish}} at {{location}}. Camera language: believable smartphone vlog, subtle handheld drift only; no cinematic orbit. Shot 1: creator receives the dish at a fixed counter position. Shot 2: fixed close food detail with steam and utensil interaction. Shot 3: handheld medium close-up; creator takes one bite and shows {{reaction}} without overacting. Shot 4: fixed environmental close-up of one supporting food/detail. Shot 5: medium creator finish with a short natural line. Visual style: authentic travel social content, mixed practical light, realistic exposure breathing. Audio: live market ambience, cooking sounds and voice; no music. Constraints: background people do not pose, no subtitles/logos, identity and counter layout remain stable.`
  },
  {
    id: 'digest-idol-homevideo', title: 'Personal Brand Memory Film', category: 'Case Study / Portfolio', subcategory: 'Behind the scenes', model: 'Seedance 2.0', aspect: '16:9', published: '2026-08-05', featured: false, designScore: 4,
    author: 'Anissa', authorUrl: 'https://x.com/SimplyAnnisa', sourceUrl: 'https://x.com/SimplyAnnisa/status/2084957016003412344', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8554',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084956889901633536/img/8RaZtVU9UP0Za84V.jpg',
    originalExcerpt: 'Create a nostalgic behind-the-scenes home video following CHASE before a fan meeting. The video should feel personal, like private memories.',
    why: 'A strong case-study storytelling device for founders, talent and brands: anticipation is built through mundane BTS details rather than spectacle.',
    tags: ['BTS','personal-brand','camcorder','case-study','memory'],
    variables: { subject: 'one founder, artist or team member', milestone: 'a launch, keynote or live event', cameraTexture: 'consumer camcorder imperfections', recurringDetail: 'one object that appears in preparation and final moment' },
    porterPrompt: `Core subject: {{subject}} preparing for {{milestone}}. Visual grammar: {{cameraTexture}}—natural handheld wobble, brief autofocus uncertainty and exposure shifts, never synthetic glitch overlays. Shot 1: fixed mirror/dressing-room moment with {{recurringDetail}} in frame. Shot 2: handheld travel transition with subject looking outward rather than addressing camera. Shot 3: fixed empty-venue preparation detail. Shot 4: handheld backstage moment where distant crowd/event sound becomes audible. Shot 5: one follow move as subject crosses into the milestone space; stop before spectacle. Visual style: intimate private-memory documentary. Audio: real room/vehicle/venue ambience plus short restrained VO if needed. Constraints: identity and wardrobe continuity, no fake timestamp text, no influencer overperformance.`
  },
  {
    id: 'digest-werewolf', title: 'Editorial Human → Creature Transformation', category: 'VFX / Transitions', subcategory: 'Character metamorphosis', model: 'Seedance 2.0', aspect: '16:9', published: '2026-08-04', featured: false, designScore: 4,
    author: 'Zarah', authorUrl: 'https://x.com/Ho_Neyy_', sourceUrl: 'https://x.com/Ho_Neyy_/status/2084669925239792076', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8508',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084669896030601216/img/cB3j4oY0spBSJm2N.jpg',
    originalExcerpt: 'A beautiful young East Asian woman with long black hair styled half-up, soft natural makeup, pearl ear cuff, layered gold necklace.',
    why: 'Useful VFX case pattern: preserve a few identity/accessory anchors while one body/material state transforms. Strong for fashion, gaming and campaign reveals.',
    tags: ['VFX','transformation','fashion','character','campaign'],
    variables: { subject: 'one editorial model from [Image 1]', anchors: 'hair silhouette, ear accessory and necklace', creature: 'a luminous white mythic creature', environment: 'a quiet premium bedroom or dressing room' },
    porterPrompt: `Core subject: {{subject}} with immutable anchors: {{anchors}}. Scene/environment: {{environment}}, warm natural light and one mirror. Shot 1: one slow rear push-in as subject looks at the mirror and touches hair once. Shot 2: locked mirror close-up; transformation begins from a single visible material cue and progresses continuously into {{creature}} without spawning a second body. Shot 3: fixed three-quarter final state that preserves pose direction and accessory logic where physically possible. Visual style: luxury editorial fantasy, photoreal skin/fur/material transition, restrained volumetric light. Image quality: coherent anatomy and mirror reflection. Constraints: one subject only, no face swap, no random wardrobe change, no separate creature duplicate, no text/logos.`
  },
  {
    id: 'digest-seattle-chase', title: 'Problem → Chase → Deadpan Payoff', category: 'Case Study / Portfolio', subcategory: 'Narrative ad', model: 'Seedance 2.0', aspect: '16:9', published: '2026-08-05', featured: false, designScore: 4,
    author: 'BMX', authorUrl: 'https://x.com/bmx_ai13', sourceUrl: 'https://x.com/bmx_ai13/status/2084939972499452176', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8562',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084758829406072832/img/4ovKyI6vNFeuZwyQ.jpg',
    originalExcerpt: 'A fast paced 15 second hyper realistic action video in 16 by 9 aspect ratio driven by energetic electronic drum and bass music.',
    why: 'Advertising insight: a very kinetic middle becomes memorable because the final payoff is completely static. Great for campaign/case-film rhythm.',
    tags: ['narrative-ad','chase','contrast','payoff','case-film'],
    variables: { object: 'one small mission-critical object', runner: 'one athletic courier', city: 'a recognizable contemporary city block', destination: 'a quiet executive or studio interior' },
    porterPrompt: `Core story object: {{object}} carried by {{runner}} from {{city}} to {{destination}}. Generate as separate clips rather than one overloaded sequence. Clip A: fixed macro of the object being grabbed. Clip B: one handheld forward follow as runner exits and clears one obstacle. Clip C: one low lateral tracking shot for the fastest movement beat. Clip D: completely static interior frame; runner enters, places the intact object precisely, then acts casually. Visual style: premium realistic brand short with natural midday contrast and readable urban texture. Audio: energetic rhythm during movement, then sudden room-tone contrast at payoff. Constraints: object never changes shape, runner identity/wardrobe stays fixed, no multi-camera instructions inside a shot, final calm frame must be clean enough for post typography.`
  },
  {
    id: 'digest-1950s-drama', title: 'Period Editorial Blocking System', category: 'Fashion / Editorial', subcategory: 'Period film grammar', model: 'Seedance 2.0', aspect: '4:3', published: '2026-08-04', featured: false, designScore: 4,
    author: "God's Way Foundation", authorUrl: 'https://x.com/godswayfoundinc', sourceUrl: 'https://x.com/godswayfoundinc/status/2084684539524206747', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8513',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084512991802699776/img/ywKpet81cjX9Es0L.jpg',
    originalExcerpt: 'Cinematic Framework: Shot in the style of a 1950s major-studio romantic drama. 4:3 Academy ratio. Rich black-and-white 35mm cinematography.',
    why: 'A useful design lesson: period feel comes from composition, blocking, lenses and movement rules—not just a vintage filter.',
    tags: ['period','editorial','4:3','blocking','film-language'],
    variables: { era: 'mid-century studio drama', characters: 'two formally dressed adults', street: 'a period city street with controlled extras', prop: 'one carried object linking the interaction' },
    porterPrompt: `Core subjects: {{characters}} in {{street}}, carrying {{prop}}. Visual system: {{era}}, 4:3 composition, monochrome tonal separation, balanced actor staging. Shot 1: fixed wide master; characters enter and complete one formal blocking gesture while background extras flow around them. Shot 2: one slow push-in on Character A delivering a short line. Shot 3: fixed reaction close-up on Character B; emotion changes through eyes and mouth only. Shot 4: one smooth lateral track as both characters leave together and exchange {{prop}}. Lighting: soft motivated studio-natural mix with silvery highlights and open detail. Image quality: stable wardrobe, period props and faces. Constraints: no modern objects, no handheld movement, no fake scratches/titles; apply film texture lightly in post.`
  },
  {
    id: 'digest-tennis', title: 'Freeze-Frame Apparel Feature Reveal', category: 'Brand / Logo Motion', subcategory: 'Sports campaign', model: 'Seedance 2.0', aspect: '16:9', published: '2026-08-03', featured: true, designScore: 5,
    author: 'Saul Goodman', authorUrl: 'https://x.com/Goodmanprotocol', sourceUrl: 'https://x.com/Goodmanprotocol/status/2084217915893784975', archiveUrl: 'https://youmind.com/en-US/seedance-2-0-prompts?id=8425',
    previewUrl: 'https://pbs.twimg.com/amplify_video_thumb/2084217868242341889/img/y4r__CEkcXS2TrKM.jpg',
    originalExcerpt: 'Create a high-end cinematic sports commercial set on a professional outdoor tennis court during golden hour.',
    why: 'Sports + product-detail pattern: pause peak action to inspect apparel/equipment, then resume motion into a brand-shaped final composition.',
    tags: ['sports','freeze','apparel','brand','campaign'],
    variables: { athlete: 'one tennis athlete from [Image 1]', apparel: 'the exact performance apparel system from [Image 2]', brandShape: 'a simple geometric brand symbol', ballColor: 'optic yellow' },
    porterPrompt: `Core subject: {{athlete}} wearing {{apparel}} on a clean professional court at golden hour. Shot 1: one medium tracking move following the serve preparation. Shot 2: fixed overhead frame at the peak contact pose; time appears visually suspended while fabric, footwear and racket details remain readable. Shot 3: one side track as action resumes and the ball crosses court. Shot 4: fixed overhead brand frame where multiple {{ballColor}} balls settle into {{brandShape}} using believable rolling/bouncing physics. Visual style: premium performance campaign, crisp sunlight, controlled motion blur. Image quality: stable athlete, apparel, racket and court lines. Constraints: final exact wordmark should be composited in post; no malformed lettering, no duplicate athlete, no impossible ball teleportation.`
  }
];

export const DIGEST_STATS = {
  entries: INDUSTRY_DIGEST.length,
  categories: new Set(INDUSTRY_DIGEST.map(item => item.category)).size,
  creators: new Set(INDUSTRY_DIGEST.map(item => item.author)).size,
  designFirst: INDUSTRY_DIGEST.filter(item => item.designScore >= 4).length
};
