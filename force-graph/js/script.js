const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const narrative = urlParams.get('narrative') ? urlParams.get('narrative') : 'mythical-nazis'
const lang = urlParams.get('lang') ? urlParams.get('lang') : 'en'
const default_distance = 500;

let focusNode = null;
const highlightNodes = new Set();
const highlightLinks = new Set();

var node_index = 0
var link_index = 250
var nodes_length
window.Graph = null
var fontFace = null
var savedCameraPos = null
window.interval = null
var isTransitioning = false 
var isRotating = false
const options = {}//{ controlType: 'fly' }

window.guiOptions = {
  size: 14,
  showCircle: false
}

fetch(`../export/narratives_word_graphs/${narrative}.json`)
  .then((response) => response.json())
  .then((data) => {
    //console.log(data)
    init(data)
    nodes_length = data.nodes.length
    node_index = nodes_length
  });

const init = function (gData) {
  window.Graph = ForceGraph3D(options)(document.getElementById('3d-graph'))
  .graphData(gData)
  .enableNodeDrag(false)
  .showNavInfo(true)
  .linkLabel(link => {
    // console.log("link", link)
    return `
      <div class="tooltip-box">
        <span>source: ${link.source.id}</span><br/>
        <span>target: ${link.target.id}</span><br/>
        <span>headline_id: ${link.headline}</span><br/>
        <span>count: ${link.count}</span>
      </div>
    `
  })
  .nodeLabel(node => {
    return `
      <div class="tooltip-box">
        <span>source: ${node.ru}</span><br/>
        <span>count: ${node.value}</span><br/>
        <span>keyword: ${node.keyword}</span>
      </div>
    `
  })
  .onNodeHover(node => {
    // console.log("node!", node)
    //hightlightNode(node)
  })
  .onNodeClick(node => {
    functions.focusOnNode({node_id: node.id, show_all: true})
  })
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
  /*
  .linkWidth(link => {
    // console.log("link", link, link_index, link_index/250)
    var width = link_index/250 * 2
    if (link_index > 1) {
      link_index--
    } else {
      link_index = 250
    }
    return width
  })
  */
  .onEngineStop(() => {
    console.log("onEngineStop!")
    Graph.pauseAnimation()
  })
  .onNodeHover((node) => {

  })
  .nodeThreeObject((node, index) => {
    node_index--
    if (node_index == 0) {
      node_index = gData.nodes.length
    }
    const group = new THREE.Group();
    var size =  guiOptions.size * ( node_index/gData.nodes.length) + 5 //node.index / 230 * 10
    //console.log("node")
    
    const geometry = new THREE.SphereGeometry(size, 32, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.material.opacity = 1
    sphere.material.transparent = true
    if (guiOptions.showCircle) group.add(sphere);
  
    const sprite = new SpriteText(node[lang]);
    sprite.position.set(0, 0, 0);
    sprite.fontFace = "roboto-mono";
    sprite.material.depthWrite = false; // make sprite background transparent
    sprite.color = 'white'//node.color;
    sprite.strokeColor = node.color;
    sprite.backgroundColor = 'black'

    sprite.renderOrder = 999;
    sprite.material.depthTest = false;
    sprite.material.depthWrite = false;
    sprite.onBeforeRender = function (renderer) { renderer.clearDepth(); };

    sprite.textHeight = size
    // sprite.position.set(0, 100, 100);
  
    if (highlightNodes.size > 0) {
      if (highlightNodes.has(node.id)) {
        sprite.material.opacity = 0.9
      } else {
        sprite.material.opacity = 0.3
      }
    }
    sprite.material.opacity = 0.8
    sprite.fontWeight = 'normal';
    group.add(sprite);
    //node_index++
    return group;
  });

  // no scroll zoom
  Graph.controls().noZoom = true

  // Spread nodes a little wider
  Graph.d3Force('charge').strength(-300);

  // save initial camera position
  savedCameraPos = Graph.cameraPosition();
  
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
  focusNode = nodes[0] || null;
  updateHighlight();
})

const updateHighlight = function () {
  //console.log("nodeThreeObject", highlightNodes)
  node_index = nodes_length
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
    console.log('autorotate received');
    highlightNodes.clear();
    updateHighlight()
    isRotating = true
    isTransitioning = false;
    if (window.interval) {
      clearInterval(window.interval);
    }
    //console.log("Graph.cameraPosition()", )
    // camera orbit
    var dist = Graph.cameraPosition().z
    let angle = 0;
    
    window.interval = setInterval(() => {
      Graph.cameraPosition({
        x: dist * Math.sin(angle),
        z: dist * Math.cos(angle)
      }, 100);
      angle += Math.PI / 5000;
    }, 10);
  },
  focusOnNodes: function (params) {
    let nodes_id = (params.node_ids || params)
    if (window.interval) {
      clearInterval(window.interval);
    }
    
    isRotating = false
    isTransitioning = true
    let distance = params.distance || default_distance 
    var nodes = []
    for(let i in nodes_id) {
      var node = Graph.graphData().nodes.find(n => {
        return n.id.toLowerCase() == nodes_id[i].toLowerCase()
      })
      if (node) nodes.push(node)
    }

    setHightlightNodes(nodes)

    if (nodes.length == 0) {
      this.resetZoom()
      return
    }
    
    var node = nodes[0]
    if (window.timeout) {
      clearTimeout(window.timeout);
    };
    
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
    window.timeout = setTimeout(() => {
      isTransitioning = false
    }, 3000)
  },
  focusOnNode: function (params) {
    let data = (params.node_id || params)
    let show_all = params.show_all || false
    if ((params.node_id || params).includes(',')) {
      this.focusOnNodes(data.split(','))
    }
    
    if (window.interval) {
      clearInterval(window.interval);
    }
    isRotating=false
    isTransitioning = true
    let node_id = params.node_id || params
    let distance = params.distance || default_distance * 1.5 
    var node = Graph.graphData().nodes.find(n => {
      return n.id.toLowerCase() == node_id.toLowerCase()
    })

    if (!show_all) hightlightNode(node)

    if (!node) {
      this.resetZoom()
      return
    }
    
    if (window.timeout) {
      clearTimeout(window.timeout);
    };

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
    window.timeout = setTimeout(() => {
      isTransitioning = false
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
        
    if (window.interval) {
      clearInterval(window.interval);
    }
    isRotating = false;
    isTransitioning = true;
    if (window.timeout) {
      clearTimeout(window.timeout); 
    }
    // 
    Graph.cameraPosition(
      savedCameraPos, // new position
      {x: 0, y: 0, z: 0}, // lookAt ({ x, y, z })
      3000  // ms transition duration
    );
    window.timeout = setTimeout(() => {
      isTransitioning = false;
    }, 3000)
    
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
