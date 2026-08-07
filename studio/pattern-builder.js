export function buildTransferredPrompt(item, intel, input) {
  const project = input.projectName?.trim() || 'Untitled project';
  const subject = input.subject?.trim() || 'the new project subject';
  const objective = input.objective?.trim() || 'communicate one clear visual idea';
  const environment = input.environment?.trim() || 'a controlled environment appropriate to the brand';
  const style = input.style?.trim() || 'contemporary premium design film';
  const exact = input.exact?.trim() || 'subject identity, product geometry, brand colors and approved layout hierarchy';
  const shots = (intel?.shotBreakdown || []).map((shot, index) => {
    const camera = shot.camera || 'fixed';
    const role = shot.role || `Beat ${index + 1}`;
    return `Shot ${index + 1}: ${role}. Framing: ${shot.framing || 'controlled composition'}. Camera: ${camera}. Translate the function of the source shot to ${subject}; do not copy source characters, props, location or brand matter. The shot must advance this objective: ${objective}.`;
  });

  return [
    `Project: ${project}.`,
    `Core subject: ${subject}.`,
    `Objective: ${objective}.`,
    `Scene/environment: ${environment}.`,
    `Visual style: ${style}.`,
    `Pattern logic to preserve: ${intel?.transferablePattern || item.why}.`,
    `Signature mechanism: ${intel?.signatureMove || 'preserve the source case structure, not its subject matter'}.`,
    ...shots,
    `Continuity locks: preserve ${exact}.`,
    `Image quality: stable geometry, coherent materials, readable motion, natural physics, clean edges and controlled visual hierarchy.`,
    `Constraints: one dominant camera movement per shot; no unrequested text, subtitles, logos or duplicate subjects; do not reproduce source-specific characters, products, locations, trademarks or copy.`,
    input.audio ? `Audio: build sound around physical actions and the project environment; keep dialogue minimal unless essential.` : `Audio: no required generated dialogue; design sound can be finished in post.`
  ].join('\n');
}

export function buildTransferredProject(item, intel, input) {
  const prompt = buildTransferredPrompt(item, intel, input);
  const refLines = String(input.references || '').split(/\n+/).map(v => v.trim()).filter(Boolean);
  const anchors = String(input.exact || '').split(/[,;\n]+/).map(v => v.trim()).filter(Boolean).slice(0, 3);
  const safeAnchors = anchors.length >= 2 ? anchors : ['approved subject geometry and proportions', 'approved color/material identity'];

  const references = refLines.map((url, index) => ({
    id: `reference-${index + 1}`,
    kind: 'image',
    url,
    role: index === 0 ? (input.referenceRole || 'product') : 'environment',
    faceSource: input.faceSource || 'none',
    ...(index === 0 && ['identity','product','logo'].includes(input.referenceRole || 'product') ? { anchors: safeAnchors } : {}),
    note: index === 0 ? 'Primary exact reference for the transferred pattern.' : 'Supporting environment/style reference; use only for this declared role.'
  }));

  const mode = references.length > 1 ? 'reference-to-video' : references.length === 1 ? 'image-to-video' : 'text-to-video';
  const shotBeats = (intel?.shotBreakdown || []).map(shot => `${shot.role}: ${shot.action}`);

  return {
    project: slug(input.projectName || `pattern-${item.id}`),
    label: `pattern-transfer-${item.id}`,
    model: 'seedance-2.0',
    mode,
    duration: Math.max(4, Math.min(15, Number(input.duration || Math.min(15, Math.max(6, shotBeats.length * 3))))),
    resolution: '720p',
    aspectRatio: input.aspect || item.aspect || '16:9',
    generateAudio: Boolean(input.audio),
    outputPolicy: {
      generatedText: 'forbid',
      generatedLogo: input.referenceRole === 'logo' && references.length ? 'reference-only' : 'forbid',
      generatedWatermark: 'forbid'
    },
    brief: {
      objective: input.objective || `Transfer the production pattern from “${item.title}” to a new project without copying its subject matter.`,
      subject: input.subject || 'New project subject',
      action: shotBeats[0] || intel?.signatureMove || 'Execute one clear visual action and settle.',
      environment: input.environment || 'Controlled project-appropriate environment',
      camera: intel?.motionLanguage?.[0] || 'controlled camera',
      lighting: 'Motivated lighting consistent across all shots',
      colorTone: input.style || 'brand-appropriate controlled palette',
      style: input.style || 'Contemporary premium design film',
      imageQuality: 'HD, stable geometry, coherent materials, natural motion and clean edges',
      constraints: [
        `Preserve: ${input.exact || 'approved subject geometry, identity and brand palette'}`,
        'Do not copy source-specific characters, products, locations, trademarks or wording',
        'One dominant camera movement per shot',
        'No unrequested text, subtitles, logos or duplicate subjects'
      ],
      beats: shotBeats
    },
    references,
    shots: [],
    patternTransfer: {
      sourceDigestId: item.id,
      sourceTitle: item.title,
      sourceUrl: item.sourceUrl,
      sourceCreator: item.author,
      reviewStatus: intel?.reviewStatus || 'unknown',
      collections: intel?.collections || [],
      signatureMove: intel?.signatureMove,
      transferablePattern: intel?.transferablePattern,
      generatedPrompt: prompt
    }
  };
}

function slug(value) {
  return String(value || 'porter-project')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'porter-project';
}
