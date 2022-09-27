var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')

const csv=require('csvtojson')
var snowball = require('node-snowball');

const dataFolder = 'data/WordCloud/';
const outputFolder = 'export/narratives_word_graphs/'

const path_full_connections_data = 'data/full_connections_data/full_data.csv'
const path_narratives_keywords = 'data/narratives_keywords.json'


var mergedNodes = []
var mergedLinks = []
var mergedConnections = {}

var files_length = 0
var saved_file_index = 0


const readFullData = () => {
  readCsvFile(path_full_connections_data)
}

const readNarrativeKeywords = () => {
  var rawdata = fs.readFileSync(path_narratives_keywords);
  return JSON.parse(rawdata)
}

const readCsvFile = (filename) => {
  return csv({delimiter: ','})
  .fromFile(filename)
  .then((jsonObj)=>{
    const narrativeKeywords = readNarrativeKeywords()
    narrativeKeywords.map(n => {n})
    
    //console.log("jsonObj", jsonObj)

    var mergedConnectionData = {} 
    narrativeKeywords.map(narrative => {
      var nodes = []
      var links = []
      mergedConnectionData = collectNarrativeNodes(mergedNodes, mergedLinks, narrative, jsonObj)
      var narrativeConnectionData = collectNarrativeNodes(nodes, links, narrative, jsonObj)
      if (mergedConnectionData) {
        saveJsonFile(`${outputFolder}${narrative.id}.json`, narrativeConnectionData)
      }
    })
    saveJsonFile(`${outputFolder}mergedNarrativesConnections.json`, mergedConnectionData)

    //console.log("connectionsObj", connectionsObj)
  })
}

const collectNarrativeNodes = (nodes, links, narrative, jsonObj) => {
  var keywords = narrative["keywords"]
  if (keywords.length > 0 ) {
    
    jsonObj.map(obj => {
      // check for each keyword
      keywords.map((keyword, index) => {
        let regex = new RegExp(keyword, 'g');
        if (parseInt(obj["count"]) < 5) return false
        if (regex.exec(obj["source"]) || regex.exec(obj["target"])) {

          let source = obj["source"]
          let target = obj["target"]
          //obj["source"] = snowball.stemword(source, 'russian')
          //obj["target"] = snowball.stemword(target, 'russian')

          links.push(obj)
          mergedLinks.push(obj)
          
          var existing_node = nodes.find(n => n.id == obj["source"])
          if (!existing_node) {
            nodes.push({
              "id": obj["source"],
              "ru": source,
              "en": obj["source_en"],
              "group": index, // if is keyword, group 1, if not group 0
              "value": parseInt(obj["count"]),
              "keyword": keyword,
              "isKeyword": regex.exec(source) ? true : false
            })
          } else {
            // add count to node if it already exists
            existing_node.value += parseInt(obj["count"])
          }
          
          existing_node = nodes.find(n => n.id == obj["target"])
          if (!existing_node) {
            nodes.push({
              "id": obj["target"],
              "en": obj["target_ru"],
              "ru": target,
              "group": index, // if is keyword, group 1, if not group 0
              "value": parseInt(obj["count"]),
              "keyword": keyword,
              "isKeyword": regex.exec(target) ? true : false
            })
          } else {
            // add count to node if it already exists
            existing_node.value += parseInt(obj["count"])
          }
        }
      })
    })
    var gData = {
      "nodes": nodes,
      "links": links
    }
    links.map(link => {
      const target = gData.nodes.find(n => n.id == link["target"])
      const source = gData.nodes.find(n => n.id == link["source"])
      // add neighbors
      !target.neighbors && (target.neighbors = []);
      !source.neighbors && (source.neighbors = []);
      target.neighbors.push(source.id);
      source.neighbors.push(target.id);
      // add links
      /*
      !target.links && (target.links = []);
      !source.links && (source.links = []);
      target.links.push(link);
      source.links.push(link);
      */
    })
    console.log("gData", gData)
    return gData
  } else {
    return null
  }
}


const saveJsonFile = (path, jsonObj) => {
  fs.writeFileSync(path, JSON.stringify(jsonObj), 'utf8', function (err) {
  if (err) {
    console.log("An error occured while writing JSON Object to File.");
    reject()
    return console.log(err);
  }
  console.log(`${path} file has been saved.`);
  })
}

readFullData()