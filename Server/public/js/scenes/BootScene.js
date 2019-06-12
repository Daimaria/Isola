'use strict'


export default class BootScene extends Phaser.Scene {
	create() {
		let that = this;
		try{
			var port = window.location.port,
			host = window.location.hostname,
			protocol = window.location.protocol,
			path = '/',
			url, 
			options = { };

			if( protocol.indexOf( 'https' ) > -1 ) {
					protocol = 'wss:';
			} else {
					protocol = 'ws:'
			}

			url = protocol + "//" + host + ":" + port + path;

			// Connect to the Socket.io server that is running on url
			console.log("connecting to server: " + url);
			this.socket = io(url, options);
			this.isConnected = true;
			
			this.socket.on('hello_client', function (data) {
				console.log("");
				console.log("* * * hello_client event received from server.");
				console.log("* Data was also sent:");
				console.log(data);
				that.isConnected = true;
			});

			this.socket.on('how_are_you', function () {
				console.log("");
				console.log("* * * how_are_you event received from server.");
				console.log("* Try sending an event back. You can use the browser console to send events manually.");
				console.log("* Type in `socket.emit('im_fine');` and hit enter.");
			});

			this.socket.on('good_to_hear', function () {
				console.log("");
				console.log("* * * good_to_hear event received from server.");
				console.log("* That's good to hear. :)");
				console.log("* Now try sending an event with some data to the server.");
				console.log("* Let's change the username stored on the socket for this client on the server.");
				console.log("* Type in `socket.emit('change_username', {username: 'PUT A NEW USERNAME HERE'});` and hit enter.");
				console.log("* Now check the output in the command line console that the server is running in.");
			});

			this.socket.on('join_game_success', function (data) {
				console.log("");
				console.log("* * * join_game_success event received from server.");
				console.log("* Starting Game state.");
				console.log(data);
				that.data = data;
				// hide LobbyScene
				that.scene.sleep('LobbyScene');
				// This player joined the game. Start the GameScene
				that.scene.start('GameScene');
				that.isConnected = true;
			});

			this.socket.on('remove_player', function (data) {
				console.log("");
				console.log("* * * remove_player event received from server.");
				// Check that the 'playerSprites' object exists on whatever the context is for '_this'.
				if(that.playerSprites !== undefined){
					// Check that the player sprite to remove is actually in the list of player sprites.
					if(that.playerSprites[data]){
						// Destroy the player sprite for the player to remove.
						that.playerSprites[data].destroy();
						// Delete the property for that player.
						delete that.playerSprites[data];
					}
				}
			});

			this.socket.on('state_update', function (data) {
				that.isConnected = true;
				//console.log("* * * state_update event received from server.");
				// Uncomment the below code in an editor, save it and restart the client (refresh the page) to see the emitter output.
				/*updateCount += 1;
				console.log("");
				console.log("* * * state_update event received from server. Update count: " + updateCount);*/
			
				// The server sent the positions of each player with this event. Update the position of each player's sprite.
				// Check that the 'playerSprites' object exists on whatever the context is for '_this'.
				if(that.playerSprites !== undefined){
					// The 'playerSprites' object exists.
					for(var i= 0, len = data.length; i<len; i+=1){
						// Check that there is a property on the 'playerSprites' with the key that matches this socket ID.
						if(that.playerSprites[data[i].id]){
							// This player's sprite exists. Update its position.
							that.playerSprites[data[i].id].x = data[i].x;
							that.playerSprites[data[i].id].y = data[i].y;
						}
						// No property was found for the player that this socket ID belongs to. Add a sprite for them.
						else {
							//that.playerSprites[data[i].id] = that.add.sprite(data[i].x, data[i].y, 'red-fly');
						}
					}
					that.levelData = data[1].level;
				}
			
			});

			this.socket.on('connect_error', function() {
				console.log('int: Failed to connect to server');
				that.isConnected = false;
				that.scene.start('LobbyScene');
				// This player joined the game. Start the GameScene
				that.scene.sleep('GameScene');
			});

			this.socket.on('message', function(message) {
				console.log('int: ' + message);
			});
		
			//_this = this;
			this.scene.start('PreloadScene');
		}
		catch(e)
		{
			console.log('server nicht verfügbar');
		}
    }

    events() {
        this.socket.on('disconnect', function () {
            console.log("The server disconnected. ")
		});
		this.socket.on('message', function(message) {
			console.log(message);
		});
	}
	
	getSocket(){
		return this.socket;
	}
	
	getData(){
		return this.data;
	}

	getIsConnected(){
		return this.isConnected;
	}
}