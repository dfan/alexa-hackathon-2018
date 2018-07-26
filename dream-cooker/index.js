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

const handlers = {
    // Route new requests to Launch Request
    'NewSession': function(){
        this.emitWithState('LaunchRequest')
    },
    'LaunchRequest': function () {
        this.attributes[QUESTION_STATE_ATTRIBUTE] = HAVE_INGREDIENTS_QUESTION;

        this.emit(':responseReady');
    },
    'MakeFoodIntent': function () {

        this.attributes[FOOD_INGREDIENTS_ATTRIBUTE] = [];
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
        if(slotValue === MEDIATYPE_EMAIL_SLOT){

        }
        else if (slotValue === MEDIATYPE_TEXT_SLOT){

        }
        else if (slotValue === MEDIATYPE_TODO_SLOT){
            const consentToken = this.event.session.user.permissions.consentToken;
            const options = {
                method: 'POST',
                host: LIST_API_URL,
                port: LIST_API_PORT,
                path: '/v2/householdlists/',
                headers: {
                    'User-Agent': 'Request-Promise',
                    'Authorization': 'Bearer ' + consentToken,
                    'Content-Type': 'application/json'
                },
                body:{
                    'name': this.attributes[FOOD_QUERY_ATTRIBUTE] + ' ' + 'Ingredients',
                    'state': 'active'
                },
                json: true // Automatically parses the JSON string in the response
            };
            rp(options)
                .then(function(response){

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
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
