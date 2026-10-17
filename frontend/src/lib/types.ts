export type Persona = {
  id: string;
  name: string;
  emoji: string;
  /** Who is looking at the picture, written for the model ("as a ..."). */
  voice: string;
  /** One short line for the picker. */
  blurb?: string;
};

export type Drift = {
  survival: number;
  origin_words: { word: string; kept: boolean }[];
  new_words: string[];
  lost_words: string[];
};

export type Step = {
  image_id: string;
  image_url: string;
  /** What the painter was told for this round. */
  heard: string;
  /** What the persona said about the picture. */
  description: string;
  /** What the next painter will hear. */
  next_prompt: string;
  persona: Pick<Persona, 'name' | 'emoji' | 'voice'>;
  imagination: number;
  drift: Drift;
  timings?: { paint_s?: number; describe_s?: number };
};

export type Chain = {
  origin: string;
  steps: Step[];
};

export type LiveStage = 'painting' | 'looking';

export type LiveStep = {
  stage: LiveStage;
  persona: Persona;
  heard: string;
  imageUrl?: string;
  text: string;
  model?: string;
};

export type Health = {
  ok: boolean;
  problems: string[];
  mock: boolean;
  describer: string;
  painter: string;
};
