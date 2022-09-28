const functions = {
  autoRotate: function () {
    // camera orbit
    let angle = 0;
    setInterval(() => {
      Graph.cameraPosition({
        x: distance * Math.sin(angle),
        z: distance * Math.cos(angle)
      });
      angle += Math.PI / 3000;
    }, 10);
  },
  focusOnNode: function (params) {
    let node_id = params.node_id
    let distance = params.distance
    var node = Graph.graphData().nodes.find(n => {
      return n.id == node_id
    })
    if (!node) return
    // Aim at node from outside it
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
  
    const newPos = node.x || node.y || node.z
      ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
      : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)
  
    Graph.cameraPosition(
      newPos, // new position
      node, // lookAt ({ x, y, z })
      3000  // ms transition duration
    );
  },
  xf: function (data) {
    var data = Graph.graphData()
    if (node == null) {
      data.nodes.map(n => {
        //console.log()
        n.__threeObj.material.opacity = parseInt(n.value) / 50
        // sprite.color = "color";
      })
      return
    }
    var connections = data.links.filter(l => l.target.id == node.id || l.source.id == node.id).map(l => l)
    var nodes = data.nodes.filter(n => {
      return connections.some(l => (l.target.id == n.id || l.source.id == n.id))
    })
    data.nodes.map(n => {
      n.__threeObj.material.opacity = 0.1
    })
    nodes.map(n => {
      //console.log()
      n.__threeObj.material.opacity = 1
      // sprite.color = "color";
    })
    console.log("connections", connections)
    console.log("nodes", nodes)
  },
  fitToCanvas: function (data) {
    Graph.zoomToFit(data || 100)
  },
  setZoom: function (data) {
    // 
  }
}

window.addEventListener("message", (event) => {
  //console.log("window message", event)
  console.log("window message", event)
  var fn = event.data.function
  var data = event.data.data
  if (functions[fn] !== undefined) {
    functions[fn](data)
  }
}, false);
