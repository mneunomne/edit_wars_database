var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')
const csv=require('csvtojson');
const { resolve } = require('path');

const utils = require('./utils')

const headlinesPath = 'data/headlines/headlines.csv'

const readEventsFile = () => {
  return csv({delimiter: ','}).fromFile(headlinesPath)
}

const getGraphHeadlines = (graph_id) => {
  return new Promise((resolve, reject) => {
    readEventsFile().then((headlines)=>{
      headlines = headlines.filter(h => {
        return h.chart == graph_id
      })
      headlines = cleanHeadlineData(headlines)
      headlines.sort(utils.sortByDate)
      resolve(headlines)
    })
  })
}

const cleanHeadlineData = (headlines) => {
  return headlines.map(headline => (
    {
      date: utils.parseGermanDate(headline.date).toISOString(),
      text_en: headline.text_en,
      link: headline.link
    }
  ))
}

/* test
getGraphHeadlines('cold_war_ii-colab-china').then((data) => {
  console.log("data", data)
})
*/

exports.getGraphHeadlines = getGraphHeadlines