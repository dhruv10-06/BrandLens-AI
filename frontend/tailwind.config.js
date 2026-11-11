/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Forest Green as the core sovereign brand tone (brand-600 used in active navigation tests)
        brand: {
          50: '#F2F7F4',
          100: '#E5EFEA',
          200: '#C8DDD4',
          300: '#9BBCAE',
          400: '#6E9C88',
          500: '#4F7E6B',
          600: '#243C32', // Deep forest green - primary active brand tone
          700: '#1C3228',
          800: '#172921',
          900: '#111F19',
          950: '#0A130F',
        },
        // Old Money Luxury Canvas & Surfaces
        cream: {
          50: '#FAF8F3',  // Softest luxury cream
          100: '#F5EFE4', // Champagne ivory
          200: '#EAE1D2', // Warm parchment surface
          300: '#DDD2BF', // Delicate parchment border
          400: '#C7B9A2', // Muted warm stone
          500: '#A79A88', // Warm taupe
        },
        parchment: {
          50: '#FAF7F0',  // Soft cream background
          100: '#F4EFE4', // Champagne ivory canvas
          200: '#EAE1D2', // Warm parchment card
          300: '#DDD2BF', // Hairline borders
          400: '#C7B9A2',
          500: '#A79A88',
          600: '#8E8271',
        },
        // Roasted Espresso Typography & Dark Surfaces
        espresso: {
          50: '#FAF8F7',
          100: '#F4F0EE',
          200: '#EAE4E0',
          300: '#D4CBC4',
          400: '#B5A89E',
          500: '#96877B',
          600: '#7A6B60',
          700: '#615248',
          800: '#4A3C34',
          850: '#3D3028',
          900: '#30251F', // Deep roasted espresso text
          950: '#1F1713', // Deepest authority black-brown
        },
        // British Racing / Deep Forest Green (Governance, pristine scores, approvals)
        forest: {
          50: '#F2F7F4',
          100: '#E5EFEA',
          200: '#C8DDD4',
          300: '#9BBCAE',
          400: '#6E9C88',
          500: '#4F7E6B',
          600: '#3A6050',
          700: '#2D4C3F',
          800: '#243C32', // Deep forest green
          900: '#1C3228',
          950: '#13221B',
        },
        // Oxblood Burgundy (High-severity findings, rejections, critical warnings)
        oxblood: {
          50: '#FCF3F6',
          100: '#F9E7EC',
          200: '#F1CCD6',
          300: '#E3A4B3',
          400: '#CF7C90',
          500: '#B55F74',
          600: '#984A5E',
          700: '#7D3B4C',
          800: '#632F3C', // Deep oxblood burgundy
          900: '#4D222E',
          950: '#3B1A23',
        },
        // Antique Burnished Brass (Metrics, golden rules, score accents)
        brass: {
          50: '#FDFBFA',
          100: '#F9F5EC',
          200: '#F1E9DA',
          300: '#E6D7BD',
          400: '#D8C39B',
          500: '#C7AE7F',
          600: '#B49A68', // Antique burnished brass
          700: '#9B7E45',
          800: '#7C6436',
          900: '#5C4927',
        },
        // Muted Olive & Warm Taupe (Medium findings, secondary tags)
        olive: {
          50: '#FAF9F7',
          100: '#F2F2EE',
          200: '#E5E4DB',
          300: '#D0CFBF',
          400: '#B7B5A0',
          500: '#9E9C83',
          600: '#85836A', // Muted olive
          700: '#6B6A56',
          800: '#525141',
          900: '#38372C',
        },
        taupe: {
          50: '#FAF9F8',
          100: '#F4F2F0',
          200: '#E8E5E2',
          300: '#D8D3CE',
          400: '#C1B9B1',
          500: '#A79A88', // Warm taupe
          600: '#8C7F6E',
          700: '#6F6354',
          800: '#53493E',
          900: '#373029',
        },
      },
      fontFamily: {
        serif: [
          'Newsreader',
          'Playfair Display',
          'Georgia',
          'Cambria',
          'serif',
        ],
        sans: [
          'Plus Jakarta Sans',
          'Manrope',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'parchment-sm': '0 1px 2px 0 rgba(48, 37, 31, 0.04)',
        'parchment': '0 2px 6px -1px rgba(48, 37, 31, 0.06), 0 1px 3px -1px rgba(48, 37, 31, 0.04)',
        'parchment-md': '0 6px 16px -2px rgba(48, 37, 31, 0.07), 0 2px 6px -1px rgba(48, 37, 31, 0.03)',
        'parchment-lg': '0 12px 28px -4px rgba(48, 37, 31, 0.09), 0 4px 10px -2px rgba(48, 37, 31, 0.04)',
        'parchment-modal': '0 24px 48px -12px rgba(48, 37, 31, 0.22), 0 8px 16px -4px rgba(48, 37, 31, 0.06)',
        'brass-glow': '0 0 20px -2px rgba(180, 154, 104, 0.25)',
        'forest-glow': '0 0 20px -2px rgba(36, 60, 50, 0.22)',
      },
      borderWidth: {
        'hairline': '0.75px',
      },
    },
  },
  plugins: [],
}
