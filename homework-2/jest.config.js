module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/index.ts"],
  coverageThreshold: {
    global: { statements: 85, branches: 85, functions: 85, lines: 85 },
  },
  coverageReporters: ["text", "lcov", "html"],
};
