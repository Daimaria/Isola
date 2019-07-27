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
		//let text = this.add.text(40,40,"gamerooms: 0/12");
		this.rooms = 0;
		this.roomGroup = this.add.group();
		console.log(this.roomGroup);

		this.socket.on('available_gamerooms', function(data){
			that.roomGroup.clear(true, true);
			//text.setText("gamerooms: " + data.data.length + "/12");
			that.rooms = data.data.length;
			let counterX = 0;
			let counterY = 0;
			let noAlreadyTaken = 0;
			let circle;
			data.data.forEach(element => {
				console.log(element);
				let graphics;
				let place;
				noAlreadyTaken = element.numberOfPlayers - element.numberOfHumans + element.humanPlayersJoined;
				if(element.numberOfHumans === element.humanPlayersJoined){
					graphics = that.add.sprite(30 + counterX*170, 30 + counterY*170, 'btn-watch-game').setOrigin(0,0);
				}
				else {
					graphics = that.add.sprite(30 + counterX*170, 30 + counterY*170, 'btn-join-game').setOrigin(0,0);
				}
				that.roomGroup.add(graphics);
				if(element.numberOfPlayers == 2){
					/*graphics = that.add.sprite(32 + counterX*210, 32 + counterY*110, 'btn-join-game2').setOrigin(0, 0);
					that.roomGroup.add(graphics);
					for(var i = 0; i < noAlreadyTaken; i++){
						circle = new Phaser.Geom.Circle(32 + counterX*210 + 128 + i*26, 32 + counterY*110 + 23, 8);
						circleGraphics = that.add.graphics({ fillStyle: { color: 0xff0000 } });
						circleGraphics.fillCircleShape(circle);
						that.roomGroup.add(circleGraphics);
					}*/
					for(let i = 0; i < element.players.length; i++){
						if(element.players[i].id){
							if(element.players[i].id.startsWith('ai')){
								place = that.add.sprite(75 + counterX*170, 40+i*70 + counterY*170, 'computer').setOrigin(0,0).setScale(0.6);
							}
							else {
								place = that.add.sprite(75 + counterX*170, 40+i*70 + counterY*170, 'person').setOrigin(0,0).setScale(0.6);
							}
						}
						else {
							place = that.add.sprite(75 + counterX*170, 40+i*70 + counterY*170, 'add-player').setOrigin(0,0).setScale(0.6);
						}
						that.roomGroup.add(place);
					}
				}
				else {
					/*graphics = that.add.sprite(32 + counterX*210, 32 + counterY*110, 'btn-join-game4').setOrigin(0, 0);
					that.roomGroup.add(graphics);
					noAlreadyTaken = element.numberOfPlayers - element.numberOfHumans + element.humanPlayersJoined;
					for(var i = 0; i < noAlreadyTaken; i++){
						circle = new Phaser.Geom.Circle(32 + counterX*210 + 76 + i*26, 32 + counterY*110 + 24, 8);
						circleGraphics = that.add.graphics({ fillStyle: { color: 0xff0000 } });
						circleGraphics.fillCircleShape(circle);
						that.roomGroup.add(circleGraphics);
					}*/
					let i = 0;
					let j = 0;
					element.players.forEach(player => {
						if(player.id){
							if(player.id.startsWith('ai')){
								place = that.add.sprite(40+i*70 + counterX*170, 40+j*70 + counterY*170, 'computer').setOrigin(0,0).setScale(0.6);
							}
							else {
								place = that.add.sprite(40+i*70 + counterX*170, 40+j*70 + counterY*170, 'person').setOrigin(0,0).setScale(0.6);
							}
						}
						else {
							place = that.add.sprite(40+i*70 + counterX*170, 40+j*70 + counterY*170, 'add-player').setOrigin(0,0).setScale(0.6);
						}
						that.roomGroup.add(place);
						i++;
						if(i === 2){
							j++;
							i=0;
						}
					});
				}
				graphics.setInteractive({useHandCursor: true}).on('pointerdown', () => that.joinGamePressed(element.ID));
				counterY++;
				if(counterY == 3){
					counterX++;
					counterY = 0;
				}
			});
			if(that.rooms != 12){
				that.newGame.destroy();
				that.newGame = that.add.image(30 + counterX*170, 30 + counterY*170, 'add-player')
					.setOrigin(0, 0).setScale(1.5)
					.setInteractive({useHandCursor: true})
					.on('pointerdown', () => {
						if(that.rooms != 12){
							that.createGamePressed();
						}
					});
			}
		});
	}

	create() {
		console.log("create LobbyScene");
		this.theme = sessionStorage.getItem('theme')||1;
		this.fill = this.theme === '1' ? 0x737373 : (this.theme === '2' ? 0xffff80 : 0x330000);
		this.add.sprite(0,0, 'bg'+this.theme).setOrigin(0.3,0.2).setScale(1.5);
		this.add.graphics().fillStyle(0xa6a6a6, 0.4).fillRect(10, 10, this.cameras.main.width - 20, this.cameras.main.height - 20);
		/*let room = this.add.graphics().fillStyle(0xa6a6a6, 1).fillRect(30, 30, 150, 150).fillRect(30, 200, 150, 150).fillRect(30, 370, 150, 150);
		room.fillRect(200, 30, 150, 150).fillRect(200, 200, 150, 150).fillRect(200, 370, 150, 150);
		room.fillRect(370, 30, 150, 150).fillRect(370, 200, 150, 150).fillRect(370, 370, 150, 150);
		room.fillRect(540, 30, 150, 150).fillRect(540, 200, 150, 150).fillRect(540, 370, 150, 150);*/
		this.newGame = this.add.image(30, 30, 'add-player')
			.setOrigin(0, 0).setScale(1.5)
			.setInteractive({useHandCursor: true})
			.on('pointerdown', () => {
				if(this.rooms != 12){
					this.createGamePressed();
				}
			});
		isConnectedSprite = this.add.sprite(this.cameras.main.width - 30,30,'connect-icon').setVisible(false);
		isDisconnectedSprite = this.add.sprite(this.cameras.main.width - 30,30,'disconnect-icon').setVisible(false);

		this.socket.emit('get_available_gamerooms');

	}

	update(){
		this.checkServerStatus();
	}

	createGamePressed() {
		console.log("createGamePressed");
		this.dialogue = this.add.group();
		let numPlayers = 2;
		let numAI = 0;
		let ai1 = false;
		let ai2 = false;
		let ai3 = false;
		let ai4 = false;
		
		let dialogueBox = this.add.graphics();
		dialogueBox.fillStyle(this.fill, 1);
		console.log(this.fill);
		dialogueBox.fillRect(100,50,500,520);
		let layer = this.add.graphics().fillStyle(0xa6a6a6, 0.6).fillRect(110, 60, 480, 500);
		let logo = this.add.image(350, 65, 'new-sign-0'+this.theme);
		let title = this.add.text(350, 150, "Create Room", {fontFamily: "Arial Black", fontSize: 36, color: "#000000"});
		title.setOrigin(0.5,0.5);
		/*let mmo = this.add.text(350, 150, "Online-Multiplayer", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"});
		mmo.setOrigin(0.5,0.5);*/
		let p1 = this.add.image(230, 200, 'person').setOrigin(0,0);
		//p1.fillStyle(0xa6a6a6, 1).fillRect(230,200,100,100);
		p1.setInteractive({useHandCursor: true});
		let p2 = this.add.image(370, 200, 'person').setOrigin(0,0);
		//p2.fillStyle(0xa6a6a6, 1).fillRect(370,200,100,100);
		p2.setInteractive({useHandCursor: true});
		let p3 = this.add.image(230, 340, 'add-player').setOrigin(0,0).setAlpha(0.7);
		//p3.fillStyle(0xa6a6a6, 0.7).fillRect(230,340,100,100);
		p3.setInteractive({useHandCursor: true});
		let p4 = this.add.image(370, 340, 'add-player').setOrigin(0,0).setAlpha(0.7);
		//p4.fillStyle(0xa6a6a6, 0.7).fillRect(370,340,100,100);
		p4.setInteractive({useHandCursor: true});
		let x3 = this.add.image(310, 330, 'exit-square').setScale(0.6).setOrigin(0,0);
		//x3.fillStyle(0xff0000, 1).fillRect(310,330,30,30);
		x3.setVisible(false).setInteractive({useHandCursor: true});
		let x4 = this.add.image(450, 330, 'exit-square').setScale(0.6).setOrigin(0,0);
		//x4.fillStyle(0xff0000, 1).fillRect(450,330,30,30);
		x4.setVisible(false).setInteractive({useHandCursor: true});
		/*let pt1 = this.add.text(230, 200, "AI", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"}).setVisible(false);
		let pt2 = this.add.text(370, 200, "AI", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"}).setVisible(false);
		let pt3 = this.add.text(230, 340, "AI", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"}).setVisible(false);
		let pt4 = this.add.text(370, 340, "AI", {fontFamily: "Arial Black", fontSize: 28, color: "#000000"}).setVisible(false);*/
		let play = this.add.image(260, 480, 'play').setOrigin(0,0);
		//play.fillStyle(0x0000ff).fillRect(260,480,100,50);
		play.setInteractive({useHandCursor: true});
		let exit = this.add.image(390, 480, 'exit-square').setOrigin(0,0);
		//exit.fillStyle(0xff0000,1).fillRect(390,480,50,50);
		exit.setInteractive({useHandCursor: true});
		
		this.dialogue.addMultiple([dialogueBox,layer,logo,title,p1,p2,p3,p4,x3,x4,play,exit]);
		this.dialogue.getChildren().forEach(part => {part.setDepth(100);});
		
		p1.on('pointerdown', () => {
			if(ai1){
				p1.setTexture('person');
				ai1 = false;
				numAI--;
			}
			else if(numPlayers-numAI > 1){
				p1.setTexture('computer');
				ai1 = true;
				numAI++;
			}
		});
		p2.on('pointerdown', () => {
			if(ai2){
				p2.setTexture('person');
				ai2 = false;
				numAI--;
			}
			else if(numPlayers-numAI > 1){
				p2.setTexture('computer')
				ai2 = true;
				numAI++;
			}
		});
		p3.on('pointerdown', () => {
			if(ai3){
				p3.setTexture('person');
				ai3 = false;
				numAI--;
			}
			else if(x3.visible && numPlayers-numAI > 1){
				p3.setTexture('computer');
				ai3 = true;
				numAI++;
			}
			else {
				x3.setVisible(true);
				//p3.clear();
				//p3.fillStyle(0xa6a6a6, 1).fillRect(230,340,100,100);
				p3.setAlpha(1).setTexture('person');
				x4.setVisible(true);
				//p4.clear();
				//p4.fillStyle(0xa6a6a6, 1).fillRect(370,340,100,100);
				p4.setAlpha(1).setTexture('person');
				numPlayers+=2;
			}
		});
		p4.on('pointerdown', () => {
			if(ai4){
				p4.setTexture('person');
				ai4 = false;
				numAI--;
			}
			else if(x4.visible && numPlayers-numAI > 1){
				p4.setTexture('computer');
				ai4 = true;
				numAI++;
			}
			else {
				x3.setVisible(true);
				//p3.clear();
				//p3.fillStyle(0xa6a6a6, 1).fillRect(230,340,100,100);
				p3.setAlpha(1).setTexture('person');
				x4.setVisible(true);
				//p4.clear();
				//p4.fillStyle(0xa6a6a6, 1).fillRect(370,340,100,100);
				p4.setAlpha(1).setTexture('person');
				numPlayers+=2;
			}
		});
		x3.on('pointerdown', () => {
			//pt3.setVisible(false);
			//pt4.setVisible(false);
			if(ai3) numAI--;
			if(ai4) numAI--;
			ai3 = false;
			ai4 = false;
			x3.setVisible(false);
			x4.setVisible(false);
			//p3.clear();
			//p3.fillStyle(0xa6a6a6, 0.7).fillRect(230,340,100,100);
			p3.setAlpha(0.7).setTexture('add-player');
			//p4.clear();
			//p4.fillStyle(0xa6a6a6, 0.7).fillRect(370,340,100,100);
			p4.setAlpha(0.7).setTexture('add-player');
			numPlayers-=2;
		});
		x4.on('pointerdown', () => {
			//pt3.setVisible(false);
			//pt4.setVisible(false);
			ai3 = false;
			ai4 = false;
			x3.setVisible(false);
			x4.setVisible(false);
			//p3.clear();
			//p3.fillStyle(0xa6a6a6, 0.7).fillRect(230,340,100,100);
			p3.setAlpha(0.7).setTexture('add-player');
			//p4.clear();
			//p4.fillStyle(0xa6a6a6, 0.7).fillRect(370,340,100,100);
			p4.setAlpha(0.7).setTexture('add-player');
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
	
	getTheme(){
		return this.theme;
	}
}


