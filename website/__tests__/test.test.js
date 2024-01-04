/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
import gremlins from '../assets/gremlins.min';
const testModule = require('../js/test');

describe('test test', () => {
    test('exec', () => {
        jest.spyOn(gremlins, 'createHorde').mockReturnValue({
            gremlin: jest.fn(),
            unleash: jest.fn(),
        });

        jest.spyOn(window.horde, 'unleash').mockImplementation(() => {});

        const documentSpy = jest.spyOn(document, 'getElementById')
            .mockReturnValueOnce({ hidden: false })
            .mockReturnValueOnce(undefined);

        window.start(false);
        window.start(true);

        expect(documentSpy).toHaveBeenCalledTimes(2);
    });
});
