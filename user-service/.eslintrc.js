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
        'no-unused-vars': 'off', // Checked by typescript
        'arrow-body-style': 'off',
        'no-shadow': 'off',
        'import/prefer-default-export': 'off',
        'max-classes-per-file': 'off',
        'no-underscore-dangle': 'off',
        'consistent-return': 'off',
        'no-plusplus': 'off',
        'no-console': ['error', { allow: ['error'] }],
    },
};
