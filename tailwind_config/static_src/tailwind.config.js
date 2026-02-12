module.exports = {
    content: [
        '../../web/pages/**/*.html',
        '!../../**/node_modules',
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#137fec",
                "background-light": "#f6f7f8",
                "background-dark": "#101922",
                "surface-dark": "#1c2630",
                "surface-light": "#ffffff",
                "border-dark": "#3b4754",
                "success": "#16a34a",
                "error": "#dc2626",
                "warning": "#facc15",
                "info": "#0ea5e9"
            },
            fontFamily: {
                "display": ["Poppins", "sans-serif"],
                "body": ["Noto Sans", "sans-serif"]
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        require('@tailwindcss/aspect-ratio'),
    ],
}
