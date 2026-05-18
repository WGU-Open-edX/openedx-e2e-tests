module.exports = {
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  settings: {
    react: {
      version: '18.0',
    },
  },
  rules: {
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off',
    'max-len': 'off',
    'arrow-parens': ['error', 'as-needed'],
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
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
