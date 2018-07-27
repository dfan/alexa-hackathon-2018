# Dream Cooker

Alexa skill that sends you a list of ingredients for what you want to cook. Supports email, SMS, and Alexa todo list.

## Installation Instructions
1. Put everything under `/dream-cooker` into a zip file called `dream-cooker.zip`.
2. Make a lambda function.
3. Upload `dream-cooker.zip` to the lambda function.
4. Set environment variables for the lambda function.
5. Set up Alexa skill with intents and slots.
6. Give lambda ARN role as endpoint for Alexa skill. Create [security profile](https://developer.amazon.com/blogs/post/Tx3CX1ETRZZ2NPC/Alexa-Account-Linking-5-Steps-to-Seamlessly-Link-Your-Alexa-Skill-with-Login-wit).

## Testing Instructions
* To test lambda functions locally, go into the folder, add appropriate variables to .env file, and run node index.js (make sure testing code is uncommented)