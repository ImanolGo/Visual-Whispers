import type { Persona } from './types';

export const PERSONAS: Persona[] = [
  { id: 'archaeologist', emoji: '🛸', name: 'Space archaeologist',
    blurb: 'Year 4000, studying Earth relics',
    voice: 'as a space archaeologist from the year 4000 studying artifacts of an ancient Earth civilisation, sure that everything had a ritual purpose' },
  { id: 'child', emoji: '🧃', name: 'Six-year-old',
    blurb: 'Very excited, knows about dinosaurs',
    voice: 'as an overexcited six-year-old who connects everything to dinosaurs, snacks and their best friend Maya' },
  { id: 'cat', emoji: '🐈', name: 'House cat',
    blurb: 'Only cares about birds and warm spots',
    voice: 'as a house cat who judges every scene by its birds, sunbeams, boxes and things that could be knocked off a table' },
  { id: 'clockwork', emoji: '⚙️', name: 'Victorian engineer',
    blurb: 'Sees gears and steam everywhere',
    voice: 'as a Victorian clockwork engineer who sees every shape as brass gears, pistons, steam and ingenious mechanisms' },
  { id: 'agent', emoji: '🏡', name: 'Estate agent',
    blurb: 'Everything is a selling point',
    voice: 'as an upbeat real-estate agent who describes everything as a property listing full of charming features and great potential' },
  { id: 'monk', emoji: '📜', name: 'Medieval monk',
    blurb: 'Illuminates manuscripts, fears dragons',
    voice: 'as a medieval monk illuminating a manuscript, who sees saints, omens, gold leaf and the occasional dragon' },
  { id: 'synesthete', emoji: '🎷', name: 'Synesthete musician',
    blurb: 'Hears colours, sees chords',
    voice: 'as a jazz musician with synesthesia who hears colours as chords and describes shapes as rhythms' },
  { id: 'detective', emoji: '🔎', name: 'Noir detective',
    blurb: 'Everyone is hiding something',
    voice: 'as a hard-boiled 1940s detective who reads every scene as a crime scene full of clues and suspicious shadows' },
  { id: 'shaman', emoji: '🌿', name: 'Forest spirit',
    blurb: 'Feels roots and elemental forces',
    voice: 'as an ancient forest spirit who perceives the elemental forces, roots and living connections in all things' },
  { id: 'dream', emoji: '🌙', name: 'Dream interpreter',
    blurb: 'Everything is a symbol',
    voice: 'as a dream interpreter who reads every object as a symbol from the subconscious' },
];

export const STARTERS = [
  'a lighthouse made of jelly on a stormy night',
  'two foxes sharing an umbrella in Tokyo rain',
  'a grandmother teaching a robot to knit',
  'a breakfast table floating in space',
  'a tiny dragon asleep in a teacup',
  'the last ice cream van at the end of the world',
  'a jazz band of frogs on a lily pad',
  'a library where the books are birds',
  'a cathedral built from bicycles',
  'a snowman on a tropical beach at sunset',
  'an astronaut walking a dog on the moon',
  'a lemon wearing a crown, oil painting',
];

export function customPersona(text: string): Persona {
  const clean = text.trim().replace(/^as\s+(an?\s+)?/i, '');
  const name = clean.split(/\s+who\s+|,/i)[0].slice(0, 40) || 'Stranger';
  return {
    id: `custom-${clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`,
    emoji: '✨',
    name: name.charAt(0).toUpperCase() + name.slice(1),
    voice: `as ${/^(an?|the)\s/i.test(clean) ? '' : 'a '}${clean}`,
    blurb: 'Your own character',
  };
}

/** Who describes round `index` (0-based). One persona = same player; several = they take turns. */
export function personaForRound(team: Persona[], index: number, shuffle: boolean, random = Math.random): Persona {
  if (team.length === 0) return PERSONAS[0];
  if (!shuffle) return team[index % team.length];
  return team[Math.floor(random() * team.length)];
}
