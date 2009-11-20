// pzprUtil.js v3.2.2

//---------------------------------------------------------------------------
// ★AreaInfoクラス 主に色分けの情報を管理する
//   id : -1     どの部屋にも属さないセル(黒マス情報で白マスのセル、等)
//         0     どの部屋に属させるかの処理中
//         1以上 その番号の部屋に属する
//---------------------------------------------------------------------------
AreaInfo = function(){
	this.max  = 0;	// 最大の部屋番号(1〜maxまで存在するよう構成してください)
	this.id   = [];	// 各セル/線などが属する部屋番号を保持する
	this.room = [];	// 各部屋のidlist等の情報を保持する(info.room[id].idlistで取得)
};

//---------------------------------------------------------------------------
// ★LineManagerクラス 主に色分けの情報を管理する
//---------------------------------------------------------------------------
// LineManagerクラスの定義
LineManager = function(){
	this.lcnt    = [];
	this.ltotal  = [];

	this.disableLine = (!k.isCenterLine && !k.isborderAsLine);
	this.data    = {};	// 線id情報

	this.typeA = 'A';
	this.typeB = 'B';
	this.typeC = 'C';

	this.saved = 0;

	this.init();
};
LineManager.prototype = {

	//---------------------------------------------------------------------------
	// line.init()        変数の起動時の初期化を行う
	// line.resetLcnts()  lcnts等の変数の初期化を行う
	// line.lcntCell()    セルに存在する線の本数を返す
	//---------------------------------------------------------------------------
	init : function(){
		if(this.disableLine){ return;}

		// lcnt, ltotal変数(配列)初期化
		if(k.isCenterLine){
			for(var c=0;c<bd.cellmax;c++){ this.lcnt[c]=0;}
			this.ltotal=[(k.qcols*k.qrows), 0, 0, 0, 0];
		}
		else{
			for(var c=0,len=(k.qcols+1)*(k.qrows+1);c<len;c++){ this.lcnt[c]=0;}
			this.ltotal=[((k.qcols+1)*(k.qrows+1)), 0, 0, 0, 0];
		}

		// その他の変数初期化
		this.data = {max:0,id:[]};
		for(var id=0;id<bd.bdmax;id++){ this.data.id[id] = -1;}
	},

	resetLcnts : function(){
		if(this.disableLine){ return;}

		this.init();
		for(var id=0;id<bd.bdmax;id++){ this.data.id[id] = (bd.isLine(id)?0:-1);
			if(bd.isLine(id)){
				this.data.id[id] = 0;

				var cc1, cc2;
				if(k.isCenterLine){ cc1 = bd.cc1(id),      cc2 = bd.cc2(id);}
				else              { cc1 = bd.crosscc1(id), cc2 = bd.crosscc2(id);}

				if(cc1!=-1){ this.ltotal[this.lcnt[cc1]]--; this.lcnt[cc1]++; this.ltotal[this.lcnt[cc1]]++;}
				if(cc2!=-1){ this.ltotal[this.lcnt[cc2]]--; this.lcnt[cc2]++; this.ltotal[this.lcnt[cc2]]++;}
			}
		}
		for(var id=0;id<bd.bdmax;id++){
			if(this.data.id[id]!=0){ continue;}	// 既にidがついていたらスルー
			var bx=bd.border[id].cx, by=bd.border[id].cy;
			this.data.max++;
			this.data[this.data.max] = {idlist:[]};
			if(k.isCenterLine^(bx%2==0)){ this.lc0(bx,by+1,1,this.data.max); this.lc0(bx,by,2,this.data.max);}
			else                        { this.lc0(bx+1,by,3,this.data.max); this.lc0(bx,by,4,this.data.max);}
		}
	},
	lcntCell  : function(cc){ return (cc!=-1?this.lcnt[cc]:0);},

	//---------------------------------------------------------------------------
	// line.gettype()   線が引かれた/消された時に、typeA/typeB/typeCのいずれか判定する
	// line.isTpos()    pieceが、指定されたcc内でidの反対側にあるか判定する
	// line.branch()    lc0関数でidを割り当て中、このセルで分岐するかどうか判定する
	// line.terminate() lc0関数でidを割り当て中、このセルで終了するかどうか判定する
	//---------------------------------------------------------------------------
	gettype : function(cc,id,val){
		if(!k.isLineCross){
			return ((this.lcnt[cc]===(0+val))?this.typeA:this.typeB);
		}
		else{
			if(cc===-1 || this.lcnt[cc]===(0+val) || (this.lcnt[cc]===(2+val) && this.isTpos(cc,id))){ return this.typeA;}
			else if(this.lcnt[cc]===(1+val) || this.lcnt[cc]===(3+val)){ return this.typeB;}
			return this.typeC;
		}
	},
	isTpos : function(cc,id){
		//   │ ←id                    
		// ━┷━                       
		//   ・ ←この場所に線があるか？
		if(k.isCenterLine){
			return !bd.isLine(bd.bnum( 4*bd.cell[cc].cx+2-bd.border[id].cx, 4*bd.cell[cc].cy+2  -bd.border[id].cy ));
		}
		else{
			return !bd.isLine(bd.bnum( 4*(cc%(k.qcols+1))-bd.border[id].cx, 4*mf(cc/(k.qcols+1))-bd.border[id].cy ));
		}
	},

	branch    : function(bx,by){
		if(!k.isLineCross){
			return (this.lcntCell((k.isCenterLine?bd.cnum:bd.xnum)(bx>>1,by>>1))>=3);
		}
		return false;
	},
	terminate : function(bx,by){
		return false;
	},

	//---------------------------------------------------------------------------
	// line.setLine()        線が引かれたり消された時に、lcnt変数や線の情報を生成しなおす
	// line.setLineInfo()    線が引かれた時に、線の情報を生成しなおす
	// line.removeLineInfo() 線が消された時に、線の情報を生成しなおす
	// line.addLineInfo()    線が引かれた時に、周りの線が全てくっついて1つの線が
	//                       できる場合の線idの再設定を行う
	// line.remakeLineInfo() 線が引かれたり消された時、新たに2つ以上の線ができる
	//                       可能性がある場合の線idの再設定を行う
	// line.repaintLine()    ひとつながりの線を再描画する
	// line.repaintParts()   repaintLine()関数で、さらに上から描画しなおしたい処理を書く
	//---------------------------------------------------------------------------
	setLine : function(id, val){
		if(this.disableLine){ return;}
		val = (val>0?1:0);

		var cc1, cc2;
		if(k.isCenterLine){ cc1 = bd.cc1(id),      cc2 = bd.cc2(id);}
		else              { cc1 = bd.crosscc1(id), cc2 = bd.crosscc2(id);}

		if(val>0){
			if(cc1!=-1){ this.ltotal[this.lcnt[cc1]]--; this.lcnt[cc1]++; this.ltotal[this.lcnt[cc1]]++;}
			if(cc2!=-1){ this.ltotal[this.lcnt[cc2]]--; this.lcnt[cc2]++; this.ltotal[this.lcnt[cc2]]++;}
		}
		else{
			if(cc1!=-1){ this.ltotal[this.lcnt[cc1]]--; this.lcnt[cc1]--; this.ltotal[this.lcnt[cc1]]++;}
			if(cc2!=-1){ this.ltotal[this.lcnt[cc2]]--; this.lcnt[cc2]--; this.ltotal[this.lcnt[cc2]]++;}
		}

		//---------------------------------------------------------------------------
		// (A)くっつきなし                        (B)単純くっつき
		//     ・      │    - 交差ありでlcnt=1     ┃      │    - 交差なしでlcnt=2〜4
		//   ・ ━   ・┝━  - 交差なしでlcnt=1   ・┗━  ━┿━  - 交差ありでlcnt=2or4
		//     ・      │    - 交差ありでlcnt=3     ・      │                         
		// 
		// (C)複雑くっつき
		//    ┃        │   - 交差ありでlcnt=3(このパターン)
		//  ━┛・ => ━┷━   既存の線情報が別々になってしまう
		//    ・        ・   
		//---------------------------------------------------------------------------
		var type1 = this.gettype(cc1,id,val), type2 = this.gettype(cc2,id,val);
		if(val>0){
			// (A)+(A)の場合 -> 新しい線idを割り当てる
			if(type1===this.typeA && type2===this.typeA){
				this.data.max++;
				this.data[this.data.max] = {idlist:[id]};
				this.data.id[id] = this.data.max;
				bd.border[id].color = pc.getNewLineColor();
			}
			// (A)+(B)の場合 -> 既存の線にくっつける
			else if((type1===this.typeA && type2===this.typeB) || (type1===this.typeB && type2===this.typeA)){
				var bid = (this.getbid(id,1))[0];
				this.data[this.data.id[bid]].idlist.push(id);
				this.data.id[id] = this.data.id[bid];
				bd.border[id].color = bd.border[bid].color;
			}
			// (B)+(B)の場合 -> くっついた線で、大きい方の線idに統一する
			else if(!k.isLineCross || (type1===this.typeB && type2===this.typeB)){
				this.addLineInfo(id);
			}
			// その他の場合
			else{
				this.remakeLineInfo(id,1);
			}
		}
		else{
			// (A)+(A)の場合 -> 線id自体を消滅させる
			if(type1===this.typeA && type2===this.typeA){
				this.data[this.data.id[id]] = {idlist:[]};
				this.data.id[id] = -1;
				bd.border[id].color = "";
			}
			// (A)+(B)の場合 -> 既存の線から取り除く
			else if((type1===this.typeA && type2===this.typeB) || (type1===this.typeB && type2===this.typeA)){
				var ownid = this.data.id[id], idlist = this.data[ownid].idlist;
				for(var i=0;i<idlist.length;i++){ if(idlist[i]===id){ idlist.splice(i,1); break;} }
				this.data.id[id] = -1;
				bd.border[id].color = "";
			}
			// (B)+(B)の場合、その他の場合 -> 分かれた線にそれぞれ新しい線idをふる
			else{
				this.remakeLineInfo(id,0);
				bd.border[id].color = "";
			}
		}
	},

	addLineInfo : function(id){
		var dataid = this.data.id;

		// この関数の突入条件より、bid.lengthは必ず2になる
		// →ならなかった... くっつく線のIDは必ず2になる
		var bid = this.getbid(id,1);
		var did = [dataid[bid[0]], -1];
		for(var i=0;i<bid.length;i++){
			if(did[0]!=dataid[bid[i]]){
				did[1]=dataid[bid[i]];
				break;
			}
		}

		var newColor = bd.border[bid[0]].color;
		if(did[1] != -1){
			var longid = did[0], shortid = did[1];
			if(this.data[did[0]].idlist.length < this.data[did[1]].idlist.length){
				longid=did[1]; shortid=did[0];
				newColor=bd.border[bid[1]].color;
			}

			// つながった線は全て同じIDにする
			var longidlist  = this.data[longid].idlist;
			var shortidlist = this.data[shortid].idlist;
			for(var n=0,len=shortidlist.length;n<len;n++){
				longidlist.push(shortidlist[n]);
				dataid[shortidlist[n]] = longid;
			}
			this.data[shortid].idlist = [];

			longidlist.push(id);
			dataid[id] = longid;

			// 色を同じにする
			for(var i=0,len=longidlist.length;i<len;i++){
				bd.border[longidlist[i]].color = newColor;
			}
			this.repaintLine(longidlist);
		}
		else{
			this.data[did[0]].idlist.push(id);
			dataid[id] = did[0];
			bd.border[id].color = newColor;
		}
	},
	remakeLineInfo : function(id,val){
		var dataid = this.data.id;

		var bid = this.getbid(id,val);
		var longid = dataid[bid[0]];
		var longColor = bd.border[bid[0]].color; // 周りで一番長い線の色を保持する

		// つながった線の線情報を0にする
		for(var i=0,len=bid.length;i<len;i++){
			var lid = dataid[bid[i]];
			if(lid<=0){ continue;}
			var idlist = this.data[lid].idlist;
			if(this.data[longid].idlist.length < idlist.length){
				longid=lid; longColor=bd.border[bid[i]].color;
			}
			for(var n=0,len2=idlist.length;n<len2;n++){ dataid[idlist[n]] = 0;}
			this.data[lid] = {idlist:[]};
		}

		dataid[id] = (val>0?0:-1);
		if(val===1){ bid.unshift(id);}

		// 新しいidを設定する
		var oldmax = this.data.max;
		for(var i=0,len=bid.length;i<len;i++){
			if(dataid[bid[i]]!=0){ continue;}	// 既にidがついていたらスルー
			var bx=bd.border[bid[i]].cx, by=bd.border[bid[i]].cy;
			this.data.max++; this.data[this.data.max] = {idlist:[]};
			if(k.isCenterLine^(bx%2===0)){ this.lc0(bx,by+1,1,this.data.max); this.lc0(bx,by,2,this.data.max);}
			else                         { this.lc0(bx+1,by,3,this.data.max); this.lc0(bx,by,4,this.data.max);}
		}

		// 新しい色を設定して、再描画する
		longid = oldmax+1;
		if(this.data.max>longid || k.isLineCross){
			for(var i=oldmax+2;i<=this.data.max;i++){ if(this.data[longid].idlist.length < this.data[i].idlist.length){ longid=i;} }
			for(var i=oldmax+1;i<=this.data.max;i++){
				var newColor = (i===longid?longColor:pc.getNewLineColor());
				var idlist = this.data[i].idlist;
				for(var n=0,len=idlist.length;n<len;n++){
					bd.border[idlist[n]].color = newColor;
				}
				this.repaintLine(idlist);
			}
		}
		else{
			bd.border[id].color = (val==0?longColor:"");
		}
	},

	repaintLine : (
		((!k.vml) ?
			function(idlist){
				if(!pp.getVal('irowake')){ return;}

				if(k.isCenterLine){
					for(var i=0,len=idlist.length;i<len;i++){
						pc.drawLine1(idlist[i],true);
						this.repaintParts(idlist[i]);
					}
				}
				else{
					for(var i=0,len=idlist.length;i<len;i++){
						var id = idlist[i];
						if(bd.border[id].qans!==1){ g.fillStyle = pc.BorderQuescolor; }
						else                      { g.fillStyle = pc.getLineColor(id);}
						pc.drawBorder1x(bd.border[id].cx, bd.border[id].cy, true);
						this.repaintParts(id);
					}
				}
			}
		:
			function(idlist){
				if(!pp.getVal('irowake')){ return;}

				pc.zstable = true;
				if(k.isCenterLine){
					for(var i=0,len=idlist.length;i<len;i++){
						pc.drawLine1(idlist[i],true);
					}
				}
				else{
					for(var i=0,len=idlist.length;i<len;i++){
						pc.drawBorder1x(bd.border[idlist[i]].cx,bd.border[idlist[i]].cy,true);
					}
				}
				pc.zstable = false;
			}
		)
	),
	repaintParts : function(id){ }, // オーバーライド用

	//---------------------------------------------------------------------------
	// line.getbid()  指定したpieceに繋がる、最大6箇所に引かれている線を全て取得する
	// line.lc0()     ひとつながりの線にlineidを設定する(再帰呼び出し用関数)
	//---------------------------------------------------------------------------
	getbid : function(id,val){
		var bid = [];
		var bx=bd.border[id].cx, by=bd.border[id].cy;
		var dx =((k.isCenterLine^(bx%2===0))?2:0), dy=(2-dx);	// (dx,dy) = (2,0) or (0,2)

		var i;
		if(!k.isLineCross){
			i = bd.bnum(bx-dy,   by-dx  ); if(bd.isLine(i)){ bid.push(i);} // cc1からのstraight
			i = bd.bnum(bx-1,    by-1   ); if(bd.isLine(i)){ bid.push(i);} // cc1からのcurve1
			i = bd.bnum(bx+dx-1, by+dy-1); if(bd.isLine(i)){ bid.push(i);} // cc1からのcurve2
			i = bd.bnum(bx+dy,   by+dx  ); if(bd.isLine(i)){ bid.push(i);} // cc2からのstraight
			i = bd.bnum(bx+1,    by+1   ); if(bd.isLine(i)){ bid.push(i);} // cc2からのcurve1
			i = bd.bnum(bx-dx+1, by-dy+1); if(bd.isLine(i)){ bid.push(i);} // cc2からのcurve2
		}
		else{
			var cc1 = bd.cc1(id), cc2 = bd.cc2(id);
			if(!k.isCenterLine){ cc1 = bd.crosscc1(id); cc2 = bd.crosscc2(id);}
			// k.isLineCross==1でk.isborderAsLine==1(->k.isCenterLine==0)のパズルは作ってないはず
			// 該当するのもスリザーボックスくらいだったような、、

			if(cc1!==-1){
				if(this.lcnt[cc1]===(1+val) || (this.lcnt[cc1]===(2+val) && !this.isTpos(cc1,id))){
					i = bd.bnum(bx-dy,   by-dx  ); if(bd.isLine(i)){ bid.push(i);} // cc1からのstraight
					i = bd.bnum(bx-1,    by-1   ); if(bd.isLine(i)){ bid.push(i);} // cc1からのcurve1
					i = bd.bnum(bx+dx-1, by+dy-1); if(bd.isLine(i)){ bid.push(i);} // cc1からのcurve2
				}
				else if(this.lcnt[cc1]>=(3+val)){
					i = bd.bnum(bx-dy,   by-dx  ); if(bd.isLine(i)){ bid.push(i);} // cc1からのstraight
				}
			}
			if(cc2!==-1){
				if(this.lcnt[cc2]===(1+val) || (this.lcnt[cc2]===(2+val) && !this.isTpos(cc2,id))){
					i = bd.bnum(bx+dy,   by+dx  ); if(bd.isLine(i)){ bid.push(i);} // cc2からのstraight
					i = bd.bnum(bx+1,    by+1   ); if(bd.isLine(i)){ bid.push(i);} // cc2からのcurve1
					i = bd.bnum(bx-dx+1, by-dy+1); if(bd.isLine(i)){ bid.push(i);} // cc2からのcurve2
				}
				else if(this.lcnt[cc2]>=(3+val)){
					i = bd.bnum(bx+dy,   by+dx  ); if(bd.isLine(i)){ bid.push(i);} // cc2からのstraight
				}
			}
		}

		return bid;
	},

	lc0 : function(bx,by,dir,newid){
		while(1){
			switch(dir){ case 1: by--; break; case 2: by++; break; case 3: bx--; break; case 4: bx++; break;}
			if((bx+by)%2===0){
				if(this.branch(bx,by)){
					if(bd.isLine(bd.bnum(bx,by-1))){ this.lc0(bx,by,1,newid);}
					if(bd.isLine(bd.bnum(bx,by+1))){ this.lc0(bx,by,2,newid);}
					if(bd.isLine(bd.bnum(bx-1,by))){ this.lc0(bx,by,3,newid);}
					if(bd.isLine(bd.bnum(bx+1,by))){ this.lc0(bx,by,4,newid);}
					break;
				}
				else if(this.lcntCell((k.isCenterLine?bd.cnum:bd.xnum)(bx>>1,by>>1))<=2){
					if     (dir!=1 && bd.isLine(bd.bnum(bx,by+1))){ dir=2;}
					else if(dir!=2 && bd.isLine(bd.bnum(bx,by-1))){ dir=1;}
					else if(dir!=3 && bd.isLine(bd.bnum(bx+1,by))){ dir=4;}
					else if(dir!=4 && bd.isLine(bd.bnum(bx-1,by))){ dir=3;}
				}
				else if(this.terminate(bx,by)){ break;}
			}
			else{
				var id = bd.bnum(bx,by);
				if(this.data.id[id]!=0){ break;}
				this.data.id[id] = newid;
				this.data[newid].idlist.push(id);
			}
		}
	},

	//--------------------------------------------------------------------------------
	// line.getLineInfo()    線情報をAreaInfo型のオブジェクトで返す
	// line.getLareaInfo()   同じ線がまたがるセルの情報をAreaInfo型のオブジェクトで返す
	//                       (これだけは旧型の生成方法でやってます)
	//--------------------------------------------------------------------------------
	getLineInfo : function(){
		var info = new AreaInfo();
		for(var id=0;id<bd.bdmax;id++){ info.id[id]=(bd.isLine(id)?0:-1);}
		for(var id=0;id<bd.bdmax;id++){
			if(info.id[id]!=0){ continue;}
			info.max++;
			info.room[info.max] = {idlist:this.data[this.data.id[id]].idlist}; /* 参照だけなのでconcat()じゃなくてよい */
			for(var i=0;i<info.room[info.max].idlist.length;i++){
				info.id[info.room[info.max].idlist[i]] = info.max;
			}
		}
		return info;
	},
	getLareaInfo : function(){
		var linfo = new AreaInfo();
		for(var c=0;c<bd.cellmax;c++){ linfo.id[c]=(this.lcnt[c]>0?0:-1);}
		for(var c=0;c<bd.cellmax;c++){
			if(linfo.id[c]!=0){ continue;}
			linfo.max++;
			linfo.room[linfo.max] = {idlist:[]};
			this.sr0(linfo, c, linfo.max);
		}
		return linfo;
	},
	sr0 : function(linfo, i, areaid){
		linfo.id[i] = areaid;
		linfo.room[areaid].idlist.push(i);
		if( bd.isLine(bd.ub(i)) && linfo.id[bd.up(i)]===0 ){ this.sr0(linfo, bd.up(i), areaid);}
		if( bd.isLine(bd.db(i)) && linfo.id[bd.dn(i)]===0 ){ this.sr0(linfo, bd.dn(i), areaid);}
		if( bd.isLine(bd.lb(i)) && linfo.id[bd.lt(i)]===0 ){ this.sr0(linfo, bd.lt(i), areaid);}
		if( bd.isLine(bd.rb(i)) && linfo.id[bd.rt(i)]===0 ){ this.sr0(linfo, bd.rt(i), areaid);}
	}
};

//--------------------------------------------------------------------------------
// ★AreaManagerクラス 部屋のTOP-Cellの位置等の情報を扱う
//   ※このクラスで管理しているareaidは、処理を簡略化するために
//     領域に属するIDがなくなっても情報としては消していません。
//     そのため、1〜maxまで全て中身が存在しているとは限りません。
//     回答チェックやファイル出力前には一旦resetRarea()等が必要です。
//--------------------------------------------------------------------------------
// 部屋のTOPに数字を入力する時の、ハンドリング等
AreaManager = function(){
	this.lcnt  = [];	// 交点id -> 交点から出る線の本数

	this.room  = {};	// 部屋情報を保持する
	this.bcell = {};	// 黒マス情報を保持する
	this.wcell = {};	// 白マス情報を保持する

	this.disroom = (!k.isborder || !!k.area.disroom);	// 部屋情報を生成しない
	this.bblock = (!!k.area.bcell || !!k.area.number);	// 黒マス(or 繋がる数字・記号)の情報を生成する
	this.wblock = !!k.area.wcell;						// 白マスの情報を生成する
	this.numberColony = !!k.area.number;				// 数字・記号を黒マス情報とみなして情報を生成する

	this.init();
};
AreaManager.prototype = {
	//--------------------------------------------------------------------------------
	// area.init()       起動時に変数を初期化する
	// area.resetArea()  部屋、黒マス、白マスの情報をresetする
	//--------------------------------------------------------------------------------
	init : function(){
		this.initRarea();
		this.initBarea();
		this.initWarea();
	},
	resetArea : function(){
		if(k.isborder && !k.isborderAsLine){ this.resetRarea();}
		if(this.bblock){ this.resetBarea();}
		if(this.wblock){ this.resetWarea();}
	},

	//--------------------------------------------------------------------------------
	// area.initRarea()  部屋関連の変数を初期化する
	// area.resetRarea() 部屋の情報をresetして、1から割り当てしなおす
	// 
	// area.lcntCross()  指定された位置のCrossの上下左右のうち境界線が引かれている(ques==1 or qans==1の)数を求める
	// area.getRoomID()          このオブジェクトで管理しているセルの部屋IDを取得する
	// area.setRoomID()          このオブジェクトで管理しているセルの部屋IDを設定する
	// area.getTopOfRoomByCell() 指定したセルが含まれる領域のTOPの部屋を取得する
	// area.getTopOfRoom()       指定した領域のTOPの部屋を取得する
	// area.getCntOfRoomByCell() 指定したセルが含まれる領域の大きさを抽出する
	// area.getCntOfRoom()       指定した領域の大きさを抽出する
	//--------------------------------------------------------------------------------
	initRarea : function(){
		// 部屋情報初期化
		this.room = {max:1,id:[],1:{top:0,clist:[]}};
		for(var c=0;c<bd.cellmax;c++){ this.room.id[c] = 1; this.room[1].clist[c] = c;}

		// lcnt変数初期化
		this.lcnt = [];
		for(var c=0;c<(k.qcols+1)*(k.qrows+1);c++){
			this.lcnt[c]=0;
			if(k.isoutsideborder===0){
				var xx=c%(k.qcols+1), xy=mf(c/(k.qcols+1));
				if(xx===0 || xx===k.qcols || xy===0 || xy===k.qrows){ this.lcnt[c]=2;}
			}
		}

		if(this.disroom){ return;}
		for(var id=0;id<bd.bdmax;id++){
			if(bd.isBorder(id)){
				var cc1 = bd.crosscc1(id), cc2 = bd.crosscc2(id);
				if(cc1!==-1){ this.lcnt[cc1]++;}
				if(cc2!==-1){ this.lcnt[cc2]++;}
			}
		}
	},
	resetRarea : function(){
		if(this.disroom){ return;}

		this.initRarea();
		this.room.max = 0;
		for(var cc=0;cc<bd.cellmax;cc++){ this.room.id[cc]=0;}
		for(var cc=0;cc<bd.cellmax;cc++){
			if(this.room.id[cc]!=0){ continue;}
			this.room.max++;
			this.room[this.room.max] = {top:-1,clist:[]};
			this.sr0(cc,this.room,bd.isBorder);
		}

		// 部屋ごとに、TOPの場所に数字があるかどうか判断して移動する
		if(k.isOneNumber){
			for(var r=1;r<=this.room.max;r++){
				this.setTopOfRoom(r);

				var val = -1, clist = this.room[r].clist;
				for(var i=0,len=clist.length;i<len;i++){
					var c = clist[i];
					if(this.room.id[c]===r && bd.cell[c].qnum!==-1){
						if(val===-1){ val = bd.cell[c].qnum;}
						if(this.getTopOfRoom(r)!==c){ bd.sQnC(c, -1);}
					}
				}
				if(val!==-1 && bd.QnC(this.getTopOfRoom(r))===-1){ bd.sQnC(this.getTopOfRoom(r), val);}
			}
		}
	},

	lcntCross : function(id){ return this.lcnt[id];},

	getRoomID : function(cc){ return this.room.id[cc];},
//	setRoomID : function(cc,val){ this.room.id[cc] = val;},

	getTopOfRoomByCell : function(cc){ return this.room[this.room.id[cc]].top;},
	getTopOfRoom       : function(id){ return this.room[id].top;},

	getCntOfRoomByCell : function(cc){ return this.room[this.room.id[cc]].clist.length;},
//	getCntOfRoom       : function(id){ return this.room[id].clist.length;},

	//--------------------------------------------------------------------------------
	// area.setBorder()    境界線が引かれたり消されてたりした時に、変数lcntの内容を変更する
	// area.setTopOfRoom() セルのリストから部屋のTOPを設定する
	// area.sr0()          setBorder()から呼ばれて、初期idを含む一つの部屋の領域を、指定されたareaidにする
	//---------------------------------------------------------------------------
	call_setBorder : function(id,val,type){
		this.setBorder(id,val);
	},
	setBorder : function(id,val){
		if(this.disroom){ return;}
		val = (val>0?1:0);

		var cc1, cc2, xc1 = bd.crosscc1(id), xc2 = bd.crosscc2(id);
		var room = this.room, roomid = room.id;
		if(val>0){
			this.lcnt[xc1]++; this.lcnt[xc2]++;

			if(this.lcnt[xc1]===1 || this.lcnt[xc2]===1){ return;}
			cc1 = bd.cc1(id); cc2 = bd.cc2(id);
			if(cc1===-1 || cc2===-1 || roomid[cc1]!==roomid[cc2]){ return;}

			var baseid = roomid[cc1];

			// まず下or右側のセルから繋がるセルのroomidを変更する
			room.max++;
			room[room.max] = {top:-1,clist:[]}
			this.sr0(cc2,room,bd.isBorder);

			// 部屋が分割されていなかったら、元に戻して終了
			if(roomid[cc1] === room.max){
				for(var i=0,len=room[room.max].clist.length;i<len;i++){
					roomid[room[room.max].clist[i]] = baseid;
				}
				room.max--;
				return;
			}

			// roomの情報を更新する
			var clist = room[baseid].clist.concat();
			room[baseid].clist = [];
			room[room.max].clist = [];
			for(var i=0,len=clist.length;i<len;i++){
				room[roomid[clist[i]]].clist.push(clist[i]);
			}

			// TOPの情報を設定する
			if(k.isOneNumber){
				if(roomid[room[baseid].top]===baseid){
					this.setTopOfRoom(room.max);
				}
				else{
					room[room.max].top = room[baseid].top;
					this.setTopOfRoom(baseid);
				}
			}
		}
		else{
			this.lcnt[xc1]--; this.lcnt[xc2]--;

			if(this.lcnt[xc1]===0 || this.lcnt[xc2]===0){ return;}
			cc1 = bd.cc1(id); cc2 = bd.cc2(id);
			if(cc1===-1 || cc2===-1 || roomid[cc1]===roomid[cc2]){ return;}

			// k.isOneNumberの時 どっちの数字を残すかは、TOP同士の位置で比較する
			if(k.isOneNumber){
				var merged, keep;

				var tc1 = room[roomid[cc1]].top, tc2 = room[roomid[cc2]].top;
				var tcx1 = bd.cell[tc1].cx, tcx2 = bd.cell[tc2].cx;
				if(tcx1>tcx2 || (tcx1===tcx2 && tc1>tc2)){ merged = tc1; keep = tc2;}
				else                                     { merged = tc2; keep = tc1;}

				// 消える部屋のほうの数字を消す
				if(bd.QnC(merged)!==-1){
					// 数字が消える部屋にしかない場合 -> 残るほうに移動させる
					if(bd.QnC(keep)===-1){ bd.sQnC(keep, bd.QnC(merged)); pc.paintCell(keep);}
					bd.sQnC(merged,-1); pc.paintCell(merged);
				}
			}

			// room, roomidを更新
			var r1 = roomid[cc1], r2 = roomid[cc2], clist = room[r2].clist;
			for(var i=0;i<clist.length;i++){
				roomid[clist[i]] = r1;
				room[r1].clist.push(clist[i]);
			}
			room[r2] = {top:-1,clist:[]};
		}
	},
	setTopOfRoom : function(roomid){
		var cc=-1, cx=k.qcols, cy=k.qrows;
		var clist = this.room[roomid].clist;
		for(var i=0;i<clist.length;i++){
			var tc = bd.cell[clist[i]];
			if(tc.cx>cx || (tc.cx==cx && tc.cy>=cy)){ continue;}
			cc=clist[i];
			cx=tc.cx;
			cy=tc.cy;
		}
		this.room[roomid].top = cc;
	},
	sr0 : function(c,data,func){
		data.id[c] = data.max;
		data[data.max].clist.push(c);
		var tc;
		tc=bd.up(c); if( tc!==-1 && data.id[tc]!==data.max && !func(bd.ub(c)) ){ this.sr0(tc,data,func);}
		tc=bd.dn(c); if( tc!==-1 && data.id[tc]!==data.max && !func(bd.db(c)) ){ this.sr0(tc,data,func);}
		tc=bd.lt(c); if( tc!==-1 && data.id[tc]!==data.max && !func(bd.lb(c)) ){ this.sr0(tc,data,func);}
		tc=bd.rt(c); if( tc!==-1 && data.id[tc]!==data.max && !func(bd.rb(c)) ){ this.sr0(tc,data,func);}
	},

	//--------------------------------------------------------------------------------
	// area.initBarea()  黒マス関連の変数を初期化する
	// area.resetBarea() 黒マスの情報をresetして、1から割り当てしなおす
	// area.initWarea()  白マス関連の変数を初期化する
	// area.resetWarea() 白マスの情報をresetして、1から割り当てしなおす
	//--------------------------------------------------------------------------------
	initBarea : function(){
		this.bcell = {max:0,id:[]};
		for(var c=0;c<bd.cellmax;c++){
			this.bcell.id[c] = -1;
		}
	},
	resetBarea : function(){
		this.initBarea();
		if(!this.numberColony){ for(var cc=0;cc<bd.cellmax;cc++){ this.bcell.id[cc]=(bd.isBlack(cc)?0:-1);} }
		else                  { for(var cc=0;cc<bd.cellmax;cc++){ this.bcell.id[cc]=(bd.isNum(cc)  ?0:-1);} }
		for(var cc=0;cc<bd.cellmax;cc++){
			if(this.bcell.id[cc]!=0){ continue;}
			this.bcell.max++;
			this.bcell[this.bcell.max] = {clist:[]};
			this.sc0(cc,this.bcell);
		}
	},

	initWarea : function(){
		this.wcell = {max:1,id:[],1:{clist:[]}};
		for(var c=0;c<bd.cellmax;c++){
			this.wcell.id[c] = 1;
			this.wcell[1].clist[c]=c;
		}
	},
	resetWarea : function(){
		this.initWarea();
		this.wcell.max = 0;
		for(var cc=0;cc<bd.cellmax;cc++){ this.wcell.id[cc]=(bd.isWhite(cc)?0:-1); }
		for(var cc=0;cc<bd.cellmax;cc++){
			if(this.wcell.id[cc]!=0){ continue;}
			this.wcell.max++;
			this.wcell[this.wcell.max] = {clist:[]};
			this.sc0(cc,this.wcell);
		}
	},

	//--------------------------------------------------------------------------------
	// area.setCell()    黒マス・白マスが入力されたり消された時に、黒マス/白マスIDの情報を変更する
	// area.setBWCell()  setCellから呼ばれる関数
	// area.sc0()        初期idを含む一つの領域内のareaidを指定されたものにする
	//--------------------------------------------------------------------------------
	setCell : function(cc,val){
		if(val>0){
			if(this.bblock){ this.setBWCell(cc,1,this.bcell);}
			if(this.wblock){ this.setBWCell(cc,0,this.wcell);}
		}
		else{
			if(this.bblock){ this.setBWCell(cc,0,this.bcell);}
			if(this.wblock){ this.setBWCell(cc,1,this.wcell);}
		}
	},
	setBWCell : function(cc,val,data){
		var cid = [], dataid = data.id, tc;
		tc=bd.up(cc); if(tc!==-1 && dataid[tc]!==-1){ cid.push(tc);}
		tc=bd.dn(cc); if(tc!==-1 && dataid[tc]!==-1){ cid.push(tc);}
		tc=bd.lt(cc); if(tc!==-1 && dataid[tc]!==-1){ cid.push(tc);}
		tc=bd.rt(cc); if(tc!==-1 && dataid[tc]!==-1){ cid.push(tc);}

		// 新たに黒マス(白マス)になった時
		if(val>0){
			// まわりに黒マス(白マス)がない時は新しいIDで登録です
			if(cid.length===0){
				data.max++;
				data[data.max] = {clist:[cc]};
				dataid[cc] = data.max;
			}
			// 1方向にあるときは、そこにくっつけばよい
			else if(cid.length===1){
				data[dataid[cid[0]]].clist.push(cc);
				dataid[cc] = dataid[cid[0]];
			}
			// 2方向以上の時
			else{
				// 周りで一番大きな黒マスは？
				var largeid = dataid[cid[0]];
				for(var i=1;i<cid.length;i++){
					if(data[largeid].clist.length < data[dataid[cid[i]]].clist.length){ largeid=dataid[cid[i]];}
				}
				// つながった黒マス(白マス)は全て同じIDにする
				for(var i=0;i<cid.length;i++){
					if(dataid[cid[i]]===largeid){ continue;}
					var clist = data[dataid[cid[i]]].clist;
					for(var n=0,len=clist.length;n<len;n++){
						dataid[clist[n]] = largeid;
						data[largeid].clist.push(clist[n]);
					}
					clist = [];
				}
				// 自分をくっつける
				dataid[cc] = largeid;
				data[largeid].clist.push(cc);
			}
		}
		// 黒マス(白マス)ではなくなった時
		else{
			// まわりに黒マス(白マス)がない時は情報を消去するだけ
			if(cid.length===0){
				data[dataid[cc]].clist = [];
				dataid[cc] = -1;
			}
			// まわり1方向の時も自分を消去するだけでよい
			else if(cid.length===1){
				var ownid = dataid[cc], clist = data[ownid].clist;
				for(var i=0;i<clist.length;i++){ if(clist[i]===cc){ clist.splice(i,1); break;} }
				dataid[cc] = -1;
			}
			// 2方向以上の時は考慮が必要
			else{
				// 一度自分の領域の黒マス(白マス)情報を無効にする
				var ownid = dataid[cc], clist = data[ownid].clist;
				for(var i=0;i<clist.length;i++){ dataid[clist[i]] = 0;}
				data[ownid].clist = [];

				// 自分を黒マス(白マス)情報から消去
				dataid[cc] = -1;

				// まわりのIDが0なセルに黒マス(白マス)IDをセットしていく
				for(var i=0;i<cid.length;i++){
					if(dataid[cid[i]]!==0){ continue;}
					data.max++;
					data[data.max] = {clist:[]};
					this.sc0(cid[i],data);
				}
			}
		}
	},
	sc0 : function(c,data){
		data.id[c] = data.max;
		data[data.max].clist.push(c);
		var tc;
		tc=bd.up(c); if( tc!==-1 && data.id[tc]===0 ){ this.sc0(tc,data);}
		tc=bd.dn(c); if( tc!==-1 && data.id[tc]===0 ){ this.sc0(tc,data);}
		tc=bd.lt(c); if( tc!==-1 && data.id[tc]===0 ){ this.sc0(tc,data);}
		tc=bd.rt(c); if( tc!==-1 && data.id[tc]===0 ){ this.sc0(tc,data);}
	},

	//--------------------------------------------------------------------------------
	// area.getRoomInfo()  部屋情報をAreaInfo型のオブジェクトで返す
	// area.getBCellInfo() 黒マス情報をAreaInfo型のオブジェクトで返す
	// area.getWCellInfo() 白マス情報をAreaInfo型のオブジェクトで返す
	// area.getNumberInfo() 数字情報(=黒マス情報)をAreaInfo型のオブジェクトで返す
	// area.getAreaInfo()  上記関数の共通処理
	//--------------------------------------------------------------------------------
	getRoomInfo  : function(){ return this.getAreaInfo(this.room);},
	getBCellInfo : function(){ return this.getAreaInfo(this.bcell);},
	getWCellInfo : function(){ return this.getAreaInfo(this.wcell);},
	getNumberInfo : function(){ return this.getAreaInfo(this.bcell);},
	getAreaInfo : function(block){
		var info = new AreaInfo();
		for(var c=0;c<bd.cellmax;c++){ info.id[c]=(block.id[c]>0?0:-1);}
		for(var c=0;c<bd.cellmax;c++){
			if(info.id[c]!=0){ continue;}
			info.max++;
			var clist = block[block.id[c]].clist;
			info.room[info.max] = {idlist:clist}; /* 参照だけなのでconcat()じゃなくてよい */
			for(var i=0,len=clist.length;i<len;i++){ info.id[clist[i]] = info.max;}
		}
		return info;
	}
};
