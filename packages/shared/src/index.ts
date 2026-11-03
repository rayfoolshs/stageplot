import { z } from "zod";

/**
 * The rider document. This is the single source of truth for the editor,
 * the print view and the PDF renderer. Keep it versioned and stable.
 */
export const STAGE_DOC_VERSION = 1 as const;

export const OrientationSchema = z.enum(["portrait", "landscape"]);
export type Orientation = z.infer<typeof OrientationSchema>;

export const StageItemSchema = z.object({
  id: z.string(),
  itemKey: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  rotation: z.number(),
  flipX: z.boolean(),
  flipY: z.boolean(),
  label: z.string().optional(),
  /** For stage monitors: the desk output row this item feeds. */
  outputId: z.string().optional(),
});
export type StageItem = z.infer<typeof StageItemSchema>;

export const TextItemSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  fontSize: z.number().positive(),
  rotation: z.number(),
});
export type TextItem = z.infer<typeof TextItemSchema>;

export const ArrowItemSchema = z.object({
  id: z.string(),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
});
export type ArrowItem = z.infer<typeof ArrowItemSchema>;

/**
 * A drawn shape (rectangle, ellipse or free polygon). Polygon vertices are
 * stored as flat normalized coordinates within the bounding box, so resizing
 * the box scales the shape.
 */
export const ShapeKindSchema = z.enum(["rect", "ellipse", "polygon"]);
export type ShapeKind = z.infer<typeof ShapeKindSchema>;

export const ShapeItemSchema = z.object({
  id: z.string(),
  kind: ShapeKindSchema,
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  rotation: z.number(),
  /** flat [x0,y0,x1,y1,...] normalized 0..1 inside the bbox (polygon only) */
  points: z.array(z.number()).optional(),
  fill: z.boolean(),
  label: z.string().optional(),
});
export type ShapeItem = z.infer<typeof ShapeItemSchema>;

export const ChannelRowSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  source: z.string(),
  person: z.string().default(""),
  mic: z.string(),
  inputType: z.string().default(""),
  stand: z.string(),
  phantom: z.string(),
  monitor: z.string().default(""),
  dca: z.string().default(""),
  notes: z.string(),
});
export type ChannelRow = z.infer<typeof ChannelRowSchema>;

export const StageDocSchema = z.object({
  version: z.literal(STAGE_DOC_VERSION),
  stage: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    background: z.string().optional(),
  }),
  items: z.array(StageItemSchema),
  texts: z.array(TextItemSchema),
  shapes: z.array(ShapeItemSchema).default([]),
  arrows: z.array(ArrowItemSchema),
  channels: z.array(ChannelRowSchema),
  outputs: z.array(ChannelRowSchema),
  footer: z.object({ text: z.string() }),
  meta: z.object({
    name: z.string(),
    orientation: OrientationSchema,
  }),
});
export type StageDoc = z.infer<typeof StageDocSchema>;

export const DEFAULT_STAGE_WIDTH = 1000;
export const DEFAULT_STAGE_HEIGHT = 700;

export function createEmptyDoc(name = "Untitled rider"): StageDoc {
  return {
    version: STAGE_DOC_VERSION,
    stage: { width: DEFAULT_STAGE_WIDTH, height: DEFAULT_STAGE_HEIGHT },
    items: [],
    texts: [],
    shapes: [],
    arrows: [],
    channels: [],
    outputs: [],
    footer: { text: "" },
    meta: { name, orientation: "landscape" },
  };
}

export function parseStageDoc(input: unknown): StageDoc {
  return StageDocSchema.parse(input);
}

/** Categories shown in the editor's item library. Artwork lands in M1. */
export const LIBRARY_CATEGORIES = [
  "Drums",
  "Guitars",
  "Amps",
  "Keys",
  "Strings",
  "Winds",
  "Mics",
  "Audio",
  "People",
  "Stages",
  "Lighting",
  "Video",
  "Text",
] as const;
export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];
