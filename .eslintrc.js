module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2021
    },
    env: {
        node: true
    },
    extends: ['eslint:recommended', 'plugin:vue/recommended', 'airbnb-base'],
    rules: {
        indent: ['warn', 4],
        quotes: ['warn', 'single']
    }
};
