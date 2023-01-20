module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', 'articles/**/*.{md,mdx}'],
  theme: {
    fontFamily: {
      serif: ['"Open Sans"', 'sans-serif']
    },
    colors: {
      back: '#ffffff',
      primary: '#333333',
      opaque: '#666666',
      faded: '#dddddd',
      link1: '#777777',
      link1hover: '#777777',
      link2: '#d07070',
      link2hover: '#f08080',
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
      },
    },
  },
}
