import type { ProjectSpec, ShotSpec } from "../core/schema.js";

export function planShots(spec: ProjectSpec): ShotSpec[] {
  if (spec.shots.length) return spec.shots;
  const beats = spec.brief.beats.length ? spec.brief.beats : [spec.brief.action];
  if (beats.length === 1) {
    return [{
      start: 0,
      end: spec.duration,
      action: beats[0],
      camera: spec.brief.camera,
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
    camera: index === 0 ? spec.brief.camera : undefined,
    lighting: index === 0 ? spec.brief.lighting : undefined,
    sound: spec.brief.sound,
    endpoint: index === beats.length - 1 ? spec.brief.endpoint : undefined,
  }));
}

export function renderShots(shots: ShotSpec[]): string[] {
  return shots.map((shot) => {
    const pieces = [`[${shot.start}-${shot.end}s]`];
    if (shot.shotSize) pieces.push(`${shot.shotSize}.`);
    pieces.push(`${shot.action}.`);
    if (shot.camera) pieces.push(`Camera: ${shot.camera}.`);
    if (shot.lighting) pieces.push(`Light: ${shot.lighting}.`);
    if (shot.sound) pieces.push(`Sound: ${shot.sound}.`);
    if (shot.endpoint) pieces.push(`End state: ${shot.endpoint}.`);
    return pieces.join(" ");
  });
}
