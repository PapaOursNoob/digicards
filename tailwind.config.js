/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-card': 'var(--bg-card)',
        'bg-elevated': 'var(--bg-elevated)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border-color': 'var(--border-color)',
        'input-bg': 'var(--input-bg)',
        'success': '#00ff88',
        'warning': '#ffb800',
        'danger': '#ff4757',
        // Card colors
        'red-card': '#ef4444',
        'blue-card': '#3b82f6',
        'yellow-card': '#eab308',
        'green-card': '#22c55e',
        'black-card': '#374151',
        'purple-card': '#a855f7',
        'white-card': '#f8fafc',
        // Rarity colors
        'rarity-c': '#9ca3af',
        'rarity-u': '#22c55e',
        'rarity-r': '#3b82f6',
        'rarity-sr': '#8b5cf6',
        'rarity-sec': '#f59e0b',
        'rarity-p': '#ec4899'
      }
    },
  },
  plugins: [],
}
