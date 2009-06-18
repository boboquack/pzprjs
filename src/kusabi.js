//
// パズル固有スクリプト部 クサビリンク版 kusabi.js v3.1.9p2
//

function setting(){
	// グローバル変数の初期設定
	if(!k.qcols){ k.qcols = 10;}	// 盤面の横幅
	if(!k.qrows){ k.qrows = 10;}	// 盤面の縦幅
	k.irowake = 0;			// 0:色分け設定無し 1:色分けしない 2:色分けする

	k.iscross      = 0;		// 1:Crossが操作可能なパズル
	k.isborder     = 1;		// 1:Border/Lineが操作可能なパズル
	k.isextendcell = 0;		// 1:上・左側にセルを用意するパズル 2:四方にセルを用意するパズル

	k.isoutsidecross  = 0;	// 1:外枠上にCrossの配置があるパズル
	k.isoutsideborder = 0;	// 1:盤面の外枠上にborderのIDを用意する
	k.isborderCross   = 0;	// 1:線が交差するパズル
	k.isCenterLine    = 1;	// 1:マスの真ん中を通る線を回答として入力するパズル
	k.isborderAsLine  = 0;	// 1:境界線をlineとして扱う

	k.dispzero      = 0;	// 1:0を表示するかどうか
	k.isDispHatena  = 0;	// 1:qnumが-2のときに？を表示する
	k.isAnsNumber   = 0;	// 1:回答に数字を入力するパズル
	k.isArrowNumber = 0;	// 1:矢印つき数字を入力するパズル
	k.isOneNumber   = 0;	// 1:部屋の問題の数字が1つだけ入るパズル
	k.isDispNumUL   = 0;	// 1:数字をマス目の左上に表示するパズル(0はマスの中央)
	k.NumberWithMB  = 0;	// 1:回答の数字と○×が入るパズル

	k.BlackCell     = 0;	// 1:黒マスを入力するパズル
	k.NumberIsWhite = 0;	// 1:数字のあるマスが黒マスにならないパズル
	k.RBBlackCell   = 0;	// 1:連黒分断禁のパズル

	k.ispzprv3ONLY  = 1;	// 1:ぱずぷれv3にしかないパズル
	k.isKanpenExist = 0;	// 1:pencilbox/カンペンにあるパズル

	k.fstruct = ["cellqnum", "borderline"];

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

		base.setTitle("クサビリンク","Kusabi");
		base.setExpression("　左ドラッグで線が、右ドラッグで×印が入力できます。",
						   " Left Button Drag to input black cells, Right Click to input a cross.");
		base.setFloatbgcolor("rgb(96, 96, 96)");
	},
	menufix : function(){ },
	postfix : function(){ },

	//---------------------------------------------------------
	//入力系関数オーバーライド
	input_init : function(){
		// マウス入力系
		mv.mousedown = function(x,y){
			if(k.mode==1){
				if(!kp.enabled()){ this.inputqnum(x,y,3);}
				else{ kp.display(x,y);}
			}
			else if(k.mode==3){
				if(this.btn.Left) this.inputLine(x,y);
				else if(this.btn.Right) this.inputpeke(x,y);
			}
		};
		mv.mouseup = function(x,y){ };
		mv.mousemove = function(x,y){
			if(k.mode==3){
				if(this.btn.Left) this.inputLine(x,y);
				else if(this.btn.Right) this.inputpeke(x,y);
			}
		};

		// キーボード入力系
		kc.keyinput = function(ca){
			if(k.mode==3){ return;}
			if(this.moveTCell(ca)){ return;}
			this.key_inputqnum(ca,3);
		};

		if(k.callmode == "pmake"){
			kp.generate(99, true, false, this.kpgenerate);
			kp.kpinput = function(ca){
				kc.key_inputqnum(ca,3);
			};
		}
	},
	kpgenerate : function(mode){
		kp.inputcol('num','knum1','1','同');
		kp.inputcol('num','knum2','2','短');
		kp.inputcol('num','knum3','3','長');
		kp.insertrow();
		kp.inputcol('num','knum.','-','○');
		kp.inputcol('num','knum_',' ',' ');
		kp.inputcol('empty','knumx','','');
		kp.insertrow();
	},

	//---------------------------------------------------------
	//画像表示系関数オーバーライド
	graphic_init : function(){
		pc.BDlinecolor = "rgb(127, 127, 127)";

		pc.errcolor1 = "rgb(192, 0, 0)";

		pc.paint = function(x1,y1,x2,y2){
			this.flushCanvas(x1,y1,x2,y2);

			this.drawErrorCells(x1,y1,x2,y2);

			this.drawBDline(x1,y1,x2,y2);

			this.drawPekes(x1,y1,x2,y2,0);
			this.drawLines(x1,y1,x2,y2);

			this.drawNumCells_kusabi(x1,y1,x2,y2);
			this.drawNumbers_kusabi(x1,y1,x2,y2);

			this.drawChassis(x1,y1,x2,y2);

			if(k.mode==1){ this.drawTCell(x1,y1,x2+1,y2+1);}else{ this.hideTCell();}
		};

		pc.drawNumCells_kusabi = function(x1,y1,x2,y2){
			var rsize  = k.cwidth*0.42;
			var rsize2 = k.cwidth*0.36;

			var clist = this.cellinside(x1-2,y1-2,x2+2,y2+2,f_true);
			for(var i=0;i<clist.length;i++){
				var c = clist[i];
				if(bd.getQnumCell(c)!=-1){
					var px=bd.cell[c].px()+int(k.cwidth/2), py=bd.cell[c].py()+int(k.cheight/2);

					g.fillStyle = this.Cellcolor;
					g.beginPath();
					g.arc(px, py, rsize , 0, Math.PI*2, false);
					if(this.vnop("c"+c+"_cira_",1)){ g.fill(); }

					if(bd.getErrorCell(c)==1){ g.fillStyle = this.errbcolor1;}
					else{ g.fillStyle = "white";}
					g.beginPath();
					g.arc(px, py, rsize2, 0, Math.PI*2, false);
					if(this.vnop("c"+c+"_cirb_",1)){ g.fill(); }
				}
				else{ this.vhide(["c"+c+"_cira_", "c"+c+"_cirb_"]);}
			}
			this.vinc();
		};
		pc.drawNumbers_kusabi = function(x1,y1,x2,y2){
			var clist = this.cellinside(x1,y1,x2,y2,f_true);
			for(var i=0;i<clist.length;i++){
				var c = clist[i];
				var num = bd.getQnumCell(c);
				if(num>=1 && num<=3){ text = ({1:"同",2:"短",3:"長"})[num];}
				else if(!bd.cell[c].numobj)   { continue;}
				else{ bd.cell[c].numobj.hide(); continue;}

				if(!bd.cell[c].numobj){ bd.cell[c].numobj = this.CreateDOMAndSetNop();}
				this.dispnumCell1(c, bd.cell[c].numobj, 1, text, 0.65, this.getNumberColor(c));
			}
			this.vinc();
		};
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	pzlinput : function(type, bstr){
		if(type==0 || type==1){
			bstr = enc.decodeNumber10(bstr);
		}
	},
	pzloutput : function(type){
		if(type==0)     { document.urloutput.ta.value = enc.getURLbase()+"?"+k.puzzleid+this.pzldata();}
		else if(type==1){ document.urloutput.ta.value = enc.getDocbase()+k.puzzleid+"/sa/m.html?c"+this.pzldata();}
		else if(type==3){ document.urloutput.ta.value = enc.getURLbase()+"?m+"+k.puzzleid+this.pzldata();}
	},
	pzldata : function(){
		return "/"+k.qcols+"/"+k.qrows+"/"+enc.encodeNumber10();
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	check : function(){
		ans.performAsLine = true;

		if( !ans.checkLcntCell(3) ){
			ans.setAlert('分岐している線があります。','There is a branch line.'); return false;
		}
		if( !ans.checkLcntCell(4) ){
			ans.setAlert('線が交差しています。','There is a crossing line.'); return false;
		}

		var larea = ans.searchLarea();
		if( !ans.checkQnumsInArea(larea, function(a){ return (a>=3);}) ){
			ans.setAlert('3つ以上の丸がつながっています。','Three or more objects are connected.'); return false;
		}
		if( !this.check2Line() ){
			ans.setAlert('丸の上を線が通過しています。','A line goes through a circle.'); return false;
		}

		var saved = this.checkConnectedLine();
		if( !this.checkErrorFlag(saved,7) ){
			ans.setAlert('丸がコの字型に繋がっていません。','The shape of a line is not correct.'); return false;
		}
		if( !this.checkErrorFlag(saved,6) ){
			ans.setAlert('繋がる丸が正しくありません。','The type of connected circle is wrong.'); return false;
		}
		if( !this.checkErrorFlag(saved,5) ){
			ans.setAlert('線が2回以上曲がっています。','A line turns twice or more.'); return false;
		}
		if( !this.checkErrorFlag(saved,4) ){
			ans.setAlert('線が2回曲がっていません。','A line turns only once or lower.'); return false;
		}
		if( !this.checkErrorFlag(saved,3) ){
			ans.setAlert('線の長さが同じではありません。','The length of lines is differnet.'); return false;
		}
		if( !this.checkErrorFlag(saved,2) ){
			ans.setAlert('線の長短の指示に反してます。','The length of lines is not suit for the label of object.'); return false;
		}
		if( !this.checkErrorFlag(saved,1) ){
			ans.setAlert('途切れている線があります。','There is a dead-end line.'); return false;
		}

		if( !ans.checkDisconnectLine(larea) ){
			ans.setAlert('丸につながっていない線があります。','A line doesn\'t connect any circle.'); return false;
		}

		if( !this.checkNumber() ){
			ans.setAlert('どこにもつながっていない丸があります。','A circle is not connected another object.'); return false;
		}

		return true;
	},
	check1st : function(){ return this.checkNumber();},

	check2Line : function(){ return this.checkLine(function(i){ return (ans.lcntCell(i)>=2 && bd.getQnumCell(i)!=-1);}); },
	checkLine : function(func){
		for(var c=0;c<bd.cell.length;c++){
			if(func(c)){
				bd.setErrorBorder(bd.borders,2);
				ans.setCellLineError(c,true);
				return false;
			}
		}
		return true;
	},
	checkNumber : function(){
		for(var c=0;c<bd.cell.length;c++){
			if(ans.lcntCell(c)==0 && bd.getQnumCell(c)!=-1){
				bd.setErrorCell(c,1);
				return false;
			}
		}
		return true;
	},

	checkConnectedLine : function(){
		var saved = {errflag:0,cells:new Array(),idlist:new Array()};
		var visited = new AreaInfo();
		for(var id=0;id<bd.border.length;id++){ visited[id]=0;}

		for(var c=0;c<bd.cell.length;c++){
			if(bd.getQnumCell(c)==-1 || ans.lcntCell(c)==0){ continue;}

			var cc      = -1;	// ループから抜けたときに到達地点のIDが入る
			var ccnt    =  0;	// 曲がった回数
			var dir     =  0;	// 現在向かっている方向/最後に向かった方向
			var dir1    =  0;	// 最初に向かった方向
			var length1 =  0;	// 一回曲がる前の線の長さ
			var length2 =  0;	// 二回曲がった後の線の長さ
			var idlist  = new Array();	// 通過したlineのリスト(エラー表示用)
			var bx=bd.cell[c].cx*2+1, by=bd.cell[c].cy*2+1;	// 現在地
			while(1){
				switch(dir){ case 1: by--; break; case 2: by++; break; case 3: bx--; break; case 4: bx++; break;}
				if((bx+by)%2==0){
					cc = bd.getcnum(int(bx/2),int(by/2));
					if(dir!=0 && bd.getQnumCell(cc)!=-1){ break;}
					else if(dir!=1 && bd.getLineBorder(bd.getbnum(bx,by+1))>0){ if(dir!=0&&dir!=2){ ccnt++;} dir=2;}
					else if(dir!=2 && bd.getLineBorder(bd.getbnum(bx,by-1))>0){ if(dir!=0&&dir!=1){ ccnt++;} dir=1;}
					else if(dir!=3 && bd.getLineBorder(bd.getbnum(bx+1,by))>0){ if(dir!=0&&dir!=4){ ccnt++;} dir=4;}
					else if(dir!=4 && bd.getLineBorder(bd.getbnum(bx-1,by))>0){ if(dir!=0&&dir!=3){ ccnt++;} dir=3;}
				}
				else{
					cc=-1;
					var id = bd.getbnum(bx,by);
					if(id==-1||visited[id]!=0||bd.getLineBorder(id)<=0){ break;}
					idlist.push(id);
					visited[id]=1;
					if(dir1==0){ dir1=dir;}
					if     (ccnt==0){ length1++;}
					else if(ccnt==2){ length2++;}
				}
			}

			if(idlist.length<=0){ continue;}
			else if((cc==-1 || bd.getQnumCell(cc)==-1) && saved.errflag==0){
				saved = {errflag:1,cells:[c],idlist:idlist};
			}
			else if((((bd.getQnumCell(c)==2 || bd.getQnumCell(cc)==3) && length1>=length2) ||
					 ((bd.getQnumCell(c)==3 || bd.getQnumCell(cc)==2) && length1<=length2)) && ccnt==2 && cc!=-1 && saved.errflag<=1)
			{
				saved = {errflag:2,cells:[c,cc],idlist:idlist};
			}
			else if((bd.getQnumCell(c)==1 || bd.getQnumCell(cc)==1) && ccnt==2 && cc!=-1 && length1!=length2 && saved.errflag<=2){
				saved = {errflag:3,cells:[c,cc],idlist:idlist};
			}
			else if(ccnt<2 && cc!=-1 && saved.errflag<=3){
				saved = {errflag:4,cells:[c,cc],idlist:idlist};
				return saved;
			}
			else if(ccnt>2 && saved.errflag<=3){
				saved = {errflag:5,cells:[c,cc],idlist:idlist};
				return saved;
			}
			else if(!((bd.getQnumCell(c)==1 && bd.getQnumCell(cc)==1)||
					  (bd.getQnumCell(c)==2 && bd.getQnumCell(cc)==3)||
					  (bd.getQnumCell(c)==3 && bd.getQnumCell(cc)==2)||
					  bd.getQnumCell(c)==-2 || bd.getQnumCell(cc)==-2) && cc!=-1 && ccnt==2 && saved.errflag<=3)
			{
				saved = {errflag:6,cells:[c,cc],idlist:idlist};
				return saved;
			}
			else if(!((dir1==1&&dir==2)||(dir1==2&&dir==1)||(dir1==3&&dir==4)||(dir1==4&&dir==3)) && ccnt==2 && saved.errflag<=3){
				saved = {errflag:7,cells:[c,cc],idlist:idlist};
				return saved;
			}
		}
		return saved;
	},
	checkErrorFlag : function(saved, val){
		if(saved.errflag==val){
			bd.setErrorCell(saved.cells,1);
			bd.setErrorBorder(bd.borders,2);
			bd.setErrorBorder(saved.idlist,1);
			return false;
		}
		return true;
	}
};
