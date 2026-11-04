/**
 * The static GitHub Pages build has no API and no accounts. Detected once here
 * so the UI can avoid probing endpoints that can't exist.
 */
export const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === "1";
