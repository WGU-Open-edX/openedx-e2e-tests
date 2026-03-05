module.exports = {
  extends: '@edx/eslint-config',
  overrides: [
    {
      files: ['bin/**/*.ts', 'scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
        'no-continue': 'off',
      },
    },
    {
      files: ['tests/**/*.ts', 'utils/**/*.ts'],
      rules: {
        'no-console': 'off',
        'no-continue': 'off',
      },
    },
  ],
};
