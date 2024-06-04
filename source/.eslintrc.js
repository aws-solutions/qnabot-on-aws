module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2021
    },
    env: {
        node: true
    },
    extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'airbnb-base', 'plugin:vue-pug/vue3-recommended'],
    rules: {
        indent: ['warn', 4],
        quotes: ['warn', 'single'],
        'vue/no-deprecated-slot-attribute': 'off'
    }
};
