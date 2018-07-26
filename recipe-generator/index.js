const fetch = require('node-fetch');
require('dotenv').config()

exports.handler = (event, context, callback) => {
  fetch(`https://api.edamam.com/search?q=${event.query}&app_id=${process.env.APP_ID}&app_key=${process.env.APP_KEY}`)
    .then(res => res.json())
    .then(json => callback(json.hits[0].recipe.ingredientLines))
    .catch(err => new Error(err));
}

// handler({ query: 'pizza' }, {}, ingredients => {
//   console.log(ingredients);
// });