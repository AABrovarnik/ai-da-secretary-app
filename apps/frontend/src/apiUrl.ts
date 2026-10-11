export function buildApiUrl(baseUrl: string, path: string) {
  const base = baseUrl.replace(/\/+$/, "");
  const requestPath = path.startsWith("/") ? path : `/${path}`;

  if (base.endsWith("/api") && requestPath.startsWith("/api/")) {
    return `${base}${requestPath.slice(4)}`;
  }

  return `${base}${requestPath}`;
}
