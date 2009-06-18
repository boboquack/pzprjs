//
// パズル固有スクリプト部 クリーク版 creek.js v3.1.9p1
//

function setting(){
	// グローバル変数の初期設定
	if(!k.qcols){ k.qcols = 10;}	// 盤面の横幅
	if(!k.qrows){ k.qrows = 10;}	// 盤面の縦幅
	k.irowake = 0;			// 0:色分け設定無し 1:色分けしない 2:色分けする

	k.iscross      = 1;		// 1:Crossが操作可能なパズル
	k.isborder     = 0;		// 1:Border/Lineが操作可能なパズル
	k.isextendcell = 0;		// 1:上・左側にセルを用意するパズル 2:四方にセルを用意するパズル

	k.isoutsidecross  = 1;	// 1:外枠上にCrossの配置があるパズル
	k.isoutsideborder = 0;	// 1:盤面の外枠上にborderのIDを用意する
	k.isborderCross   = 0;	// 1:線が交差するパズル
	k.isCenterLine    = 0;	// 1:マスの真ん中を通る線を回答として入力するパズル
	k.isborderAsLine  = 0;	// 1:境界線をlineとして扱う

	k.dispzero      = 1;	// 1:0を表示するかどうか
	k.isDispHatena  = 0;	// 1:qnumが-2のときに？を表示する
	k.isAnsNumber   = 0;	// 1:回答に数字を入力するパズル
	k.isArrowNumber = 0;	// 1:矢印つき数字を入力するパズル
	k.isOneNumber   = 0;	// 1:部屋の問題の数字が1つだけ入るパズル
	k.isDispNumUL   = 0;	// 1:数字をマス目の左上に表示するパズル(0はマスの中央)
	k.NumberWithMB  = 0;	// 1:回答の数字と○×が入るパズル

	k.BlackCell     = 0;	// 1:黒マスを入力するパズル
	k.NumberIsWhite = 0;	// 1:数字のあるマスが黒マスにならないパズル
	k.RBBlackCell   = 0;	// 1:連黒分断禁のパズル

	k.ispzprv3ONLY  = 0;	// 1:ぱずぷれv3にしかないパズル
	k.isKanpenExist = 0;	// 1:pencilbox/カンペンにあるパズル

	k.fstruct = ["crossnum","cellans"];

	//k.def_csize = 36;
	//k.def_psize = 24;
}

//-------------------------------------------------------------
// Puzzle個別クラスの定義
Puzzle = function(){
	this.prefix();
};
Puzzle.prototype = {
	prefix : function(){
		this.input_init();
		this.graphic_init();

		base.setTitle("クリーク","Creek");
		base.setExpression("　左クリックで黒マスが、右クリックで白マスを入力できます。",
						   " Left Click to input black cells, Right Click to input white cells.");
		base.setFloatbgcolor("rgb(0, 0, 255)");
	},
	menufix : function(){
		menu.addUseToFlags();
	},
	postfix : function(){
		tc.minx = 0;
		tc.miny = 0;
		tc.maxx = 2*k.qcols;
		tc.maxy = 2*k.qrows;
		tc.setTXC(0);
	},

	//---------------------------------------------------------
	//入力系関数オーバーライド
	input_init : function(){
		// マウス入力系
		mv.mousedown = function(x,y){
			if(k.mode==3) this.inputcell(x,y);
			else if(k.mode==1){
				if(!kp.enabled()){ this.inputcross(x,y);}
				else{ kp.display(x,y);}
			}
		};
		mv.mouseup = function(x,y){ };
		mv.mousemove = function(x,y){
			if(k.mode==3) this.inputcell(x,y);
		};

		// キーボード入力系
		kc.keyinput = function(ca){
			if(k.mode==3){ return;}
			if(this.moveTCross(ca)){ return;}
			this.key_inputcross(ca,4);
		};

		if(k.callmode == "pmake"){
			kp.generate(4, true, false, '');
			kp.ctl[1].target = "cross";
			kp.kpinput = function(ca){
				kc.key_inputcross(ca,4);
			};
		}
	},

	//---------------------------------------------------------
	//画像表示系関数オーバーライド
	graphic_init : function(){
		pc.BDlinecolor = "black";
		pc.Cellcolor = "rgb(127, 127, 127)";

		pc.crosssize = 0.35;

		pc.paint = function(x1,y1,x2,y2){
			this.flushCanvas(x1,y1,x2,y2);
		//	this.flushCanvasAll();

			this.drawBlackCells(x1,y1,x2,y2);
			this.drawWhiteCells(x1,y1,x2,y2);

			this.drawBDline(x1,y1,x2,y2);
			this.drawChassis(x1,y1,x2,y2);

			this.drawCrosses(x1,y1,x2+1,y2+1);
			if(k.mode==1){ this.drawTCross(x1,y1,x2+1,y2+1);}else{ this.hideTCross();}
		};
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	pzlinput : function(type, bstr){
		if((type==1 && enc.pzlflag.indexOf("c")>=0) || (type==0 && enc.pzlflag.indexOf("d")==-1)){
			bstr = enc.decode4(bstr, bd.setQnumCross.bind(bd), (k.qcols+1)*(k.qrows+1));
		}
		else{ bstr = enc.decodecross_old(bstr);}
	},
	pzloutput : function(type){
		if(type==0)     { document.urloutput.ta.value = enc.getURLbase()+"?"+k.puzzleid+this.pzldata();}
		else if(type==1){ document.urloutput.ta.value = enc.getDocbase()+k.puzzleid+"/sa/m.html?c"+this.pzldata();}
		else if(type==3){ document.urloutput.ta.value = enc.getURLbase()+"?m+"+k.puzzleid+this.pzldata();}
	},
	pzldata : function(){
		return "/"+k.qcols+"/"+k.qrows+"/"+enc.encode4(bd.getQnumCross.bind(bd), (k.qcols+1)*(k.qrows+1));
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	check : function(){
		if( !ans.checkQnumCross(function(cr,bcnt){ return (cr>=bcnt);}) ){
			ans.setAlert('数字のまわりにある黒マスの数が間違っています。','The number of black cells around a number on crossing is big.'); return false;
		}
		if( !ans.linkBWarea( ans.searchWarea() ) ){
			ans.setAlert('白マスが分断されています。','White cells are devided.'); return false;
		}
		if( !ans.checkQnumCross(function(cr,bcnt){ return (cr<=bcnt);}) ){
			ans.setAlert('数字のまわりにある黒マスの数が間違っています。','The number of black cells around a number on crossing is small.'); return false;
		}

		return true;
	}
};
