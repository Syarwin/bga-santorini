import * as THREE 				from './three.js';
import Stats 							from './stats.js';
import { OrbitControls } 	from './OrbitControls.js';
import { MeshManager } 	  from './meshManager.js';
import Hammer 						from './hammer.js';
import { Tween, Ease } 		from './tweenjs.js';


const canvasHeight = () => window.innerHeight*0.8;
const ratio = 1.2;
const canvasWidth = () => ratio*canvasHeight();

// Zoom limits
const ZOOM_MIN = 20;
const ZOOM_MAX = 40;

const lvlHeights = [0, 1.24, 2.44, 3.25];
const xCenters = [-4.15, -2.05, 0, 2.2, 4.26];
const zCenters = [-4.3, -2.15, 0, 2.15, 4.2];
const fallAnimationDuration = 0;


var Board = function(container){
	console.info("Creating board");
	this._container = container;
	this._meshManager = new MeshManager();
	this._meshManager.load().then( () => console.info("Meshes loaded, rendered scene should look good") );
	this.initScene();
	this.initBoard();
	this.animate();


	this._clickable = [];


/*

	this._board = new Array();
	for(var i = 0; i < 4; i++){
		this._board[i] = new Array();
		for(var j = 0; j < 5; j++){
			this._board[i][j] = new Array();
			for(var k = 0; k < 5; k++)
				this._board[i][j][k] = null;
		}
	}
*/
};



/*
 * Init basic elements of THREE.js
 *  - scene
 *  - camera
 *  - lights
 *  - renderer
 *  - controls
 * for debug : stats, axes helper and grid
 */

Board.prototype.initScene = function(){
	// Scene
	this._scene = new THREE.Scene();
	this._scene.background = new THREE.Color(0x29a9e0);
	this._scene.background.convertLinearToGamma( 2 );

	// Camera
	this._camera = new THREE.PerspectiveCamera( 35, ratio, 1, 150 );
	this._camera.position.set( 20, 14, 20 );
	this._camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

	// Lights
//	this._scene.add( new THREE.HemisphereLight( 0xFFFFFF, 0xEEEEEE, 1 ) );

	// Renderer
	this._renderer = new THREE.WebGLRenderer({ antialias: true });
	this._renderer.setPixelRatio( window.devicePixelRatio );
	this._renderer.setSize( ratio*canvasHeight(), canvasHeight() );
	this._renderer.outputEncoding = THREE.sRGBEncoding;
	this._renderer.shadowMap.enabled = true;
	this._container.appendChild(this._renderer.domElement);
	window.addEventListener( 'resize', () => this._renderer.setSize( ratio*canvasHeight(), canvasHeight() ), false );

	const getRealMouseCoords = (px,py) => {
		var rect = this._renderer.domElement.getBoundingClientRect()
		return {
			x : (px - rect.left) / canvasWidth() * 2 - 1,
			y : -(py - rect.top) / canvasHeight() * 2 + 1
		}
	};


	var hammer = new Hammer(this._renderer.domElement);
	hammer.on('tap', (ev) => {
		this._mouse = getRealMouseCoords(ev.center.x, ev.center.y);
		this.raycasting(false);
	});


	// Controls
	var controls = new OrbitControls( this._camera, this._renderer.domElement );
	controls.maxPolarAngle = Math.PI * 0.36;
	controls.minDistance = ZOOM_MIN;
	controls.maxDistance = ZOOM_MAX;
	controls.mouseButtons = {
		RIGHT: THREE.MOUSE.ROTATE
	}


	// Raycasting
	this._raycaster = new THREE.Raycaster();
	this._intersected = null;
	this._mouse = { x : 0, y : 0};
	this._mouseDown = false;

	document.addEventListener( 'mousemove', (event) => {
		event.preventDefault();
		this._mouse = getRealMouseCoords(event.clientX, event.clientY);
	}, false );

	document.addEventListener( 'mousedown', (event) => this._mouseDown = true );
	document.addEventListener( 'mouseup', (event) => this._mouseDown = false );


//TODO remove in production
	// Stats
	this._stats = new Stats();
	this._container.appendChild( this._stats.dom );
/*
	// Axes helper
	this._scene.add( new THREE.AxesHelper(8));

	// Grid
	this._scene.add(new THREE.GridHelper(10, 10));
*/
};




/*
 * Init the board game
 *  - sea
 *  - island
 *  - board (bottom and grass)
 *  - marks
 */
Board.prototype.initBoard = function(){
	var sea = this._meshManager.createMesh('sea');
	sea.rotation.set(0,Math.PI,0);
	sea.position.set(0,-2.8,0);
	this._scene.add(sea);

	var island = this._meshManager.createMesh('island');
	island.position.set(0,-1.6,0);
	this._scene.add(island);

	var board = this._meshManager.createMesh('board');
	this._scene.add(board);

/*
	var outerWall1 = this._meshManager.createMesh('outerWall1');
	this._scene.add(outerWall1);

	var innerWall = this._meshManager.createMesh('innerWall');
	this._scene.add(innerWall);
*/

};



/*
 * Infinite loop for rendering
 */
var animate = true;
Board.prototype.animate = function(){
	if(animate)
		requestAnimationFrame(this.animate.bind(this));
	this.render();
	this._stats.update();
}


/*
 * Render the scene
 */
Board.prototype.render = function() {
	if(!this._mouseDown){
		this.raycasting(true);
	}

	// Render
	this._renderer.render( this._scene, this._camera );
}


/*
 * Clear clickable mesh (useful after click)
 */
Board.prototype.clearClickable = function(){
	this._clickable.map((m) => this._scene.remove(m));
};


/*
 * Raycasting with two modes
 * - hover : change textures to reflect hovering
 * - click : use callback function on clicked object
 */
Board.prototype.raycasting = function(hover){
	this._raycaster.setFromCamera( this._mouse, this._camera );
	var intersects = this._raycaster.intersectObjects(this._clickable);

	if(intersects.length > 0) {
		// Hover
		if(hover){
			document.body.style.cursor = "pointer";
			if(this._intersected != intersects[0].object ) {
				if(this._intersected != null) this._intersected.material.color.setHex(this._intersected.currentHex);

				this._intersected = intersects[0].object;
				this._intersected.currentHex = this._intersected.material.color.getHex();
				this._intersected.material.color.setHex(0x000000);
			}
		}
		// Click
		else {
			if(this._intersected != null) this._intersected.material.color.setHex(this._intersected.currentHex);
			intersects[0].object.onclick();
		}
	} else {
		if(this._intersected) this._intersected.material.color.setHex( this._intersected.currentHex );
		document.body.style.cursor = "default";
		this._intersected = null;
	}
};



/*
 * Add a mesh to a given position
 * - i : 0...3 corresponding level
 * - j,k : 0...4 position on the grid
 */

Board.prototype.addMesh = function(name, i, j, k){
	var center = new THREE.Vector3(xCenters[i], lvlHeights[k], zCenters[j]);
	var sky = center.clone();
	sky.setY(14);

	var mesh = this._meshManager.createMesh(name);
	mesh.position.copy(sky);
	this._scene.add(mesh);
	return animateVector3(mesh.position, center, { duration: fallAnimationDuration });
};


/*
 * Add a clickable mesh to a given position
 */
Board.prototype.addClickable = function(name, i, j, k, callback){
	var center = new THREE.Vector3(xCenters[i], lvlHeights[k], zCenters[j]);

	var mesh = this._meshManager.createMesh(name);
	mesh.position.copy(center);
	mesh.position.setY(center.y + 0.05);
	mesh.rotation.set(Math.PI/2,0,0);
	mesh.onclick = callback;
	this._scene.add(mesh);
	this._clickable.push(mesh);


	var up = center.clone();
	up.setY(mesh.position.y + 0.15);
	animateVector3(mesh.position, up, { duration: 700, loop:-1 });
};




function animateVector3(vectorToAnimate, target, options){
	options = options || {};

	var to = target || THREE.Vector3(),
			easing = options.easing || Ease.cubicInOut,
			duration = options.duration || 1000;

	return new Promise(function(resolve, reject){
		Tween.get(vectorToAnimate, options)
			.to({ x: to.x, y: to.y, z: to.z, }, duration, easing)
			.call(resolve);
	});
}

//window.BOARD = new Board(document.getElementById(CONTAINER));
window.Board = Board;
export { Board };
