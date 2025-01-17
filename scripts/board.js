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

// Fall animation
const fallAnimation = {
	sky : 14,
	duration : 2000
};

const lvlHeights = [0, 1.24, 2.44, 3.25];
const xCenters = [-4.2, -2.12, -0.04, 2.12, 4.2];
const zCenters = [-4.2, -2.12, 0, 2.13, 4.15];


var Board = function(container, url){
	console.info("Creating board");
	this._url = url;
	this._container = container;
	this._meshManager = new MeshManager(url);
	this._meshManager.load().then( () => console.info("Meshes loaded, rendered scene should look good") );

	this._board = new Array();
	for(var i = 0; i < 5; i++){
		this._board[i] = new Array();
		for(var j = 0; j < 5; j++){
			this._board[i][j] = new Array();
			for(var k = 0; k < 4; k++)
				this._board[i][j][k] = {
					piece: null,
					planeHover:null,
					onclick: null,
				};
		}
	}
	this._ids = [];
	this._clickable = [];

	this.initScene();
	this.initBoard();
	this.animate();
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
	this._scene.add( new THREE.HemisphereLight( 0xFFFFFF, 0xFFFFFF, 1 ) );

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
	this._hoveringSpace = null;
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
};



/*
 * Infinite loop for rendering
 */
var animate = true; // Useful to turn off the animation
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
	if(!this._mouseDown)
		this.raycasting(true);

	this._renderer.render( this._scene, this._camera );
}


/*
 * Add a piece to a given position
 * - str name : name of the mesh
 * - mixed space : contains the location
 * - optionnal int id : useful to access the mesh later
 */
Board.prototype.addPiece = function(piece){
	var center = new THREE.Vector3(xCenters[piece.x], lvlHeights[piece.z], zCenters[piece.y]);
	var sky = center.clone();
	sky.setY(center.y + fallAnimation.sky);

	var mesh = this._meshManager.createMesh(piece.name);
	mesh.name = piece.name;
	mesh.space = { x : piece.x, y : piece.y, z : piece.z };
	mesh.position.copy(sky);
	mesh.rotation.set(0, Math.floor(Math.random() * 4)*Math.PI/2, 0);
	this._scene.add(mesh);
	this._ids[piece.id] = mesh;
	this._board[piece.x][piece.y][piece.z].piece = mesh;

	return new Promise(function(resolve, reject){
		Tween.get(mesh.position)
			.to(center, fallAnimation.duration,  Ease.cubicInOut)
			.call(resolve);
	});
};


/*
 * Move a piece to a new position
 * - mixed pece : info about the piece
 * - mixed space : contains the location
 */
Board.prototype.movePiece = function(piece, space){
	// Update location on (abstract) board
	var mesh = this._board[piece.x][piece.y][piece.z].piece;
	this._board[piece.x][piece.y][piece.z].piece = null;
	this._board[space.x][space.y][space.z].piece = mesh;
	mesh.space = space;

	// Animate
	var target = new THREE.Vector3(xCenters[space.x], lvlHeights[space.z], zCenters[space.y]);

	var maxZ = Math.max(piece.z, space.z);
	var tmp1 = mesh.position.clone();
	tmp1.setY(lvlHeights[maxZ] + 1);
	var tmp2 = target.clone();
	tmp2.setY(lvlHeights[maxZ] + 1);

	Tween.get(mesh.position)
		.to(tmp1, 700,  Ease.cubicInOut)
		.to(tmp2, 600,  Ease.cubicInOut)
		.to(target, 600,  Ease.cubicInOut)
};





/*
 * Raycasting with two modes
 * - hover : change textures to reflect hovering
 * - click : use callback function on clicked object
 */
Board.prototype.raycasting = function(hover){
	this._raycaster.setFromCamera( this._mouse, this._camera );
	var intersects = this._raycaster.intersectObjects(this._clickable);

	// Try to find the corresponding space (x,y,z)
	var space = (intersects.length > 0 && intersects[0].object.space)? intersects[0].object.space : null;
	// Clear previous hovering if needed
	this.clearHovering(space);

	if(space === null)
		return;

	if(hover){
		this._hoveringSpace = space;
		var cell = this._board[space.x][space.y][space.z];
		cell.planeHover.children[0].material.color.setHex(0xFF0000);
		if(cell.piece != null)
			cell.piece.material.emissive.setHex(0xFF0000);
		document.body.style.cursor = "pointer";
	}
	else {
		// Enforce clearing of hovering
		this.clearHovering();
		this._board[space.x][space.y][space.z].onclick();
	}
};

/*
 * Clear hovering effect
 *  - optional argument space : no clearing if new space to hover is the same
 */
Board.prototype.clearHovering = function(space){
	if(this._hoveringSpace === null || space == this._hoveringSpace)
		return;

	var cell = this._board[this._hoveringSpace.x][this._hoveringSpace.y][this._hoveringSpace.z];
	cell.planeHover.children[0].material.color.setHex(0xFFFFFF);
	if(cell.piece != null)
		cell.piece.material.emissive.setHex(0x000000);
	document.body.style.cursor = "default";
	this._hoveringSpace = null;
}

/*
 * Clear clickable mesh (useful after click)
 */
Board.prototype.clearClickable = function(){
	this._clickable.map((m) => {
		var cell = this._board[m.space.x][m.space.y][m.space.z];

		if(cell.planeHover !== null)
			this._scene.remove(cell.planeHover)

		cell.onclick = null;
	});

	this._clickable = [];
};


/*
 * Make several spaces/pieces clickable to allow space selection (for placement/moving/building)
 */
Board.prototype.makeClickable = function(objects, callback){
	objects.forEach(o => {
		// Store the callback into the board
		this._board[o.x][o.y][o.z].onclick = () => callback(o);

		// Add some interactive meshes to this space
		var center = new THREE.Vector3(xCenters[o.x], lvlHeights[o.z] + 0.01, zCenters[o.y]);

		// Transparent square to make the whole space interactive
		var mesh = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(2,2).rotateX(-Math.PI/2),
			new THREE.MeshPhongMaterial({	opacity:0, transparent: true })
		);
		mesh.position.copy(center);
		mesh.space = { x:o.x, y:o.y, z:o.z };
		this._scene.add(mesh);
		this._clickable.push(mesh);
		this._board[o.x][o.y][o.z].planeHover = mesh;

		// Ring animation
		var ring = new THREE.Mesh(
			new THREE.CircleGeometry( 0.53, 32 ).rotateX(-Math.PI/2),
			new THREE.MeshPhongMaterial({
//					alphaMap: new THREE.TextureLoader().load(this._url + "img/aRing.jpg"),
					color: 0xFFFFFF,
					opacity:0.7,
					transparent: true,
			})
		);
		ring.position.set(0, 0.05, 0);
		ring.space = mesh.space;
		this._clickable.push(ring);
		mesh.add(ring);
		Tween.get(ring.scale, {	loop:-1, bounce:true }).to({ x: 1.3, z: 1.3, }, 700, Ease.cubicInOut);

		// If there a piece at this location, make it interactive
		var piece = this._board[o.x][o.y][o.z].piece;
		if(piece !== null){
			piece.space = mesh.space;
			this._clickable.push(piece);
		}
	})
};


window.Board = Board;
export { Board };
