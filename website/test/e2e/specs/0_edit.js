/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var assert=require('assert')

module.exports = {
    beforeEach:function(browser){
        var page=browser.page.page()
        page.navigate().login().go('edit')
    },
    after:function(browser){
        browser.end() 
    },
    'openClose' : function (browser) {
        var page=browser.page.page()
        var open='.QAs .QA .window-controls .open-window'
        var close='.QAs .QA .window-controls .close-window'
        
        page.click(open)
        .waitForElementVisible(close,3000)
        .waitForElementVisible('.Qs',3000)
        .click(close)
        .waitForElementNotVisible('.Qs',3000)
        .waitForElementVisible(open,3000)
    },
    'addRemove' : function (browser) {
        var page=browser.page.page()
        var add='#controls #more' 
        var remove='.QAs .QA .window-controls .del'
        var start
        page.click(add)
        
        browser.elements('css selector','.QAs .QA',function(el){
            start=el.value.length
        })
        page.click(remove)
        browser.elements('css selector','.QAs .QA',function(el){
            assert.equal(start,el.value.length+1)
        })
        
    },
    'save' : function (browser) {
        var page=browser.page.page()
        page.click("#controls #build")
    },
    'addRemoveQuestion' : function (browser) {
        var page=browser.page.page()
        var add='.QAs .QA #add .fa' 
        var remove='.QAs .QA .Qs .q-delete'
        var open='.QAs .QA .window-controls .open-window'
        var start
        
        page.click(open).click(add)
        browser.pause(1000).elements('css selector','.QAs .QA .Qs li',function(el){
            console.log(el.value)
            start=el.value.length
        })
        page.click(remove)
        browser.elements('css selector','.QAs .QA .Qs li',function(el){
            assert.equal(start,el.value.length+1)
        })
    },
    'editID' : function (browser) {
        var page=browser.page.page()
        var open='.QAs .QA .window-controls .open-window'
        var edit='.QAs .QA .id-edit'
        var input='.QAs .QA .id-input'
        
        page.click(open).click(edit)
        browser.setValue(input,'new')
        page.click(edit)
    },
    'editQuestion' : function (browser) {
        var page=browser.page.page()
        var open='.QAs .QA .window-controls .open-window'
        var edit='.QAs .QA .q-edit'
        var input='.QAs .QA .Qs input'

        page.click(open).click(edit)
        browser.setValue(input,'new')
        page.click(edit)

    },
    'editAnwser' : function (browser) {
        var page=browser.page.page()
        var open='.QAs .QA .window-controls .open-window'
        var edit='.QAs .QA .a-edit'
        var input='.QAs .QA .A input'
        
        page.click(open).click(edit)
        browser.setValue(input,'new')
        page.click(edit)
    }

};
