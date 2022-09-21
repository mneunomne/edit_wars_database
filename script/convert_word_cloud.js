var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')

const csv=require('csvtojson')
const dataFolder = 'data/WordCloud/';
const outputFolder = 'export/'


var mergedNodes = []
var mergedLinks = []
var mergedConnections = {}

var files_length = 0
var saved_file_index = 0

fs.readdir(dataFolder, (err, files) => {
  files_length = files.length
  files.forEach((file ,index) => {
    if (path.extname(file) == '.csv') {
      readCsvFile(file, index)
    }
  });
});

const readCsvFile = (filename, index) => {
  return csv({delimiter: '\t'})
    .fromFile(dataFolder + filename)
    .then((jsonObj)=>{
      var outputData = {}
      jsonObj = cleanDataObject(jsonObj)
      const connectionData = processWordCloud(jsonObj, index)
      // console.log("connectionData", connectionData)
      saveJsonFile(outputFolder + filename.replace('.csv', '.json'), JSON.stringify(connectionData)).then((index) => {
        if (saved_file_index == files_length-1) {
          mergedConnections = {
            "nodes": mergedNodes,
            "links": mergedLinks
          }
          //console.log("mergedConnections" ,mergedConnections)
          saveJsonFile(outputFolder + "mergedConnections.json", JSON.stringify(mergedConnections))
        }
      })
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

const processWordCloud = (dataObject, index) => {

  var nodes = []
  var links = []

  // nodes for local file
  nodes = collectNodes(dataObject, nodes, index)
  
  // all nodes merged
  mergedNodes = collectNodes(dataObject, mergedNodes, index)

  // array of each link
  links = dataObject.map(obj => {
    return {
      "source": obj["source"],
      "target": obj["target"],
      "source_en": "",
      "target_en": ""
    }
  })

  // merged links
  mergedLinks = mergedLinks.concat(links)

  return {
    "nodes": nodes,
    "links": links
  }
}

const saveJsonFile = (path, jsonString) => {
  return new Promise(function (resolve, reject) {
    fs.writeFile(path, jsonString, 'utf8', function (err) {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      reject()
      return console.log(err);
    }
    saved_file_index++
    console.log(`${path} file has been saved.`, files_length, saved_file_index);
    resolve(saved_file_index)
    })
  })
}

/*
    // save merged connections after all connections are saved
    if (saved_file_index == files_length-1) {
      mergedConnections = {
        "nodes": mergedNodes,
        "links": mergedLinks
      }
    }
*/

const saveMergedFile = (path, jsonString) => {

}

const collectNodes = (dataObject, nodes, index) => {
  // collect all sources
  dataObject.map(obj => {
    const re = new RegExp(obj.keyword, 'g');
    nodes.push({
      "id": obj["source"],
      "group": re.exec(obj["source"]) ? index+100+"" : index+"", // if is keyword, group 1, if not group 0
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
        "group": re.exec(obj["target"]) ? index+100+"" : index+"", // if is keyword, group 1, if not group 0
        "value": obj["value"],
        "keyword": obj["keyword"]
      })
    }
  })
  return nodes
}


const uniqueObjectArray = (dataObject) => {
  return dataObject.filter((value, index, self) =>
    index === self.findIndex((t) => (
      t.text === value.text 
    ))
  )
}