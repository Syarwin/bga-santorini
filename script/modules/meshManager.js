import * as THREE 				from './three.js';
import { OBJLoader } 			from './OBJLoader.js';

const Meshes = [
/* Board Components */
	{
		n:'sea',
		s:0.8,
	},
	{
		n:'island',
		s:6.5,
	},
	{
		n:'board',
		t:'island',
		s:0.84
	},
	{
		n:'outerWall1',
		t:'island',
		s:0.84
	},
	{
		n:'innerWall',
		t:'island',
		s:0.84
	},

/* Lvl */
	{
		n:'lvl0',
		s:0.32,
	},
	{
		n:'lvl1',
		s:0.32,
	},
	{
		n:'lvl2',
		s:0.32,
	},
	{
		n:'lvl3',
		s:0.32,
	},


/* Workers */
	{
		n:'fWorker0',
		g:'fWorker',
		s:0.9
	},
	{
		n:'fWorker1',
		g:'fWorker',
		s:0.9
	},
	{
		n:'mWorker0',
		g:'mWorker',
		s:0.9
	},
	{
		n:'mWorker1',
		g:'mWorker',
		s:0.9
	},

/* Interactive meshes */
	{
		n:'ring',
		g:new THREE.PlaneBufferGeometry( 2, 2 ),
		t:'ring',
		tExt:'png',
	}
];


var MeshManager = function(){
	this._geometries = [];
	this._textures = [];
}


/*
 * Allow to load several geometries using promises
 */
MeshManager.prototype.loadGeometry = function(names, scales){
	var scope = this;
	var loader = new OBJLoader();

	if(!(names instanceof Array))
		names = [names];

	return new Promise(function(resolve, reject){
		// Create a promise with all loading requests
		Promise.all(names.map( (n) => loader.load('./geometries/' + n + '.obj') ))
		.then( (values) => {
			// Store them (assuming only one mesh inside the obj file
			for(var i = 0; i < names.length; i++){
				scope._geometries[names[i]] = values[i].children[0].geometry;
				scope._geometries[names[i]].scale(scales[i], scales[i], scales[i]);
			}

			resolve();
		})
		.catch( (err) => {
			reject(err);
		});
	});
};


/*
 * Allow to load several textures using promises
 */
MeshManager.prototype.loadTexture = function(names, ext){
	var scope = this;
	if(!(names instanceof Array))
		names = [names];

	return new Promise(function(resolve, reject){
		const manager = new THREE.LoadingManager(()=>resolve());
  	const loader = new THREE.TextureLoader(manager);
		for(var i = 0; i < names.length; i++)
			scope._textures[names[i]] = loader.load('./textures/' + names[i] + "." + ext[i]);
	});
};


/*
 * Load models geometries and textures (lvl, workers, ...)
 */

MeshManager.prototype.load = function(){
	var scope = this;
	var aGeometries = [];
	var aScales = [];
	var aTextures = [];
	var aTexturesExt = [];

	Meshes.forEach((m) => {
		var g = m.g || m.n,
				t = m.t || m.n;

		if(aTextures.includes(t) === false){
			aTextures.push(t);
			aTexturesExt.push(m.tExt || 'jpg');
		}

		if(typeof g === "string"){
			if(aGeometries.includes(g) === false){
				aGeometries.push(g);
				aScales.push(m.s || 1);
			}
		}
		else
			scope._geometries[m.n] = g;
	});

	return Promise.all([
		this.loadGeometry(aGeometries, aScales),
		this.loadTexture(aTextures, aTexturesExt)
	]);
};



/*
 * Create mesh
 */
MeshManager.prototype.createMesh = function(name){
	for(var i = 0; i < Meshes.length; i++) {
	if(name == Meshes[i].n){
		var m = Meshes[i];
		var t = this._textures[typeof m.t == "string" ? m.t : m.n];
		var g = this._geometries[typeof m.g == "string"? m.g : m.n];

		var material = new THREE.MeshBasicMaterial({ map : t, color:0xDDDDDD, transparent: m.tExt == "png" ? true : false, side: THREE.DoubleSide  });
		var mesh = new THREE.Mesh(g, material);
		return mesh;
		}
	}
	throw "Mesh not found";
}


export { MeshManager, Meshes };
