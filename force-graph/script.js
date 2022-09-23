const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const narrative = urlParams.get('narrative') ? urlParams.get('narrative') : 'mythical_nazis'
const distance = 1000;

const Graph = ForceGraph3D()(document.getElementById('3d-graph'))
  .jsonUrl(`../export/narratives_word_graphs/${narrative}.json`)
  .enableNodeDrag(false)
  .showNavInfo(false)
  .nodeAutoColorBy('group')
  .enableNavigationControls(true)
  .backgroundColor("rgba(0, 0, 0, 0)")
  .linkOpacity(0.05)
  .linkColor(() => "#000000")
  //.onNodeHover()
  .nodeThreeObject(node => {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(2, 32, 64);
    const material = new THREE.MeshBasicMaterial({ color: node.color });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    const sprite = new SpriteText(node.en);
    sprite.position.set(2, 10, 0);

    sprite.fontFace = "roboto-mono";
    sprite.material.depthWrite = false; // make sprite background transparent
    sprite.color = "#000000";
    sprite.strokeColor = node.color;
    // sprite.position.set(0, 100, 100);

    if (node.isKeyword) {
      sprite.textHeight = 18
      //sprite.color = "red";
      //sprite.fontWeight = 500
      //sprite.textHeight = 40;
      sprite.fontWeight = 'bold';
    } else {
      sprite.textHeight = 1 + Math.min(10, parseInt(node.value));

      sprite.fontWeight = 'normal';
      //sprite.textHeight = 2 + Math.min(40, parseInt(node.value)/7);
      //sprite.material.opacity = parseInt(node.value) / 50
    }
    group.add(sprite);
    return group;
    //return sprite;
  });

const functions = {
  autoRotate: function () {
    // Spread nodes a little wider
    Graph.d3Force('charge').strength(-500);
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
  highlightNodeConnections: function (data) {
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