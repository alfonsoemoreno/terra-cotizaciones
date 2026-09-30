export function allowedOrigins() {
  if (!process.env.BETTER_AUTH_URL) return [];
  const url = new URL(process.env.BETTER_AUTH_URL);
  const origins = [url.origin];
  if (
    process.env.NODE_ENV === "development" &&
    ["localhost", "127.0.0.1"].includes(url.hostname)
  ) {
    url.hostname = url.hostname === "localhost" ? "127.0.0.1" : "localhost";
    origins.push(url.origin);
  }
  return origins;
}
