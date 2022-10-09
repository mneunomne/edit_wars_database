var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')

const { readColabFile } = require('./convert_colab.js')
const { readTableauFile } = require('./convert_tableau')
const { getContent } = require('./content_table')
const { getGraphEvents } = require('./events')
const { getGraphHeadlines } = require('./headlines')
const utils = require('./utils')

const csv=require('csvtojson')

const narrativesFolder = 'data/narratives/';
var outputDataFolder = 'export/data/'
//const editWarsRepo = '/Users/albertoharres/edit_wars/content/'

process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});


const init = () => {
  getContent().then(data => {
    const { backgrounds, steps } = data

    steps.forEach(step => {
      // save step files
      utils.saveJsonFile(step.path, JSON.stringify(step))
    })

    backgrounds.forEach(background => {
      console.log("background.identifier", background)
      // save background files
      const datapath = `${narrativesFolder}${background.narrativeName}/${background.identifier}.csv`
      const exportpath = `${outputDataFolder}${background.identifier}.json`
      if(fs.existsSync(datapath)) {
        // file exists, process data
        processBackgroundData(background, datapath).then(backgroundData => {
          getGraphEvents(background.events).then(events => {
            backgroundData.events = events
            getGraphHeadlines(background.identifier).then(headlines => {
              backgroundData.headlines = headlines
              // save backgroundData file
              utils.saveJsonFile(exportpath, JSON.stringify(backgroundData))
            })
          })
        })
      } else {
        // missing data file
        background.data = 'missing'
      }
      let background_steps = background.steps.split('-')
      background.stepstart = parseInt(background_steps[0])
      background.stepend = parseInt(background_steps[1] || background_steps[0])
      background.name = background.identifier
      background.identifier = `${background.identifier}-${background.stepstart}-${background.stepend}`
      // remove unused parameters
      delete background.steps
      // save background .json file 
      utils.saveJsonFile(background.path, JSON.stringify(background))
    })
  })
}

const processBackgroundData = (background, datapath) => {
  const {identifier} = background
  //console.log("identifier", identifier)
  if (identifier.includes('colab')) {
    // readColab
    //console.log("readColab", datapath)
    return readColabFile(datapath)
  } else if (identifier.includes('tableau')) {
    // readTableau
    //console.log("readTableau", datapath)
    return readTableauFile(datapath)
  } else if (identifier.includes('wordcloud')) {
    //console.log("wordcloud", datapath)
    return new Promise((res, rej) => rej([]))
  }
}

const getDirectories = (source) => {
  var folders = fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  return folders
}

init()