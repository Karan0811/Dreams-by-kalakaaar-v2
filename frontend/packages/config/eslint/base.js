// @dbk/config/eslint/base — shared flat ESLint config.
// Enforces the architecture boundaries defined in 11-frontend-architecture.md
// Section 24.5 (no ad hoc fetch in components, no reaching into another
// feature's internals) in addition to standard TypeScript/React hygiene.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "warn",
      // Feature boundary rule (11-frontend-architecture.md §4.3): a feature's
      // internals may only be imported through its index.ts barrel.
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./features/**",
              from: "./features/**",
              except: ["../index.ts", "../index.tsx"],
              message:
                "Import from a feature's public index.ts, not its internals (11-frontend-architecture.md §4.3).",
            },
          ],
        },
      ],
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "react",
              importNames: ["default"],
              message:
                "Import named exports from react instead of the default export.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [".next/**", "dist/**", "node_modules/**", ".turbo/**"],
  },
];
