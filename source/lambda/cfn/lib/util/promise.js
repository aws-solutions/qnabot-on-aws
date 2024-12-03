/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

class NativePromise extends Promise {
    static retry = function (fnc, retries = 10) {
        return new NativePromise((res, rej) => {
            const next = function (count) {
                console.log(`retries left:${count}`);
                fnc().then(res).catch((err) => {
                    if (count > 0) {
                        return setTimeout(() => next(--count), 1000);
                    }
                    rej(err);
                });
            };
            next(retries);
        });
    };
}

module.exports = NativePromise;
