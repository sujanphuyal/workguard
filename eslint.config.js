const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    ignores: ['node_modules/', 'dist/', '.expo/', 'supabase/types.ts', 'supabase/functions/**', 'src/components/EditScreenInfo.tsx', 'src/components/useClientOnlyValue*.ts'],
  },
];
