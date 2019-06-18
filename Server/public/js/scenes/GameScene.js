var upKey;
var downKey;
var leftKey;
var rightKey;
//x & y values of the direction vector for character movement
var dX=0;
var dY=0;
var tileWidth=50;// the width of a tile
var borderOffset = new Phaser.Geom.Point(450,50);//to centralise the isometric level display
var wallGraphicHeight=98;
var floorGraphicWidth=103;
var floorGraphicHeight=53;
var heroGraphicWidth=41;
var heroGraphicHeight=62;
var wallHeight=wallGraphicHeight-floorGraphicHeight; 
var heroHeight=(floorGraphicHeight/2)+(heroGraphicHeight-floorGraphicHeight)+6;//adjustments to make the legs hit the middle of the tile for initial load
var heroWidth= (floorGraphicWidth/2)-(heroGraphicWidth/2);//for placing hero at the middle of the tile
var facing='south';//direction the character faces
var sorcerer;//hero
var sorcererShadow;//duh
var shadowOffset=new Phaser.Geom.Point(heroWidth+7,11);
var bmpText;//title text
var normText;//text to display hero coordinates
var normText2;//text to display hero coordinates
var normText3;//text to display hero coordinates
var heroMapSprite;//hero marker sprite in the minimap
var gameScene;//this is the render texture onto which we draw depth sorted scene
var markerMoved;    //if true, redraw marker and players
var toBeRemoved;    //if true, redraw the board
var playerMoved;	//if true, redraw players
var pdCoords;
var marker;
var markerSprite;
var lava;

export default class GameScene extends Phaser.Scene {

	create() {
		let boot = this.scene.get('BootScene');
		let data = boot.getData();
		this.socket = boot.getSocket();
		this.levelData = data.data.levelData;
		this.roomID = data.data.ID;
		this.players = data.data.players;
		this.currentPlayer = 0;
		this.gameOver = false;
		this.out = false;
		//this.players.pop();
		this.playerSprites = [];
		toBeRemoved = false;
		pdCoords = new Phaser.Geom.Point();
		//bmpText = this.add.bitmapText(10, 10, 'font', 'Isometric Tutorial\nUse Arrow Keys', 18);
		//normText=this.add.text(10,360,"hi");
		
		normText2=this.add.text(10,390,"hi");
		normText3=this.add.text(10,420,"hi");
		this.scene.backgroundColor = '#cccccc';
		gameScene = this.add.group();
		this.playerGroup = this.add.group();
		this.dialogue = this.add.group();
		marker = new Phaser.Geom.Point(0, 0);

		this.anims.create({
			key: 'left',
			frames: this.anims.generateFrameNumbers('blueJewel', { start: 0, end: 30 }),
			frameRate: 10,
			repeat: -1
		});
		this.anims.create({
			key: 'right',
			frames: this.anims.generateFrameNumbers('lavaBubble', { start: 0, end: 14 }),
			frameRate: 10,
			repeat: -1
		});
		
		let that = this;

		this.socket.on('remove_player', function (data) {
			console.log("");
			console.log("* * * remove_player event received from server.");
			if(data.player != that.socket.id){
				that.levelData = data.data.levelData;
				that.roomID = data.data.ID;
				that.players = data.data.players;
				that.drawPlayers();
			}
		});
		
		this.socket.on('destroy_room', function (data) {
			let dialogueBox = that.add.graphics();
			dialogueBox.fillStyle(0x009900, 1);
			dialogueBox.fillRect(100,50,800,520).depth = 100;
			let title = that.add.text(500, 100, "Warning", {fontFamily: "Arial Black", fontSize: 36, color: "#000000"});
			title.setOrigin(0.5,0.5).depth = 100;
			if(data.timeUp){
				let text1 = that.add.text(500, 200, "Due to prolonged inactivity in this", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"});
				text1.setOrigin(0.5,0.5).depth = 100;
				let text2 = that.add.text(500, 250, "room, it will be shut down to", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"});
				text2.setOrigin(0.5,0.5).depth = 100;
				let text3 = that.add.text(500, 300, "make place for more active rooms.", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"});
				text3.setOrigin(0.5,0.5).depth = 100;
				let exitBtn = that.add.graphics();
				exitBtn.fillStyle(0xff0000,1);
				exitBtn.fillRect(450, 400, 100, 50).depth = 100;
				that.dialogue.addMultiple(dialogueBox, title, text1, text2, text3, exitBtn);
				exitBtn.setInteractive(new Phaser.Geom.Rectangle(450,400,100,50), Phaser.Geom.Rectangle.Contains)
				.on('pointerdown', () => {
					that.socket.emit('leaving_room');
					that.dialogue.clear(true, true);
					//that.scene.sleep('GameScene');
					that.scene.start('LobbyScene');
				});
				that.currentPlayer = 0;
			}
			else {
				let text1 = that.add.text(500, 200, "A player disconnected from the game.", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"});
				text1.setOrigin(0.5,0.5).depth = 100;
				let text2 = that.add.text(500, 250, "Due to these circumstances,", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"});
				text2.setOrigin(0.5,0.5).depth = 100;
				let text3 = that.add.text(500, 300, "the game will not continue.", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"});
				text3.setOrigin(0.5,0.5).depth = 100;
				let exitBtn = that.add.graphics();
				exitBtn.fillStyle(0xff0000,1);
				exitBtn.fillRect(450, 400, 100, 50).depth = 100;
				that.dialogue.addMultiple(dialogueBox, title, text1, text2, text3, exitBtn);
				exitBtn.setInteractive(new Phaser.Geom.Rectangle(450,400,100,50), Phaser.Geom.Rectangle.Contains)
				.on('pointerdown', () => {
					that.socket.emit('leaving_room');
					that.dialogue.clear(true, true);
					that.scene.start('LobbyScene');
					//that.scene.remove('GameScene');
				});
				that.currentPlayer = 0;
			}
		});
		
		this.socket.on('remove_success', function(data){
			console.log('remove: '+data);
			that.levelData = data.data.levelData;
			that.roomID = data.data.ID;
			that.players = data.data.players;
			if(!that.gameOver) that.currentPlayer = data.currentPlayer;
			else that.currentPlayer = 0;
			//that.players.pop();
			that.drawBoard();
			that.playersToTop();
			toBeRemoved = false;
		});
		
		this.socket.on('new_player', function(data){
			that.levelData = data.data.levelData;
			that.roomID = data.data.ID;
			that.players = data.data.players;
			that.currentPlayer = data.currentPlayer;
			that.drawPlayers();
		});
		
		this.socket.on('player_moved', function(data){
			console.log(data);
			that.levelData = data.data.levelData;
			that.roomID = data.data.ID;
			that.players = data.data.players;
			that.drawPlayers();
			toBeRemoved = true;
		});
		
		this.socket.on('game_over', function(data){
			that.gameOver = true;
			if(that.socket.id != data.loser.id && !that.out){
				console.log('winner');
				normText = that.add.text(20, 360, "You won!", { fontFamily: "Arial Black", fontSize: 36, color: "#c51b7d" });
				normText.setStroke('#de77ae', 16);

				//  Apply the shadow to the Stroke only
				normText.setShadow(2, 2, '#333333', 2, true, false);
				normText.depth = 200;
			}
			else {
				console.log('loser');
				normText = that.add.text(20, 360, "You lost!", { fontFamily: "Arial Black", fontSize: 36, color: "#c51b7d" });
				normText.setStroke('#de77ae', 16);

				//  Apply the shadow to the Stroke only
				normText.setShadow(2, 2, '#333333', 2, true, false);
				normText.depth = 200;
			}
		});
		
		this.socket.on('player_out', function(data){
			if(that.socket.id === data.player.id){
				console.log('out');
				that.out = true;
				normText = that.add.text(20, 360, "You lost!", { fontFamily: "Arial Black", fontSize: 36, color: "#c51b7d" });
				normText.setStroke('#de77ae', 16);

				//  Apply the shadow to the Stroke only
				normText.setShadow(2, 2, '#333333', 2, true, false);
				normText.depth = 200;
			}
		});

		this.createLevel();
	}
	
	update(){
		if(markerMoved) {
			if(markerSprite) markerSprite.destroy();
			markerSprite = this.add.sprite(marker.x, marker.y, 'marker').setOrigin(0, 0);
			markerMoved = false;
		}
	}

	createLevel(){
		var isoPt= new Phaser.Geom.Point();
		this.drawBoard();
		isoPt=this.cartesianToIsometric(new Phaser.Geom.Point(1*tileWidth,2*tileWidth));
		/*lava = this.add.sprite(isoPt.x+borderOffset.x + 20, isoPt.y+borderOffset.y-wallHeight, 'lavaBubble').setOrigin(0, 0);
		lava.anims.play('right', true);
		lava.depth = 100;*/
	}
	
	drawBoard() {
		//normText.text = "drawBoard";
		gameScene.clear(true,true);
		this.dialogue.clear(true,true);
		let isoPt;
		let tileType=0;
		for (var i = 0; i < this.levelData.length; i++)
		{
			for (var j = 0; j < this.levelData[0].length; j++)
			{
				tileType=this.levelData[i][j].type;
				this.drawTileIso(tileType,i,j);
				if(this.levelData[i][j].player && !toBeRemoved){
					isoPt=this.cartesianToIsometric(new Phaser.Geom.Point(i*tileWidth,j*tileWidth));
					let colTmp = this.add.sprite(isoPt.x+borderOffset.x + 20, isoPt.y+borderOffset.y-wallHeight, 'colorMarker').setOrigin(0, -0.15);
					this.players.forEach(player => {
						if(player.id === this.levelData[i][j].player){
							colTmp.setTint(player.color);
							console.log(player.color);
						}
					});
					colTmp.depth = 100;
					this.playerGroup.add(colTmp);
					let tmp = this.add.sprite(isoPt.x+borderOffset.x + 20, isoPt.y+borderOffset.y-wallHeight, 'blueJewel').setOrigin(0, 0);
					this.playerSprites.push(tmp);
					this.playerSprites[this.playerSprites.length-1].anims.play('left', true);
					this.playerGroup.add(tmp);
					console.log('addPlayer ' + i + ' ' + j);
					this.playerSprites[this.playerSprites.length-1].depth = 100;
					//console.log(tmp);
				}
			}
		}
		console.log(this.playerSprites);
	}
	
	drawPlayers() {
		this.playerGroup.clear(true,true);
		this.playerSprites = [];
		let isoPt;
		for (var i = 0; i < this.levelData.length; i++)
		{
			for (var j = 0; j < this.levelData[0].length; j++)
			{
				if(this.levelData[i][j].player){
					isoPt=this.cartesianToIsometric(new Phaser.Geom.Point(i*tileWidth,j*tileWidth));
					let colTmp = this.add.sprite(isoPt.x+borderOffset.x + 20, isoPt.y+borderOffset.y-wallHeight, 'colorMarker').setOrigin(0, -0.15);
					this.players.forEach(player => {
						if(player.id === this.levelData[i][j].player){
							colTmp.setTint(player.color);
							console.log(player.color);
						}
					});
					colTmp.depth = 100;
					this.playerGroup.add(colTmp);
					let tmp = this.add.sprite(isoPt.x+borderOffset.x + 20, isoPt.y+borderOffset.y-wallHeight, 'blueJewel').setOrigin(0, 0);
					this.playerSprites.push(tmp);
					this.playerSprites[this.playerSprites.length-1].anims.play('left', true);
					this.playerGroup.add(tmp);
					//console.log('addPlayer ' + i + ' ' + j);
					this.playerSprites[this.playerSprites.length-1].depth = 100;
				}
			}
		}
	}
	
	playersToTop(x, y) {
		this.playerSprites.forEach(player => {
			this.children.bringToTop(player);
			player.anims.resume();
		});
		this.children.bringToTop(lava);
		//lava.anims.resume();
	}
	
	drawTileIso(tileType,i,j){//place isometric level tiles
		let tmp;
		var bj;
		var isoPt= new Phaser.Geom.Point();//It is not advisable to create point in update loop
		var cartPt=new Phaser.Geom.Point();//This is here for better code readability.
		cartPt.x=j*tileWidth;
		cartPt.y=i*tileWidth;
		isoPt=this.cartesianToIsometric(cartPt);
		let that = this;
		//console.log('Draw ' + i + ' ' + j);
		switch(tileType){
			case 0:
				tmp = this.add.sprite(isoPt.x+borderOffset.x, isoPt.y+borderOffset.y-wallHeight, 'floor').setOrigin(0, 0).setInteractive();
				gameScene.add(tmp);
				tmp.setData('x', i);
				tmp.setData('y', j);
				tmp.on('pointerover', function (event) {
					if(that.currentPlayer != 0 && that.currentPlayer.id === that.socket.id){
						if(toBeRemoved && !that.levelData[this.getData('y')][this.getData('x')].player) {
							this.setTint(0x0000ff);
							marker.x = this.x;
							marker.y = this.y;
							markerMoved = true;
						}
						else {
							if(that.isNextToPlayer(this.getData("x"), this.getData("y"))) {
								this.setTint(0x00ff00);
								marker.x = this.x;
								marker.y = this.y;
								markerMoved = true;
							}
						}
					}
				});
				tmp.on('pointerout', function(event) {
					this.clearTint();
					if(markerSprite) markerSprite.destroy();
				});
				tmp.on('pointerdown', function(event) {
					if(that.currentPlayer != 0 && that.currentPlayer.id === that.socket.id){
						pdCoords.x = this.getData("x");
						pdCoords.y = this.getData("y");
						//normText2.text='pdCoords: '+pdCoords.x +','+pdCoords.y;
						//lava.anims.pause();
						if(toBeRemoved && !that.levelData[this.getData('y')][this.getData('x')].player){
							that.playerSprites.forEach(player => {
								player.anims.pause();
							});
							console.log('pdCoords: '+pdCoords.x +','+pdCoords.y);
							console.log(that.roomID);
							that.socket.emit('remove_field', {roomID: that.roomID, x: pdCoords.x, y: pdCoords.y});
						}
						else {
							if(that.isNextToPlayer(this.getData("x"), this.getData("y"))){
								console.log('moveCoords: '+pdCoords.x +','+pdCoords.y);
								console.log(that.roomID);
								that.socket.emit('move_player', {roomID: that.roomID, x: pdCoords.x, y: pdCoords.y});
							}
						}
					}
				});
			break;
			case 1:
				tmp = this.add.sprite(isoPt.x+borderOffset.x, isoPt.y+borderOffset.y-wallHeight, 'water').setOrigin(0, 0).setInteractive();
				gameScene.add(tmp);
			break;
		}
	}
	
	isNextToPlayer(x, y){
		if(this.levelData[y][x].player) return false;
		for(let i = y-1; i <= y+1; i++){
			for(let j = x-1; j <= x+1; j++){
				if(this.levelData[i][j].player === this.socket.id) return true;
			}
		}
		return false;
	}
	/*isWalkable(){//It is not advisable to create points in update loop, but for code readability.
		var able=true;
		var heroCornerPt=new Phaser.Geom.Point(heroMapPos.x-heroMapSprite.width/2,heroMapPos.y-heroMapSprite.height/2);
		var cornerTL =new Phaser.Geom.Point();
		cornerTL.x=heroCornerPt.x +  (heroSpeed * dX);
		cornerTL.y=heroCornerPt.y +  (heroSpeed * dY);
		// now we have the top left corner point. we need to find all 4 corners based on the map marker graphics width & height
		//ideally we should just provide the hero a volume instead of using the graphics' width & height
		var cornerTR =new Phaser.Geom.Point();
		cornerTR.x=cornerTL.x+heroMapSprite.width;
		cornerTR.y=cornerTL.y;
		var cornerBR =new Phaser.Geom.Point();
		cornerBR.x=cornerTR.x;
		cornerBR.y=cornerTL.y+heroMapSprite.height;
		var cornerBL =new Phaser.Geom.Point();
		cornerBL.x=cornerTL.x;
		cornerBL.y=cornerBR.y;
		var newTileCorner1;
		var newTileCorner2;
		var newTileCorner3=heroMapPos;
		//let us get which 2 corners to check based on current facing, may be 3
		switch (facing){
			case "north":
				newTileCorner1=cornerTL;
				newTileCorner2=cornerTR;
			break;
			case "south":
				newTileCorner1=cornerBL;
				newTileCorner2=cornerBR;
			break;
			case "east":
				newTileCorner1=cornerBR;
				newTileCorner2=cornerTR;
			break;
			case "west":
				newTileCorner1=cornerTL;
				newTileCorner2=cornerBL;
			break;
			case "northeast":
				newTileCorner1=cornerTR;
				newTileCorner2=cornerBR;
				newTileCorner3=cornerTL;
			break;
			case "southeast":
				newTileCorner1=cornerTR;
				newTileCorner2=cornerBR;
				newTileCorner3=cornerBL;
			break;
			case "northwest":
				newTileCorner1=cornerTR;
				newTileCorner2=cornerBL;
				newTileCorner3=cornerTL;
			break;
			case "southwest":
				newTileCorner1=cornerTL;
				newTileCorner2=cornerBR;
				newTileCorner3=cornerBL;
			break;
		}
		//check if those corners fall inside a wall after moving
		newTileCorner1=getTileCoordinates(newTileCorner1,tileWidth);
		if(levelData[newTileCorner1.y][newTileCorner1.x]==1){
			able=false;
		}
		newTileCorner2=getTileCoordinates(newTileCorner2,tileWidth);
		if(levelData[newTileCorner2.y][newTileCorner2.x]==1){
			able=false;
		}
		newTileCorner3=getTileCoordinates(newTileCorner3,tileWidth);
		if(levelData[newTileCorner3.y][newTileCorner3.x]==1){
			able=false;
		}
		return able;
	}*/
	/*detectKeyInput(){//assign direction for character & set x,y speed components
		if (upKey.isDown)
		{
			dY = -1;
		}
		else if (downKey.isDown)
		{
			dY = 1;
		}
		else
		{
			dY = 0;
		}
		if (rightKey.isDown)
		{
			dX = 1;
			if (dY == 0)
			{
				facing = "east";
			}
			else if (dY==1)
			{
				facing = "southeast";
				dX = dY=0.5;
			}
			else
			{
				facing = "northeast";
				dX=0.5;
				dY=-0.5;
			}
		}
		else if (leftKey.isDown)
		{
			dX = -1;
			if (dY == 0)
			{
				facing = "west";
			}
			else if (dY==1)
			{
				facing = "southwest";
				dY=0.5;
				dX=-0.5;
			}
			else
			{
				facing = "northwest";
				dX = dY=-0.5;
			}
		}
		else
		{
			dX = 0;
			if (dY == 0)
			{
				//facing="west";
			}
			else if (dY==1)
			{
				facing = "south";
			}
			else
			{
				facing = "north";
			}
		}
	}*/

	cartesianToIsometric(cartPt){
		var tempPt=new Phaser.Geom.Point();
		tempPt.x=cartPt.x-cartPt.y;
		tempPt.y=(cartPt.x+cartPt.y)/2;
		return (tempPt);
	}
	isometricToCartesian(isoPt){
		var tempPt=new Phaser.Geom.Point();
		tempPt.x=(2*isoPt.y+isoPt.x)/2;
		tempPt.y=(2*isoPt.y-isoPt.x)/2;
		return (tempPt);
	}
	getTileCoordinates(cartPt, tileHeight){
		var tempPt=new Phaser.Geom.Point();
		tempPt.x=Math.floor(cartPt.x/tileHeight);
		tempPt.y=Math.floor(cartPt.y/tileHeight);
		return(tempPt);
	}
	getCartesianFromTileCoordinates(tilePt, tileHeight){
		var tempPt=new Phaser.Geom.Point();
		tempPt.x=tilePt.x*tileHeight;
		tempPt.y=tilePt.y*tileHeight;
		return(tempPt);
	}

}