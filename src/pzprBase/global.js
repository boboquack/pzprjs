// global.js v3.1.9p3

//----------------------------------------------------------------------------
// ★グローバル変数
//---------------------------------------------------------------------------
// Posクラス
Pos = function(xx,yy){ this.x = xx; this.y = yy;};
Pos.prototype = {
	set : function(xx,yy){ this.x = xx; this.y = yy;}
};

// 各種パラメータの定義
var k = {
	// 各パズルのsetting()関数で設定されるもの
	qcols : 0, qrows : 0,	// 盤面の横幅・縦幅
	outside   :  0,			// 1:盤面の外側にIDを用意する (削除予定:使用しないでください)
	irowake   :  0,			// 0:色分け設定無し 1:色分けしない 2:色分けする
	def_csize : 36,			// デフォルトのセルサイズ
	def_psize : 24,			// デフォルトの枠外marginサイズ

	iscross      : 0,		// 1:Crossが操作可能なパズル
	isborder     : 0,		// 1:Border/Lineが操作可能なパズル
	isextendcell : 0,		// 1:上・左側にセルを用意するパズル 2:四方にセルを用意するパズル

	isoutsidecross  : 1,	// 1:外枠上にCrossの配置があるパズル
	isoutsideborder : 0,	// 1:盤面の外枠上にborderのIDを用意する
	isborderCross   : 1,	// 1:線が交差するパズル
	isCenterLine    : 0,	// 1:マスの真ん中を通る線を回答として入力するパズル
	isborderAsLine  : 0,	// 1:境界線をlineとして扱う

	dispzero      : 0,		// 1:0を表示するかどうか
	isDispHatena  : 1,		// 1:qnumが-2のときに？を表示する
	isAnsNumber   : 0,		// 1:回答に数字を入力するパズル
	isArrowNumber : 0,		// 1:矢印つき数字を入力するパズル
	isOneNumber   : 0,		// 1:問題の数字が部屋の左上に1つだけ入るパズル
	isDispNumUL   : 0,		// 1:数字をマス目の左上に表示するパズル(0はマスの中央)
	NumberWithMB  : 0,		// 1:回答の数字と○×が入るパズル

	BlackCell     : 0,		// 1:黒マスを入力するパズル
	NumberIsWhite : 0,		// 1:数字のあるマスが黒マスにならないパズル
	RBBlackCell   : 0,		// 1:連黒分断禁のパズル

	ispzprv3ONLY  : 0,		// ぱずぷれv3にしかないパズル
	isKanpenExist : 0,		// pencilbox/カンペンにあるパズル

	// 内部で自動的に設定されるグローバル変数
	puzzleid  : '',			// パズルのID("creek"など)
	callmode  : 'pmake',	// 'pmake':エディタ 'pplay':player
	mode      : 3,			// 1:問題配置モード 3:回答モード
	use       : 1,			// 操作方法
	irowake   : 0,			// 線の色分けをするかしないか
	widthmode : 2,			// Canvasの横幅をどうするか

	enableKey   : true,		// キー入力は有効か
	enableMouse : true,		// マウス入力は有効か
	autocheck   : true,		// 回答入力時、自動的に答え合わせするか

	fstruct  : new Array(),		// ファイルの構成

	cwidth   : this.def_csize,	// セルの横幅
	cheight  : this.def_csize,	// セルの縦幅

	p0       : new Pos(this.def_psize, this.def_psize),	// Canvas中での盤面の左上座標
	cv_oft   : new Pos(0, 0),	// Canvasのwindow内での左上座標
	IEMargin : new Pos(4, 4),	// マウス入力等でずれる件のmargin

	br:{
		IE    : !!(window.attachEvent && !window.opera),
		Opera : !!window.opera,
		WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
		Gecko : navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1
	}
};

var g;						// グラフィックコンテキスト

//---------------------------------------------------------------------------
// ★共通グローバル関数
//---------------------------------------------------------------------------
	//---------------------------------------------------------------------------
	// newEL(tag)      新しいtagのHTMLエレメントを表すjQueryオブジェクトを作成する
	// unselectable()  jQueryオブジェクトを文字列選択不可にする(メソッドチェーン記述用)
	// getSrcElement() イベントを起こしたエレメントを返す
	// int()           小数点以下を切捨てる
	// f_true()        trueを返す関数オブジェクト(引数に空関数を書くのがめんどくさいので)
	//---------------------------------------------------------------------------
function newEL(tag){ return $(document.createElement(tag));}
$.fn.unselectable = function(){
	if     (k.br.Gecko) { this.css("-moz-user-select","none"  ).css("user-select","none");}
	else if(k.br.WebKit){ this.css("-khtml-user-select","none").css("user-select","none");}
	else{ this.attr("unselectable", "on");}
	return this;
};
function getSrcElement(event){ return event.target || event.srcElement;}

var int = Math.floor;
function f_true(){ return true;}

	//---------------------------------------------------------------------------
	// toArray()         配列にする(bindで使う)
	// Function.bind()   thisを関数に紐付けする
	// Function.ebind()  thisを関数に紐付けする(イベント用)
	// Function.kcbind() thisを関数に紐付けする(キーボードイベント用)
	//---------------------------------------------------------------------------
function toArray(inp){ var args=[]; for(var i=0;i<inp.length;i++){ args[i] = inp[i];} return args;}

Function.prototype.bind = function(){
	var args=toArray(arguments);
	var __method = this, obj = args.shift();
	return function(){ return __method.apply(obj, args.concat(toArray(arguments)));}
};
Function.prototype.ebind = function(){
	var args=toArray(arguments);
	var __method = this, obj = args.shift();
	return function(e){ return __method.apply(obj, [e||window.event].concat(args).concat(toArray(arguments)));}
};
Function.prototype.kcbind = function(){
	var args=toArray(arguments), __method = this;
	return function(e){
		ret = __method.apply(kc, [e||window.event].concat(args).concat(toArray(arguments)));
		if(kc.tcMoved){ if(k.br.Gecko||k.br.WebKit){ e.preventDefault();}else if(k.br.IE){ return false;}else{ e.returnValue = false;} }
		return ret;
	}
};

//---------------------------------------------------------------------------
// ★Timerクラス
//---------------------------------------------------------------------------
Timer = function(){
	this.st = 0;	// 最初のタイマー取得値
	this.TID;		// タイマーID
	this.lastOpeCnt = 0;
	this.lastACTime = 0;
	this.worstACCost = 0;

	this.start();
};
Timer.prototype = {
	//---------------------------------------------------------------------------
	// tm.reset()      タイマーのカウントを0にする
	// tm.start()      update()関数を100ms間隔で呼び出す
	// tm.update()     100ms単位で呼び出される関数
	// tm.updatetime() 秒数の表示を行う
	// tm.label()      経過時間に表示する文字列を返す
	// tm.ACchek()     自動正解判定を呼び出す
	//---------------------------------------------------------------------------
	reset : function(){
		this.st = 0;
		this.prev = clearInterval(this.TID);
		$("#timerpanel").html(this.label()+"00:00");
		this.worstACCost = 0;
		this.start();
	},
	start : function(){
		this.st = (new Date()).getTime();
		var self = this;
		this.TID = setInterval(function(){self.update();},100);
	},
	update : function(){
		if(k.callmode!='pmake'){ this.updatetime();}

		if(!kc.isCTRL){ kc.inUNDO=false; kc.inREDO=false;}

		if     (kc.inUNDO)  { um.undo(); }
		else if(kc.inREDO)  { um.redo(); }
		else{ this.ACcheck();}
	},
	updatetime : function(){
		var nowtime = (new Date()).getTime();
		var seconds = int((nowtime - this.st)/1000);
		var hours   = int(seconds/3600);
		var minutes = int(seconds/60) - hours*60;
		seconds = seconds - minutes*60 - hours*3600;

		if(minutes < 10) minutes = "0" + minutes;
		if(seconds < 10) seconds = "0" + seconds;

		if(hours) $("#timerpanel").html(this.label()+hours+":"+minutes+":"+seconds);
		else $("#timerpanel").html(this.label()+minutes+":"+seconds);
	},
	label : function(){
		return lang.isJP()?"経過時間：":"Time: ";
	},

	ACcheck : function(){
		var nowms = (new Date()).getTime();
		if(nowms - this.lastACTime > 120+(this.worstACCost<250?this.worstACCost*4:this.worstACCost*2+500) && this.lastOpeCnt != um.anscount && !ans.inCheck){
			this.lastACTime = nowms;
			this.lastOpeCnt = um.anscount;
			if(k.autocheck){
				var comp = ans.autocheck();
				if(!comp){ this.worstACCost = Math.max(this.worstACCost, ((new Date()).getTime()-nowms));}
			}
		}
	}
};
