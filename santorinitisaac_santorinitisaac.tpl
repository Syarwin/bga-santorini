{OVERALL_GAME_HEADER}
<div id="playareascaler">
	<div id="playArea">
		<div id="sceneContainer"></div>
	</div>
</div>
<script type="text/javascript" src="https://en.1.studio.boardgamearena.com:8083/data/themereleases/current/games/santorinitisaac/999999-9999/script/vendor/tweenjs.js"></script>
<script type="text/javascript" src="https://en.1.studio.boardgamearena.com:8083/data/themereleases/current/games/santorinitisaac/999999-9999/script/vendor/hammer.js"></script>
<script type="module">
import { Board } from 'https://en.1.studio.boardgamearena.com:8083/data/themereleases/current/games/santorinitisaac/999999-9999/script/modules/board.js';

console.log("coucou");
var	container = document.getElementById('sceneContainer');
var BOARD = new Board(container, () => {
	var click = (i,j) => { return function(){
		BOARD.clearClickable();
		BOARD.addMesh('fWorker0', i,j,0);
	}; }

	for(var i = 0; i < 5; i++)
	for(var j = 0; j < 5; j++)
		BOARD.addClickable('ring', i, j, 0, click(i,j))
});
window.BOARD = BOARD;
</script>

{OVERALL_GAME_FOOTER}
