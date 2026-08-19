'use strict';

// ESLint 9.x flat config for `gcme-ember` (Ember 6.12 LTS, Octane idioms).
//
// Lint scope (Requirements 5.3, 6.9, 10.1, 10.2):
//   - app/**/*.js            (browser, modules)
//   - tests/**/*.js          (browser, modules, QUnit globals)
//   - config/**/*.js         (Node, CommonJS)
//   - root *.js              (Node, CommonJS) — ember-cli-build.js, testem.js, eslint.config.js itself
//
// Octane rules (Requirement 6.9): the spec calls for `ember/no-classic-classes`,
// `ember/no-classic-components`, `ember/no-jquery`, and
// `ember/no-computed-properties-in-native-classes` at error level. They are
// already in `eslint-plugin-ember`'s recommended set, but we re-state them here
// so the linter contract is explicit and survives any future rebase of the
// plugin's recommended set.
//
// The task also names `ember/no-action-modifier` and `ember/no-link-to`. Those
// are template-lint rules (they live in `ember-template-lint` and run against
// `.hbs` files), not ESLint rules. ESLint cannot load them. The equivalent
// JS-side enforcement comes from `ember/no-classic-classes` plus the QUnit
// rendering tests under `tests/`. Template-lint configuration is a separate
// concern and is not in scope for this task.

const ember = require('eslint-plugin-ember');
const emberRecommended = require('eslint-plugin-ember/configs/recommended');
const js = require('@eslint/js');
const globals = require('globals');
const babelParser = require('@babel/eslint-parser');

module.exports = [
  // Files this config does not own.
  {
    ignores: [
      'dist/**',
      'tmp/**',
      'node_modules/**',
      'blueprints/*/files/**',
      'coverage/**',
    ],
  },

  // Baseline JS recommended rules.
  js.configs.recommended,

  // eslint-plugin-ember recommended set (registers the `ember` plugin and its
  // recommended rules across `**/*.{js,ts}`). This already enables the four
  // Octane rules at error level; we re-state them in the per-scope blocks
  // below for clarity.
  ...emberRecommended,

  // Browser-side application + test code.
  {
    files: ['app/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      parser: babelParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          // Ember Octane decorators: `@tracked`, `@action`, `@service`, etc.
          // Use the legacy decorator proposal which is what `ember-cli-babel`
          // 8.x ships in production builds.
          plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
          ],
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: { ember },
    rules: {
      // Octane / Ember 6.x guardrails (Requirement 6.9).
      'ember/no-classic-classes': 'error',
      'ember/no-classic-components': 'error',
      'ember/no-jquery': 'error',
      'ember/no-computed-properties-in-native-classes': 'error',
    },
  },

  // QUnit test globals.
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.qunit,
      },
    },
  },

  // Node-side build / config files.
  {
    files: [
      'eslint.config.js',
      'ember-cli-build.js',
      'testem.js',
      'config/**/*.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // These files are CommonJS / Node. The Ember-class rules don't apply.
      'ember/no-classic-classes': 'off',
      'ember/no-classic-components': 'off',
      'ember/no-computed-properties-in-native-classes': 'off',
    },
  },
];
