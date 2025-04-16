export default {
    preset: "ts-jest/presets/default-esm", // Use ts-jest with ES module support
    testEnvironment: "jsdom", // Use jsdom for DOM-related tests
    extensionsToTreatAsEsm: [".ts"], // Treat .ts files as ES modules
    transform: {
      "^.+\\.ts$": "ts-jest", // Use ts-jest to transform TypeScript files
    },
    moduleNameMapper: {
        "^~/(.*)$": "<rootDir>/src/$1"
    }
};