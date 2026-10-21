/**
 * dependency-cruiser configuration — architecture boundary enforcement.
 * Complements eslint-plugin-boundaries (spec.md R3.x).
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: 'no-web-to-server',
      comment: 'apps/web must not import from apps/server (spec.md R3.2)',
      severity: 'error',
      from: { path: '^apps/web' },
      to: { path: '^apps/server' },
    },
    {
      name: 'no-server-to-web',
      comment: 'apps/server must not import from apps/web (spec.md R3.2)',
      severity: 'error',
      from: { path: '^apps/server' },
      to: { path: '^apps/web' },
    },
    {
      name: 'shared-types-is-type-only',
      comment:
        'packages/shared-types must stay a pure contract layer: no imports ' +
        'outside itself (test files exempted — dev tooling only).',
      severity: 'error',
      from: { path: '^packages/shared-types', pathNot: '\\.test\\.ts$' },
      to: { pathNot: '^packages/shared-types' },
    },
  ],
  options: {
    exclude: { path: '(node_modules|dist|coverage|\\.pnpm-store)' },
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },
  },
};
