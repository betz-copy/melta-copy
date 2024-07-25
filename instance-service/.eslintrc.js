module.exports = {
    env: {
        es6: true,
        node: true,
        jest: true,
    },
    extends: ['airbnb-base', 'plugin:prettier/recommended'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.ts', '.json'],
            },
        },
    },
    ignorePatterns: ['dist'],
    rules: {
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'never',
                ts: 'never',
                json: 'never',
            },
        ],
        'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.spec.ts', '**/*.mock.ts'] }],
        'no-underscore-dangle': ['error', { allow: ['_id'] }],
        'no-console': 'off',
        'no-unused-vars': 'off', // Checked by typescript
        'no-plusplus': 'off', // shitty rule
        'import/prefer-default-export': 'off',
        'no-restricted-syntax': 'off',
        'valid-typeof': ['error', { requireStringLiterals: false }],
        semi: [2, 'always'],
    },
};
