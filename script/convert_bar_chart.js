var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')

const csv=require('csvtojson')

const dataFolder = 'data/BarChart/';
const outputStackedFolder = 'export/BarChart/stacked/'
const outputUnstackedFolder = 'export/BarChart/unstacked/'


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
      // console.log(`reading file ${filename}`)
      // check if its weekly
      if (Object.keys(jsonObj[0])[0] == "Week of fetchdate_orig") {
        outputData = processWeeklyStackedChart(jsonObj)
      } else {
        outputData = processDailyStackedChart(jsonObj)
      }
      // save stacked data
      saveJsonFile(outputStackedFolder + filename.replace('.csv', '.json'), JSON.stringify(outputData))
      // save unstacked counts data
      var dataCounts = generateCountArray(outputData)
      saveJsonFile(outputUnstackedFolder + filename.replace('.csv', '.json'), JSON.stringify(dataCounts))
    })
  
const saveJsonFile = (path, jsonString) => {
  fs.writeFile(path, jsonString, 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
    console.log(`${path} file has been saved.`);
  });
}

const processWeeklyStackedChart = (jsonObj) => {
  return jsonObj.map((obj) => {
    return {
      "fetchdate_orig": formatDateWeekly(obj["Week of fetchdate_orig"]),
      "page_domain_root": obj["page_domain_root"],
      "page_url": obj["page_url"],
      "title": obj["title"],
      "id": obj["ID"]
    }
  })
}

const processDailyStackedChart = (jsonObj) => {
  return jsonObj.map((obj) => {
    return {
      "fetchdate_orig": formatDateDaily(obj["fetchdate_orig"]),
      "page_domain_root": obj["page_domain_root"],
      "page_url": obj["page_url"],
      "title": obj["title_new"],
      "id": obj["ID"]
    }
  })
}



const generateCountArray = (jsonObj) => {
  //console.log("jsonObj", jsonObj)
  var dates = [...new Set(jsonObj.map(obj => obj["fetchdate_orig"]))]
  var dataValues = dates.map(d => 0)
  jsonObj.map((d) => {
    var date = d.fetchdate_orig
    var index = dates.indexOf(date)
    dataValues[index] = dataValues[index]+1
  })
  return {
    "dates": dates,
    "counts": dataValues
  }
}


const formatDateDaily = (dateString) => {
  dateString = dateString.slice(0, dateString.length - 9)  // to remove " 00:00:00"
  var dateParts = dateString.split("/");
  // month is 0-based, that's why we need dataParts[1] - 1
  var dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
  return dateObject.toISOString()
}

const formatDateWeekly = (dateString) => {
  var dateObject = new Date(dateString)
  return dateObject.toISOString()
}

// not used because graph js can use time parameter on its graphs
function getFormattedDateString(date) {
  var year = date.getFullYear();
  var month = (1 + date.getMonth()).toString();
  month = month.length > 1 ? month : '0' + month;
  var day = date.getDate().toString();
  day = day.length > 1 ? day : '0' + day;
  return day + '/' + month + '/' + year;
}