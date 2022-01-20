module.exports = {
    env: {
        browser: true,
    },
    extends: ['airbnb', 'prettier', 'plugin:prettier/recommended', 'plugin:jest/recommended', 'plugin:react-hooks/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'prettier', 'jest'],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.ts', '.tsx'],
            },
        },
    },
    rules: {
        quotes: ['error', 'single'],
        indent: ['error', 4, { SwitchCase: 1 }],
        'import/prefer-default-export': 'off',
        'import/extensions': 'off',
        'no-unused-vars': 'off',
        'no-console': 'warn',
        'linebreak-style': ['error', 'unix'],
        'no-empty': 'warn',
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': ['error'],
        'react/jsx-filename-extension': [
            2,
            {
                extensions: ['.tsx'],
            },
        ],
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                vars: 'all',
                args: 'after-used',
                ignoreRestSiblings: false,
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            },
        ],
        'react/function-component-definition': [
            2,
            {
                namedComponents: 'arrow-function',
                unnamedComponents: 'arrow-function',
            },
        ],
        'no-param-reassign': [
            'error',
            {
                props: true,
                ignorePropertyModificationsFor: ['state'],
            },
        ],
        'react/jsx-key': ['error'],
    },
};
