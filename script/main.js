var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')

const { readColabFile } = require('./convert_colab.js')
const { readTableauFile } = require('./convert_tableau')

console.log("readColabFile", readColabFile)

const csv=require('csvtojson')

const dataFolder = 'data/BarChart/';
const narrativesFolder = 'data/narratives/';
const outputStackedFolder = 'export/'
const outputUnstackedFolder = 'export/'

const init = () => {
  var narratives = getDirectories(narrativesFolder)
  narratives.forEach(narrative => {
    var folder = narrativesFolder + narrative
    var files = fs.readdirSync(folder)
      .filter(file => path.extname(file) == '.csv')
      .map(file => `${folder}/${file}`);
    files.forEach(file => {
      if (file.includes('colab')) {
        // readColab
        readColabFile(file, narrative)
        console.log("readColab", file)
      } else if (file.includes('tableau')) {
        // readTableau
        readTableauFile(file, narrative)
        console.log("readTableau", file)
      }
    })
  })
}

const getDirectories = (source) => {
  var folders = fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  return folders
}

init()