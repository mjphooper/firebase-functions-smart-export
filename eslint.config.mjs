// @ts-check

import eslint from '@eslint/js';
import globals from "globals";
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['**/*.ts'],
    ignores: ['**/*.js'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strict,
    ],
    languageOptions: {
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': 'off',
    },

  },
);
