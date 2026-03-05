module.exports = {
  extends: '@edx/eslint-config',
  settings: {
    react: {
      version: '18.0',
    },
  },
  overrides: [
    {
      files: ['bin/**/*.ts', 'scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
        'no-continue': 'off',
      },
    },
    {
      files: ['tests/**/*.ts', 'utils/**/*.ts', 'src/**/*.ts'],
      rules: {
        'no-console': 'off',
        'no-continue': 'off',
      },
    },
    {
      files: ['src/**/*.ts'],
      rules: {
        'import/no-extraneous-dependencies': ['error', {
          devDependencies: true,
        }],
        'no-param-reassign': ['error', {
          props: true,
          ignorePropertyModificationsFor: ['img'],
        }],
        'no-multi-assign': 'off',
      },
    },
  ],
};
