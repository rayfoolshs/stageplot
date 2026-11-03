/**
 * Prefix an app-internal path with Vite's base. Locally the base is "/", so
 * this is a no-op; on GitHub Pages (served from /stageplot/) it keeps links
 * and redirects inside the deployment.
 */
export function appPath(path: string): string {
  const base = import.meta.env.BASE_URL;
  if (path === "/") return base;
  return `${base.replace(/\/$/, "")}${path}`;
}
