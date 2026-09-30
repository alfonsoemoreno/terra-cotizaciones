import { afterEach, expect, it, vi } from "vitest";
import { allowedOrigins } from "../src/lib/origins";
afterEach(() => vi.unstubAllEnvs());
it("permite ambos nombres locales solo en desarrollo y conserva el puerto", () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("BETTER_AUTH_URL", "http://127.0.0.1:3000");
  expect(allowedOrigins()).toEqual([
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ]);
  expect(allowedOrigins()).not.toContain("http://localhost:3001");
  vi.stubEnv("NODE_ENV", "production");
  expect(allowedOrigins()).toEqual(["http://127.0.0.1:3000"]);
  vi.stubEnv("BETTER_AUTH_URL", "https://terra.example");
  expect(allowedOrigins()).toEqual(["https://terra.example"]);
});
