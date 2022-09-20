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
      jsonObj = cleanDataObject(jsonObj)
      const connectionData = processWordCloid(jsonObj)
      console.log("connectionData", connectionData)
      saveJsonFile(outputFolder + filename.replace('.csv', '.json'), JSON.stringify(connectionData))
    })
  }


const cleanDataObject = (dataObject) => {
  return dataObject.map(obj => {
    return {
      "source": obj["text"],
      "target": obj["head"],
      "keyword": obj["Regex String (OR)"].replace(/\^|\(|\)/g, ''), // from (всу|обстрел) to всу|обстрел
      "value": parseInt(obj["count"]),
      "source_en": "",
      "target_en": ""
    }
  })
}

const processWordCloid = (dataObject) => {

  var nodes = []
  var links = []

  // collect all sources
  dataObject.map(obj => {
    const re = new RegExp(obj.keyword, 'g');
    nodes.push({
      "id": obj["source"],
      "group": re.exec(obj["source"]) ? "1" : "0", // if is keyword, group 1, if not group 0
      "value": obj["value"],
      "keyword": obj["keyword"]
    })
  })

  // collect all targets
  dataObject.map(obj => {
    const re = new RegExp(obj.keyword, 'g');
    node = nodes.find(n => n["id"] == obj["target"])
    if (node !== undefined) {
      node["value"] += obj["value"]
    } else {
      nodes.push({
        "id": obj["target"],
        "group": re.exec(obj["target"]) ? "1" : "0", // if is keyword, group 1, if not group 0
        "value": obj["value"],
        "keyword": obj["keyword"]
      })
    }
  })

  // array of each link
  links = dataObject.map(obj => {
    return {
      "source": obj["source"],
      "target": obj["target"],
      "source_en": "",
      "target_en": ""
    }
  })

  return {
    "nodes": nodes,
    "links": links
  }
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


const uniqueObjectArray = (dataObject) => {
  return dataObject.filter((value, index, self) =>
    index === self.findIndex((t) => (
      t.text === value.text 
    ))
  )
}