const fetch = require('node-fetch');
require('dotenv').config();
const AWS = require('aws-sdk');

AWS.config.region = `${process.env.MY_REGION}`;
AWS.config.update({
      accessKeyId: `${process.env.ACCESS_KEY}`,
      secretAccessKey: `${process.env.SECRET_ACCESS_KEY}`,
});

handler = (event, context) => {
  // var params = {
  //     Destination: { /* required */
  //       CcAddresses: [
  //       ],
  //       ToAddresses: [
  //         event.address //Insert the legit address here.
  //         /* more items */
  //       ]
  //     },
  //     Message: { /* required */
  //       Body: { /* required */
  //         Html: {
  //           Charset: "UTF-8",
  //           Data: "<html><head></head><body><p>" + event.message.join('<br>') + "</p></body></html>"
  //         },
  //         Text: {
  //          Charset: "UTF-8",
  //          Data: event.message.join('\n')
  //         }
  //      },
  //      Subject: {
  //       Charset: "UTF-8",
  //       Data: "Your Shopping List from Alexa Dream Cooker"
  //      }
  //     },
  //   Source: "alexadreamcooker@gmail.com", /* required */
  //   ReplyToAddresses: [
  //       "alexadreamcooker@gmail.com"
  //     /* more items */
  //   ],
  // };       

  // // Create the promise and SES service object
  // var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

  // // Handle promise's fulfilled/rejected states
  // sendPromise.then(
  //   function(data) {
  //     console.log(data.MessageId);
  //   }).catch(
  //     function(err) {
  //     console.error(err, err.stack);
  //   });
  var helper = require('sendgrid').mail;

  from_email = new helper.Email("alexadreamcooker@gmail.com");
  to_email = new helper.Email(event.address);
  subject = "Sending with SendGrid is Fun";
  content = new helper.Content("text/html", "<html><head></head><body><p>" + event.message.join('<br>') + "</p></body></html>");
  mail = new helper.Mail(from_email, subject, to_email, content);

  var sg = require('sendgrid')(`${process.env.SENDGRID_API_KEY}`);
  var request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });

  sg.API(request, function(error, response) {
    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);
  })

  
}

handler({message: ['Apples', 'Oranges', 'Bananas'], address: 'davidfan219@gmail.com'});

