try{
// Gathering dependencies. The require(...) bit imports the stuff that was installed through npm.
var express = require('express');
// Create an Express app. Socket.io just sits on top of Express, but Express itself isn't
// used much, unless you want to serve files with it, but that is not recommended.
var app = express();
// Make a new HTTP server from Express. This doesn't get used itself either, unless you want to do stuff with it.
var server = require('http').Server(app);
// This is where Socket.io is set up. Socket takes in the HTTP server created above, and basically adds it's own
// layer on top of it that is nice and easy to use. 'io' is the Socket.io server object. You could call it
// 'socketIOServer' or something similar if you wish, but all of the documentation for Socket.io uses just 'io'.
io = require('socket.io').listen(server);

// What port and IP address to bind the server to. 
server.listen(8081, process.env.INADDR_ANY, function () {
  console.log(`Listening on ${server.address().port}`);
});

// Used to manage players in the game. See the slightly more advanced stuff
var players = {};

let levelData=
[[{type: 1},{type: 1},{type: 1},{type: 1},{type: 1},{type: 1}],
[{type: 1},{type: 0},{type: 0},{type: 0},{type: 0},{type: 1}],
[{type: 1},{type: 0},{type: 0},{type: 0},{type: 0},{type: 1}],
[{type: 1},{type: 0},{type: 0},{type: 0},{type: 0},{type: 1}],
[{type: 1},{type: 0},{type: 0},{type: 0},{type: 0},{type: 1}],
[{type: 1},{type: 1},{type: 1},{type: 1},{type: 1},{type: 1}]];

app.use(express.static(__dirname + '/public'));
app.use(function(req, res, next) {
  res.setHeader("Content-Type", "application/json");
  next();
});

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

class GameroomDefinition{
    constructor(numberOfPlayers, numberOfHumans){
        this.numberOfPlayers = numberOfPlayers;
        this.numberOfHumans = numberOfHumans;
        this.humanPlayers = [this.numberOfHumans];
		this.lastAction = Date.now();
		this.players = numberOfPlayers===2 
			? [{id: null, out: false, color: 0xff0000, char: '', dir: 7, startx: 4, starty: 2},
			{id: null, out: false, color: 0xffff00, char: '', dir: 3, startx: 4, starty: 6}]
			: [{id: null, out: false, color: 0xff0000, char: '', dir: 7, startx: 6, starty: 2},
			  {id: null, out: false, color: 0xffff00, char: '', dir: 3, startx: 6, starty: 10},
			  {id: null, out: false, color: 0xff00ff, char: '', dir: 1, startx: 2, starty: 6},
			  {id: null, out: false, color: 0x00ffff, char: '', dir: 5, startx: 10, starty: 6}];
        this.humanPlayersJoined = 0;
		this.over = false;
		this.started = false;
        if(this.numberOfPlayers == 2){
            this.levelData = this.createLevelData(9);
        }
        else {
            this.levelData = this.createLevelData(13);
        }
    }

    createLevelData(size){
        let a = [];

        for(var i = 0; i < size; i++){
            a[i] = [];
            for(var j = 0; j < size; j++){
                if((i==0) || (i == size -1) || (j==0) || (j == size -1)){
                    a[i][j] = {type: 1, player: 0};
                }
                else {
                    a[i][j] = {type: 0, player: 0};
                }
            }
        }
        return a;
    }

    addNewPlayer(id, human, pos) {
		let chars = ['cow', 'elephant', 'pig', 'caterpillar'];
		let zuf = Math.floor(Math.random() * 4);
        if(human) {
			this.humanPlayers[this.humanPlayersJoined] = id;
			let set = false;
			this.players.forEach(player => {
				if(player.id === null && !set){
					player.id = id;
					this.levelData[player.startx][player.starty].player = id;
					player.char = chars[zuf];
					set = true;
				}
			});
			this.humanPlayersJoined++;
		}
		else {
			this.players[pos].id = id;
			this.levelData[this.players[pos].startx][this.players[pos].starty].player = id;
			this.players[pos].char = chars[zuf];
		}
    }
}

let gameRooms = [];
let maxRooms = 12;

io.on('connection', function (socket) {
  console.log("* * * A new connection has been made.");
    // Each socket object (one for each connected client) has an 'id' property,
    // which can be used to uniquely identify each socket connection.
    // Check the command line that was used to start the server to see
    // the id of each socket that connects being printed.
    console.log("* ID of new socket object: " + socket.id);

    // send available gamerooms to client
    socket.emit('available_gamerooms', { data: gameRooms });

    socket.emit('hello_client', {crazyString: 'abc123', coolArray: [40, 'beep', true]});
    // Or with no data, just an event.
    socket.emit('how_are_you');
    // An event that the client isn't listening for, so will be ignored when the client receives it.
    socket.emit('anyone_there');

    // You can add your own properties onto the socket object like any other object.
    // Useful if you want to store player data like a score, username, or a flag of
    // whether they are currently in a game.
    socket.username = 'DEFAULT NAME';
    socket.score = 0;
    socket.isInGame = false;
	socket.gameRoom = '';

    // Event listeners can be added to this socket. Every time the client sends
    // an event to this server, the server will look to see if the name of that event
    // matches any events that this socket is listening for.

    // In this case, an event listener is being added that will listen for an event
    // called 'change_username', and giving it a callback function to run whenever the
    // event is received. When the client sends this event, they can also pass along data.
    // The data that is sent is automatically passed in to the callback as the first argument.
    socket.on('change_username', function(data) {
        // Update the player's username with the data that they sent from their client.
        // The name of the property that you access on the data object must match how it
        // looks when the client sent it.
        socket.username = data.username;
        console.log("* Username changed to: " + data.username);
    });

    socket.on('get_available_gamerooms', function() {
        console.log("get_available_gamerooms");
        socket.emit('available_gamerooms', { data: gameRooms });
    });

    socket.on('create_new_gameroom', function(data) {
		if(gameRooms.length < maxRooms){
			let grd = new GameroomDefinition(data.numberOfPlayers, data.numberOfHumans);
			grd.ID = gameRooms.length +1;
			if(data.aipos && data.aipos.length > 0){
				for(let i = 0; i < data.aipos.length; i++){
					grd.addNewPlayer('ai'+i, false, data.aipos[i]);
				}
			}
			gameRooms.push(grd);
			io.emit('available_gamerooms', { data: gameRooms });
			console.log("* new gameroom: " + grd.ID + " created");
			console.log("* players : humans - " + data.numberOfPlayers + " : " + data.numberOfHumans);
		}
    });

    socket.on('im_fine', function (/* No data was sent by the client for this event. You could put 'data' here but it would just be undefined. */) {
        socket.emit('good_to_hear');
    });

    socket.on('join_game', function (data) {
        // Check that the player is not already in a game before letting them join one.
        console.log("join_game: " + data.roomID);
        console.log("socket.isInGame: " + socket.isInGame);
        if(socket.isInGame === false){
            let roomToJoin = findCurrentRoom(gameRooms, data.roomID);
            /*for(var i = 0; i < gameRooms.length; i ++) {
                if(gameRooms[i].ID === data.roomID){
                    roomToJoin = gameRooms[i];
                    i = gameRooms.length;
                }
            }*/
            if(roomToJoin) {
                console.log("roomToJoin");
                if(roomToJoin.humanPlayersJoined < roomToJoin.numberOfHumans){
                    console.log("there is a free place in the room");
                    // there is a free place in the room
                    roomToJoin.addNewPlayer(socket.id, true);
                    roomToJoin.lastAction = Date.now();
                    // This player is now in a game.
                    socket.isInGame = true;
                    // Add a basic object that tracks player position to the list of players, using
                    // the ID of this socket as the key for convenience, as each socket ID is unique.
                    /*players[socket.id] = {
                        x: Math.round(1 + Math.random()*3),
                        y: Math.round(1 + Math.random()*3)
                    };
                    levelData[players[socket.id].x][players[socket.id].y].player = socket.id;*/
                    // Add this socket to the room for the game. A room is an easy way to group sockets, so you can send events to a bunch of sockets easily.
                    // A socket can be in many rooms.
                    socket.join('game-room' + data.roomID);
					socket.gameRoom = data.roomID;
                    //let dataToSend = preparePlayersDataToSend();
                    // Tell the client that they successfully joined the game.
                    socket.emit('join_game_success', {data: roomToJoin});
					io.emit('available_gamerooms', { data: gameRooms });
					//check if room is full and ready to start the game
					let currentPlayer = 0;
					if(roomToJoin.humanPlayersJoined === roomToJoin.numberOfHumans) {
						currentPlayer = roomToJoin.players[0];
						roomToJoin.started = true;
					}
					
					io.in('game-room' + data.roomID).emit('new_player', {data: roomToJoin, currentPlayer: currentPlayer});
                    console.log("* " + socket.username + " joined a game.");
					/*if(currentPlayer != 0 && currentPlayer.id.startsWith("ai")){
						setTimeout(() => {
							movePlayer(true, null, currentPlayer.id, socket.gameRoom);
						},1000);
					}*/
                    // check if room is complete

                    // if so -> start the game
                }
                else {
                    console.log("no free place in the room");
                }
            }
        }
        else {
            console.log("* " + socket.username + " is already in a game.");
        }
    });
	
	socket.on('ready', function () {
		let currentRoom = findCurrentRoom(gameRooms, socket.gameRoom);
		if(currentRoom){
			console.log("ready");
			if(currentRoom.players[0].id===socket.id){
				console.log("start");
				io.in('game-room' + socket.gameRoom).emit('new_player', {data: currentRoom, currentPlayer: currentRoom.players[0], start: true});
			}
			else if(currentRoom.players[0].id.startsWith("ai")){
				setTimeout(() => {
					movePlayer(true, null, currentRoom.players[0].id, socket.gameRoom);
				},1000);
			}
		}
	});

    socket.on('move_player', function (data) {
		movePlayer(false, data, socket.id, socket.gameRoom);
        //find current room
		/*let currentRoom = findCurrentRoom(gameRooms, socket.gameRoom);
		if(currentRoom && !currentRoom.over){
			currentRoom.lastAction = Date.now();
			//check whether field to go to is ok
			for(let i = data.y-1; i <= data.y+1; i++){
				for(let j = data.x-1; j <= data.x+1; j++){
					if(currentRoom.levelData[i][j].player === socket.id && !(i === data.y && j === data.x)) {
						//move player
						currentRoom.levelData[data.y][data.x].player = socket.id;
						currentRoom.levelData[i][j].player = 0;
						//tell everyone in room about movement and next move
						io.in('game-room'+currentRoom.ID).emit('player_moved', {data: currentRoom});
					}
				}
			}
		}*/
    });
	
	socket.on('remove_field', function (data) {
        console.log("remove_field");
		removeField(false, data, socket.id, socket.gameRoom);
        /*let currentRoom = findCurrentRoom(gameRooms, socket.gameRoom);
        if(currentRoom && !currentRoom.over) {
			currentRoom.lastAction = Date.now();
            console.log("currentRoom found");
            currentRoom.levelData[data.x][data.y].type = 1;
			let currentPlayer = findPlayer(currentRoom, socket.id)+1 < currentRoom.players.length
				? currentRoom.players[findPlayer(currentRoom, socket.id)+1]
				: currentRoom.players[0];
			while(isOut(currentRoom, currentPlayer)){
				currentRoom.players[findPlayer(currentRoom, currentPlayer.id)].out = true;
				if(playersOut(currentRoom) === currentRoom.numberOfPlayers-2){
					if(isOut(currentRoom, socket.id)){
						currentRoom.players[findPlayer(currentRoom, socket.id)].out = true;
						io.in('game-room'+currentRoom.ID).emit('game_over', {loser: currentRoom.players[findPlayer(currentRoom, socket.id)]});
						currentRoom.over = true;
						console.log('Game over');
						gameRooms.splice(gameRooms.indexOf(currentRoom),1);
						io.emit('available_gamerooms', { data: gameRooms });
					}
				}
				//check wether next player can still move
				if(playersOut(currentRoom) === currentRoom.numberOfPlayers-1){
					io.in('game-room'+currentRoom.ID).emit('game_over', {loser: currentRoom.players[findPlayer(currentRoom, currentPlayer.id)]});
					currentRoom.over = true;
					console.log('Game over');
					break;
				}
				else {
					//Tell next player he's out
					console.log('Player out');
					io.in('game-room'+currentRoom.ID).emit('player_out', {player: currentPlayer});
					//set next player to player after that
					currentPlayer = findPlayer(currentRoom, currentPlayer.id)+1 < currentRoom.players.length
						? currentRoom.players[findPlayer(currentRoom, currentPlayer.id)+1]
						: currentRoom.players[0];
					//shorten the array
					if(currentPlayer === socket.id) break;
				}
			}
			io.in('game-room'+currentRoom.ID).emit('remove_success', {data: currentRoom, currentPlayer: currentPlayer});
        }
        else {
            console.log("currentRoom not found");
        }*/
		//levelData[data.x][data.y].type = 1;
		//let dataToSend = preparePlayersDataToSend();
		//io.in('game-room').emit('remove_success', dataToSend);
	});
	
	socket.on('leaving_room', function (data) {
		if(data && data.exiting){
			let currentRoom = findCurrentRoom(gameRooms, socket.gameRoom);
			if(currentRoom){
				if(currentRoom.started){
					io.in('game-room'+socket.gameRoom).emit('destroy_room', {player: socket.id});
					gameRooms.splice(gameRooms.indexOf(socket.gameRoom),1);
					io.emit('available_gamerooms', { data: gameRooms });
				}
				else {
					for(let i = 0; i < currentRoom.humanPlayers.length; i++){
						if(currentRoom.humanPlayers[i] === socket.id) {
							currentRoom.humanPlayers[i] = 0;
						}
					}
					for(let i = 0; i < currentRoom.players.length; i++){
						if(currentRoom.players[i].id === socket.id) {
							currentRoom.players[i].id = null;
						}
					}
					for(var i = 0; i < currentRoom.levelData.length; i++){
						for(var j = 0; j < currentRoom.levelData.length; j++){
							if(currentRoom.levelData[i][j].player === socket.id){
								currentRoom.levelData[i][j].player = 0;
							}
						}
					}
					currentRoom.humanPlayersJoined--;
					io.in('game-room'+socket.gameRoom).emit('remove_player', {data: currentRoom, player: socket.id});
				}
			}
		}
		socket.leave('game-room'+socket.gameRoom);
		socket.isInGame = false;
		socket.gameRoom = null;
	});

	socket.on('reconnecting', function (data) {
		gameRooms.forEach(room => {
			room.humanPlayers.forEach(player => {
				if(player === data.old_id){
					room.lastAction = Date.now();
					player = socket.id;
					room.players[findPlayer(room, data.old_id)].id = socket.id;
					pos = findPlayerPos(room, data.old_id);
					room.levelData[pos.i][pos.j].player = socket.id;
					socket.isInGame = true;
					socket.gameRoom = room.ID;
					socket.join('game-room'+socket.gameRoom);
					socket.emit('join_game_success', {data: room});
					io.in('game-room'+socket.gameRoom).emit('reconnected', {data: room, player: socket.id});
					return;
				}
			});
		});
	});
    // When a client socket disconnects (closes the page, refreshes, timeout etc.),
    // then this event will automatically be triggered.
    socket.on('disconnecting', function () {
        // Check if this player was in a game before they disconnected.
        if(socket.isInGame === true){
            // Remove this player from the player list.
			/*levelData[players[socket.id].x][players[socket.id].y].player = undefined;
            delete players[socket.id];*/
			let currentRoom = findCurrentRoom(gameRooms, socket.gameRoom);
			if(currentRoom){
				if(currentRoom.started){
					io.in('game-room'+socket.gameRoom).emit('destroy_room', {player: socket.id});
					gameRooms.splice(gameRooms.indexOf(socket.gameRoom),1);
					io.emit('available_gamerooms', { data: gameRooms });
				}
				else {
					for(let i = 0; i < currentRoom.humanPlayers.length; i++){
						if(currentRoom.humanPlayers[i] === socket.id) {
							currentRoom.humanPlayers[i] = 0;
						}
					}
					for(let i = 0; i < currentRoom.players.length; i++){
						if(currentRoom.players[i].id === socket.id) {
							currentRoom.players[i].id = null;
						}
					}
					for(var i = 0; i < currentRoom.levelData.length; i++){
						for(var j = 0; j < currentRoom.levelData.length; j++){
							if(currentRoom.levelData[i][j].player === socket.id){
								currentRoom.levelData[i][j].player = 0;
							}
						}
					}
					currentRoom.humanPlayersJoined--;
					io.in('game-room'+socket.gameRoom).emit('remove_player', {data: currentRoom, player: socket.id});
				}
			}
        }
    });
});


// How often to send game updates. Faster paced games will require a lower value for emitRate,
// so that updates are sent more often. Do some research and test what works for your game.
var emitRate = 60000;
// This is what I call an 'emitter'. It is used to continuously send updates of the game world to all relevant clients.
setInterval(function () {
    gameRooms.forEach(room => {
		if(Date.now()-room.lastAction >= 300000){
			io.in('game-room'+room.ID).emit('destroy_room', {timeUp: true});
			gameRooms.splice(gameRooms.indexOf(room),1);
			io.emit('available_gamerooms', { data: gameRooms });
		}
	});
}, emitRate);

function preparePlayersDataToSend() {
    // Prepare the positions of the players, ready to send to all players.
    var dataToSend = [];
    // 'players' is an object, so get a list of the keys.
    var keys = Object.keys(players);
    // Loop though the list of players and get the position of each player.
    keys.forEach(function (key) {
        // Add the position (and ID, so the client knows who is where) to the data to send.
        dataToSend.push({id: key, x: players[key].x, y: players[key].y});
    });
    // Add leveldata
    dataToSend.push({level: levelData});
    return dataToSend;
}

function findCurrentRoom(gameRooms, roomId) {
	for(var i = 0; i < gameRooms.length; i ++) {
		if(gameRooms[i].ID === roomId){
			return gameRooms[i];
		}
	}
}

function isOut(currentRoom, currentPlayer){
	let water = 0;
	for(let i = 1; i < currentRoom.levelData.length-1; i++){
		for(let j = 1; j < currentRoom.levelData.length-1; j++){
			if(currentRoom.levelData[i][j].player === currentPlayer.id) {
				water = countWater(i, j, currentRoom);
				break;
			}
		}
	}
	if(water === 8) return true;
	else return false;
}

function movePlayer(isAI, data, id, room) {
	//find current room
	if(isAI) console.log("AI moving");
	let currentRoom = findCurrentRoom(gameRooms, room);
	//console.log(currentRoom);
	if(isAI) {
		data = moveBest(currentRoom, id);
		console.log('Field found: ' + data.x + " " + data.y + ", Type " + currentRoom.levelData[data.x][data.y].type);
	}
	if(currentRoom && !currentRoom.over){
		currentRoom.lastAction = Date.now();
		//check whether field to go to is ok
		for(let i = data.x-1; i <= data.x+1; i++){
			for(let j = data.y-1; j <= data.y+1; j++){
				if(currentRoom.levelData[i][j].player === id && !(i === data.x && j === data.y)) {
					//move player
					currentRoom.levelData[data.x][data.y].player = id;
					currentRoom.levelData[i][j].player = 0;
					//set direction for sprite
					currentRoom.players[findPlayer(currentRoom, id)].dir = newDirection(data.x, data.y, i, j);
					//tell everyone in room about movement and next move
					io.in('game-room'+currentRoom.ID).emit('player_moved', {data: currentRoom});
					if(isAI) removeField(isAI, data, id, room);
					return;
				}
			}
		}
	}
}

function newDirection(x, y, oldx, oldy) {
	if(x < oldx){
		if(y < oldy){
			return 4;
		}
		else if(y > oldy){
			return 6;
		}
		else {
			return 5;
		}
	}
	else if(x > oldx){
		if(y < oldy){
			return 2;
		}
		else if(y > oldy){
			return 0;
		}
		else {
			return 1;
		}
	}
	else {
		if(y < oldy){
			return 3;
		}
		else if(y > oldy){
			return 7;
		}
	}
}

function removeField(isAI, data, id, room) {
	if(isAI) console.log("AI removing");
	let currentRoom = findCurrentRoom(gameRooms, room);
	if(currentRoom && !currentRoom.over) {
		if(isAI){
			data = removeBest(currentRoom, id);
			console.log(data.x + ":" + data.y);
		}
		currentRoom.lastAction = Date.now();
		console.log("currentRoom found");
		currentRoom.levelData[data.x][data.y].type = 1;
		//set next player as current player
		let currentPlayer = findPlayer(currentRoom, id)+1 < currentRoom.players.length
			? currentRoom.players[findPlayer(currentRoom, id)+1]
			: currentRoom.players[0];
		while(isOut(currentRoom, currentPlayer)){
			currentRoom.players[findPlayer(currentRoom, currentPlayer.id)].out = true;
			if(playersOut(currentRoom) === currentRoom.numberOfPlayers-2){
				if(isOut(currentRoom, id)){
					currentRoom.players[findPlayer(currentRoom, id)].out = true;
					io.in('game-room'+currentRoom.ID).emit('game_over', {loser: currentRoom.players[findPlayer(currentRoom, id)]});
					currentRoom.over = true;
					console.log('Game over');
					gameRooms.splice(gameRooms.indexOf(currentRoom),1);
					io.emit('available_gamerooms', { data: gameRooms });
				}
			}
			//check wether next player can still move
			if(playersOut(currentRoom) === currentRoom.numberOfPlayers-1){
				io.in('game-room'+currentRoom.ID).emit('game_over', {loser: currentRoom.players[findPlayer(currentRoom, currentPlayer.id)]});
				currentRoom.over = true;
				console.log('Game over');
				break;
			}
			else {
				//Tell next player he's out
				console.log('Player out');
				io.in('game-room'+currentRoom.ID).emit('player_out', {player: currentPlayer});
				//set next player to player after that
				currentPlayer = findPlayer(currentRoom, currentPlayer.id)+1 < currentRoom.players.length
					? currentRoom.players[findPlayer(currentRoom, currentPlayer.id)+1]
					: currentRoom.players[0];
				//shorten the array
				if(currentPlayer === id) break;
			}
		}
		io.in('game-room'+currentRoom.ID).emit('remove_success', {data: currentRoom, currentPlayer: currentPlayer});
		if(currentPlayer.id.startsWith('ai') && !currentRoom.over){
			setTimeout(() => {
				movePlayer(true, null, currentPlayer.id, room);
			},1000);
		}
	}
	else {
		console.log("currentRoom not found");
	}
}

function moveBest(currentRoom, id) {
	console.log("Searching field");
	let pos = findPlayerPos(currentRoom, id);
	console.log("Pos: " +pos.i+ ":" +pos.j);
	let water = 8;
	let target = {};
	let best = [];
	for(let i = pos.i-1; i <= pos.i+1; i++){
		for(let j = pos.j-1; j <= pos.j+1; j++){
			console.log(i + ":" + j + " " + currentRoom.levelData[i][j].type);
			if(!currentRoom.levelData[i][j].player && currentRoom.levelData[i][j].type != 1){
				let tmp = countWater(i, j, currentRoom);
				console.log("Counting, " + tmp);
				if(tmp < water){
					water = tmp;
					target.x = i;
					target.y = j;
					best = [target];
				}
				else if(tmp === water){
					target.x = i;
					target.y = j;
					best.push(target);
				}
			}
		}
		console.log(" ");
	}
	let rand = Math.floor(Math.random() * (best.length));
	target = best[rand];
	console.log(rand);
	return target;
}

function removeBest(currentRoom, id) {
	let target;
	let water = 8;
	let bestpl = [];
	currentRoom.players.forEach(player => {
		if(player.id != id && !player.out){
			console.log(player.id);
			let pos = findPlayerPos(currentRoom, player.id);
			let tmp = countWater(pos.i, pos.j, currentRoom);
			console.log(tmp);
			if(tmp < water){
				water = tmp;
				bestpl = [player];
			}
			else if(tmp === water && water != 8){
				bestpl.push(player);
			}
		}
	});
	let rand = Math.floor(Math.random() * (bestpl.length));
	target = moveBest(currentRoom, bestpl[rand].id);
	/*let best = [];
	currentRoom.players.forEach(player => {
		if(player.id != id && !player.out){
			console.log(player.id);
			let tmp = countWater(currentRoom, player.id);
			if(tmp < water){
				water = countWater(currentRoom, player.id);
				target = moveBest(currentRoom, player.id);
				best = [target];
			}
			else if(tmp === water){
				target = moveBest(currentRoom, player.id);
				best.push(target);
			}
		}
	});
	rand = Math.floor(Math.random() * (best.length));
	target = best[rand];
	console.log(rand);*/
	return target;
}

function findPlayerPos(currentRoom, id){
	for(let i = 0; i < currentRoom.levelData.length; i++){
		for(let j = 0; j < currentRoom.levelData.length; j++){
			if(currentRoom.levelData[i][j].player === id) return {i: i, j: j};
		}
	}
}

function countWater(x, y, currentRoom){
	let water = 0;
	for(let i = x-1; i <= x+1; i++){
		for(let j = y-1; j <= y+1; j++){
			if(currentRoom.levelData[i][j].type === 1 || (i!=x && j!=y && currentRoom.levelData[i][j].player)) water++;
		}
	}
	return water;
}

function findPlayer(currentRoom, socketId) {
	for(let i = 0; i < currentRoom.players.length; i++){
		if(currentRoom.players[i].id === socketId) return i;
	}
}

function playersOut(currentRoom){
	let tmp = 0;
	for(let i = 0; i < currentRoom.players.length; i++){
		if(currentRoom.players[i].out) tmp++;
	}
	console.log(tmp);
	return tmp;
}
}
catch(error) {
	console.log("Error: "+error);
}