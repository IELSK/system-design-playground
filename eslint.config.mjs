import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    // Global rules for all .ts and .tsx files
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "error",
    },
  },
  // eslint-config-prettier disables every ESLint rule that would
  // conflict with Prettier. Each tool stays in its lane:
  // ESLint → code quality, Prettier → formatting.
  eslintConfigPrettier,
];
