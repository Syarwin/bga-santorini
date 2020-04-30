{OVERALL_GAME_HEADER}
<div id="playareascaler">
	<div id="playArea">
		<div id="sceneContainer"></div>
	</div>
</div>
<script type="text/javascript" src="./script/vendor/tweenjs.js"></script>
<script type="text/javascript" src="./script/vendor/hammer.min.js"></script>
<script type="module">
import { Board } from './script/modules/board.js';

var	container = document.getElementById('sceneContainer');
var BOARD = new Board(container);
window.BOARD = BOARD;
</script>

{OVERALL_GAME_FOOTER}

