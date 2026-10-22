
import nextVitals from 'eslint-config-next/core-web-vitals';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/generated/**',
    'src/app/not-in-use/**',
    'src/lib/components/backgrounds/**',
    'src/lib/components/performance/**',
    'components/**',
    'src/app/new-design-approach/**',
    'src/app/test/**'
  ]),
]);

export default eslintConfig;
