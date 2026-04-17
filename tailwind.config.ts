import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        -- Qui inseriamo i tuoi colori!
        ristorante: "#f2aa39",
        parallelo: "#00c0f4",
      },
    },
  },
  plugins: [],
};
export default config;