module.exports = {
    env: {
        es2023: true,
        node: true,
        jest: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
    },
    extends: ['airbnb-base', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
    plugins: ['@typescript-eslint', 'prettier'],
    ignorePatterns: ['dist', 'node_modules', 'tests', '.eslintrc.js'],
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
            },
        },
    },
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        Express: 'readonly',
    },
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
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            },
        ],

        '@typescript-eslint/no-shadow': ['error'],

        'no-restricted-syntax': 'off',
        'no-plusplus': 'off',
        'max-classes-per-file': 'off',
        'class-methods-use-this': 'off',
        '@typescript-eslint/no-wrapper-object-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'valid-typeof': ['error', { requireStringLiterals: false }],

        'no-underscore-dangle': ['error', { allow: ['_id'] }],
        'no-console': ['error', { allow: ['error'] }],
    },
    root: true,
};
