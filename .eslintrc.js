module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2021
    },
    env: {
        node: true
    },
    extends: ['eslint:recommended'],
    rules: {
        indent: ['warn', 4],
        quotes: ['warn', 'single']
    }
};
