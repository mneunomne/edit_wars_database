var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')

const csv=require('csvtojson')
const dataFolder = 'data/colab/';
const outputFolder = 'export/'

let topic_labels = JSON.parse(fs.readFileSync('data/topic_labels.json'));


/*
fs.readdir(dataFolder, (err, files) => {
  files.forEach(file => {
    if (path.extname(file) == '.csv') {
      readCsvFile(file)
    }
  });
});
*/

const readColabFile = (filepath) => {
  return new Promise((resolve, reject) => {
    var filename = filepath.split("/")[filepath.split("/").length - 1]
    // console.log("filename", filename, narrative)
    csv({delimiter: ','})
      .fromFile(filepath)
      .then((jsonObj)=>{
        //console.log("readColabFile", jsonObj)
        var outputData = {}
        outputData = generateCountArray(processColabChart(jsonObj))
        resolve(outputData)
        //saveJsonFile(filename.replace('.csv', '.json'), JSON.stringify(outputData))
      })
  })
  }
  
const saveJsonFile = (filename, jsonString) => {
  fs.writeFile(outputFolder + filename, jsonString, 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
    console.log(`${filename} file has been saved.`);
  });
}

const getLabelFromTopic = (topic_id) =>
  topic_labels.find(topic => topic_id == topic.topic_id).label_en


const processColabChart = (jsonObj) => {
  return jsonObj.map((obj) => {
    return {
      "id": obj["id"],
      "frequency": obj["Frequency"],
      "timestamp": formatDate(obj["Timestamp"]),
      "topic": obj["Topic"],
      "words": obj["Words"]
    }
  }).filter(obj => 
    new Date (obj.timestamp) >= new Date ("01/01/2022")
  )
}

const generateCountArray = (jsonObj) => {

  var datasets = []

  // unique topics
  var topics = [...new Set(jsonObj.map(obj => obj["topic"]))]
  // console.log("topics" ,topics)
  // unique dates for the labels
  var dates = [...new Set(jsonObj.map(obj => obj["timestamp"]))]

  // create object for each dataset
  topics.map((topic) => {
    datasets.push({
      'label': getLabelFromTopic(topic), // e.g. topic 19
      'borderColor': ``,
      'backgroundColor': '',
      'data': [],
    })
  })
  
  // populate datasets with data
  jsonObj.map((d) => {
    let topic_index = topics.indexOf(d["topic"]) // pick correct dataset
    datasets[topic_index]['data'].push(
      {
        x: d["timestamp"],
        y: parseInt(d["frequency"]) 
      }
    )
  })
  
  // return in chartjs format 
  return {
    "labels": dates,
    "datasets": datasets
  }
}


const formatDate = (dateString) => {
  //console.log("dateString", dateString)
  var dateObject = new Date(dateString)
  return dateObject.toISOString()
}

exports.readColabFile = readColabFile