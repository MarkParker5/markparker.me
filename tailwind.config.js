module.exports = {
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
      back: '#ffffff',
      primary: '#333333',
      opaque: '#666666',
      faded: '#dddddd',
      link1: '#777777',
      link1hover: '#777777',
      link2: '#4c31c4',
      link2hover: '#8553fa',
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
