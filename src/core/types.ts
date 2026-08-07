export const PROVIDERS = ["byteplus", "fal", "muapi"] as const;
export type ProviderName = (typeof PROVIDERS)[number];

export const MODES = [
  "text-to-video",
  "image-to-video",
  "reference-to-video",
  "first-last-frame",
] as const;
export type GenerationMode = (typeof MODES)[number];

export type Resolution = "480p" | "720p" | "1080p" | "4k";
export type AspectRatio = "adaptive" | "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16" | "9:21";
export type ReferenceKind = "image" | "video" | "audio";
export type FaceSource = "none" | "synthetic" | "modelark-trusted-output" | "preset-digital-character" | "authorized-real-person" | "non-human";
/** @deprecated Use faceSource. Kept for compatibility with early v0.3 project files. */
export type IdentitySource = Exclude<FaceSource, "none">;
export type ReferenceRole =
  | "identity"
  | "product"
  | "logo"
  | "environment"
  | "motion"
  | "camera"
  | "style"
  | "audio"
  | "first_frame"
  | "last_frame"
  | "endpoint";

export interface ReferenceAsset {
  id: string;
  kind: ReferenceKind;
  url: string;
  role: ReferenceRole;
  note?: string;
  anchors?: string[];
  faceSource?: FaceSource;
  /** @deprecated Use faceSource. */
  identitySource?: IdentitySource;
  token?: string;
}

export interface ReferenceLimits {
  images: number;
  videos: number;
  audios: number;
}

export interface ProviderRoute {
  provider: ProviderName;
  officialApi: boolean;
  modelId?: string;
  endpoints?: Partial<Record<GenerationMode, string>>;
  resolutions: Resolution[];
  modes: GenerationMode[];
  supportsSeed?: boolean;
  notes?: string[];
}

export interface ModelDefinition {
  key: string;
  displayName: string;
  family: "seedance";
  lifecycle: "production" | "preview" | "experimental" | "deprecated";
  lastVerified: string;
  duration: { min: number; max: number; auto?: boolean };
  aspectRatios: AspectRatio[];
  referenceLimits: ReferenceLimits;
  nativeAudio: boolean;
  supportsSeed: boolean;
  routes: Partial<Record<ProviderName, ProviderRoute>>;
  sources: string[];
  notes: string[];
}

export interface GenerationRequest {
  project: string;
  label?: string;
  provider: ProviderName;
  modelKey: string;
  modelId?: string;
  mode: GenerationMode;
  prompt: string;
  references: ReferenceAsset[];
  duration: number;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  generateAudio: boolean;
  seed?: number;
  watermark?: boolean;
}

export type TaskStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled" | "expired";

export interface GenerationTask {
  id: string;
  provider: ProviderName;
  modelKey: string;
  status: TaskStatus;
  videoUrl?: string;
  lastFrameUrl?: string;
  raw?: unknown;
  error?: { code?: string; message: string };
}

export interface OfficialComplianceSummary {
  standard: string;
  verifiedAt: string;
  sourceUpdatedAt: string;
  passed: boolean;
  score: number;
  findings: Array<{ rule: string; severity: "error" | "warning" | "info"; message: string; path?: string }>;
  normalization: string[];
  sources: readonly string[];
}

export interface CompiledProject {
  request: GenerationRequest;
  referenceMap: Array<{ id: string; token: string; role: ReferenceRole; note?: string; anchors?: string[]; faceSource?: FaceSource; identitySource?: IdentitySource }>;
  warnings: string[];
  officialCompliance: OfficialComplianceSummary;
}
