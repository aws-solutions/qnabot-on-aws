const hooks = require("../lambda_hook_sdk/hooks")
const _ = require("lodash");
const hooksFixture = require('./hooks.fixtures')

describe("Lambda hooks tests",() => {
    test("get_step()",() => {
        let result = hooks.get_step(hooksFixture.srcEvent)
        expect(result).toBe(hooks.PREPROCESS)
    })

    test("get_args",() => {
        let result = hooks.get_args(hooksFixture.srcEvent)
        console.log(result)
        expect(result).toStrictEqual([
            {
                "test1":"A",
                "test2":"B",
                "test3":"C"
            },"string test"]
        )
    })

    test("get_lex_event", () => {
        let result = hooks.get_lex_event(hooksFixture.srcEvent)
        expect(result).toBe(_.get(hooksFixture.srcEvent,"req._event"))
    })

    test("get_bot",() => {
        let result = hooks.get_bot(hooksFixture.srcEvent)
        expect(result).toBe(_.get(hooksFixture.srcEvent,"req._event.bot"))
    })

    test("list_settings",() => {
        let result = hooks.list_settings(hooksFixture.srcEvent)
        expect(result).toBe(_.get(hooksFixture.srcEvent, "req._settings", {}))
    })

    test("get_settings",() => {
        let result = hooks.get_setting(hooksFixture.srcEvent,"ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE")
        expect(result).toBe("HIGH")
    })

    test("list_session_attributes",() => {
        let result = hooks.list_session_attributes(hooksFixture.srcEvent)
        expect(result).toBe(_.get(hooksFixture.srcEvent, "req.session"))
    })

    test("list_user_attributes",() => {
        let result = hooks.list_user_attributes(hooksFixture.srcEvent)
        expect(result).toBe(_.get(hooksFixture.srcEvent,"req._userInfo",{}))
    })

    test("get_user_attribute",() => {
        let result = hooks.get_user_attribute(hooksFixture.srcEvent,"InteractionCount")
        expect(result).toBe(6)
    })

    test("list_response_card_buttons",() => {
        let result = hooks.list_response_card_buttons(hooksFixture.srcEvent)
        expect(result).toBe(_.get(hooksFixture.srcEvent, "res.card.buttons"))
    })

    //todo create a separate event object to test this
    test("get_response_card_imageurl",() => {
        let result = hooks.get_response_card_imageurl(hooksFixture.srcEvent)
        expect(result).toBe(_.get(hooksFixture.srcEvent, "res.card.ImageUrl"))
    })

    test("get_message",() => {
        let result = hooks.get_message(hooksFixture.srcEvent2)
        expect(result).toStrictEqual({
            plainText: "ABC Street" ,
            markDown: "*ABC Street*",
            ssml: "<loud>ABC Street</loud>"
        })
    })

    test("set_message",() => {
        let event = _.cloneDeep(hooksFixture.srcEvent2)
        let message = {
            plainText: "New text" ,
            markDown: "*ANew text*",
            ssml: "<loud>New text</loud>"
        }

        hooks.set_message(event, message)
        expect(hooks.get_message(event)).toStrictEqual(message)
    })

    test("get_es_result",() => {
        let result = hooks.get_es_result(hooksFixture.srcEvent)
        expect(result).toBe(_.get(hooksFixture.srcEvent, "res.result"))
    })

    test("get_answer_source",() => {
        let result = hooks.get_answer_source(hooksFixture.srcEvent)
        expect(result).toBe(_.get(hooksFixture.srcEvent, "res.result.answerSource"))
    })

    test("get_question",() => {
        let result = hooks.get_question(hooksFixture.srcEvent)
        expect(result).toBe(_.get(hooksFixture.srcEvent, "req.question"))
    })

    test("get_sentiment",() => {
        let result = hooks.get_sentiment(hooksFixture.srcEvent)
        expect(result).toStrictEqual({
            sentiment: _.get(hooksFixture.srcEvent,"req.sentiment"),
            score: _.get(hooksFixture.srcEvent,"req.sentimentScore")
        })
    })

    test("add_session_attribute",() => {
        let event = _.cloneDeep(hooksFixture.srcEvent)
        let expected = _.cloneDeep(hooksFixture.srcEvent)

        let actual = hooks.add_session_attribute(event,"unit-test","this value")
        expected = _.get(expected,"res.session")
        expected["unit-test"] = "this value"

        expect(expected).toStrictEqual(actual)

    })

    test("add_user_attribute",() => {
        let event = _.cloneDeep(hooksFixture.srcEvent)
        let expected = _.cloneDeep(hooksFixture.srcEvent)

        let actual = hooks.add_user_attribute(event,"unit-test","this value")
        expected = _.get(expected,"res._userInfo")
        expected["unit-test"] = "this value"

        expect(expected).toStrictEqual(actual)

    })

    test("add_response_card_button should add button to empty list",() => {
        let event = _.cloneDeep(hooksFixture.srcEvent)
        _.unset(event, "res.card.buttons")

        let actual = hooks.add_response_card_button(event,"unit-test","this value")
        let expected = [{
            text: "unit-test",
            value: "this value"
        }]
        expect(expected).toStrictEqual(actual)
    })

    test("add_response_card_button should add value without a QID and append button",() => {
        let event = _.cloneDeep(hooksFixture.srcEvent)
        let expected = _.cloneDeep(hooksFixture.srcEvent)

        let actual = hooks.add_response_card_button(event,"unit-test","this value")
        expected = _.get(expected,"res.card.buttons",[])
        expected.push({
            text: "unit-test",
            value: "this value"
        })

        expect(expected).toStrictEqual(actual)
    })

    test("add_response_card_button should add value without a QID prepend button",() => {
        let event = _.cloneDeep(hooksFixture.srcEvent)
        let expected = _.cloneDeep(hooksFixture.srcEvent)

        let actual = hooks.add_response_card_button(event,"unit-test","this value",false,true)
        expected = _.get(expected,"res.card.buttons",[])
        expected.unshift({
            text: "unit-test",
            value: "this value"
        })

        expect(expected).toStrictEqual(actual)
    })

    test("add_response_card_button should add value with a QID append button",() => {
        let event = _.cloneDeep(hooksFixture.srcEvent)
        let expected = _.cloneDeep(hooksFixture.srcEvent)

        let actual = hooks.add_response_card_button(event,"unit-test","A.Question",true,false)
        expected = _.get(expected,"res.card.buttons",[])
        expected.push({
            text: "unit-test",
            value: "QID::A.Question"
        })

        expect(expected).toStrictEqual(actual)

    })

    test("add_response_card_button should add value with a QID prepend button",() => {
        let event = _.cloneDeep(hooksFixture.srcEvent)
        let expected = _.cloneDeep(hooksFixture.srcEvent)

        let actual = hooks.add_response_card_button(event,"unit-test","A.Question",true,true)
        expected = _.get(expected,"res.card.buttons",[])
        expected.unshift({
            text: "unit-test",
            value: "QID::A.Question"
        })

        expect(expected).toStrictEqual(actual)

    })

    test("set_response_card_title should overwrite if present",() => {
        let event = _.cloneDeep(hooksFixture.srcEvent)
        _.set(event, "res.card.title", "original title")
        let expected = _.cloneDeep(hooksFixture.srcEvent)

        let actual = hooks.set_response_card_title(event,"This is a test title.")
        expected = _.get(event, "res.card.title")


        expect(expected).toStrictEqual(actual)
        expect(expected).toBe("This is a test title.")

    })


    test("set_response_card_title should overwrite if present",() => {
        let event = _.cloneDeep(hooksFixture.srcEvent)
        let expected = _.cloneDeep(hooksFixture.srcEvent)
        _.set(expected, "res.card.title", "original title")


        let actual = hooks.set_response_card_title(expected,"This is a test title.",false)
        expected = _.get(expected, "res.card.title")


        expect(expected).toStrictEqual(actual)
        expect(expected).toBe("original title")

    })

})
