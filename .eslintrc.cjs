module.exports = {
  root: true,
  overrides: [
    {
      files: ['**/next-env.d.ts'],
      rules: {
        '@typescript-eslint/triple-slash-reference': 'off',
      },
    },
  ],
}
