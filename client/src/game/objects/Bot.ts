import Phaser from 'phaser';

export class Bot extends Phaser.GameObjects.Container {
    private sprite: Phaser.Physics.Arcade.Sprite;
    private chatBubble: Phaser.GameObjects.Container;
    private chatText: Phaser.GameObjects.Text;
    private bubbleGraphics: Phaser.GameObjects.Graphics;

    private speed: number = 50;
    private textureKey: string;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y);
        this.textureKey = texture;

        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        // Sprite
        this.sprite = this.scene.physics.add.sprite(0, 0, texture);
        // Scale 128px to ~47px (0.37x) to match player (471px * 0.1)
        this.sprite.setScale(0.37);
        this.add(this.sprite);

        // Chat Bubble Container
        this.chatBubble = this.scene.add.container(0, -80); // Higher bubble
        this.bubbleGraphics = this.scene.add.graphics();
        this.chatText = this.scene.add.text(0, 0, '', {
            fontSize: '14px',
            color: '#000000',
            fontFamily: 'Arial',
            align: 'center',
            wordWrap: { width: 120 }
        }).setOrigin(0.5);

        this.chatBubble.add(this.bubbleGraphics);
        this.chatBubble.add(this.chatText);
        this.chatBubble.setVisible(false);
        this.add(this.chatBubble);

        // Physics body for container
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(50, 50);
        body.setOffset(-25, -25);
        body.setCollideWorldBounds(true);

        this.startRandomMovement();
    }

    private startRandomMovement() {
        this.scene.time.addEvent({
            delay: Phaser.Math.Between(2000, 5000),
            callback: this.pickRandomDestination,
            callbackScope: this,
            loop: true
        });
    }

    private pickRandomDestination() {
        if (!this.scene) return;

        // Stop previous movement
        (this.body as Phaser.Physics.Arcade.Body).setVelocity(0);

        // 50% chance to stand still
        if (Math.random() < 0.5) {
            // Check for chat
            if (Math.random() < 0.3) {
                this.saySomething();
            }
            // Play idle
            // Do not force idle here, handle in update loop
            return;
        }

        const angle = Phaser.Math.Between(0, 360);
        const velocity = this.scene.physics.velocityFromAngle(angle, this.speed);

        (this.body as Phaser.Physics.Arcade.Body).setVelocity(velocity.x, velocity.y);
    }

    private saySomething() {
        const phrases = [
            "Hello!", "Nice weather!", "Busy day?", "Where is the meeting?",
            "Pixel art is cool!", "Generating assets...", "I am a bot.",
            "Walking around...", "Looks nice here.", "Anyone seen the boss?"
        ];
        const text = phrases[Math.floor(Math.random() * phrases.length)];

        this.chatText.setText(text);

        // Redraw bubble
        const bounds = this.chatText.getBounds();
        const padding = 10;
        const w = bounds.width + padding * 2;
        const h = bounds.height + padding * 2;

        this.bubbleGraphics.clear();
        this.bubbleGraphics.fillStyle(0xffffff, 1);
        this.bubbleGraphics.lineStyle(2, 0x000000, 1);
        this.bubbleGraphics.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
        this.bubbleGraphics.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

        // Tail
        this.bubbleGraphics.fillTriangle(0, h / 2 + 5, -5, h / 2, 5, h / 2);
        this.bubbleGraphics.strokeTriangle(0, h / 2 + 5, -5, h / 2, 5, h / 2); // Stroke might look weird overlapping, but simplify for now

        this.chatBubble.setVisible(true);

        // Hide after few seconds
        this.scene.time.delayedCall(3000, () => {
            this.chatBubble.setVisible(false);
        });
    }

    update() {
        if (!this.body) return;
        const velocity = (this.body as Phaser.Physics.Arcade.Body).velocity;

        if (velocity.length() > 0) {
            if (this.textureKey) {
                this.sprite.play(`walk_${this.textureKey}`, true);
            }
            // Flip sprite based on direction
            if (velocity.x < 0) {
                this.sprite.setFlipX(true);
            } else if (velocity.x > 0) {
                this.sprite.setFlipX(false);
            }
        } else {
            if (this.textureKey) {
                this.sprite.play(`idle_${this.textureKey}`, true);
            }
        }
    }
}
