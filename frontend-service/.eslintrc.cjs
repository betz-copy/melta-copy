module.exports = {
    env: {
        browser: true,
    },
    extends: ['airbnb', 'prettier', 'plugin:prettier/recommended', 'plugin:react-hooks/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'prettier'],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    globals: {
        JSX: 'readonly',
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
    },
    rules: {
        quotes: ['error', 'single'],
        'import/prefer-default-export': 'off',
        'import/extensions': 'off',
        'no-unused-vars': 'off',
        'no-console': ['error', { allow: ['error'] }],
        'no-empty': 'warn',
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': ['error'],
        'react/jsx-key': ['error'],
        'no-underscore-dangle': ['error', { allow: ['_id', '__threeObj'] }],
        'react/require-default-props': 'off',
        'react/jsx-props-no-spreading': 'off',
        'no-plusplus': 'off',
        'react/prop-types': 'off',
        'react/no-unused-prop-types': 'off',
        'jsx-a11y/alt-text': 'off',
        'react/jsx-filename-extension': [
            2,
            {
                extensions: ['.tsx'],
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
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',
        'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
    },
};
