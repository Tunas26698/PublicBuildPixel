/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'pixel': ['"Press Start 2P"', 'cursive'],
                'sans': ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'bounce-slow': 'bounce 3s infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [
        function ({ addUtilities }) {
            addUtilities({
                '.pixelated': {
                    'image-rendering': 'pixelated',
                }
            })
        }
    ],
}
