'use strict';
const Alexa = require('alexa-sdk');
const HAVE_INGREDIENTS_QUESTION = "HAVE_INGREDIENTS";
const HEAR_RECIPE_QUESTION = "HEAR_QUESTION";
const QUESTION_STATE_ATTRIBUTE = "QUESTION_STATE";
const APP_ID = "amzn1.ask.skill.e770bd0d-a891-4563-874c-b6716c36ea04";
const handlers = {
    // Route new requests to Launch Request
    'NewSession': function(){
        this.emitWithState('LaunchRequest')
    },
    'LaunchRequest': function () {
        this.attributes[QUESTION_STATE_ATTRIBUTE] = HAVE_INGREDIENTS_QUESTION;

        this.emit('GetNewFactIntent');
    },
    'MakeFoodIntent': function () {
        this.emit(':responseReady');
    },
    'EmailTextIntent': function(){
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
