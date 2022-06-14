import BaseScene from "./BaseScene";

class PlayScene extends BaseScene {
    constructor( config ) {
        super('PlayScene', config);
        this.bird = null;
        this.pipes = null;
        this.isPaused = false;
        this.flapVelocity = 300;
        this.pipesToRender = 4;
        this.pipeHorizontalDistance = 0;
        this.score = 0;
        this.scoreText = '';
        this.currentDifficulty = 'easy';
        this.difficulties = {
            'easy': {
                pipeDistanceRange: [300, 350],
                pipeOpeningRange: [ 150, 250 ]
            },
            'normal': {
                pipeDistanceRange: [280, 330],
                pipeOpeningRange: [ 140, 190 ]
            },
            'hard': {
                pipeDistanceRange: [250, 310],
                pipeOpeningRange: [ 120, 170 ]
            }
        }
    }

    create () {
        this.currentDifficulty = 'easy';
        super.create();
        this.createBird();
        this.createPipes();
        this.createPause();
        this.createColliders();
        this.createScore();
        this.handleInputs();      
        this.listenToEvents();

        this.anims.create({
            key: 'fly',
            frames: this.anims.generateFrameNumbers('bird', {start: 8, end: 15}),
            frameRate: 8,
            repeat: -1
        });

        this.bird.play('fly');
    }

    update () {
        this.checkGameStatus();
        this.recyclePipes();
    }

    listenToEvents () {
        if ( this.pauseEvent ) {
            return;
        }
        this.pauseEvent = this.events.on('resume', () => {
            this.initialTime = 3;
            this.countDownText = this.add.text(...this.screenCenter, `Resume in: ${this.initialTime}`, this.fontOptions).setOrigin(.5);
            this.timedEvent = this.time.addEvent({
                delay: 1000,
                callback: this.countDown,
                callbackScope: this,
                loop: true
            });
        });
    }

    countDown () {
        this.initialTime--;
        this.countDownText.setText(`Resume in: ${this.initialTime}`);
        
        if ( this.initialTime <= 0 ) {
            this.isPaused = false;
            this.countDownText.setText('');
            this.physics.resume();
            this.timedEvent.remove();
        }
    }

    createBG () {
        this.add.image( 0, 0, 'sky' ).setOrigin( 0, 0 );
    }

    createBird () {
        this.bird = this.physics.add.sprite( this.config.startPosition.x, this.config.startPosition.y, 'bird')
        .setFlipX(true)
        .setScale(3)
        .setOrigin(0);
        
        this.bird.setBodySize(this.bird.width, this.bird.height - 8);
        this.bird.body.gravity.y = 600;
        this.bird.setCollideWorldBounds(true);
    }

    createPipes () {
        // Group pipes together using group()
        this.pipes = this.physics.add.group();

        for ( let i = 0; i < this.pipesToRender; i++ ) {
            // pipes.create() does the same thing as this.physics.add.sprite(), but it also adds the ability to 'group' sprites together
            const upperPipe = this.pipes.create( 0, 0, 'pipe' )
                .setImmovable(true)
                .setOrigin( 0, 1 );
            const lowerPipe = this.pipes.create( 0, 0, 'pipe' )
                .setImmovable(true)
                .setOrigin(0);
        
            this.placePipe( upperPipe, lowerPipe );
        }

        this.pipes.setVelocityX(-200);
    }

    createPause () {
        this.isPaused = false;
        const pauseBtn = this.add.image( this.config.width - 10, this.config.height - 10, 'pause' )
        .setScale(3)
        .setOrigin( 1 );

        pauseBtn.setInteractive();
        pauseBtn.on('pointerdown', () => {
            this.isPaused = true;
            this.physics.pause();
            this.scene.pause();
            this.scene.launch('PauseScene');
        });
    }

    createColliders () {
        this.physics.add.collider(this.bird,this.pipes, this.restartGame, null, this );
    }

    createScore () {
        this.score = 0;
        const bestScore = localStorage.getItem('bestScore');
        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`,{ fontSize: '32px', fill: '#000'});
        this.bestScoreText = this.add.text(16, 50, `Best Score: ${bestScore || 0}`, {fontSize: '18px', fill: '#000'});
    }

    handleInputs () {
        this.input.on('pointerdown', this.flap, this);
        this.input.keyboard.on('keydown_SPACE', this.flap, this);
    }

    checkGameStatus () {
        if ( 
            this.bird.getBounds().bottom >= this.config.height ||
            this.bird.y <= 0
        ) {
            this.restartGame();
        }
    }

    // Render pipes
    placePipe ( uPipe, lPipe ) {
        const difficulty = this.difficulties[this.currentDifficulty];
        const rightMostPipe = this.getRightMostPipe();
        // generate random number for distance between pipes, pipe opening distance and pipe vertical position within a range
        let distanceBetweenPipes = Phaser.Math.Between( ...difficulty.pipeDistanceRange );
        this.pipeHorizontalDistance = distanceBetweenPipes;
        let pipeOpeningDistance = Phaser.Math.Between( ...difficulty.pipeOpeningRange);
        let pipeVerticalPosition = Phaser.Math.Between( 0 + 20, this.config.height - 20 - pipeOpeningDistance );

        // Set x and y coordinates of upper/lower pipe based on numbers generated above
        uPipe.x = rightMostPipe + this.pipeHorizontalDistance;
        uPipe.y = pipeVerticalPosition;

        lPipe.x = uPipe.x;
        lPipe.y = uPipe.y + pipeOpeningDistance;
    }

    recyclePipes () {
        const tempPipes = [];
        this.pipes.getChildren().forEach( ( pipe ) => {
        if ( pipe.getBounds().right <= 0 ) {
            // Recycle pipe
            tempPipes.push(pipe);
            if ( tempPipes.length === 2 ) {
                this.placePipe(...tempPipes);
                this.increaseScore();
                this.saveBestScore();
                this.increaseDifficulty();
            }
        }
        });
    }

    increaseDifficulty (){
        if ( this.score === 10 ) {
            this.currentDifficulty = 'normal';
        }

        if ( this.score === 20 ) {
            this.currentDifficulty = 'hard';
        }
    }

    getRightMostPipe () {
        let rightMostPipe = 0;

        this.pipes.getChildren().forEach( (pipe) => {
            rightMostPipe = Math.max(pipe.x, rightMostPipe)
        });
        return rightMostPipe;
    }

    saveBestScore () {
        const bestScoreText = localStorage.getItem('bestScore');
        const bestScore = bestScoreText && parseInt(bestScoreText, 10);

        if ( !bestScore || this.score > bestScore ) {
            localStorage.setItem('bestScore', this.score);
        }
    }

    restartGame () {
        this.physics.pause();
        this.bird.setTint(0xEE4824);

        this.saveBestScore();

        // restart scene after 1 s
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.scene.restart();
            },
            loop: false,
        });
    }

    flap () {
        if ( this.isPaused ) return;
        this.bird.body.velocity.y = -this.flapVelocity;
    }

    increaseScore () {
        this.score++;
        this.scoreText.setText(`Score: ${ this.score }`);
    }

    updateBestScore () {
        if ( this.bestScore < this.score ) {
            this.bestScore = this.score;
            this.bestScoreText.setText(`Best Score: ${ this.bestScore }`);
        }
    }
}

export default PlayScene;