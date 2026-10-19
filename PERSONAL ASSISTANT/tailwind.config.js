/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  safelist: [
    { pattern: /^(bg|text)-(cream|ink|paper|green|yellow|blue|pink|lilac|sand|red-300)$/ }
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF3E2",
        ink: "#1a1a1a",
        paper: "var(--paper)",
        line: "var(--line)",
        night: "#17140F",
        bone: "#F3ECD9",
        green: "#C9E4CA",
        yellow: "#FFD84D",
        blue: "#B7D7EA",
        pink: "#F9C2D6",
        lilac: "#E4D5F7",
        sand: "#eadfc4"
      },
      fontFamily: {
        display: ['"Archivo Black"', "sans-serif"],
        sans: ['"Space Grotesk"', "sans-serif"],
        mono: ['"Space Mono"', "monospace"]
      },
      boxShadow: {
        sticker: "4px 4px 0 var(--line)",
        "sticker-sm": "2px 2px 0 var(--line)",
        "sticker-lg": "6px 6px 0 var(--line)"
      },
      borderWidth: { 3: "3px" }
    }
  },
  plugins: []
};
