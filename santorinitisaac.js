/**
	*------
	* BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
	* santorinitisaac implementation : (c) Morgalad & Tisaac
	*
	* This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
	* See http://en.boardgamearena.com/#!doc/Studio for more information.
	* -----
	*
	* santorinitisaac.js
	*
	* santorinitisaac user interface script
	*
	* In this file, you are describing the logic of your user interface, in Javascript language.
	*
	*/
//# sourceURL=santorinitisaac.js
//@ sourceURL=santorinitisaac.js

define([
	"dojo", "dojo/_base/declare",
	"ebg/core/gamegui",
	"ebg/counter",
	"ebg/stock",
	"ebg/scrollmap"
], function(dojo, declare) {
	// Player colors
	const BLUE = "0000ff";
	const WHITE = "ffffff";

	return declare("bgagame.santorinitisaac", ebg.core.gamegui, {

/*
 * Constructor
 */
constructor: function() {
	this.hexWidth = 84;
	this.hexHeight = 71;
	this.tryTile = null;
},

/*
 * Setup:
 *  This method set up the game user interface according to current game situation specified in parameters
 *  The method is called each time the game interface is displayed to a player, ie: when the game starts and when a player refreshes the game page (F5)
 *
 * Params :
 *  - mixed gamedatas : contains all datas retrieved by the getAllDatas PHP method.
 */
setup: function(gamedatas) {
	console.info('SETUP', gamedatas);

	// Setup the board (3d scene using threejs)
	var	container = document.getElementById('sceneContainer');
	this.board = new Board(container, URL);

		// TODO remove ?
		/*
		for (var player_id in gamedatas.players) {
			var player = gamedatas.players[player_id];
			player.colorName = colorNames[player.color];
			//dojo.place(this.format_block('jstpl_player_board', player), 'player_board_' + player_id);
			//this.updatePlayerCounters(player);
		}*/

	// Setup worker and buildings
	gamedatas.placedPieces = gamedatas.placedPieces || [];
	gamedatas.placedPieces.forEach(piece => {
			var name = piece.type;
			if(piece.type == "fWorker" || piece.type == "mWorker")
				name += "0";

			this.board.addMesh(name, piece);
	});

	// TODO remove ?
	// Setup remaining tile counter
	// dojo.place($('count_remain'), 'game_play_area_wrap', 'first');

	// TODO remove ?
	// Setup player boards
	colorNames = {
		'0000ff': 'blue',
		'ffffff': 'white'
	};

	// Setup game notifications
	this.setupNotifications();
},

///////////////////////////////////////
////////  Game & client states ////////
///////////////////////////////////////

/*
 * onEnteringState:
 * 	this method is called each time we are entering into a new game state.
 *
 * params:
 *  - str stateName : name of the state we are entering
 *  - mixed args : additional information
 */
onEnteringState: function(stateName, args) {
	console.info('Entering state: ' + stateName, args.args);

	if(!this.isCurrentPlayerActive())
		return;

	this.clearPossible();

	// Place a worker
	if (stateName == 'playerPlaceWorker') {
		// TODO possible to be false ?
		if (args.args.accessibleSpaces.length == 0)
			throw new Error("No available spaces to place worker");

		this.worker = args.args.worker;
		this.board.addClickableSpaces(args.args.accessibleSpaces, this.onClickPlaceWorker.bind(this));
	}
	// Move a worker
	else if(stateName == "playerMove"){
		// TODO possible to be false ?
		if (Object.keys(args.args.destinations_by_worker).length >= 1) {
			// TODO remove ?
			//this.destinations_by_worker = args.args.destinations_by_worker;

			this.activateworkers();
		}
	}
	// Select a space
	else if (stateName == 'selectSpace') {
		this.showPossibleSpaces();
	}
	// Build a block
	else if (stateName == 'playerBuild') {
		this.showPossibleBuilding();
	}
},


/*
 * onLeavingState:
 * 	this method is called each time we are leaving a game state.
 *
 * params:
 *  - str stateName : name of the state we are leaving
 */
onLeavingState: function(stateName) {
	console.info('Leaving state: ' + stateName);
	this.clearPossible();
},



/*
 * onUpdateActionButtons:
 * 	TODO when is this called ?
 *  in this method you can manage "action buttons" that are displayed in the action status bar (ie: the HTML links in the status bar).
 */
onUpdateActionButtons: function(stateName, args) {
	console.info('Update action buttons: ' + stateName, args);

	// Make sure it the player's turn
	if (!this.isCurrentPlayerActive())
		return;

	if (stateName == 'playerMove') {
		this.addActionButton('button_reset', _('Cancel'), 'onClickCancelMove', null, false, 'gray');
	}
},




///////////////////////////////////////
////////    Utility methods    ////////
///////////////////////////////////////

/*
 * doAction:
 * 	TODO description ?
 * params :
 *  - action: TODO
 *  - args: TODO
 */
doAction: function(action, args) {
	if (this.checkAction(action)) {
		console.info('Taking action: ' + action, args);
		args = args || {};
		//args.lock = true; TODO remove ?

		this.ajaxcall('/santorinitisaac/santorinitisaac/' + action + '.html', args, this, function(result) {});
	}
},


/*
 * delayedExec:
 * 	TODO description ?
 */
delayedExec : function(onStart, onEnd, duration, delay) {
	duration = duration || 500;
	delay = delay || 0;

	if (this.instantaneousMode) {
		delay = Math.min(1, delay);
		duration = Math.min(1, duration);
	}

	var launch = () => {
		onStart();
		if (onEnd)
			setTimeout(onEnd, duration);
	};

	if (delay)	setTimeout(launch, delay);
	else				launch();
},


/*
 * createPiece:
 * 	TODO description ?
 * params:
 *  - piece: TODO
 *  - location: TODO
 */
createPiece: function(piece, location) {
/*
	location = location || 'sky';

	if (piece.type.startsWith("worker")){
		var piecetype = "woman";
		if ( piece.type_arg == "1" ) { piecetype = "man"; };
		thispieceEL = dojo.place(this.format_block('jstpl_'+piecetype, {
		id: piece.id,
		color: piece.type,
		player: piece.location_arg
		}), location );
		} else {
rand= Math.floor(Math.random() * 4);
angles = [0,90,180,270];
thispieceEL = dojo.place(this.format_block('jstpl_'+piece.type, {
id: piece.id,
angle: angles[rand]
}), location );
}

return thispieceEL;
*/
},



clearPossible: function() {
	this.removeActionButtons();
	//this.onUpdateActionButtons(this.gamedatas.gamestate.name, this.gamedatas.gamestate.args); TODO remove ?
	this.board.clearClickable();
},

activateworkers: function() {
	// TODO
/*
	this.clearPossible();
	for (var w in this.gamedatas.gamestate.args.destinations_by_worker) {
	var thisWorker = this.gamedatas.gamestate.args.destinations_by_worker[w];
	dojo.addClass($("worker_"+w), "activeworker");
	this.handles.push( dojo.connect($("worker_"+w),'onclick', this, 'onClickPossibleworker'));
	}
*/
},

showPossibleBuilding: function() {
//TODO
/*
this.clearPossible();
for (var s in this.gamedatas.gamestate.args.neighbouring_spaces) {
var thisSpace = this.gamedatas.spaces[s];
newtarget = dojo.place(this.format_block('jstpl_buildtarget', {
id: s
}), 'mapspace_'+thisSpace.x+'_'+thisSpace.y+'_'+thisSpace.z );
this.handles.push( dojo.connect(newtarget,'onclick', this, 'onClickBuildTarget'));
}
*/
},

///////////////////////////////////////////////////
//// Player's action

/////
// Tile actions
/////

onClickPossibleworker: function(evt, worker_id) {
/*
this.clearPossible();
if (worker_id == null) {
dojo.stopEvent(evt);
var idParts = evt.currentTarget.id.split('_');
worker_id = idParts[1];
}
for (var s in this.gamedatas.gamestate.args.destinations_by_worker[worker_id]) {
var thisWorker = this.gamedatas.gamestate.args.destinations_by_worker[worker_id][s];
var thisSpace = thisWorker.space_id ;
newtarget = dojo.place(this.format_block('jstpl_movetarget', {
id: thisSpace,
worker: worker_id
}), 'mapspace_'+thisWorker.x+'_'+thisWorker.y+'_'+thisWorker.z );
this.handles.push( dojo.connect(newtarget,'onclick', this, 'onClickMoveTarget'));
}

this.onUpdateActionButtons(this.gamedatas.gamestate.name, this.gamedatas.gamestate.args);
*/
},

onClickCancelMove: function(evt) {
	dojo.stopEvent(evt);
	this.clearPossible();
	this.activateworkers();
},

onClickMoveTarget: function(evt) {
/*
dojo.stopEvent(evt);
if( this.checkAction( 'move' ) )    // Check that this action is possible at this moment
{
var idParts = evt.currentTarget.className.split(/[_ ]/);
worker_id = idParts[1];

var coords = evt.currentTarget.parentElement.id.split('_');
x = coords[1];
y = coords[2];
z = coords[3];
this.ajaxcall( "/santorinitisaac/santorinitisaac/move.html", {
worker_id:worker_id,
x:x,
y:y,
z:z
}, this, function( result ) {} );
}
this.clearPossible();
this.removeActionButtons();
*/
},

onClickPlaceWorker: function(space) {
	// Check that this action is possible at this moment
	if(! this.checkAction( 'placeWorker' ) )
		return false;

	space.workerId = this.worker.id;
	this.ajaxcall( "/santorinitisaac/santorinitisaac/placeWorker.html", space, this, (res) => {} );
	this.clearPossible();
},


/////
// Building actions
/////

onClickBuildTarget: function(evt) {
/*
dojo.stopEvent(evt);
if( this.checkAction( 'build' ) )    // Check that this action is possible at this moment
{
var idParts = evt.currentTarget.id.split(/[_ ]/);
space_id = idParts[1];

var coords = evt.currentTarget.parentElement.id.split('_');
x = coords[1];
y = coords[2];
z = coords[3];
this.ajaxcall( "/santorinitisaac/santorinitisaac/build.html", {
x:x,
y:y,
z:z
}, this, function( result ) {} );
}
this.clearPossible();
*/
},

///////////////////////////////////////////////////
//// Reaction to cometD notifications

/*
setupNotifications:

In this method, you associate each of your game notifications with your local method to handle it.

Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
your santorinitisaac.game.php file.

*/
setupNotifications: function() {
	dojo.subscribe('blockBuilt', this, 'notif_building');
	this.notifqueue.setSynchronous('blockBuilt', 2000);
	dojo.subscribe('workerPlaced', this, 'notif_workerPlaced');
	this.notifqueue.setSynchronous('workerPlaced', 2000);
	dojo.subscribe('workerMoved', this, 'notif_moveworker');
	this.notifqueue.setSynchronous('workerMoved', 2000);
},

notif_workerPlaced: function(n) {
	console.log('notif_tile', n.args);
	var player_id = this.getActivePlayerId();
	var player = this.gamedatas.players[player_id];
	thisPiece = this.gamedatas.available_pieces[n.args.worker_id]
	var pieceEl = this.createPiece(thisPiece);
	thisSpace = this.gamedatas.spaces[n.args.space_id];
	targetEL = $('mapspace_'+thisSpace.x+'_'+thisSpace.y+'_'+thisSpace.z);
	this.positionPiece (pieceEl, targetEL);
},

notif_building: function(n) {
	console.log('notif_building', n.args);
	var player_id = this.getActivePlayerId();
	var player = this.gamedatas.players[player_id];
	thisPiece = this.gamedatas.available_pieces[n.args.block.id]
	var pieceEl = this.createPiece(thisPiece);
	thisSpace = this.gamedatas.spaces[n.args.space_id];
	targetEL = $('mapspace_'+thisSpace.x+'_'+thisSpace.y+'_'+thisSpace.z);
	this.positionPiece (pieceEl, targetEL);
},

notif_moveworker : function(notif) {
	thisSpace= this.gamedatas.spaces[notif.args.space_id];
	var destination = "mapspace_"+thisSpace.x+"_"+thisSpace.y+"_"+thisSpace.z;
	this.slideToObjectAbsolute('worker_'+notif.args.worker_id, 'sky' ,0,0, 800, 0 , dojo.hitch( this ,function(){ this.slideToObjectAbsolute('worker_'+notif.args.worker_id, destination,0,0, 800 )}));
},

});
});
