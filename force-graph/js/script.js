console.time("loaded")
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const color_param = 'group'
const isMobile = getIsMobile()
var narrative = urlParams.get('narrative') ? urlParams.get('narrative') : 'mythical-nazis'
if (isMobile) {
  narrative = narrative + '_small'
}
const isMerged = narrative.includes('merged')
const lang = urlParams.get('lang') ? urlParams.get('lang') : isMerged ? 'ru' : 'en'
var default_distance = isMerged ? 900 : 600;
let focusNode = null;
const highlightNodes = new Set();
const highlightLinks = new Set();

const colors = [
  "#EA5545",
  "#F46A9B",
  "#EDBF33",
  "#F5C243",
  "#EDE15B",
  "#BDCF32",
  "#87BC45",
  "#27AEEF",
  "#B33DC6",
  "#FF69EB",
  "#F7A9A8",
  "#FF9F1C",
]


var node_index = 0
var link_index = 250
var nodes_length
window.Graph = null
var fontFace = null
var savedCameraPos = null
window.interval = null
var isTransitioning = false
var isRotating = false
const options = {
  controlType: 'trackball'
}

var threeNodes = []

const graphDom = document.getElementById('graph')

window.guiOptions = {
  size: 18,
  showCircle: false
}

// Loading FontFaces via JavaScript is alternative to using CSS's @font-face rule.
var robotoMono = new FontFace('roboto-mono', 'url("../fonts/roboto-mono-v22-latin_cyrillic-regular.woff2")');
document.fonts.add(robotoMono);

document.fonts.ready.then((evt) => {
  loadData()
}).catch(() => {
  console.log("Error loading fonts");
});

function loadData() {
  fetch(`../export/narratives_word_graphs/${narrative}.json`)
    .then((response) => response.json())
    .then((data) => {
      var attempts = 0
      window.checkFontInterval = setInterval(() => {
        var check = document.fonts.check("16px roboto-mono")
        if (check || attempts > 10) {
          console.log("font loaded")
          clearInterval(window.checkFontInterval)
          init(data)
          nodes_length = data.nodes.length
          node_index = nodes_length
        }
        attempts++
      }, 100)
    });
}

const init = function (gData) {
  window.Graph = ForceGraph3D(options)(graphDom)
    .graphData(gData)
    .enableNodeDrag(false)
    .showNavInfo(!isMobile)
    .nodeLabel(node => {
      return !isMobile && `
      <div class="tooltip-box">
        <span>source: ${node.ru}</span><br/>
        <span>count: ${node.value}</span><br/>
        <span>keyword: ${node.keyword}</span><br/>
        <span style="${isMerged ? '' : 'display:none;'}">narrative: ${node.narrative_title_en}</span>
      </div>
    `
    })
    .onNodeClick(node => {
      functions.focusOnNode({ node_id: node.id, show_all: true })
    })
    .onEngineStop(() => {
      console.log("onEngineStop!")
      Graph.pauseAnimation()
    })
    .cooldownTime(5000)
    .nodeAutoColorBy(color_param)
    .enablePointerInteraction(!isMobile)
    .warmupTicks(10)
    .backgroundColor("rgba(0, 0, 0, 0)")
    .linkColor((link) => {
      return "#000000"
    })
    .onEngineStop(() => {
      console.log("onEngineStop!")
    })

  // no scroll zoom
  Graph.controls().noZoom = !isMerged

  Graph.controls().screen.width = window.innerWidth
  Graph.controls().screen.height = window.innerHeight

  if (!isMobile) {
    Graph.enableNavigationControls(true)
  }


  // save initial camera position
  savedCameraPos = Graph.cameraPosition();

  setTimeout(() => {
    updateNodes(gData)
    setTimeout(() => {
      // Spread nodes a little wider
      Graph.d3Force('charge').strength(-300);
      graphDom.className = 'loaded'
    }, 500)
  }, 500)

  // dispatch resize event
  window.dispatchEvent(new Event('resize'));
}

function updateNodes(gData) {
  var i = 0
  Graph.nodeThreeObject((node, index) => {
    node_index--
    i++
    if (node_index == 0) {
      node_index = gData.nodes.length
      i = 0
    }
    var size = Math.min(Math.sqrt(node.value) / 1.5 + 6, isMerged ? 60 : 30) // guiOptions.size * ( node_index/gData.nodes.length) + 4 //node.index / 230 * 10

    if (guiOptions.showCircle) {
      const group = new THREE.Group();
      const geometry = new THREE.SphereGeometry(size, 32, 64);
      const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.material.opacity = 0.5
      sphere.material.transparent = true
      group.add(sphere);
    }

    const sprite = new SpriteText(node[lang == 'ru' ? 'original' : lang].toLowerCase());
    sprite.position.set(0, 0, 0);
    if (document.fonts.check("16px roboto-mono")) {
      sprite.fontFace = "roboto-mono";
    } else {
      sprite.fontFace = "Arial";
    }
    sprite.padding = [2, 1]
    sprite.material.depthWrite = false; // make sprite background transparent
    sprite.color = 'black'//node.color;
    sprite.strokeColor = isMerged ? node.narrative_color : colors[node['group'] % colors.length]//node.color;
    sprite.backgroundColor = isMerged ? node.narrative_color : colors[node['group'] % colors.length]//node.color//'black'
    sprite.renderOrder = 999;
    sprite.material.depthTest = false;
    sprite.material.depthWrite = false;
    sprite.onBeforeRender = function (renderer) { renderer.clearDepth(); };
    sprite.textHeight = size
    sprite.fontWeight = 'normal';
    if (guiOptions.showCircle) {
      group.add(sprite);
      return group;
    }
    sprite.nodeId = node.id
    threeNodes.push(sprite)
    if (i == gData.nodes.length - 1) {
      console.timeEnd("loaded")
      if (parent) parent.postMessage("nodes_loaded", "*")
    }
    return sprite;
  });
}

const onLoadedData = () => {
  console.log("onLoadedData")
}


const hightlightNode = (node => {
  if ((!node && !highlightNodes.size) || (node && focusNode === node)) return;
  highlightNodes.clear();
  if (node) {
    highlightNodes.add(node.id);
    node.neighbors.forEach(neighbor => {
      highlightNodes.add(neighbor)
    });
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
  threeNodes.forEach((n) => {
    if (highlightNodes.size === 0) {
      n.material.opacity = 0.9
    } else {
      if (highlightNodes.has(n.nodeId.toLowerCase())) {
        n.material.opacity = 0.9
      } else {
        n.material.opacity = 0.2
      }
    }
  })
  // trigger update of highlighted objects in scene
  /*
  Graph
    //.nodeVisibility(Graph.nodeVisibility())
    //.linkVisibility(Graph.linkVisibility())
    .nodeThreeObject(Graph.nodeThreeObject())
  //.linkDirectionalParticles(Graph.linkDirectionalParticles());
  */
}

const functions = {
  autoRotate: function () {
    console.log("autorotate")
    if (isRotating) return
    highlightNodes.clear();
    updateHighlight()
    if (isTransitioning) {
      return;
    }
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
      }, 10);
      angle += Math.PI / 5000;
    }, 10);
  },
  stopRotate: function () {
    isRotating = false
    isTransitioning = false;
    if (window.interval) {
      clearInterval(window.interval);
    }
  },
  focusOnNodes: function (params) {
    console.log("focusonnodes");
    let nodes_id = (params.node_ids || params)
    if (window.interval) {
      clearInterval(window.interval);
    }

    isRotating = false
    isTransitioning = true
    let distance = params.distance || default_distance

    const nodes = Graph.graphData().nodes.filter((node) => nodes_id.indexOf(node.id.toLowerCase()) !== -1)

    setHightlightNodes(nodes)
    var node = nodes[0]

    setTimeout(() => {
      if (nodes.length == 0) {
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
    }, 50)


    if (window.timeout) {
      clearTimeout(window.timeout);
    };

    window.timeout = setTimeout(() => {
      isTransitioning = false
    }, 3050)
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
    isRotating = false
    isTransitioning = true
    let node_id = params.node_id || params
    let distance = params.distance || default_distance
    var node = Graph.graphData().nodes.find(n => {
      return n.id.toLowerCase() == node_id.toLowerCase()
    })

    if (!show_all) hightlightNode(node)

    if (window.timeout) {
      clearTimeout(window.timeout);
    };
    setTimeout(() => {
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
    }, 50)

    window.timeout = setTimeout(() => {
      isTransitioning = false
    }, 3050)
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
      { x: 0, y: 0, z: 0 }, // lookAt ({ x, y, z })
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
      { x: 0, y: 0, z: 0 }, // lookAt ({ x, y, z })
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
  var fn = event.data.function
  var data = event.data.data
  if (functions[fn] !== undefined) {
    functions[fn](data)
  }
}, false);

function getIsMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

function onWindowResize() {
  Graph.width(window.innerWidth)
  Graph.height(window.innerHeight)
  Graph.controls().screen.width = window.innerWidth
  Graph.controls().screen.height = window.innerHeight
}

window.addEventListener('resize', onWindowResize, false);

