module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { project: './tsconfig.json', ecmaVersion: 2020, sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks', 'react'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { browser: true, node: true, es2020: true },
  ignorePatterns: ['src/assets/echarts.js', 'src/config/config.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }
    ],
    'react/jsx-key': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error'
  }
}
