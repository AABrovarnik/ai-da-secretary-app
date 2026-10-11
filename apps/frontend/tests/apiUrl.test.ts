import { describe, expect, it } from "vitest";
import { buildApiUrl } from "../src/apiUrl";

describe("buildApiUrl", () => {
  it("does not duplicate the sandbox /api prefix", () => {
    expect(buildApiUrl("/api", "/api/auth/login")).toBe("/api/auth/login");
  });

  it("keeps the API path for an absolute backend origin", () => {
    expect(buildApiUrl("http://localhost:4000", "/api/auth/login")).toBe(
      "http://localhost:4000/api/auth/login"
    );
  });
});
