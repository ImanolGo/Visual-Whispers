/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        sheet: 'var(--sheet)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        pink: 'var(--pink)',
        blue: 'var(--blue)',
        yellow: 'var(--yellow)',
      },
      fontFamily: {
        sans: ['"Anybody Variable"', 'system-ui', 'sans-serif'],
        serif: ['"Newsreader Variable"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
