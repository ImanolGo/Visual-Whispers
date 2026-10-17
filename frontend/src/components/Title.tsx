/**
 * "Visual Whispers", with each letter a little narrower and lighter than the
 * last, so the phrase trails off like a whisper. Printed in two misaligned inks.
 */
const TEXT = 'Visual Whispers';

function letters() {
  const chars = [...TEXT];
  return chars.map((ch, i) => {
    const t = i / (chars.length - 1);
    const width = Math.round(150 - t * 95); // 150 -> 55
    const weight = Math.round(900 - t * 620); // 900 -> 280
    return (
      <span key={i} className="ch" style={{ fontStretch: `${width}%`, fontWeight: weight }}>
        {ch === ' ' ? ' ' : ch}
      </span>
    );
  });
}

export function Title() {
  const row = letters();
  return (
    <h1 className="title text-[clamp(2.6rem,9vw,6.5rem)]" aria-label={TEXT}>
      <span className="base" aria-hidden>{row}</span>
      <span className="layer pink" aria-hidden>{row}</span>
      <span className="layer blue" aria-hidden>{row}</span>
    </h1>
  );
}
