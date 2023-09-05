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
        'no-underscore-dangle': ['error', { allow: ['_id'] }],
        'no-unused-vars': 'off', // Checked by typescript
        'no-undef': 'off', // Checked by typescript
        'import/prefer-default-export': 'off',
    },
};
