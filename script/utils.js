
var fs = require('fs'); 

exports.parseGermanDate = (input) => {
  console.log("parseGermanDate", input)
  var parts = input.match(/(\d+)/g);
  if (parts == null) return null
  if (parts[0].length == 4) {
    return new Date(parts[0], parts[1]-1, parts[2]);
  } else {
    return new Date(parts[2], parts[1]-1, parts[0]);
  }
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

exports.dateIsValid = (date) => {
  return !Number.isNaN(new Date(date).getTime());
}