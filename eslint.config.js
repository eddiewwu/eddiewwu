import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * React Router framework-mode route modules are *required* to export `meta`,
 * `loader`, `ErrorBoundary` and friends alongside their component. The stock
 * react-refresh preset does not know that, so it flagged every route in the app
 * as a fast-refresh hazard. These are the framework's reserved export names.
 */
const ROUTE_MODULE_EXPORTS = [
  'meta',
  'links',
  'headers',
  'loader',
  'action',
  'clientLoader',
  'clientAction',
  'shouldRevalidate',
  'handle',
  'Layout',
  'ErrorBoundary',
  'HydrateFallback',
]

export default defineConfig([
  globalIgnores(['dist', 'build', '.react-router']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // A leading underscore is the convention for "required by the signature,
      // deliberately unused" -- e.g. `meta(_: Route.MetaArgs)`.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['app/routes/**/*.{ts,tsx}', 'app/root.tsx'],
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ROUTE_MODULE_EXPORTS },
      ],
    },
  },
  {
    // shadcn/ui ships each component's `cva` variants as a sibling export by
    // convention. These files are vendored and rarely edited by hand, so the
    // fast-refresh cost the rule guards against is theoretical here.
    files: ['app/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // A provider and the hook that consumes it belong in one file. Splitting
    // them to satisfy fast refresh trades a real convention for a marginal
    // gain, so allow the specific hook each of these exports.
    files: ['app/context/**/*.tsx', 'app/components/client-only.tsx'],
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['useAuth', 'useHydrated'] },
      ],
    },
  },
  {
    // Supabase Edge Functions run on Deno, not in the browser.
    files: ['supabase/functions/**/*.ts'],
    languageOptions: {
      globals: { ...globals.deno },
    },
  },
])
