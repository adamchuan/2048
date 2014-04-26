function Game(game) {
	this.player = {};
	this.player[game.idA] = {
		myid :  game.idA,
		rival : game.idB,
		ready : false,
		score : 0
	};
	this.player[game.idB] = {
		myid :  game.idB,
		rival : game.idA,
		ready : false ,
		score : 0
	}
	this.timer = {};
};

module.exports = Game;
Game.players = new Object();
/* 告诉双方匹配成功 */
Game.prototype.sendMatched = function(){
	for(var id in this.player){
		Game.players[id].emit("matchresult","1");
	}
}
Game.size = 4;
Game.tilesCount = Game.size * Game.size;
Game.timeLine = 180;
/*
   检查死亡
*/
Game.isGameOver = function(tiles){
	  var end = true;
	  for(var i = 0 ; i < Game.tilesCount ; i = i + Game.size){ //横向检测
	       for(var j = i ; j < i + Game.size - 1 ; j ++){
	           if(tiles[j+1].value == tiles[j+1].value ){
	              end = false;
	              break;
	           }
	       }
	       if(!end){
	          break;
	       }
	  }
      if(end){
         for(var i = 0 ; i < Game.size ; i ++){ //纵向检测
           for(var j = i ; j < Game.tilesCount - Game.size ; j = j + Game.size){
               if(tiles[j].value == tiles[j+this.size].value ){
                  end = false;
                  break;
               }
           }
           if(!end){
              break;
           }
         }
      }
      return end;
}
Game.prototype.checkWiner = function(){
	var rivalid ;
	for(var id in this.player){
		rivalid = this.player[id].rival;
		if(this.player[id].score > this.player[rivalid].score){
			this.sendWin(id);
		}else if(this.player[id].score < this.player[rivalid].score){
			this.sendLose(rivalid);
		}else{
			this.sendDraw();
		}
		break;
	}
	this.deleteGame();
}
/* 
	玩家放弃游戏
	向对方玩家发送胜利消息
*/
Game.prototype.giveUp = function(id){
	var game = Game.players[id].game;
	var rival = game.player[id].rival;
	Game.players[id].state = 'wait';
	Game.players[rival].state = 'wait';
	this.sendWin(rival);
	this.sendLose(id);
	this.deleteGame();
}
/* 
  玩家离开房间
*/

Game.prototype.leaveRoom = function(id){
	var game = Game.players[id].game;
	var rival = game.player[id].rival; 

	this.sendWin(rival);
	this.deleteGame();
}
/* 
	发送胜利消息
*/
Game.prototype.sendWin = function(id){

	Game.players[id].emit("win",{

	});
	Game.players[id].state = "wait"; 
}
/* 发送平局消息 */
Game.prototype.sendDraw = function(){
	for(var id in this.player){
		Game.players[id].emit("draw",{

		});
		Game.players[id].state = "wait"; 
	}
}
//发送失败消息
Game.prototype.sendLose = function(id){
	Game.players[id].emit("lose",{

	});
	Game.players[id].state = "wait"; 
	delete Game.players[id].game; 
}
Game.prototype.gameStart = function(){

	var num1 = Math.floor(Math.random() * Game.tilesCount);
	var num2;
	do{
		num2 = Math.floor(Math.random() * Game.tilesCount);
	}while(num2 == num1);

	//初始化数组 
	for(var id in this.player){
		Game.players[id].tiles = [];
		for(var i = 0 ; i < Game.tilesCount ; i++){
			Game.players[id].tiles.push({
				value : 0,
				type : ""
			});
		}
		Game.players[id].tiles[num1].value = 2;
		Game.players[id].tiles[num2].value = 2;
		Game.players[id].emit("gameStart",{
			num1:num1,
			num2:num2
		});
	}
	this.timer.value = 0;
	var that = this;
	this.timer.id = setInterval(function(){
		that.timer.value ++;
		console.log(that.timer.value);
		if(that.timer.value >= Game.timeLine){
			clearInterval(that.timer.id);
			that.checkWiner();
		}
	},1000);
}
Game.prototype.getAvailableTiles = function(id){
	var position = [];
	for(var i = 0 ; i < Game.tilesCount ; i++){
		if(Game.players[id].tiles[i].value == 0)
			position.push(i); 
	}
	return position;
}
Game.prototype.randomInsert = function(id){
	var availableTiles = this.getAvailableTiles(id);
	var newPosition = availableTiles[Math.floor(Math.random() * availableTiles.length)];
	Game.players[id].tiles[newPosition].value = 2;
	Game.players[id].tiles[newPosition].type = "new";
	return newPosition;
}
/* 根据动作来计算 */
Game.prototype.calculate = function(id,action){
	 var tiles = Game.players[id].tiles,
	 	 player = this.player[id],
	 	 tempArray = [],
	 	 x = 0;

	 function addTiles(tempArray){
	 	for(var i = 0 ; i < tempArray.length - 1 ; i++){
	 		if(tempArray[i] == tempArray[i+1]){ //值相同就相加
	 			tempArray[i] = tempArray[i] * 2;
	 			player.score += tempArray[i];
	 			tempArray.splice(i+1,1); 
	 		}
	 	}
	 	return tempArray;
	 }
	 switch(action) {
	 	case 'left':
	 		console.log('left');
	 		
	 		for(var i = 0; i < Game.tilesCount ; i = i + Game.size){
	 			tempArray = [];
	 			for(var j = i ; j < i + Game.size ; j ++){
	 				if( tiles[j].value != 0){
	 					tempArray.push(tiles[j].value);
	 				}
	 			}
	 			tempArray = addTiles(tempArray);
 				for(var j = i; j < i + Game.size ; j ++){
 				 	x = j - i;
                    tiles[j].value = ( x < tempArray.length) ? tempArray[x] : 0;
                    tiles[j].type = "";
                }             
	 		}
	 		break;
	 	case 'up':
	 		console.log('up');
	 	
	 		for(var i = 0; i < Game.size ; i ++){
	 		 	tempArray = [];
	 			for(var j = i ; j < Game.tilesCount ; j = j + Game.size){
	 				if( tiles[j].value != 0){
	 					tempArray.push(tiles[j].value);
	 				}
	 			}
	 			tempArray = addTiles(tempArray);
 				for(var j = i; j <  Game.tilesCount ; j = j + Game.size){
 				 	x = (j - i) / Game.size;
                    tiles[j].value = ( x < tempArray.length) ? tempArray[x] : 0;
                    tiles[j].type = "";
                }             
	 		}
	 		break;
	 	case 'right':
	 		console.log('right'); 	
	 		for(var i = Game.size - 1; i < Game.tilesCount ; i = i + Game.size){
	 			tempArray = [];
	 			for(var j = i ; j > i - Game.size ; j --){
	 				if( tiles[j].value != 0){
	 					tempArray.push(tiles[j].value);
	 				}
	 			}
	 			tempArray = addTiles(tempArray);
 			    for(var j = i ; j > i - Game.size ; j --){
 				 	x = i - j;
                    tiles[j].value = ( x < tempArray.length) ? tempArray[x] : 0;
                    tiles[j].type = "";
                }             
	 		}
	 		break;
	 	case 'down':
	 		console.log('down');	 	
	 		for(var i = Game.tilesCount - Game.size ; i < Game.tilesCount  ; i ++){     
	 			tempArray = [];
                for(var j = i ; j >= 0 ; j = j - Game.size){
                	if( tiles[j].value != 0){
                		tempArray.push(tiles[j].value);
                	}
                }
               	tempArray = addTiles(tempArray);
               	for(var j = i ; j >= 0 ; j = j - Game.size){
               		x = (i - j) / Game.size;
               		tiles[j].value = ( x < tempArray.length) ? tempArray[x] : 0;
               		tiles[j].type = "";
               	}
            }
	 		break;
	 }
	 console.log(tiles);
	 console.log(Game.players[id].tiles);
}
Game.prototype.sendTiles = function(id){
	 var player = Game.players[id];
	 console.log("发送tiles");
	 var data = {
	 	score:this.player[id].score,
	 	tiles:player.tiles
	 };
	 player.emit("updateMyTiles",JSON.stringify(data));
	 var rival = Game.players[this.player[id].rival];
	 rival.emit("updateOtherTiles",JSON.stringify(data));
}
Game.prototype.setReady = function(id){
	this.player[id].ready = true;
}
Game.prototype.isReady = function(){
	var ready = true;
	for(var id in this.player){
		ready = ready && this.player[id].ready;
	}
	return ready;
}
/*
   发送没有匹配到信息 
   id 接受者的socketid
*/
Game.sendWait = function(id){
	Game.players[id].emit("matchresult","0");
}
/* 创建一个新游戏 */
Game.createGame = function(idA,idB){
	var game = new Game({
    				idA: idA,
    				idB: idB
    			});//实例化一个game类

    /* 将双方的game 指向同一个game实例 */
    Game.players[idA].game = game;
   	Game.players[idB].game = game;

   	Game.players[idB].state = "playing";
   	Game.players[idA].state = "playing";
   	return game;
}
Game.prototype.deleteGame = function(){
	clearInterval(this.timer.id);
	for(var id in this.player){
		delete Game.players[id].game;
	}
}
/* 随机得到一个正在匹配的对手 socket.id*/
Game.findPlayers = function(myid){
	var playerTemper = [];
	//先将正在等待的用户添加进数组
	for(var playerid in Game.players){
		if(Game.players[playerid].state == "match"  ){
			playerTemper.push(Game.players[playerid].id);
		}
	}
	Game.players[myid].state = "match";//设置用户状态为寻找
	//如果没有找到用户则返回
	if(playerTemper.length == 0){
		return null;
	}else{
		var id = playerTemper[Math.floor(Math.random() * playerTemper.length)];
		return id;
	}
}
