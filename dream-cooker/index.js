'use strict';
const Alexa = require('alexa-sdk');

const HAVE_INGREDIENTS_QUESTION = "HAVE_INGREDIENTS";
const HEAR_RECIPE_QUESTION = "HEAR_QUESTION";
const QUESTION_STATE_ATTRIBUTE = "QUESTION_STATE";

const APP_ID = "amzn1.ask.skill.e770bd0d-a891-4563-874c-b6716c36ea04";
const MEDIATYPE_EMAIL_SLOT = "email";
const MEDIATYPE_TEXT_SLOT = "slot";
const MEDIATYPE_TODO_SLOT = "to do list";

const LIST_API_URL = "api.amazonalexa.com";
const LIST_API_PORT = "443";

const FOOD_QUERY_ATTRIBUTE = "FOOD_QUERY";
const FOOD_INGREDIENTS_ATTRIBUTE = "FOOD_INGREDIENTS";

let rp = require('request-promise');

const fetch = require('node-fetch');

const handlers = {
    // Route new requests to Launch Request
    'NewSession': function(){
        this.emitWithState('LaunchRequest')
    },
    'LaunchRequest': function () {
        this.attributes[QUESTION_STATE_ATTRIBUTE] = HAVE_INGREDIENTS_QUESTION;
        this.attributes[FOOD_QUERY_ATTRIBUTE] = "Pizza Is Good";
        this.attributes[FOOD_INGREDIENTS_ATTRIBUTE] = ['Tomato', 'Cheese'];
        this.response.speak("Welcome to Dream Cooker. Want do you want to cook? ")
            .listen("Want do you want to cook?");

        this.emit(':responseReady');
    },
    'MakeFoodIntent': function () {
        // fetch(`https://api.edamam.com/search?q=${event.query}&app_id=${process.env.APP_ID}&app_key=${process.env.APP_KEY}`)
        //     .then(res => res.json())
        //     .then(json => callback(null, {
        //         recipe: '',
        //         ingredients: json.hits[0].recipe.ingredientLines,
        //     }))
        //     .catch(err => callback(new Error(err)));
        this.attributes[FOOD_INGREDIENTS_ATTRIBUTE] = ['Tomato', 'Cheese'];
        this.emit(':responseReady');
    },
    'AMAZON.YesIntent': function(){
        if(this.attributes[QUESTION_STATE_ATTRIBUTE] === HAVE_INGREDIENTS_QUESTION){
            // Query Food API for ingredients
            this.attributes[QUESTION_STATE_ATTRIBUTE] = HEAR_RECIPE_QUESTION;
        }
        else if(this.attributes[QUESTION_STATE_ATTRIBUTE] === HEAR_RECIPE_QUESTION){

        }
        this.emit(':responseReady');
    },
    'AMAZON.NoIntent': function(){
        if(this.attributes[QUESTION_STATE_ATTRIBUTE] === HAVE_INGREDIENTS_QUESTION){
            // Make a shopping list
        }
        else if(this.attributes[QUESTION_STATE_ATTRIBUTE] === HEAR_RECIPE_QUESTION){

        }
        this.emit(':responseReady');
    },
    'SendRecipeIntent': function(){
        const slotValue = this.event.request.intent.slots.mediaType.value;
        let alexa = this;
        if(slotValue === MEDIATYPE_EMAIL_SLOT){
        }
        else if (slotValue === MEDIATYPE_TEXT_SLOT){

        }
        else if (slotValue === MEDIATYPE_TODO_SLOT){
            const accessToken = this.event.context.System.apiAccessToken;
            let listManagementService = new Alexa.services.ListManagementService();
            let date = new Date();
            let listObject = {
                'name': `List for ${this.attributes[FOOD_QUERY_ATTRIBUTE]} on ${date.toLocaleString()}`,
                'state': 'active'
            };
            listManagementService.createList(listObject, accessToken)
                .then(function(data){
                    console.log(data);
                    alexa.attributes[FOOD_INGREDIENTS_ATTRIBUTE].forEach(function (item) {
                        let listItemObject = {
                            'value': item,
                            'status': 'active'
                        };
                        listManagementService.createListItem(data.listId, listItemObject, accessToken)
                            .then(function(data){
                                count++;
                                console.log(data);
                            })
                            .catch(function (err) {
                                console.log(err);
                            });
                    });
                    alexa.response.speak("Your ingredients have been saved in your Alexa lists. Goodbye!");
                    alexa.emit(":responseReady");
                })
                .catch(function(error){
                    console.log(error);
                    alexa.response.speak("I cannot save your ingredients in your Alexa lists. Sorry and goodbye!");
                    alexa.emit(":responseReady");
                });
        }
        else{
            const slotToElicit = 'mediaType';
            const speechOutput = 'Choose the method to send your recipe. '
                + 'It could be email, text, or to do list.';
            const repromptOutput = speechOutput;
            this.emit(':elicitSlot', slotToElicit, speechOutput, repromptOutput);
        }
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':responseReady');
    },
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    //alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
