import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The modules under test are plain TypeScript: API client, RBAC table and
    // the backend-to-UI mappers. None of them render, so there is no reason to
    // pull in a DOM implementation. The few places that branch on `window` are
    // given an explicit stub by the test that needs one.
    environment: "node",

    // Tests live outside app/ so the Next.js router never sees them.
    include: ["tests/**/*.test.ts"],

    coverage: {
      provider: "v8",
      include: ["app/lib/**/*.ts"],
      exclude: ["app/lib/fallbackCases.ts"],
    },
  },
});
