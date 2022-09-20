var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')

const csv=require('csvtojson')
const dataFolder = 'data/WordCloud/';
const outputFolder = 'export/WordCloud/'

fs.readdir(dataFolder, (err, files) => {
  files.forEach(file => {
    if (path.extname(file) == '.csv') {
      readCsvFile(file)
    }
  });
});

const readCsvFile = (filename) => {
  csv({delimiter: '\t'})
    .fromFile(dataFolder + filename)
    .then((jsonObj)=>{
      var outputData = {}
      
      console.log("jsonObj", jsonObj)
    
      //saveJsonFile(filename.replace('.csv', '.json'), JSON.stringify(outputData))
    })
  }

const processWordCloid = (dataObject) => {
  
  var sources = dataObject.map(obj => {
    return {
      "text_ru": obj["text"],
      "text_en": obj["text eng"]
    }
  })

  var targets = dataObject.map(obj => {
    return {
      "text_ru": obj["text"],
      "text_en": obj["text eng"]
    }
  })
}

const uniqueObjectArray = (dataObject) => {
  return dataObject.filter((value, index, self) =>
    index === self.findIndex((t) => (
      t.text === value.text 
    ))
  )
}