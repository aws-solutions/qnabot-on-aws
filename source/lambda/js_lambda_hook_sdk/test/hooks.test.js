/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const hooks = require("../lambda_hook_sdk/hooks")
const _ = require("lodash");
const hooksFixture = require('./hooks.fixtures')

describe("Lambda hooks tests",() => {
    test("get_step()",() => {
        let result = hooks.get_step(hooksFixture.event)
        expect(result).toBe(hooks.PREPROCESS)
    })

    test("get_args",() => {
        let result = hooks.get_args(hooksFixture.event)
        expect(result).toStrictEqual(hooksFixture.mockArgs)
    })

    test("get_lex_event", () => {
        let result = hooks.get_lex_event(hooksFixture.event)
        expect(result).toBe(_.get(hooksFixture.event,"req._event"))
    })

    test("get_bot",() => {
        let result = hooks.get_bot(hooksFixture.event)
        expect(result).toBe(_.get(hooksFixture.event,"req._event.bot"))
    })

    test("list_settings",() => {
        let result = hooks.list_settings(hooksFixture.event)
        expect(result).toBe(_.get(hooksFixture.event, "req._settings", {}))
    })

    test("get_settings",() => {
        let result = hooks.get_setting(hooksFixture.event,"ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE")
        expect(result).toBe("HIGH")
    })

    test("list_session_attributes",() => {
        let result = hooks.list_session_attributes(hooksFixture.event)
        expect(result).toBe(_.get(hooksFixture.event, "req.session"))
    })

    test("list_user_attributes",() => {
        let result = hooks.list_user_attributes(hooksFixture.event)
        expect(result).toBe(_.get(hooksFixture.event,"req._userInfo",{}))
    })

    test("get_user_attribute",() => {
        let result = hooks.get_user_attribute(hooksFixture.event,"InteractionCount")
        expect(result).toBe(_.get(hooksFixture.event, "res._userInfo.InteractionCount"))
    })

    test("list_response_card_buttons",() => {
        let result = hooks.list_response_card_buttons(hooksFixture.event)
        expect(result).toBe(_.get(hooksFixture.event, "res.card.buttons"))
    })

    test("get_message",() => {
        let result = hooks.get_message(hooksFixture.event)
        expect(result).toStrictEqual(hooksFixture.mockMessage)
    })

    test("set_message",() => {
        let event = _.cloneDeep(hooksFixture.event)
        let message = {
            plainText: "New text" ,
            markDown: "*New text*",
            ssml: "<loud>New text</loud>"
        }

        hooks.set_message(event, message)
        expect(hooks.get_message(event)).toStrictEqual(message)
    })

    test("get_es_result",() => {
        let result = hooks.get_es_result(hooksFixture.event)
        expect(result).toBe(_.get(hooksFixture.event, "res.result"))
    })

    test("get_answer_source",() => {
        let result = hooks.get_answer_source(hooksFixture.event)
        expect(result).toBe(_.get(hooksFixture.event, "res.result.answerSource"))
    })

    test("get_question",() => {
        let result = hooks.get_question(hooksFixture.event)
        expect(result).toBe(_.get(hooksFixture.event, "req.question"))
    })

    test("get_sentiment",() => {
        let result = hooks.get_sentiment(hooksFixture.event)
        expect(result).toStrictEqual({
            sentiment: _.get(hooksFixture.event,"req.sentiment"),
            score: _.get(hooksFixture.event,"req.sentimentScore")
        })
    })

    test("set_response_card_imageurl",() => {
        let event = _.cloneDeep(hooksFixture.event)
        let testUrl = "https://fake-image-url.example.com"

        hooks.set_response_card_imageurl(event, testUrl)
        expect(_.get(event, "res.card.imageUrl")).toStrictEqual(testUrl)
    })

    test("get_response_card_imageurl",() => {
        let result = hooks.get_response_card_imageurl(hooksFixture.event)
        expect(result).toStrictEqual(_.get(hooksFixture.event, "res.card.imageUrl"))
    })

    test("add_session_attribute",() => {
        let event = _.cloneDeep(hooksFixture.event)
        let actual = hooks.add_session_attribute(event,"unit-test","testValue")

        expect(actual).toStrictEqual(hooksFixture.mockSessionAttributes)
    })

    test("add_user_attribute",() => {
        let event = _.cloneDeep(hooksFixture.event)
        let actual = hooks.add_user_attribute(event,"unit-test","testValue")

        expect(actual).toStrictEqual(hooksFixture.mockUserAttributes)
    })

    test("add_response_card_button should add button to empty list",() => {
        let event = _.cloneDeep(hooksFixture.event)
        _.unset(event, "res.card.buttons")

        let actual = hooks.add_response_card_button(event,"unit-test","this value")
        let expected = [{
            text: "unit-test",
            value: "this value"
        }]
        expect(expected).toStrictEqual(actual)
    })

    test("add_response_card_button should add value without a QID and append button",() => {
        let event = _.cloneDeep(hooksFixture.event)
        let expected = _.cloneDeep(hooksFixture.event)

        let actual = hooks.add_response_card_button(event,"unit-test","this value")
        expected = _.get(expected,"res.card.buttons",[])
        expected.push({
            text: "unit-test",
            value: "this value"
        })

        expect(expected).toStrictEqual(actual)
    })

    test("add_response_card_button should add value without a QID prepend button",() => {
        let event = _.cloneDeep(hooksFixture.event)
        let expected = _.cloneDeep(hooksFixture.event)

        let actual = hooks.add_response_card_button(event,"unit-test","this value",false,true)
        expected = _.get(expected,"res.card.buttons",[])
        expected.unshift({
            text: "unit-test",
            value: "this value"
        })

        expect(expected).toStrictEqual(actual)
    })

    test("add_response_card_button should add value with a QID append button",() => {
        let event = _.cloneDeep(hooksFixture.event)
        let expected = _.cloneDeep(hooksFixture.event)

        let actual = hooks.add_response_card_button(event,"unit-test","A.Question",true,false)
        expected = _.get(expected,"res.card.buttons",[])
        expected.push({
            text: "unit-test",
            value: "QID::A.Question"
        })

        expect(expected).toStrictEqual(actual)

    })

    test("add_response_card_button should add value with a QID prepend button",() => {
        let event = _.cloneDeep(hooksFixture.event)
        let expected = _.cloneDeep(hooksFixture.event)

        let actual = hooks.add_response_card_button(event,"unit-test","A.Question",true,true)
        expected = _.get(expected,"res.card.buttons",[])
        expected.unshift({
            text: "unit-test",
            value: "QID::A.Question"
        })

        expect(expected).toStrictEqual(actual)

    })

    test("set_response_card_title should overwrite if present",() => {
        let event = _.cloneDeep(hooksFixture.event)
        _.set(event, "res.card.title", "original title")
        let expected = _.cloneDeep(hooksFixture.event)

        let actual = hooks.set_response_card_title(event,"This is a test title.")
        expected = _.get(event, "res.card.title")


        expect(expected).toStrictEqual(actual)
        expect(expected).toBe("This is a test title.")

    })

    test("set_response_card_title should overwrite if present",() => {
        let expected = _.cloneDeep(hooksFixture.event)
        _.set(expected, "res.card.title", "original title")


        let actual = hooks.set_response_card_title(expected,"This is a test title.",false)
        expected = _.get(expected, "res.card.title")


        expect(expected).toStrictEqual(actual)
        expect(expected).toBe("original title")

    })

    test("validate_response should return event if res.card is a falsey",() => {
        let event = _.cloneDeep(hooksFixture.event)
        _.set(event, "res.card", undefined)

        let result = hooks.validate_response(event)
        expect(result).toStrictEqual(event)
    })

    test("validate_response should throw error if card.title is undefined",() => {
        let event = _.cloneDeep(hooksFixture.event)
        _.set(event, "res.card.title", undefined)

        expect(() =>{hooks.validate_response(event)}).toThrow()
    })

    test("validate_response should throw error if card.buttons and card.imageUrl are empty",() => {
        let event = _.cloneDeep(hooksFixture.event)
        _.unset(event, "res.card.buttons")
        _.unset(event, "res.card.imageUrl")

        expect(() =>{hooks.validate_response(event)}).toThrow()
    })

    test("validate_response should return successfully if a valid event object is passed",() => {
        let event = _.cloneDeep(hooksFixture.event)

        let result = hooks.validate_response(hooksFixture.event)
        expect(result).toStrictEqual(hooksFixture.event)
    })
})
