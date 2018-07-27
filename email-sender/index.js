const fetch = require('node-fetch');
require('dotenv').config();
const AWS = require('aws-sdk');

AWS.config.region = `${process.env.MY_REGION}`;
AWS.config.update({
      accessKeyId: `${process.env.ACCESS_KEY}`,
      secretAccessKey: `${process.env.SECRET_ACCESS_KEY}`,
});

handler = (event, context) => {
  var params = {
      Destination: { /* required */
        CcAddresses: [
        ],
        ToAddresses: [
          event.address //Insert the legit address here.
          /* more items */
        ]
      },
      Message: { /* required */
        Body: { /* required */
          Html: {
            Charset: "UTF-8",
            Data: ""
          },
          Text: {
           Charset: "UTF-8",
           Data: event.message.join('\n')
          }
       },
       Subject: {
        Charset: "UTF-8",
        Data: "Your Shopping List from Alexa Dream Cooker"
       }
      },
    Source: "alexadreamcooker@gmail.com", /* required */
    ReplyToAddresses: [
        "alexadreamcooker@gmail.com"
      /* more items */
    ],
  };       

  // Create the promise and SES service object
  var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

  // Handle promise's fulfilled/rejected states
  sendPromise.then(
    function(data) {
      console.log(data.MessageId);
    }).catch(
      function(err) {
      console.error(err, err.stack);
    });
}

// handler({message: ['Apples', 'Oranges', 'Bananas'], address: 'dfan@princeton.edu'});

