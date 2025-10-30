// ============================================================================
// Frontend: Add tailwind.config.js
// FILE: tailwind.config.js (NEW FILE)
// REASON: This file is required to configure Tailwind CSS and tell it
//         which files to scan for utility classes.
// ============================================================================
/** @type {import('tailwindcss').Config} */
export default {
  // Purge/Content: Scan these files for Tailwind classes
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  // Dark mode based on the 'dark' class (set in App.vue)
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // You can add custom brand colors here if needed
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
      },
    },
  },
  plugins: [
    // Add the forms plugin for better default styling of inputs
    require('@tailwindcss/forms'),
  ],
}