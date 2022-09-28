const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const narrative = urlParams.get('narrative') ? urlParams.get('narrative') : 'mythical_nazis'
const lang = urlParams.get('lang') ? urlParams.get('lang') : 'en'
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
  .onNodeHover(node => {
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
  .nodeThreeObject(nodeSpriteObject);

  // no scroll zoom
  Graph.controls().noZoom = true

  // Spread nodes a little wider
  Graph.d3Force('charge').strength(-300);
}

const nodeSpriteObject = (node) => {
  const group = new THREE.Group();
  const geometry = new THREE.SphereGeometry(2, 32, 64);
  const material = new THREE.MeshBasicMaterial({ color: node.color });
  const sphere = new THREE.Mesh(geometry, material);
  group.add(sphere);

  const sprite = new SpriteText(node[lang]);
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
}

const updateHighlight = function () {
  //console.log("nodeThreeObject", highlightNodes)
  node_index=0
  // trigger update of highlighted objects in scene
  Graph
    .nodeVisibility(Graph.nodeVisibility())
    .linkVisibility(Graph.linkVisibility())
  //.nodeThreeObject(Graph.nodeThreeObject())
  //.linkDirectionalParticles(Graph.linkDirectionalParticles());
}


function onWindowResize(){
  Graph.width(window.innerWidth)
  Graph.height(window.innerHeight)
}

window.addEventListener( 'resize', onWindowResize, false );