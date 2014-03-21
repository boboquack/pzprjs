
/* concat前のテスト用スクリプト */

(function(){
	var dir = (function getpath(){
		var srcs=document.getElementsByTagName('script');
		for(var i=0;i<srcs.length;i++){
			var result = srcs[i].src.match(/^(.*\/)pzprv3\.js$/);
			if(result){ return result[1] + (!result[1].match(/\/$/) ? '/' : '');}
		}
		return "";
	})();

	var files = [
		"lib/candle.js",
		"pzpr/CoreClass.js",
		"pzpr/Puzzle.js",
		"pzpr/BoardPiece.js",
		"pzpr/Board.js",
		"pzpr/BoardExec.js",
		"pzpr/LineManager.js",
		"pzpr/AreaManager.js",
		"pzpr/Graphic.js",
		"pzpr/MouseInput.js",
		"pzpr/KeyInput.js",
		"pzpr/URL.js",
		"pzpr/Encode.js",
		"pzpr/FileData.js",
		"pzpr/Answer.js",
		"pzpr/Operation.js",
		"puzzle-common/Graphic.js",
		"puzzle-common/KeyInput.js",
		"puzzle-common/MouseInput.js",
		"puzzle-common/Answer.js",
		"puzzle-common/BoardExec.js",
		"puzzle-common/Encode.js",
		"puzzle-common/FileData.js",
		"ui/Boot.js",
		"ui/UI.js",
		"ui/Menu.js",
		"ui/MenuArea.js",
		"ui/PopupMenu.js",
		"ui/ToolArea.js",
		"ui/KeyPopup.js",
		"ui/DataBase.js",
		"ui/Timer.js",
		"ui/Debug.js"
	];
	for(var i=0;i<files.length;i++){
		document.write('<script type="text/javascript" src="'+dir+files[i]+'"></script>');
	}
})();