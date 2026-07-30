import base from "./base.js";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/** @type {import('eslint').Linter.Config[]} */
export default [...base, ...compat.extends("next/core-web-vitals")];
