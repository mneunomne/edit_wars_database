var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')

const csv=require('csvtojson')

const dataFolder = 'data/BarChart/';
const narrativesFolder = 'data/narratives/';
const outputStackedFolder = 'export/'
const outputUnstackedFolder = 'export/'

const startDate = new Date(2022, 0, 1)
const endDate = new Date(2022,6,31)

function calculateSundaysBetweenDates(dDate1, dDate2) {
  if (dDate1 > dDate2) return false;
  var date  = dDate1;
  var dates = [];
  while (date < dDate2) {
      console.log("date.getDay()", date.getDay())
      if (date.getDay() === 1) dates.push(new Date(date).toISOString());
      date.setDate( date.getDate() + 1 );
  }
  return dates;
}

var allDates = calculateSundaysBetweenDates(startDate, endDate)
console.log("allDates", allDates)

const getDirectories = (source) => {
  //console.log("getDirectories", source)
  var folders = fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  return folders
}

const init = () => {
  var narratives = getDirectories(narrativesFolder)
  narratives.forEach(narrative => {
    //console.log("narrative", narrative)
    var folder = narrativesFolder + narrative
    var files = fs.readdirSync(folder).filter(file => path.extname(file) == '.csv').map(file => narrativesFolder + file );
  })
}

// init()

/*
fs.readdir(dataFolder, { withFileTypes: true }, (err, files) => {
  files.forEach(file => {
    if (path.extname(file) == '.csv') {
      readCsvFile(file)
    }
  });
});
*/

const readTableauFile = (filepath) => {
  console.log("readTableauFile", filepath)
  return new Promise((resolve, reject) => {
    var filename = filepath.split("/")[filepath.split("/").length - 1]
    // console.log("filename", filename, narrative)
    csv({delimiter: '\t'})
      .fromFile(filepath)
      .then((jsonObj)=>{
        let nameId = filename.replace('.csv', '.json')
        var outputData = {}
        //console.log(`readTableauFile`, jsonObj)
        // check if its weekly
        let str = Object.keys(jsonObj[0])[0].replace(/[^a-zA-Z ]/g, "")
        let isWeekly = str.includes("Week")
        if (isWeekly) {
          outputData = processWeeklyStackedChart(jsonObj)
        } else {
          outputData = processDailyStackedChart(jsonObj)
        }
        var dataCounts = generateCountArray(outputData, filename.replace('.csv', ''))
        resolve(dataCounts)
        /*
        // save stacked data
        saveJsonFile(outputStackedFolder + 'stacked_' + filename.replace('.csv', '.json'), JSON.stringify(outputData))
        // save unstacked counts data
        saveJsonFile(outputUnstackedFolder + filename.replace('.csv', '.json'), JSON.stringify(dataCounts))
        */
      })
  })
}
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
      "id": obj["ID"],
      "topic": obj["topic"],
    }
  }).filter(obj => 
    new Date (obj.fetchdate_orig) >= new Date ("01/01/2022")
  )
}

const processDailyStackedChart = (jsonObj) => {
  return jsonObj.map((obj) => {
    if (!obj["fetchdate_orig"]) console.log(obj)
    return {
      "fetchdate_orig": formatDateDaily(obj["fetchdate_orig"]),
      "page_domain_root": obj["page_domain_root"],
      "page_url": obj["page_url"],
      "title": obj["title_new"],
      "id": obj["ID"],
      "topic": obj["topic"],
    }
  })
}

const generateCountArray = (jsonObj, nameId) => {
  if (jsonObj[0]["topic"]) { // check if this tableau data has more than one data
    return generateCountArrayMultiple(jsonObj)
  }
  var dates = [...new Set(jsonObj.map(obj => obj["fetchdate_orig"])), ...allDates]
  dates = [...new Set(dates)].sort()
  var dataValues = dates.map(d => ({
    x: d,
    y: 0
  }))
  jsonObj.map((d) => {
    var date = d.fetchdate_orig
    var index = dates.indexOf(date)
    dataValues[index].y = dataValues[index].y+1
  })
  return {
    "labels": dates,
    "datasets": [{
      "label": nameId,
      "data": dataValues
    }]
  }
}

const generateCountArrayMultiple = (jsonObj) => {
  var dates = [...new Set(jsonObj.map(obj => obj["fetchdate_orig"]))]
  var topics = [...new Set(jsonObj.map(obj => obj["topic"]))]
  var datasets = topics.map(topic => {
    // add initial topic onbect to data array
    var dataValues = dates.map(d => ({
      x: d,
      y: 0
    }))
    jsonObj.filter(obj => obj.topic == topic).forEach((obj) => {
      var date = obj.fetchdate_orig
      var index = dates.indexOf(date)
      dataValues[index].y = dataValues[index].y+1
    })
    return {
      "label": topic,
      "data": dataValues
    }
  })
  return {
    "labels": dates,
    "datasets": datasets
  }
}

const formatDateDaily = (dateString) => {
  //if (!dateString) console.log("dateString", dateString)
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
function getFormattedDateString (date) {
  var year = date.getFullYear();
  var month = (1 + date.getMonth()).toString();
  month = month.length > 1 ? month : '0' + month;
  var day = date.getDate().toString();
  day = day.length > 1 ? day : '0' + day;
  return day + '/' + month + '/' + year;
}

exports.readTableauFile = readTableauFile