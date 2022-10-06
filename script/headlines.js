var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')

const csv=require('csvtojson')

fs.readdir(dataFolder, { withFileTypes: true }, (err, files) => {
  files.forEach(file => {
    if (path.extname(file) == '.csv') {
      readCsvFile(file)
    }
  });
});