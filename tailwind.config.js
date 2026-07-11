module.exports = {
  darkMode: 'media',
  content: ['./src/**/*.{js,ts,jsx,tsx}', 'articles/**/*.{md,mdx}'],
  theme: {
    fontFamily: {
      serif: ['"Open Sans"', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
    },
    fontSize: {
      // `xs` intentionally exists only for compact badges (status pills) —
      // everything a visitor is meant to actually read starts at `sm`.
      // Missing this key used to mean `text-xs` compiled to nothing, so a
      // badge using it silently inherited its parent's (much larger) size —
      // e.g. the project status pill inheriting the title's text-xl.
      xs: '0.75rem',
      sm: '0.84rem',
      base: '1rem',
      md: '1.1rem',
      l: '1.25rem',
      'xl': '1.4rem',
      '2xl': '1.563rem',
      '3xl': '1.953rem',
      '4xl': '2.441rem',
      '5xl': '2.8rem',
      '6xl': '3.5rem',
      '7xl': '4.2rem',
      '8xl': '6rem',
      '9xl': '8rem',
    },
    colors: {
      back: {
        light: '#ffffff',
        dark: '#0d1117',
        secondary: {
          light: '#f5f5f5',
          dark: '#161b22',
        },
      },
      primary: {
        light: '#333333',
        dark: '#c9d1d9',
      },
      // The one dimmed-text system, two steps: `muted` for secondary text
      // (subtitles, captions, meta lines) and `faint` for tertiary text
      // (timestamps, status labels, badges). Both are solid colors with
      // their own dark-mode value — never dim text with `opacity`, which
      // also dims any link nested inside it regardless of that link's own
      // color classes (opacity composites the whole subtree).
      muted: {
        light: '#595959',
        dark: '#9aa4ad',
      },
      faint: {
        light: '#767676',
        dark: '#7d8890',
      },
      link2: {
        light: '#4c31c4',
        dark: '#656fff',
      },
      link2hover: {
        light: '#8553fa',
        dark: '#9a85fc',
      },
      link1: '#777777',
      link1hover: '#777777',
      faded: '#dddddd',
    },
    extend: {
      height: {
        '4/5': '80%',
      },
      width: {
        88: '22rem',
      },
      listStyleType: {
        square: 'square',
        bullet: 'disc',
      },
    },
  },
}
