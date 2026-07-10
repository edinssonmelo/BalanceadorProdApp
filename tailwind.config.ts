import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Aliases para vistas existentes */
        bp: {
          bg: 'hsl(var(--background))',
          panel: 'hsl(var(--card))',
          'panel-2': 'hsl(var(--muted))',
          'panel-3': 'hsl(var(--accent))',
          border: 'hsl(var(--border))',
          'border-light': 'hsl(var(--border))',
          text: 'hsl(var(--foreground))',
          dim: 'hsl(var(--muted-foreground))',
          faint: 'hsl(var(--muted-foreground) / 0.7)',
          accent: 'hsl(var(--primary))',
          'accent-soft': 'hsl(var(--secondary))',
          ok: 'hsl(142 71% 45%)',
          'ok-soft': 'hsl(142 76% 94%)',
          warn: 'hsl(38 92% 50%)',
          'warn-soft': 'hsl(48 96% 94%)',
          danger: 'hsl(var(--destructive))',
          'danger-soft': 'hsl(0 86% 97%)',
          blue: 'hsl(221 83% 53%)',
          'blue-soft': 'hsl(214 95% 93%)',
          idle: 'hsl(var(--muted-foreground) / 0.5)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
