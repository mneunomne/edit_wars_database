const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const narrative = urlParams.get('narrative') ? urlParams.get('narrative') : 'mythical-nazis'
const lang = urlParams.get('lang') ? urlParams.get('lang') : 'en'
const default_distance = 300;

let focusNode = null;
const highlightNodes = new Set();
const highlightLinks = new Set();

var node_index = 0
var Graph = null
var fontFace = null
var savedCameraPos = null
window.interval = null
var isTransitioning = false 
var isRotating = false
const options = {}//{ controlType: 'fly' }

fetch(`../export/narratives_word_graphs/${narrative}.json`)
  .then((response) => response.json())
  .then((data) => {
    //console.log(data)
    init(data)
  });

const init = function (gData) {
  Graph = ForceGraph3D(options)(document.getElementById('3d-graph'))
  .graphData(gData)
  .enableNodeDrag(false)
  .showNavInfo(false)
  
  .nodeVisibility(node => 
    highlightNodes.size == 0 || highlightNodes.has(node.id))
  .linkVisibility(link =>
    highlightNodes.size == 0 || (focusNode !== null && (link.source.id == focusNode.id || link.target.id == focusNode.id))
  )
  .nodeAutoColorBy('group')
  .enableNavigationControls(true)
  .backgroundColor("rgba(0, 0, 0, 0)")
  .linkColor((link) => {
    return "#000000"
  })
  .onEngineStop(() => {
    console.log("onEngineStop!")
    Graph.pauseAnimation()
  })
  //.onNodeHover(hightlightNode)
  .nodeThreeObject((node) => {

    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(3, 32, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);
  
    const sprite = new SpriteText(node[lang]);
    sprite.position.set(2, 14, 0);
    sprite.fontFace = "roboto-mono";
    sprite.material.depthWrite = false; // make sprite background transparent
    sprite.color = "#000000";
    sprite.strokeColor = node.color;
    //sprite.textHeight = 45
    // sprite.position.set(0, 100, 100);
  
    if (highlightNodes.size > 0) {
      if (highlightNodes.has(node.id)) {
        sprite.material.opacity = 0.9
      } else {
        sprite.material.opacity = 0.3
      }
    }

    console.log("nodeThreeObject", highlightNodes.size)

    //console.log("node.isKeyword", (node_index / gData.nodes.length))
    //sprite.textHeight = 7 + 3 * (node_index / gData.nodes.length);
    //sprite.material.opacity = Math.max(0.35, (node_index / gData.nodes.length))
    sprite.material.opacity = 0.8
    //console.log("node_index / gData.nodes.length", node_index / gData.nodes.length)
    sprite.fontWeight = 'normal';
  
    group.add(sprite);
    node_index++
    return group;
  });

  // no scroll zoom
  Graph.controls().noZoom = true

  // Spread nodes a little wider
  Graph.d3Force('charge').strength(-300);

  // save initial camera position
  savedCameraPos = Graph.cameraPosition();
  
  //functions.autoRotate()

}

const hightlightNode = (node => {
  if ((!node && !highlightNodes.size) || (node && focusNode === node)) return;
  highlightNodes.clear();
  if (node) {
    highlightNodes.add(node.id);
    node.neighbors.forEach(neighbor => highlightNodes.add(neighbor));
    //node.links.forEach(link => highlightLinks.add(link));
  }
  focusNode = node || null;
  updateHighlight();
})

const setHightlightNodes = (nodes => {
  if (!nodes && !highlightNodes.size) return;
  highlightNodes.clear();
  if (nodes) {
    for (let i in nodes) {
      highlightNodes.add(nodes[i].id);
      nodes[i].neighbors.forEach(neighbor => highlightNodes.add(neighbor));
    }
    //node.links.forEach(link => highlightLinks.add(link));
  }
  console.log("setHightlightNodes", nodes)
  focusNode = nodes[0] || null;
  updateHighlight();
})

const updateHighlight = function () {
  //console.log("nodeThreeObject", highlightNodes)
  node_index=0
  // trigger update of highlighted objects in scene
  Graph
    //.nodeVisibility(Graph.nodeVisibility())
    .linkVisibility(Graph.linkVisibility())
    .nodeThreeObject(Graph.nodeThreeObject())
  //.linkDirectionalParticles(Graph.linkDirectionalParticles());
}

const functions = {
  autoRotate: function () {
    if (isRotating) return 
    isRotating=true
    highlightNodes.clear();
    updateHighlight()
    if (isTransitioning) return;
    //console.log("Graph.cameraPosition()", )
    // camera orbit
    var dist = Graph.cameraPosition().z
    let angle = 0;
    window.interval = setInterval(() => {
      Graph.cameraPosition({
        x: dist * Math.sin(angle),
        z: dist * Math.cos(angle)
      });
      angle += Math.PI / 5000;
    }, 10);
  },
  focusOnNodes: function (params) {
    let nodes_id = (params.node_ids || params)
    clearInterval(window.interval)
    isRotating=false
    isTransitioning = true
    let distance = params.distance || default_distance 
    var nodes = []
    for(let i in nodes_id) {
      var node = Graph.graphData().nodes.find(n => {
        return n.id.toLowerCase() == nodes_id[i].toLowerCase()
      })
      if (node) nodes.push(node)
    }

    console.log("nodes", nodes)

    setHightlightNodes(nodes)

    if (nodes.length == 0) {
      this.resetZoom()
      return
    }
    
    var node = nodes[0]
    
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
    setTimeout(() => {
      isTransitioning = false
      //highlightNodes.clear();
      //updateHighlight()
    }, 3000)
  },
  focusOnNode: function (params) {
    let data = (params.node_id || params)
    if ((params.node_id || params).includes(',')) {
      this.focusOnNodes(data.split(','))
    }
    clearInterval(window.interval)
    isRotating=false
    isTransitioning = true
    let node_id = params.node_id || params
    let distance = params.distance || default_distance * 1.5 
    var node = Graph.graphData().nodes.find(n => {
      return n.id.toLowerCase() == node_id.toLowerCase()
    })

    hightlightNode(node)

    if (!node) {
      this.resetZoom()
      return
    }
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
    setTimeout(() => {
      isTransitioning = false
      //highlightNodes.clear();
      //updateHighlight()
    }, 3000)
  },
  xf: function () {
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
      n.__threeObj.material.opacity = 1
    })
  },
  fitToCanvas: function (data) {
    // Graph.zoomToFit(data || 100)
    Graph.cameraPosition(
      {}, // new position
      {x: 0, y: 0, z: 0}, // lookAt ({ x, y, z })
      3000  // ms transition duration
    );
  },
  resetZoom: function () {
    highlightNodes.clear();
    clearInterval(window.interval)
    isRotating = false
    // 
    Graph.cameraPosition(
      savedCameraPos, // new position
      {x: 0, y: 0, z: 0}, // lookAt ({ x, y, z })
      3000  // ms transition duration
    );
  },
  noZoom: function (set) {
    Graph.controls().noZoom = set || true
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


function onWindowResize(){
  Graph.width(window.innerWidth)
  Graph.height(window.innerHeight)
}

window.addEventListener( 'resize', onWindowResize, false );