
var fs = require('fs'); 

exports.parseGermanDate = (input) => {
  var parts = input.match(/(\d+)/g);
  return new Date(parts[2], parts[1]-1, parts[0]);
}

exports.sortByDate = function(a,b){
  return new Date(b.date) - new Date(a.date);
}

exports.saveJsonFile = (path, jsonString) => {
  fs.writeFile(path, jsonString, {encoding:'utf8',flag:'w'}, function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
    console.log(`${path} file has been saved.`);
  });
}