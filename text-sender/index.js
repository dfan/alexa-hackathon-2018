const fetch = require('node-fetch');
require('dotenv').config();
const AWS = require('aws-sdk');

console.log(`${process.env.ACCESS_KEY}`);
console.log(`${process.env.SECRET_ACCESS_KEY}`);

AWS.config.region = `${process.env.MY_REGION}`;
AWS.config.update({
      accessKeyId: `${process.env.ACCESS_KEY}`,
      secretAccessKey: `${process.env.SECRET_ACCESS_KEY}`,
});

exports.handler = (event, context) => {
  var sns = new AWS.SNS();
  var params = {
      Message: event.message.join('\n'),
      MessageStructure: 'string',
      PhoneNumber: event.toAddress,
      Subject: 'your subject'
  };

  sns.publish(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
  });
}

// handler({message: ['Apples', 'Oranges', 'Bananas'], toAddress: '19083920562'});