'use strict';
const Alexa = require('alexa-sdk');
// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
const fetch = require('node-fetch');

const HAVE_INGREDIENTS_QUESTION = "HAVE_INGREDIENTS";
const HEAR_RECIPE_QUESTION = "HEAR_QUESTION";
const QUESTION_STATE_ATTRIBUTE = "QUESTION_STATE";

const APP_ID = "amzn1.ask.skill.e770bd0d-a891-4563-874c-b6716c36ea04";
const MEDIATYPE_EMAIL_SLOT = "email";
const MEDIATYPE_TEXT_SLOT = "text";
const MEDIATYPE_TODO_SLOT = "to do list";
const PHONE_NUMBER_ATTRIBUTE = "PHONE_NUMBER";

const LIST_API_URL = "api.amazonalexa.com";
const LIST_API_PORT = "443";

const FOOD_QUERY_ATTRIBUTE = "FOOD_QUERY";
const FOOD_INGREDIENTS_ATTRIBUTE = "FOOD_INGREDIENTS";
const EMAIL_ATTRIBUTE = "EMAIL_ATTRIBUTE";

let rp = require('request-promise');

function sendEmail(address, alexa) {
    var helper = require('sendgrid').mail;

    var from_email = new helper.Email("alexadreamcooker@gmail.com");
    var to_email = new helper.Email(alexa.attributes[EMAIL_ATTRIBUTE]);
    var subject = `Your recipe for ${alexa.attributes[FOOD_QUERY_ATTRIBUTE]}`;
    var content = new helper.Content("text/plain", alexa.attributes[FOOD_INGREDIENTS_ATTRIBUTE].join('<br>'));
    var mail = new helper.Mail(from_email, subject, to_email, content);

    var sg = require('sendgrid')(`${process.env.SENDGRID_API_KEY}`);
    var request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
    });

    sg.API(request, function(error, response) {
        // Doesn't actually handle errors correctly; need a promise. But whatever for now.
        if (error) {
            console.error(error, error.stack);
            alexa.response.speak("Your ingredients have not been sent to the email. Goodbye!");
            alexa.emit(":responseReady");
        } else {
            console.log(response.body);
            alexa.response.speak("Your ingredients have been sent to the email. Goodbye!");
            alexa.emit(":responseReady");
        }
    })
}

function sendText(address, alexa) {
    AWS.config.region = `${process.env.MY_REGION}`;
    AWS.config.update({
          accessKeyId: `${process.env.ACCESS_KEY}`,
          secretAccessKey: `${process.env.SECRET_ACCESS_KEY}`,
    });
    var phoneNumber = address;
    if (phoneNumber.length == 10) {
        phoneNumber = "1" + phoneNumber;
    }
    let sns = new AWS.SNS();
    let params = {
        Message: alexa.attributes[FOOD_INGREDIENTS_ATTRIBUTE].join('\n'),
        MessageStructure: 'string',
        PhoneNumber: phoneNumber,
        Subject: `Your recipe for ${alexa.attributes[FOOD_QUERY_ATTRIBUTE]}`
    };

    sns.publish(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            alexa.response.speak("Your ingredients have not been sent to the phone. Goodbye!");
            alexa.emit(":responseReady");
        } // an error occurred
        else  {
            console.log(data);           // successful response
            alexa.response.speak("Your ingredients have been sent to the phone. Goodbye!");
            alexa.emit(":responseReady");
        }

    });
}

const handlers = {
    // Route new requests to Launch Request
    'NewSession': function(){
        let alexa = this;
        alexa.attributes[EMAIL_ATTRIBUTE] = "";
        if(this.event.session.user.accessToken) {
            const amznProfileURL = 'https://api.amazon.com/user/profile';
            const accessToken = this.event.session.user.accessToken;
            const options = {
                method: 'GET',
                uri: amznProfileURL,
                qs: {
                    access_token: accessToken
                },
                headers: {
                    'User-Agent': 'Request-Promise'
                },
                json: true // Automatically parses the JSON string in the response
            };
            rp(options)
            .then(function(profile){
                alexa.attributes[EMAIL_ATTRIBUTE] = profile.email;
                alexa.emitWithState('LaunchRequest');
            })
            .catch(function (err) {
                alexa.emitWithState('LaunchRequest');
            });
        }
        else{
            this.emitWithState('LaunchRequest');
        }



    },
    'LaunchRequest': function() {
        this.attributes[QUESTION_STATE_ATTRIBUTE] = HAVE_INGREDIENTS_QUESTION;
        this.response.speak("Welcome to Dream Cooker. What do you want to cook? ")
            .listen("Want do you want to cook?");

        this.emit(':responseReady');
    },
    'MakeFoodIntent': function() {
        let foodQuery = this.event.request.intent.slots.food.value;
        this.attributes[FOOD_QUERY_ATTRIBUTE] = foodQuery;
        if (!foodQuery) {
            this.response.speak("Error").listen("What to cook?");
            this.emit(':responseReady');
        }
        else {
            let alexa = this;
            fetch(`https://api.edamam.com/search?q=${foodQuery}&app_id=${process.env.APP_ID}&app_key=${process.env.APP_KEY}`)
                .then(res => res.json())
                .then(function(json){
                    alexa.attributes[FOOD_INGREDIENTS_ATTRIBUTE] = json.hits[0].recipe.ingredientLines;
                    let prompt = "Would you like to receive an email, a text, or save the ingredients into your Alexa lists. ";
                    alexa.response.speak(prompt).listen(prompt);
                    alexa.emit(':responseReady');
                })
                .catch(err => console.log(err));
        }
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
    'AMAZON.NoIntent': function() {
        if(this.attributes[QUESTION_STATE_ATTRIBUTE] === HAVE_INGREDIENTS_QUESTION) {
            // Make a shopping list
        }
        else if(this.attributes[QUESTION_STATE_ATTRIBUTE] === HEAR_RECIPE_QUESTION) {
            // Read recipe one by one
        }
        this.emit(':responseReady');
    },
    'SendRecipeIntent': function() {
        const slotValue = this.event.request.intent.slots.mediaType.value;
        let alexa = this;
        if(slotValue === MEDIATYPE_EMAIL_SLOT) {
            sendEmail(this.attributes[EMAIL_ATTRIBUTE], alexa);
        }
        else if (slotValue === MEDIATYPE_TEXT_SLOT) {
            this.response.speak("What is your phone number?").listen("What is your phone number?");
            this.emit(":responseReady");
        }
        else if (slotValue === MEDIATYPE_TODO_SLOT) {
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
                            .catch(function (err){
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
        else {
            const slotToElicit = 'mediaType';
            const speechOutput = 'Choose the method to send your recipe. '
                + 'It could be email, text, or to do list.';
            const repromptOutput = speechOutput;
            this.emit(':elicitSlot', slotToElicit, speechOutput, repromptOutput);
        }
    },
    'PhoneNumberIntent': function() {
        let phoneNumber = this.event.request.intent.slots.phoneNumber.value;
        this.attributes[PHONE_NUMBER_ATTRIBUTE] = phoneNumber;
        let alexa = this;
        sendText(this.attributes[PHONE_NUMBER_ATTRIBUTE], alexa);
        if (!phoneNumber) {
            alexa.response.speak("Error").listen("What US domestic number would you like me to text the recipe to?");
            alexa.emit(':responseReady');
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
