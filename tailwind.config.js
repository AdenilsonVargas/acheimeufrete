module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#ff6b35',
        'primary-dark': '#d94e26',
        secondary: '#004e89',
        'secondary-dark': '#003d6b',
        accent: '#1ac8d8',
        background: '#0a0e27',
        surface: '#1a1e3f',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
