import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/", ".expo/", "node_modules/", "metro.config.js", "metro.config.cjs"],
  },
  ...tseslint.configs.strict,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
