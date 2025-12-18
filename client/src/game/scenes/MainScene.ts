import Phaser from 'phaser';
import { SocketManager } from '../SocketManager';

export class MainScene extends Phaser.Scene {
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private socketManager!: SocketManager;

    private onZoneChange?: (inZone: boolean) => void;
    private presentationZone!: Phaser.GameObjects.Zone;

    // Auto-Seating State
    private seats: Phaser.Math.Vector2[] = [];
    private isAutoMoving = false;
    private isSeated = false; // New state
    private targetSeat?: Phaser.Math.Vector2;

    constructor() {
        super('MainScene');
    }

    // Allow passing a callback
    init(data: { onZoneChange?: (inZone: boolean) => void }) {
        this.onZoneChange = data.onZoneChange;
    }
    preload() {
        this.load.image('office_map_clean', '/assets/office_map_clean.png');
        this.load.spritesheet('character_anim', '/assets/chibi_hero.png', { frameWidth: 300, frameHeight: 471 });
        this.load.image('character_back', '/assets/chibi_hero_back.png');
    }

    create() {
        // Check registry for callback
        const onZoneChange = this.registry.get('onZoneChange');
        if (onZoneChange) {
            this.onZoneChange = onZoneChange;
        }

        // Connect to server
        this.socketManager = new SocketManager(this);

        // Add background (3x Wide Tiling, Scaled 1x for cleaner look)
        // Image is 1024x1024.
        // Scale 1x => 1024x1024 per tile.
        // Total Width = 1024 * 3 = 3072.

        const scaleMap = 1;
        const tileWidth = 1024 * scaleMap;
        const tileHeight = 1024 * scaleMap;

        this.add.image(0, 0, 'office_map_clean').setOrigin(0, 0).setScale(scaleMap);
        this.add.image(tileWidth, 0, 'office_map_clean').setOrigin(0, 0).setScale(scaleMap);
        this.add.image(tileWidth * 2, 0, 'office_map_clean').setOrigin(0, 0).setScale(scaleMap);

        const totalWidth = tileWidth * 3;
        const totalHeight = tileHeight;

        this.physics.world.setBounds(0, 0, totalWidth, totalHeight);

        // Animations
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('character_anim', { start: 0, end: 2 }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'idle',
            frames: [{ key: 'character_anim', frame: 1 }],
            frameRate: 1
        });
        this.anims.create({
            key: 'idle_back',
            frames: [{ key: 'character_back' }], // Single image texture
            frameRate: 1
        });

        // Player
        this.player = this.physics.add.sprite(totalWidth / 2, totalHeight - 400, 'character_anim');
        this.player.setCollideWorldBounds(true);

        // Scale Chibi (0.1)
        this.player.setScale(0.1);

        // Fix Hitbox
        this.player.body.setSize(100, 50);
        this.player.body.setOffset(100, 421);

        // Presentation Zone (Center of the Middle Map)
        const zoneX = totalWidth / 2;
        // Stage is likely at the top of the map image.
        // Map is 2048 tall. Stage might be at Y=400?
        // Let's put zone at Y=500.
        const zoneY = 500;
        const zoneW = 600;
        const zoneH = 400;

        // Visual debug for zone
        const zoneGraphics = this.add.graphics();
        zoneGraphics.lineStyle(4, 0xffff00);
        zoneGraphics.strokeRect(zoneX - zoneW / 2, zoneY - zoneH / 2, zoneW, zoneH);

        this.presentationZone = this.add.zone(zoneX, zoneY, zoneW, zoneH);
        this.physics.world.enable(this.presentationZone);
        (this.presentationZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        (this.presentationZone.body as Phaser.Physics.Arcade.Body).moves = false;

        // Camera
        // 1.0 zoom.
        this.cameras.main.setZoom(1.0);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, totalWidth, totalHeight);

        // Dynamic Resize
        this.scale.on('resize', (_gameSize: Phaser.Structs.Size) => {
            this.cameras.main.setBounds(0, 0, totalWidth, totalHeight);
        });

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // Define Standing Area (Stage Floor)
        // Strictly within the grey area shown in reference.
        // Center X = totalWidth / 2
        // Y Range: ~380 (Near Stage) to ~550 (Near Stairs)
        // X Range: +/- 250 from center (Between Planters)

        const cx = totalWidth / 2;
        const minX = cx - 200;
        const maxX = cx + 200;
        const minY = 380;
        const maxY = 550;

        this.seats = [];

        // Generate 30 random standing spots
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(minX, maxX);
            const y = Phaser.Math.Between(minY, maxY);
            this.seats.push(new Phaser.Math.Vector2(x, y));
        }

        // Listener for external trigger
        // Using window event for React-Phaser bridge currently
        window.addEventListener('triggerAutoSeat', () => {
            this.autoMoveToSeat();
        });
    }

    public autoMoveToSeat() {
        if (this.isAutoMoving || this.isSeated) return; // Prevent double trigger

        // Pick a random seat for now
        const seatIndex = Phaser.Math.Between(0, this.seats.length - 1);
        this.targetSeat = this.seats[seatIndex];
        this.isAutoMoving = true;
        this.isSeated = false;
    }



    update() {
        if (!this.player) return;

        const body = this.player.body;
        const speed = 200;

        // Auto-Moving Logic
        if (this.isAutoMoving && this.targetSeat) {
            // Move towards target
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetSeat.x, this.targetSeat.y);

            if (distance < 10) {
                // Arrived
                body.setVelocity(0);
                this.player.setPosition(this.targetSeat.x, this.targetSeat.y); // Snap
                this.isAutoMoving = false;
                this.targetSeat = undefined;
                this.isSeated = true; // Mark as seated

                // Face UP towards stage (Back View)
                this.player.anims.play('idle_back', true);
            } else {
                this.physics.moveToObject(this.player, this.targetSeat, speed);
                this.player.anims.play('walk', true);

                // Simple facing
                if (this.player.body.velocity.x < 0) this.player.setFlipX(true);
                else this.player.setFlipX(false);
            }

            // Emit movement for sync
            this.socketManager.emitPlayerMovement(this.player.x, this.player.y);
            return; // Skip manual control
        }

        if (!this.cursors) return;

        // Manual Control Check
        const hasInput = this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown;

        // If seated and no input, stay seated and facing back
        if (this.isSeated) {
            if (!hasInput) {
                this.player.anims.play('idle_back', true); // Ensure back view
                body.setVelocity(0);
                return;
            } else {
                // Input detected, stand up
                this.isSeated = false;
            }
        }

        // Standard Manual Control (Walk/Idle)
        const oldX = this.player.x;
        const oldY = this.player.y;

        body.setVelocity(0);

        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);
        }

        if (this.cursors.up.isDown) {
            body.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            body.setVelocityY(speed);
        }

        // Normalize and scale the velocity so that player can't move faster along a diagonal
        body.velocity.normalize().scale(speed);

        // Update animation
        if (this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown) {
            this.player.anims.play('walk', true);
            this.player.setFlipX(this.cursors.left.isDown);
        } else {
            this.player.anims.play('idle', true);
        }

        // Reset FlipX handled in 'walk' block above

        // Emit movement if changed
        if (this.player.x !== oldX || this.player.y !== oldY) {
            this.socketManager.emitPlayerMovement(this.player.x, this.player.y);
        }

        // Zone overlap check
        if (this.presentationZone) {
            const playerBounds = this.player.getBounds();
            // Simple AABB check
            const inZone = Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.presentationZone.getBounds());

            this.onZoneChange?.(inZone);
        }
    }


}
