var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')
const csv=require('csvtojson');
const { resolve } = require('path');

const utils = require('./utils')

console.log("utils", utils)

const eventsPath = 'data/events/events.csv'

const readEventsFile = () => {
  return csv({delimiter: ','}).fromFile(eventsPath)
}

const getGraphEvents = (graph_id) => {
  return new Promise((resolve, reject) => {
    readEventsFile().then((events)=>{
      if (events[0][graph_id] == null || events[0][graph_id] == undefined) return resolve([])
      events = events.filter(h => h[graph_id] == '1')
      events = cleanEventData(events)
      events.sort(utils.sortByDate)
      resolve(events)
    })
  })
}

const cleanEventData = (events) => {
  return events.map(event => (
    {
      date: utils.parseGermanDate(event.Date).toISOString(),
      text: event.text,
      link: event.Source
    }
  ))
}

/*
getGraphEvents('cold_war_ii-china').then((data) => {
  console.log("data", data)
})
*/

exports.getGraphEvents = getGraphEvents