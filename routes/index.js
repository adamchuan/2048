
/*
 * GET home page.
 */
var socketio = require('socket.io'),
    Game = require('../models/game.js');

exports.websocket = function(server){

	var io = socketio.listen(server);
    var gameChannel= io.of('/game').on('connection',function(socket){
        Game.players[socket.id] = socket;
    	socket.state =  "wait"; //默认状态等待
        socket.game = null;
        /* 匹配监听 */
    	socket.on('match',function(data){
            console.log(socket.id);
    		var rivalid = Game.findPlayers(socket.id);
    		console.log("rivalid" + rivalid);
    		if(rivalid == null){
    			Game.sendWait(socket.id); //发送没匹配到的消息 持续等待
    		}else{
    			var game = Game.createGame(socket.id,rivalid);
    			game.sendMatched(); //发送匹配到的消息
    		}
    	});
        /* */
        socket.on('cancelMatch',function(data){
            Game.players[socket.id].state = "watiting";
        });
        /* 游戏准备完成 */
    	socket.on('playready',function(data){
    		var game = Game.players[socket.id].game;
    		game.setReady(socket.id);
    		if(game.isReady()){
    			game.gameStart();
    		}else{
    			console.log('not ready');
    		}
    	});
        /* 移动监听 */
    	socket.on("action",function(data){
    		console.log("收到action" + data);
    		var action = data;
    		var game = Game.players[socket.id].game;
    		game.calculate(socket.id,action);
    		game.randomInsert(socket.id);
    		game.sendTiles(socket.id);
    	});

        /* 放弃游戏入口 */
        socket.on('giveup',function(data){
            console.log("收到放弃游戏");
            var game = Game.players[socket.id].game;
            game.giveUp(socket.id);
        });

        /* 断开连接入口 */
    	socket.on('disconnect',function(){
            console.log("收到玩家强制离开游戏");
            var game = Game.players[socket.id].game;          
            if(game != null)
                game.leaveRoom(socket.id);

            delete Game.players[socket.id];
		});
    });
}
exports.router = function(app) {


  app.get('/test',function(req,res){
  	res.render('test');
  });


  app.get('/', function (req, res) {
    res.render('index');
  });

};