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
		this.players = [];
        this.humanPlayersJoined = 0;
		this.over = false;
        if(this.numberOfPlayers == 2){
            this.levelData = this.createLevelData(9);
        }
        else {
            this.levelData = this.createLevelData(13);
        }
		
		for(let i = 0; i < numberOfPlayers-numberOfHumans; i++){
			this.addNewPlayer('AI'+i, false);
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

    addNewPlayer(id, human) {
        if(human) {
			this.humanPlayers[this.humanPlayersJoined] = id;
			this.players.push({id: id, out: false});
			switch(this.humanPlayersJoined){
				case 0:
					if(this.numberOfPlayers == 2){
						this.levelData[4][2].player = id;
					}
					else {
						this.levelData[6][2].player = id;
					}
				break;
				case 1:
					if(this.numberOfPlayers == 2){
						this.levelData[4][6].player = id;
					}
					else {
						this.levelData[6][10].player = id;
					}
				break;
				case 2:
					this.levelData[2][6].player = id;
				break;
				case 3:
					this.levelData[10][6].player = id;
				break;
			}
			this.humanPlayersJoined++;
		}
		else {
			//ais = numberOfAIs - AIsJoined
			let ais = (this.numberOfPlayers - this.numberOfHumans) - (this.players.length - this.humanPlayersJoined);
			this.players.push({id: id, out: false});
			switch(ais){
				case 0: break;
				case 1:
					if(this.numberOfPlayers == 2){
						this.levelData[4][6].player = id;
					}
					else {
						this.levelData[10][6].player = id;
					}
				break;
				case 2:
					if(this.numberOfPlayers == 2){
						this.levelData[4][2].player = id;
					}
					else {
						this.levelData[2][6].player = id;
					}
				break;
				case 3:
					this.levelData[6][10].player = id;
				break;
				case 4:
					this.levelData[6][2].player = id;
				break;
			}
		}
    }
}

let gameRooms = [];
let maxRooms = 10;

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
					//check if room is full and ready to start the game
					let currentPlayer;
					if(roomToJoin.humanPlayersJoined === roomToJoin.numberOfHumans) {
						currentPlayer = roomToJoin.players[0];
					}
					
					io.in('game-room' + data.roomID).emit('new_player', {data: roomToJoin, currentPlayer: currentPlayer});
                    console.log("* " + socket.username + " joined a game.");
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

    socket.on('move_player', function (data) {
        //find current room
		let currentRoom = findCurrentRoom(gameRooms, socket.gameRoom);
		if(currentRoom && !currentRoom.over){
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
		}
    });
	
	socket.on('remove_field', function (data) {
        console.log("remove_field");
        let currentRoom = findCurrentRoom(gameRooms, socket.gameRoom);
        /*for(var i = 0; i < gameRooms.length; i ++) {
            if(gameRooms[i].ID === data.roomID){
                currentRoom = gameRooms[i];
                i = gameRooms.length;
            }
        }*/
        if(currentRoom && !currentRoom.over) {
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
        }
		//levelData[data.x][data.y].type = 1;
		//let dataToSend = preparePlayersDataToSend();
		//io.in('game-room').emit('remove_success', dataToSend);
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
				for(let i = 0; i < currentRoom.humanPlayers.length; i++){
					if(currentRoom.humanPlayers[i] === socket.id) {
						currentRoom.humanPlayers[i] = 0;
					}
				}
				for(let i = 0; i < currentRoom.players.length; i++){
					if(currentRoom.players[i] === socket.id) {
						currentRoom.players.splice(i,1);
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
			}
            // This player was in a game and has disconnected, but the other players still in the game don't know that.
            // We need to tell the other players to remove the sprite for this player from their clients.
            // All of the players still in the game are in the room called 'game-room', so emit an event called 'remove_player'
            // to that room, sending with it the key of the property to remove.
            io.in('game-room'+socket.gameRoom).emit('remove_player', socket.id);
        }
    });
});

/*
// How often to send game updates. Faster paced games will require a lower value for emitRate,
// so that updates are sent more often. Do some research and test what works for your game.
var emitRate = 100;
// This is what I call an 'emitter'. It is used to continuously send updates of the game world to all relevant clients.
setInterval(function () {
    // Prepare the positions of the players, ready to send to all players.
    var dataToSend = preparePlayersDataToSend();

    // Send the data to all clients in the room called 'game-room'.
    io.in('game-room').emit('state_update', dataToSend);
}, emitRate);
*/
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

function moveBest(currentRoom, id) {
	let pos = findPlayerPos(currentRoom, id);
	let water = 8;
	let target = {};
	for(let i = pos.i-1; i <= pos.i+1; i++){
		for(let j = pos.j-1; j <= pos.j+1; j++){
			if(!currentRoom.levelData[i][j].player){
				if(countWater(i, j, currentRoom) < water){
					water = countWater(i, j, currentRoom);
					target.i = i;
					target.j = j;
				}
			}
		}
	}
	return target;
}

function removeBest(currentRoom, id) {
	let target;
	let water = 8;
	currentRoom.players.forEach(player => {
		if(player.id != id){
			if(countWater(currentRoom, player.id) < water){
				water = countWater(currentRoom, player.id);
				target = moveBest(currentRoom, player.id);
			}
		}
	});
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
	for(let i = y-1; i <= y+1; i++){
		for(let j = x-1; j <= x+1; j++){
			if(currentRoom.levelData[i][j].type === 1) water++;
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