module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
    //
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'json', 'prettier'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:json/recommended',
    // 'plugin:prettier/recommended',
    'prettier',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [
    '.eslintrc.js',
    'node_modules',
    'dist',
    'src/lambdas/template.ts',
    'src/libs/lambda-tools.ts',
    'src/libs/sns-provider.ts',
    'src/libs/sqs-provider.ts',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'json/*': ['error', { allowComments: true }],
  },
};

