const gui = new dat.GUI()
var sizeSlider = gui.add(guiOptions, 'size', 1, 100)
var showCircleToggle = gui.add(guiOptions, 'showCircle', false, true)

sizeSlider.onChange(function (value) {
  console.log("sizeSlider", value)
  Graph.nodeThreeObject(Graph.nodeThreeObject())
});

showCircleToggle.onChange(function (value) {
  console.log("sizeSlider", value)
  Graph.nodeThreeObject(Graph.nodeThreeObject())
});