var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')

const csv=require('csvtojson')

const dataFolder = 'data/BarChart/';
const outputFolder = 'export/BarChart/'


fs.readdir(dataFolder, (err, files) => {
  files.forEach(file => {
    if (path.extname(file) == '.csv') {
      readCsvFile(file)
    }
  });
});

const readCsvFile = (filename) => 
  csv({delimiter: '\t'})
    .fromFile(dataFolder + filename)
    .then((jsonObj)=>{
      var outputData = {}
      console.log(`reading file ${filename}`)
      // check if its weekly
      if (Object.keys(jsonObj[0])[0] == "Week of fetchdate_orig") {
        outputData = processWeeklyStackedChart(jsonObj)
      } else {
        outputData = processDailyStackedChart(jsonObj)
      }
      saveJsonFile(filename.replace('.csv', '.json'), JSON.stringify(outputData))
    })
  
const saveJsonFile = (filename, jsonString) => {
  fs.writeFile(outputFolder + filename, jsonString, 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
    console.log(`${filename} file has been saved.`);
  });
}

const processWeeklyStackedChart = (jsonObj) => {
  return jsonObj.map((obj) => {
    return {
      "fetchdata_orig": formatDate(obj["Week of fetchdate_orig"]),
      "page_domain_root": obj["page_domain_root"],
      "page_url": obj["page_url"],
      "title": obj["title"],
      "id": obj["ID"]
    }
  })
}

const processDailyStackedChart = (jsonObj) => {
  return jsonObj.map((obj) => {
    console.log("obj", obj["fetchdate_orig"])
    return {
      "fetchdata_orig": formatDate(obj["fetchdate_orig"].replace(" 00:00:00", "")),
      "page_domain_root": obj["page_domain_root"],
      "page_url": obj["page_url"],
      "title": obj["title"],
      "id": obj["ID"]
    }
  })
}

const formatDate = (dateString) => {
  dateString = dateString.slice(0, dateString.length - 9) 
  var dateParts = dateString.split("/");
  // month is 0-based, that's why we need dataParts[1] - 1
  var dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]).toString();
  return dateObject
}