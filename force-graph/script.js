const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const narrative = urlParams.get('narrative') ? urlParams.get('narrative') : 'mythical_nazis'
const distance = 1000;

let focusNode = null;
const highlightNodes = new Set();
const highlightLinks = new Set();

var node_index = 0

var Graph = null

var fontFace = null

fetch(`../export/narratives_word_graphs/${narrative}.json`)
  .then((response) => response.json())
  .then((data) => {
    console.log(data)
    init(data)
  });

const init = function (gData) {
  Graph = ForceGraph3D()(document.getElementById('3d-graph'))
  .graphData(gData)
  //.nodeColor(node => highlightNodes.has(node.id) ? node === focusNode ? 'rgb(255,0,0,1)' : 'rgba(255,160,0,0.8)' : 'rgba(0,255,255,0.6)')
  //.graphData(function (d) { console.log("d", d)})
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
  //.onNodeHover()
  .onEngineStop(() => {
    console.log("onEngineStop!")
    Graph.pauseAnimation()
  })
  .onNodeHover(node => {
    //return null
    // console.log("node", node)
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

    if (highlightNodes.size > 0) {
      if (highlightNodes.has(node.id)) {
        sprite.material.opacity = 0.9
      } else {
        sprite.material.opacity = 0
      }
    }

    sprite.textHeight = 7 + 3 * (node_index / gData.nodes.length);
    //sprite.material.opacity = Math.max(0.35, (node_index / gData.nodes.length))
    sprite.material.opacity = 0.8
    console.log("node_index / gData.nodes.length", node_index / gData.nodes.length)
    sprite.fontWeight = 'normal';

    group.add(sprite);
    node_index++
    return group;
  });


  // no scroll zoom
  //Graph.controls().noZoom = true

  // Spread nodes a little wider
  Graph.d3Force('charge').strength(-300);
}





const disableScroll = function () {
  var canvas = document.querySelector("canvas")
} 

const updateHighlight = function () {
  console.log("nodeThreeObject", highlightNodes)
  node_index=0
  // trigger update of highlighted objects in scene
  Graph.nodeVisibility(Graph.nodeVisibility())
  Graph.linkVisibility(Graph.linkVisibility())
    //.nodeThreeObject(Graph.nodeThreeObject())
    // .linkDirectionalParticles(Graph.linkDirectionalParticles());
}

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

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){
  console.log()
  Graph.width(window.innerWidth)
  Graph.height(window.innerHeight)
  //camera.aspect = window.innerWidth / window.innerHeight;
  //camera.updateProjectionMatrix();
  //renderer.setSize( window.innerWidth, window.innerHeight );
}
