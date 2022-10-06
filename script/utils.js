
exports.parseGermanDate = (input) => {
  var parts = input.match(/(\d+)/g);
  return new Date(parts[2], parts[1]-1, parts[0]);
}

exports.sortByDate = function(a,b){
  return new Date(b.date) - new Date(a.date);
}
