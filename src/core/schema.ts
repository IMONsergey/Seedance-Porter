import { z } from "zod";

export const ReferenceSchema = z.object({
  id: z.string().min(1).optional(),
  kind: z.enum(["image", "video", "audio"]),
  url: z.string().min(1).describe("Remote URL, data URI where supported, or local file path where the provider adapter supports upload/inline media."),
  role: z.enum([
    "identity",
    "product",
    "logo",
    "environment",
    "motion",
    "camera",
    "style",
    "audio",
    "first_frame",
    "last_frame",
    "endpoint",
  ]),
  note: z.string().min(1).optional(),
  anchors: z.array(z.string().min(1)).min(2).max(3).optional().describe("Two or three stable identifying features. Required by Porter official compliance for identity/product/logo anchors."),
});

export const ShotSchema = z.object({
  // Timing is retained as internal planning metadata. The official Seedance 2.0
  // guide warns that hard per-shot timestamps are unstable, so the compiled
  // model prompt renders ordered Shot N blocks rather than these second ranges.
  start: z.number().min(0),
  end: z.number().positive(),
  shotSize: z.string().min(1).optional(),
  action: z.string().min(1),
  camera: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  lighting: z.string().min(1).optional(),
  sound: z.string().min(1).optional(),
  endpoint: z.string().min(1).optional(),
}).refine((shot) => shot.end > shot.start, { message: "shot.end must be greater than shot.start" });

export const DirectorReadSchema = z.object({
  sceneFunction: z.string().min(1),
  turn: z.string().min(1).optional(),
  pov: z.string().min(1).optional(),
  objective: z.string().min(1).optional(),
  obstacle: z.string().min(1).optional(),
  contradiction: z.string().min(1).optional(),
  suppressedBehavior: z.string().min(1).optional(),
  specificDetail: z.string().min(1).optional(),
  genreRefusal: z.string().min(1).optional(),
}).optional();

export const OutputPolicySchema = z.object({
  generatedText: z.enum(["forbid", "allow"]).default("forbid"),
  generatedLogo: z.enum(["forbid", "reference-only", "allow"]).default("forbid"),
  generatedWatermark: z.enum(["forbid", "allow"]).default("forbid"),
}).default({ generatedText: "forbid", generatedLogo: "forbid", generatedWatermark: "forbid" });

export const ProjectSchema = z.object({
  project: z.string().min(1),
  label: z.string().min(1).optional(),
  provider: z.enum(["byteplus", "fal", "muapi"]).optional(),
  model: z.string().min(1).default("seedance-2.0"),
  mode: z.enum(["auto", "text-to-video", "image-to-video", "reference-to-video", "first-last-frame"]).default("auto"),
  duration: z.number().int().min(4).max(30).default(6),
  resolution: z.enum(["480p", "720p", "1080p", "4k"]).default("720p"),
  aspectRatio: z.enum(["adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16", "9:21"]).default("16:9"),
  generateAudio: z.boolean().default(true),
  seed: z.number().int().min(-1).max(4294967295).optional(),
  watermark: z.boolean().default(false),
  outputPolicy: OutputPolicySchema,
  brief: z.object({
    objective: z.string().min(1),
    subject: z.string().min(1),
    action: z.string().min(1),
    environment: z.string().min(1),
    camera: z.string().min(1).optional(),
    lighting: z.string().min(1).optional(),
    sound: z.string().min(1).optional(),
    endpoint: z.string().min(1).optional(),
    style: z.string().min(1).optional(),
    imageQuality: z.string().min(1).optional(),
    colorTone: z.string().min(1).optional(),
    beats: z.array(z.string().min(1)).default([]),
    constraints: z.array(z.string().min(1)).default([]),
  }),
  director: DirectorReadSchema,
  shots: z.array(ShotSchema).default([]),
  references: z.array(ReferenceSchema).default([]),
  continuity: z.object({
    lockedSubject: z.string().optional(),
    lockedWardrobe: z.string().optional(),
    lockedEnvironment: z.string().optional(),
    lockedLighting: z.string().optional(),
    observedStartState: z.string().optional(),
    requiredEndState: z.string().optional(),
  }).optional(),
});

export type ProjectSpec = z.infer<typeof ProjectSchema>;
export type ShotSpec = z.infer<typeof ShotSchema>;
export type DirectorRead = NonNullable<z.infer<typeof DirectorReadSchema>>;
