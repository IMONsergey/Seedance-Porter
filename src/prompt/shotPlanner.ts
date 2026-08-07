import type { ProjectSpec, ShotSpec } from "../core/schema.js";

export function planShots(spec: ProjectSpec): ShotSpec[] {
  if (spec.shots.length) return spec.shots.map((shot) => ({
    ...shot,
    camera: shot.camera ?? "fixed shot",
    position: shot.position ?? spec.brief.environment,
    lighting: shot.lighting ?? spec.brief.lighting,
    sound: shot.sound ?? spec.brief.sound,
  }));

  const beats = spec.brief.beats.length ? spec.brief.beats : [spec.brief.action];
  if (beats.length === 1) {
    return [{
      start: 0,
      end: spec.duration,
      action: beats[0],
      camera: spec.brief.camera ?? "fixed shot",
      position: spec.brief.environment,
      lighting: spec.brief.lighting,
      sound: spec.brief.sound,
      endpoint: spec.brief.endpoint,
    }];
  }

  const segment = spec.duration / beats.length;
  return beats.map((beat, index) => ({
    start: Number((index * segment).toFixed(1)),
    end: index === beats.length - 1 ? spec.duration : Number(((index + 1) * segment).toFixed(1)),
    action: beat,
    camera: index === 0 ? (spec.brief.camera ?? "fixed shot") : "cut to a fixed shot",
    position: spec.brief.environment,
    lighting: spec.brief.lighting,
    sound: spec.brief.sound,
    endpoint: index === beats.length - 1 ? spec.brief.endpoint : undefined,
  }));
}

export function renderShots(shots: ShotSpec[]): string[] {
  return shots.map((shot, index) => {
    // BytePlus's official Seedance 2.0 guide recommends ordered Shot N blocks
    // and explicitly warns that hard timing ranges such as 0–3s are unstable.
    // start/end remain planning metadata and are intentionally not rendered.
    const camera = [shot.shotSize, shot.camera].filter(Boolean).join(", ");
    const pieces = [`Shot ${index + 1}:`];
    if (camera) pieces.push(`Camera/transition: ${camera}.`);
    pieces.push(`Subject action/expression: ${shot.action}.`);
    if (shot.position) pieces.push(`Position/space: ${shot.position}.`);
    if (shot.lighting) pieces.push(`Lighting: ${shot.lighting}.`);
    if (shot.sound) pieces.push(`Audio: ${shot.sound}.`);
    if (shot.endpoint) pieces.push(`Required end state: ${shot.endpoint}.`);
    return pieces.join(" ");
  });
}
