'use strict';
const Alexa = require('alexa-sdk');
// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const Cheerio = require('cheerio');

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
const FOOD_RECIPE_ATTRIBUTE = "FOOD_RECIPE";
const EMAIL_ATTRIBUTE = "EMAIL_ATTRIBUTE";

let rp = require('request-promise');

function sendEmail(address, alexa) {
    var helper = require('sendgrid').mail;

    var from_email = new helper.Email("alexadreamcooker@gmail.com");
    var to_email = new helper.Email(alexa.attributes[EMAIL_ATTRIBUTE]);
    var subject = `Your recipe for ${alexa.attributes[FOOD_QUERY_ATTRIBUTE]}`;
    var content = new helper.Content("text/html", "<html><head></head><body><p>" + alexa.attributes[FOOD_INGREDIENTS_ATTRIBUTE].join('<br>') + "</p></body></html>");
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
    'NewSession': function() {
        let alexa = this;
        alexa.attributes[EMAIL_ATTRIBUTE] = "";
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
    },
    'LaunchRequest': function() {
        let alexa = this;
        this.attributes[QUESTION_STATE_ATTRIBUTE] = HAVE_INGREDIENTS_QUESTION;
        if (!this.event.session.user.accessToken) {
            alexa.response.speak("Welcome to Dream Cooker. What do you want to cook? By the way, you will need to link your account in the Alexa app and allow list read/write permissions if you want your recipes emailed and sent to your to-do list, respectively.").listen("What do you want to cook?");
        } else {
            alexa.response.speak("Welcome to Dream Cooker. What do you want to cook? ").listen("What do you want to cook?");
        }
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
            fetch(`https://www.allrecipes.com/search/results/?wt=${event.query}&sort=p`)
                .then(res => res.text())
                .then(html => {
                    let $ = Cheerio.load(html);
                    const numResults = parseInt($('p.search-results__text .subtext').html().split()[0]);
                    if (numResults < 1) {
                        alexa.response.speak(`No results were found for ${alexa.attributes[FOOD_QUERY_ATTRIBUTE]}.`);
                        alexa.emit(':responseReady');
                    } else {
                        const recipeLink = $('section#fixedGridSection .fixed-recipe-card')
                                            .children()[2].children[1].children[1].attribs['href'];
                        fetch(recipeLink)
                            .then(resp => resp.text())
                            .then(body => {
                                $ = Cheerio.load(body);
                                const recipe = $('span.recipe-directions__list--item').map(function (i, el) {
                                    const step = $(this).html().replace(/\n/g, '').trim();
                                    if (step.length > 0 && step != ' ')
                                        return step;
                                }).get();
                                const ingredients = $('span.recipe-ingred_txt.added[itemprop="recipeIngredient"]').map(function (i, el) {
                                    const ingredient = $(this).html().replace(/\n/g, '').trim();
                                    if (ingredient.length > 0 && ingredient != ' ')
                                        return ingredient;
                                }).get();
                                alexa.attributes[FOOD_RECIPE_ATTRIBUTE] = recipe;
                                alexa.attributes[FOOD_INGREDIENTS_ATTRIBUTE] = ingredients;
                                let prompt = "Would you like to receive an email, a text, or save the ingredients into your Alexa lists. ";
                                alexa.response.speak(prompt).listen(prompt);
                                alexa.emit(':responseReady');
                            })
                            .catch(e => {
                                console.log(e);
                                alexa.response.speak(`Error when looking for recipes for ${alexa.attributes[FOOD_QUERY_ATTRIBUTE]}.`);
                                alexa.emit(':responseReady');
                            });
                    }
                })
                .catch(err => {
                    console.log(err);
                    alexa.response.speak(`Error when looking for recipes for ${alexa.attributes[FOOD_QUERY_ATTRIBUTE]}.`);
                    alexa.emit(':responseReady');
                });
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
        if (slotValue === MEDIATYPE_EMAIL_SLOT) {
            const accessToken = this.event.session.user.accessToken;
            if (!accessToken) {
                // Generate link account card in Alexa app
                this.response.linkAccountCard();
                alexa.response.speak("You will need to link your account to this skill in the Alexa app, so that we can get your email address. Goodbye!");
                alexa.emit(":responseReady");
            } else {
                sendEmail(this.attributes[EMAIL_ATTRIBUTE], alexa);
            }
        }
        else if (slotValue === MEDIATYPE_TEXT_SLOT) {
            this.response.speak("What is your phone number?").listen("What is your phone number?");
            this.emit(":responseReady");
        }
        else if (slotValue === MEDIATYPE_TODO_SLOT) {
            if (this.event.context.System.user.permissions == undefined) {
                // Generate card for enabling list read/write in Alexa app
                alexa.response.speak("Please grant skill permissions to read and write to your to-do lists in the Alexa app. Goodbye."); 
                const permissions = ['read::alexa:household:list', 'write::alexa:household:list']; 
                alexa.response.askForPermissionsConsentCard(permissions); 
                alexa.emit(":responseReady"); 
            } else {
                const consentToken = this.event.context.System.user.permissions.consentToken;
                let listManagementService = new Alexa.services.ListManagementService();
                let date = new Date();
                let listObject = {
                    'name': `List for ${this.attributes[FOOD_QUERY_ATTRIBUTE]} on ${date.toLocaleString()}`,
                    'state': 'active'
                };
                listManagementService.createList(listObject, consentToken)
                    .then(function(data){
                        console.log(data);
                        alexa.attributes[FOOD_INGREDIENTS_ATTRIBUTE].forEach(function (item) {
                            let listItemObject = {
                                'value': item,
                                'status': 'active'
                            };
                            listManagementService.createListItem(data.listId, listItemObject, consentToken)
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
                .catch(function(error) {
                    console.log(error);
                    alexa.response.speak("I cannot save your ingredients in your Alexa lists. Sorry and goodbye!");
                    alexa.emit(":responseReady");
                });
            }
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
        this.response.speak("Welcome to Dream Cooker! You will need to link your account and grant list read and write permissions, in the Alexa app, to get full functionality. When you invoke this skill, I will prompt you for something you'd like to cook. You can then choose to receive the recipe by email, text, or save it to your to-do list.")
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
