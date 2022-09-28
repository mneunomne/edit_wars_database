var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')

const csv=require('csvtojson')
var snowball = require('node-snowball');

const dataFolder = 'data/WordCloud/';
const outputFolder = 'export/narratives_word_graphs/'

const path_full_connections_data = 'data/full_connections_data/full_data.csv'
const path_narratives_keywords = 'data/narratives_keywords.json'

const maxNumNodes = 250

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

    var mergedKeywords = []
    narrativeKeywords.map(narrative => {
      console.log("narrative", narrative)
      var keywords = narrative["keywords"]
      mergedKeywords = mergedKeywords.concat(narrative["keywords"])
      var nodes = []
      var links = []
      var narrativeConnectionData = collectNarrativeNodes(nodes, links, keywords, jsonObj)
      if (narrativeConnectionData) {
        saveJsonFile(`${outputFolder}${narrative.id}.json`, narrativeConnectionData)
      }
    })
    
    console.log("mergedKeywords", mergedKeywords)
    const mergedConnectionData = collectNarrativeNodes(mergedNodes, mergedLinks, mergedKeywords, jsonObj)

    saveJsonFile(`${outputFolder}mergedNarrativesConnections.json`, mergedConnectionData)

    //console.log("connectionsObj", connectionsObj)
  })
}

const collectNarrativeNodes = (nodes, links, keywords, jsonObj) => {
  if (keywords.length > 0 ) {
    
    jsonObj = filterDataByKeywords(jsonObj, keywords)

    jsonObj = mergeByStemmification(jsonObj)

    jsonObj = jsonObj.sort(sortByCount).slice(0, maxNumNodes);

    console.log("links", links.length)
    
    jsonObj.map(obj => {
      // check for each keyword
      keywords.map((keyword, index) => {
        let regex = new RegExp(keyword, 'g');
        let source = obj["source"]
        let target = obj["target"]
        obj["count"] = parseInt(obj["count"])
        //obj["source"] = snowball.stemword(source, 'russian')
        //obj["target"] = snowball.stemword(target, 'russian')

        const link =  links.find(link => obj.source == link.source && obj.target == link.target)
        if (!link) links.push(obj)
        //mergedLinks.push(obj)
        
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
      })
    })
    console.log("links", links.length)
    var gData = {
      "nodes": nodes,
      "links": links
    }
    // generate Neighbors
    gData = generateNeighbors(gData)
    console.log("links", links.length)
    return gData
  } else {
    console.warn("no keywords for narrative")
    return null
  }
}

function sortByCount( a, b ) {
  if ( parseInt(a.count) < parseInt(b.count) ){
    return 1;
  }
  if ( parseInt(a.count) > parseInt(b.count) ){
    return -1;
  }
  return 0;
}

const generateNeighbors = (gData) => {
  gData.links.forEach(link => {
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
  });
  return gData
}

const mergeByStemmification = (jsonObj) => {
  var mergedData = []
  // merge all sounces
  jsonObj = jsonObj.map(obj => {
    obj["source"] = snowball.stemword(obj.source, 'russian')
    obj["target"] = snowball.stemword(obj.target, 'russian')
    return obj
  })
  jsonObj.forEach(obj => {
    var el = mergedData.find(d => obj.source == d.source && obj.target == d.target)
    if (el) {
      el.count = parseInt(el.count) + parseInt(obj.count)
    } else {
      mergedData.push(obj)
    }
  })
  return mergedData
}

const filterDataByKeywords = (jsonObj, keywords) =>
  jsonObj.filter(obj =>
    // check for each keyword
    keywords.some((keyword) => {
      let regex = new RegExp(keyword, 'g');
      return (regex.exec(obj["source"]) || regex.exec(obj["target"]))
    })
  )


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