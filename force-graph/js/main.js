import * as three from 'https://unpkg.com/three@0.138.3/build/three.module.js';
import SpriteText from 'https://unpkg.com/three-spritetext@1.6.5/dist/three-spritetext.module.js'
import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.module.js';
import d3ForceLimit from 'https://unpkg.com/d3-force-limit@1.1.8/dist/d3-force-limit.module.js';

const scene = new THREE.Scene();

window.THREE = three;
window.SpriteText = SpriteText
window.dat = dat
console.log("d3ForceLimit",d3ForceLimit)
window.d3ForceLimit = d3ForceLimit