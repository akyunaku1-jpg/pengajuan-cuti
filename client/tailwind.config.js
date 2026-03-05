/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        appBg: "var(--bg)",
        primary: "var(--primary)",
        primaryHover: "var(--primary-d)",
        "primary-hover": "var(--primary-d)",
        primarySoft: "var(--primary-xl)",
        "primary-soft": "var(--primary-xl)",
        approved: "var(--approved)",
        approvedBg: "var(--approved-bg)",
        pending: "var(--pending)",
        pendingBg: "var(--pending-bg)",
        rejected: "var(--rejected)",
        rejectedBg: "var(--rejected-bg)",
        card: "var(--card)",
        mainText: "var(--text)",
        mutedText: "var(--text-2)",
        mutedTextLight: "var(--text-3)",
        "muted-text-light": "var(--text-3)",
        borderSoft: "var(--border)",
        "border-soft": "var(--border)",
      },
      borderRadius: {
        xl2: "var(--radius)",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
        softHover: "0 8px 24px rgba(15, 23, 42, 0.12)",
        "soft-hover": "0 8px 24px rgba(15, 23, 42, 0.12)",
        primaryLift: "0 14px 28px rgba(108, 140, 245, 0.35)",
        "primary-lift": "0 14px 28px rgba(108, 140, 245, 0.35)",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        heading: ["Outfit", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
