/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    "rbc-agenda-event-cell",
    "dot",
    "content",
    "title",
    "desc",
    "calendar"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
