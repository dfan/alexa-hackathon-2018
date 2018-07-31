const fetch = require('node-fetch');
const Cheerio = require('cheerio');
require('dotenv').config();

exports.handler = (event, context, callback) => {
  fetch(`https://www.allrecipes.com/search/results/?wt=${event.query}&sort=p`)
    .then(res => res.text())
    .then(html => {
      let $ = Cheerio.load(html);
      const numResults = parseInt($('p.search-results__text .subtext').html().split()[0]);
      if (numResults < 1)
        callback(new Error(`No results for ${event.query}`));
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
          const ingredients = $('span.recipe-ingred_txt.added[itemprop="recipeIngredient"]').map(function(i, el) {
            const ingredient = $(this).html().replace(/\n/g, '').trim();
            if (ingredient.length > 0 && ingredient != ' ')
              return ingredient;
          }).get();
          callback(null, {
            recipe: recipe,
            ingredients: ingredients,
          })
        })
        .catch(e => callback(new Error(e)));
    })
    .catch(err => callback(new Error(err)));
}

// handler({ query: 'pizza' }, {}, (_, recipeInfo) => {
//   console.log(recipeInfo);
// });