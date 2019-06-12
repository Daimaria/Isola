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
    
    this.socket.on('available_gamerooms', function(data){
      that.add.text(10,10,"available gamerooms: " + data.data.length);
      
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
          noAlreadyTaken = element.numberOfPlayers - element.numberOfHumans + element.humanPlayersJoined;
          for(var i = 0; i < noAlreadyTaken; i++){
            circle = new Phaser.Geom.Circle(32 + counterX*210 + 128 + i*26, 32 + counterY*110 + 23, 8);
            circleGraphics = that.add.graphics({ fillStyle: { color: 0xff0000 } });
            circleGraphics.fillCircleShape(circle);
          }
        }
        else {
          graphics = that.add.sprite(32 + counterX*210, 32 + counterY*110, 'btn-join-game4').setOrigin(0, 0);
          noAlreadyTaken = element.numberOfPlayers - element.numberOfHumans + element.humanPlayersJoined;
          for(var i = 0; i < noAlreadyTaken; i++){
            circle = new Phaser.Geom.Circle(32 + counterX*210 + 76 + i*26, 32 + counterY*110 + 24, 8);
            circleGraphics = that.add.graphics({ fillStyle: { color: 0xff0000 } });
            circleGraphics.fillCircleShape(circle);
          }
        }
        graphics.setInteractive().on('pointerdown', () => that.joinGamePressed(element.ID));
        counterY++;
        if(counterY == 3){
          counterX++;
          counterY = 0;
        }
      });
		});
  }

  create() {
    console.log("create LobbyScene");
    
    this.add.image(550, 32, 'btn-new-game').setOrigin(0, 0).setInteractive().on('pointerdown', () => this.createGamePressed());
		isConnectedSprite=this.add.sprite(this.cameras.main.width - 20,20,'connect-icon').setVisible(false);
    isDisconnectedSprite= this.add.sprite(this.cameras.main.width - 20,20,'disconnect-icon').setVisible(false);

    this.socket.emit('get_available_gamerooms');
    
  }

  update(){
    this.checkServerStatus();
  }

  createGamePressed() {
    console.log("createGamePressed");
    let x = Math.round(1 + Math.random()*3);
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
    }
  }

  joinGamePressed(gameRoomID) {
    console.log("joinGamePressed");

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


