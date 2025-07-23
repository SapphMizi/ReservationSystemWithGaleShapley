import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export default {
  content: [
    './src/**/*.{ts,tsx}',
    './components.json',
  ],
  theme: {
    extend: {
      // 必要に応じてカスタムカラーなど追加
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
} satisfies Config; 