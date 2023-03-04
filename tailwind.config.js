module.exports = {
  darkMode: 'media',
  content: ['./src/**/*.{js,ts,jsx,tsx}', 'articles/**/*.{md,mdx}'],
  theme: {
    fontFamily: {
      serif: ['"Open Sans"', 'sans-serif'],
    },
    fontSize: {
      sm: '0.8rem',
      base: '1rem',
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
      opaque: '#666666',
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
