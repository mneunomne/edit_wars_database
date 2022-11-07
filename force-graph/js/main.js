import * as THREE from 'three';
import SpriteText from 'three-spritetext'
import * as dat from 'dat.gui';

const scene = new THREE.Scene();

window.THREE = THREE;
window.SpriteText = SpriteText
window.dat = dat