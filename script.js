var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var lives = 3; // Nueva variable para las vidas
var livesText; // Texto para mostrar las vidas en pantalla
var gameOverText; // Texto para el "Game Over"
var restartButton; // Botón para reiniciar el juego

var game = new Phaser.Game(config);

function preload () {
    this.load.image('sky', 'assets/sky2.jpg');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/stars2.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image('button', 'assets/restart.png'); // Cargar la imagen del botón de reinicio
}

function create () {
    this.add.image(400, 300, 'sky');

    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();

    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    bombs = this.physics.add.group();

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });
    livesText = this.add.text(640, 16, 'Lives: ' + lives, { fontSize: '32px', fill: '#fff' }); // Mostrar vidas

    // Crear el texto de "Game Over" pero mantenerlo invisible
    gameOverText = this.add.text(400, 300, 'Game Over', { fontSize: '64px', fill: '#ff0000' });
    gameOverText.setOrigin(0.5);
    gameOverText.setVisible(false);

    // Crear el botón de reinicio pero mantenerlo invisible
    restartButton = this.add.image(400, 400, 'button').setInteractive();
    restartButton.setVisible(false);

    restartButton.on('pointerdown', () => {
        // Reiniciar el juego
        this.scene.restart();
        lives = 3;
        score = 0;
        gameOver = false;
        livesText.setText('Lives: ' + lives);
        scoreText.setText('Score: ' + score);
    });

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update () {
    if (gameOver) {
        return;
    }

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

function collectStar (player, star) {
    star.disableBody(true, true);

    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }
}

function hitBomb (player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');

    lives -= 1; // Restar una vida
    livesText.setText('Lives: ' + lives);

    if (lives <= 0) {
        gameOver = true;
        gameOverText.setVisible(true); // Mostrar "Game Over"
        restartButton.setVisible(true); // Mostrar botón de reinicio
    } else {
        this.time.delayedCall(1000, () => {
            this.physics.resume();
            player.clearTint();
            player.x = 100;
            player.y = 450;
            player.setVelocity(0, 0);
        }, [], this);
    }
}