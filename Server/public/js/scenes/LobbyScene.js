var isConnectedSprite;
var isDisconnectedSprite;

export default class LobbyScene extends Phaser.Scene {
	constructor() {
		super();
	}

	preload() {
		console.log("preload LobbyScene");
		let that = this;
		let boot = this.scene.get('BootScene');
		let data = boot.getData();
		this.socket = boot.getSocket();
		let text = this.add.text(10,10,"gamerooms: 0/10");
		this.rooms = 0;
		this.roomGroup = this.add.group();
		console.log(this.roomGroup);

		this.socket.on('available_gamerooms', function(data){
			that.roomGroup.clear(true, true);
			text.setText("gamerooms: " + data.data.length + "/10");
			that.rooms = data.data.length;
			let counterX = 0;
			let counterY = 0;
			let noAlreadyTaken = 0;
			let circle;
			data.data.forEach(element => {
				console.log(element);
				let graphics;
				let circleGraphics;
				if(element.numberOfPlayers == 2){
					graphics = that.add.sprite(32 + counterX*210, 32 + counterY*110, 'btn-join-game2').setOrigin(0, 0);
					that.roomGroup.add(graphics);
					noAlreadyTaken = element.numberOfPlayers - element.numberOfHumans + element.humanPlayersJoined;
					for(var i = 0; i < noAlreadyTaken; i++){
						circle = new Phaser.Geom.Circle(32 + counterX*210 + 128 + i*26, 32 + counterY*110 + 23, 8);
						circleGraphics = that.add.graphics({ fillStyle: { color: 0xff0000 } });
						circleGraphics.fillCircleShape(circle);
						that.roomGroup.add(circleGraphics);
					}
				}
				else {
					graphics = that.add.sprite(32 + counterX*210, 32 + counterY*110, 'btn-join-game4').setOrigin(0, 0);
					that.roomGroup.add(graphics);
					noAlreadyTaken = element.numberOfPlayers - element.numberOfHumans + element.humanPlayersJoined;
					for(var i = 0; i < noAlreadyTaken; i++){
						circle = new Phaser.Geom.Circle(32 + counterX*210 + 76 + i*26, 32 + counterY*110 + 24, 8);
						circleGraphics = that.add.graphics({ fillStyle: { color: 0xff0000 } });
						circleGraphics.fillCircleShape(circle);
						that.roomGroup.add(circleGraphics);
					}
				}
				graphics.setInteractive().on('pointerdown', () => that.joinGamePressed(element.ID));
				counterY++;
				if(counterY == 5){
					counterX++;
					counterY = 0;
				}
			});
		});
	}

	create() {
		console.log("create LobbyScene");

		this.newGame = this.add.image(550, 32, 'btn-new-game')
			.setOrigin(0, 0)
			.setInteractive({useHandCursor: true})
			.on('pointerdown', () => {
				if(this.rooms != 10){
					this.createGamePressed();
				}
			});
		isConnectedSprite=this.add.sprite(this.cameras.main.width - 20,20,'connect-icon').setVisible(false);
		isDisconnectedSprite= this.add.sprite(this.cameras.main.width - 20,20,'disconnect-icon').setVisible(false);

		this.socket.emit('get_available_gamerooms');

	}

	update(){
		this.checkServerStatus();
	}

	createGamePressed() {
		console.log("createGamePressed");
		this.dialogue = this.add.group();
		let numPlayers = 2;
		let ai1 = false;
		let ai2 = false;
		let ai3 = false;
		let ai4 = false;
		
		let dialogueBox = this.add.graphics();
		dialogueBox.fillStyle(0x009900, 1);
		dialogueBox.fillRect(100,50,500,520);
		let title = this.add.text(350, 100, "Create Room", {fontFamily: "Arial Black", fontSize: 36, color: "#000000"});
		title.setOrigin(0.5,0.5);
		let mmo = this.add.text(350, 150, "Online-Multiplayer", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"});
		mmo.setOrigin(0.5,0.5);
		let p1 = this.add.graphics();
		p1.fillStyle(0xa6a6a6, 1);
		p1.fillRect(230,200,100,100).setInteractive(new Phaser.Geom.Rectangle(230,200,100,100), Phaser.Geom.Rectangle.Contains);
		let p2 = this.add.graphics();
		p2.fillStyle(0xa6a6a6, 1);
		p2.fillRect(370,200,100,100).setInteractive(new Phaser.Geom.Rectangle(370,200,100,100), Phaser.Geom.Rectangle.Contains);
		let p3 = this.add.graphics();
		p3.fillStyle(0xa6a6a6, 0.7);
		p3.fillRect(230,340,100,100).setInteractive(new Phaser.Geom.Rectangle(230,340,100,100), Phaser.Geom.Rectangle.Contains);
		let p4 = this.add.graphics();
		p4.fillStyle(0xa6a6a6, 0.7);
		p4.fillRect(370,340,100,100).setInteractive(new Phaser.Geom.Rectangle(370,340,100,100), Phaser.Geom.Rectangle.Contains);
		let x3 = this.add.graphics();
		x3.fillStyle(0xff0000, 1);
		x3.fillRect(310,330,30,30).setVisible(false).setInteractive(new Phaser.Geom.Rectangle(310,330,30,30), Phaser.Geom.Rectangle.Contains);
		let x4 = this.add.graphics();
		x4.fillStyle(0xff0000, 1);
		x4.fillRect(450,330,30,30).setVisible(false).setInteractive(new Phaser.Geom.Rectangle(450,330,30,30), Phaser.Geom.Rectangle.Contains);
		let pt1 = this.add.text(230, 200, "AI", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"}).setVisible(false);
		let pt2 = this.add.text(370, 200, "AI", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"}).setVisible(false);
		let pt3 = this.add.text(230, 340, "AI", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"}).setVisible(false);
		let pt4 = this.add.text(370, 340, "AI", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"}).setVisible(false);
		let play = this.add.graphics();
		play.fillStyle(0x0000ff);
		play.fillRect(260,480,100,50).setInteractive(new Phaser.Geom.Rectangle(260,480,100,50), Phaser.Geom.Rectangle.Contains);
		let exit = this.add.graphics();
		exit.fillStyle(0xff0000,1);
		exit.fillRect(390,480,50,50).setInteractive(new Phaser.Geom.Rectangle(390,480,50,50), Phaser.Geom.Rectangle.Contains);
		
		this.dialogue.addMultiple([dialogueBox,title,mmo,p1,p2,p3,p4,x3,x4,pt1,pt2,pt3,pt4,play,exit]);
		
		p1.on('pointerdown', () => {
			if(pt1.visible){
				pt1.setVisible(false);
				ai1 = false;
			}
			else{
				pt1.setVisible(true);
				ai1 = true;
			}
		});
		p2.on('pointerdown', () => {
			if(pt2.visible){
				pt2.setVisible(false);
				ai2 = false;
			}
			else{
				pt2.setVisible(true);
				ai2 = true;
			}
		});
		p3.on('pointerdown', () => {
			if(pt3.visible){
				pt3.setVisible(false);
				ai3 = false;
			}
			else if(x3.visible){
				pt3.setVisible(true);
				ai3 = true;
			}
			else {
				x3.setVisible(true);
				p3.clear();
				p3.fillStyle(0xa6a6a6, 1);
				p3.fillRect(230,340,100,100);
				x4.setVisible(true);
				p4.clear();
				p4.fillStyle(0xa6a6a6, 1);
				p4.fillRect(370,340,100,100);
				numPlayers+=2;
			}
		});
		p4.on('pointerdown', () => {
			if(pt4.visible){
				pt4.setVisible(false);
				ai4 = false;
			}
			else if(x4.visible){
				pt4.setVisible(true);
				ai4 = true;
			}
			else {
				x3.setVisible(true);
				p3.clear();
				p3.fillStyle(0xa6a6a6, 1);
				p3.fillRect(230,340,100,100);
				x4.setVisible(true);
				p4.clear();
				p4.fillStyle(0xa6a6a6, 1);
				p4.fillRect(370,340,100,100);
				numPlayers+=2;
			}
		});
		x3.on('pointerdown', () => {
			pt3.setVisible(false);
			pt4.setVisible(false);
			x3.setVisible(false);
			x4.setVisible(false);
			p3.clear();
			p3.fillStyle(0xa6a6a6, 0.7);
			p3.fillRect(230,340,100,100);
			p4.clear();
			p4.fillStyle(0xa6a6a6, 0.7);
			p4.fillRect(370,340,100,100);
			numPlayers-=2;
		});
		x4.on('pointerdown', () => {
			pt3.setVisible(false);
			pt4.setVisible(false);
			x3.setVisible(false);
			x4.setVisible(false);
			p3.clear();
			p3.fillStyle(0xa6a6a6, 0.7);
			p3.fillRect(230,340,100,100);
			p4.clear();
			p4.fillStyle(0xa6a6a6, 0.7);
			p4.fillRect(370,340,100,100);
			numPlayers-=2;
		});
		exit.on('pointerdown', () => {
			this.dialogue.clear(true,true);
			console.log("exit");
		});
		play.on('pointerdown', () => {
			this.dialogue.clear(true,true);
			let aipos = [];
			if(ai1) aipos.push(0);
			if(ai2) aipos.push(1);
			if(ai3) aipos.push(2);
			if(ai4) aipos.push(3);
			this.socket.emit('create_new_gameroom', {numberOfPlayers: numPlayers, numberOfHumans: numPlayers-aipos.length, aipos: aipos});
		});
		/*let x = Math.round(1 + Math.random()*3);
		switch(x){
			case 1:
			this.socket.emit('create_new_gameroom', { numberOfPlayers: 2, numberOfHumans: 2});
			break;
			case 2:
			this.socket.emit('create_new_gameroom', { numberOfPlayers: 2, numberOfHumans: 2});
			break;
			case 3:
			this.socket.emit('create_new_gameroom', { numberOfPlayers: 4, numberOfHumans: 4});
			break;
			case 4:
			this.socket.emit('create_new_gameroom', { numberOfPlayers: 4, numberOfHumans: 4});
			break;
		}*/
	}

	joinGamePressed(gameRoomID) {
		console.log("joinGamePressed");
		console.log(this.socket);
		this.socket.emit('join_game', {roomID: gameRoomID});
		isConnectedSprite.setVisible(false);
	}

	checkServerStatus(){
		let sceneBoot = this.scene.get('BootScene');
		if(sceneBoot.getIsConnected()) {
			isConnectedSprite.setVisible(true);
			isDisconnectedSprite.setVisible(false);
		}
		else {
			isConnectedSprite.setVisible(false);
			isDisconnectedSprite.setVisible(true);
		}
	}
}


