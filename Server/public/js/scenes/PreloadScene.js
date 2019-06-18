'use strict'
//import {Scene} from 'phaser';
//import logoImg from "../../assets/star_gold.png";

export default class PreloadScene extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    preload() {
        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);
            
        var width = this.cameras.main.width;
        var height = this.cameras.main.height;
        var loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
            font: '20px monospace',
            fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        var percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: {
            font: '18px monospace',
            fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);
        
        this.load.image("logo", "../../assets/star_gold.png");
        this.load.image('tile', '../../assets/tile.png');
        this.load.image('floor', '../../assets/block1.png');
        //this.load.image('floor', '../../assets/hero_tile.png');
        this.load.image('water', '../../assets/water5.png');
        this.load.image('marker', '../../assets/marker.png');
        this.load.image('btn-join-game', '../../assets/btn-join-game.png');
        this.load.image('btn-new-game', '../../assets/btn-new-game.png');
        this.load.image('btn-join-game2', '../../assets/btn-join-game_2.png');
        this.load.image('btn-join-game4', '../../assets/btn-join-game_4.png');
        this.load.image('connect-icon', '../../assets/connect-icon.png');
        this.load.image('disconnect-icon', '../../assets/disconnect-icon.png');
        this.load.image('greenTile', '../../assets/green_tile.png');
        this.load.image('redTile', '../../assets/red_tile.png');
        this.load.image('heroTile', '../../assets/hero_tile.png');
		this.load.image('colorMarker', '../../assets/color.png');
        this.load.spritesheet('blueJewel', '../../assets/jewel_blue1.png', {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaBubble', '../../assets/lava_bubble.png', {frameWidth: 64, frameHeight: 64});
		this.load.crossOrigin='Anonymous';
		//load all necessary assets
		//this.load.bitmapFont('font', 'https://dl.dropboxusercontent.com/s/z4riz6hymsiimam/font.png?dl=0', 'https://dl.dropboxusercontent.com/s/7caqsovjw5xelp0/font.xml?dl=0');
        //for (var i = 0; i < 50; i++) {
        //    this.load.image('logo'+i, "../../assets/star_gold.png");
        //}
        
        this.load.on('progress', function (value) {
            console.log(value);
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
            percentText.setText(parseInt(value * 100) + '%');
        });
                    
        this.load.on('fileprogress', function (file) {
            console.log(file.src);
        });
        
        this.load.on('complete', function () {
            console.log('complete');
        });
    }

    create() {
        this.scene.start('LobbyScene');
    }
}