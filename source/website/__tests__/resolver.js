/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
// Call the defaultResolver, so we leverage its cache, error handling, etc.
module.exports = (path, options) => options.defaultResolver(path, {
    ...options,
    packageFilter: (pkg) => {
        // This is a workaround for https://github.com/uuidjs/uuid/pull/616
        //
        // jest-environment-jsdom 28+ tries to use browser exports instead of default exports,
        // but uuid only offers an ESM browser export and not a CommonJS one. Jest does not yet
        // support ESM modules natively, so this causes a Jest error related to trying to parse
        // "export" syntax.
        //
        // This workaround prevents Jest from considering uuid's module-based exports at all;
        // it falls back to uuid's CommonJS+node "main" property.
        //
        // Once we're able to migrate our Jest config to ESM and a browser crypto
        // implementation is available for the browser+ESM version of uuid to use (eg, via
        // https://github.com/jsdom/jsdom/pull/3352 or a similar polyfill), this can go away.
        if (pkg.name === 'uuid') {
            delete pkg['exports'];
            delete pkg['module'];
        }
        return pkg;
    },
});
