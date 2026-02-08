import Phaser from 'phaser';
import { SocketManager } from '../SocketManager';
import { Bot } from '../objects/Bot';

export class MainScene extends Phaser.Scene {
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private socketManager!: SocketManager;
    // private debugText!: Phaser.GameObjects.Text;
    private otherPlayersGroup!: Phaser.Physics.Arcade.Group;
    private bots: Bot[] = [];
    private presentationZone!: Phaser.GameObjects.Zone;
    private onZoneChange?: (inZone: boolean) => void;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private playerNameText!: Phaser.GameObjects.Text;
    private otherPlayerNameTags: Map<string, Phaser.GameObjects.Text> = new Map();
    private noEventText!: Phaser.GameObjects.Text;
    private currentStageEvent: any = null;
    private stageTimerEvent?: Phaser.Time.TimerEvent;

    // Auto-Seating State
    private seats: Phaser.Math.Vector2[] = [];
    private isAutoMoving = false;
    private isSeated = false;
    private targetSeat?: Phaser.Math.Vector2;
    private lastMoveTime = 0;
    private lastSentPosition = { x: 0, y: 0 };

    constructor() {
        super('MainScene');
    }

    init(data: { onZoneChange?: (inZone: boolean) => void }) {
        this.onZoneChange = data.onZoneChange;
    }

    preload() {
        this.load.image('office_map_clean', '/assets/office_map_clean.png');
        this.load.spritesheet('character_anim', '/assets/chibi_hero_rigged.png', { frameWidth: 300, frameHeight: 471 });
        this.load.image('character_back', '/assets/chibi_hero_back.png');

        this.load.on('loaderror', (file: any) => {
            console.error('Asset load failed:', file.key, file.url);
        });

        this.load.on('complete', () => {
            console.log('All assets loaded');
        });

        // Load generated AI characters
        for (let i = 1; i <= 10; i++) {
            this.load.spritesheet(`char_${i}`, `/assets/ai_chars_animated/ai_char_${i}.png?v=12`, { frameWidth: 96, frameHeight: 128 });
        }
    }

    create() {
        console.log("MainScene: create started");

        // --- Debug Text ---
        // --- Debug Text ---
        // this.debugText = this.add.text(10, 100, 'Waiting...', {
        //     font: '14px monospace',
        //     color: '#00ff00',
        //     backgroundColor: '#000000aa'
        // }).setScrollFactor(0).setDepth(1000);

        const onZoneChange = this.registry.get('onZoneChange');
        if (onZoneChange) {
            this.onZoneChange = onZoneChange;
        }

        this.otherPlayersGroup = this.physics.add.group();

        // --- Event Listeners (Setup BEFORE Socket Connection) ---
        console.log("MainScene: Setting up listeners");

        this.events.on('addOtherPlayer', (playerInfo: any) => {
            console.log("MainScene: Event 'addOtherPlayer'", playerInfo.id);
            this.addOtherPlayer(playerInfo);
            this.updateDebugInfo();
            this.emitPlayerCount();
        });

        this.events.on('removeOtherPlayer', (playerId: string) => {
            console.log("MainScene: Event 'removeOtherPlayer'", playerId);
            const child = this.otherPlayersGroup.getChildren().find((p: any) => p.playerId === playerId) as Phaser.GameObjects.Sprite;
            if (child) child.destroy();

            // Remove Name Tag
            const nameText = this.otherPlayerNameTags.get(playerId);
            if (nameText) {
                nameText.destroy();
                this.otherPlayerNameTags.delete(playerId);
            }

            this.updateDebugInfo();
            this.emitPlayerCount();
        });

        this.events.on('moveOtherPlayer', (playerInfo: any) => {
            const child = this.otherPlayersGroup.getChildren().find((p: any) => p.playerId === playerInfo.id) as Phaser.GameObjects.Sprite;
            if (child) {
                // console.log(`[MainScene] Move ${playerInfo.id} to ${playerInfo.x}, ${playerInfo.y}`);

                // Animation & Flip
                const dx = playerInfo.x - child.x;
                const dy = playerInfo.y - child.y;

                if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {


                    const animKey = child.texture.key.startsWith('other_player_') ? `${child.texture.key}_walk` : 'walk';
                    child.play(animKey, true);

                    if (dx < 0) child.setFlipX(true);
                    else if (dx > 0) child.setFlipX(false);
                }

                // Smooth interpolation
                this.tweens.add({
                    targets: child,
                    x: playerInfo.x,
                    y: playerInfo.y,
                    duration: 50, // Interpolate over 50ms to smooth out 20ms updates
                    ease: 'Linear'
                });
            } else {
                console.warn(`[MainScene] Could not find player ${playerInfo.id} to move`);
            }
        });

        this.events.on('chatMessage', (chatData: any) => {
            console.log("MainScene: Event 'chatMessage'", chatData);
            window.dispatchEvent(new CustomEvent('chatMessage', { detail: chatData }));
            this.showChatBubble(chatData.id, chatData.text);
        });

        // --- Connect to Server ---
        console.log("MainScene: Connecting Socket");
        this.socketManager = new SocketManager(this);

        // --- Map Setup ---
        const scaleMap = 1;
        const tileWidth = 1024 * scaleMap;
        const totalWidth = tileWidth * 3;
        const totalHeight = 1024 * scaleMap;

        // Create Map (Simplified to avoid loop issues)
        // Create Map (Restoring full width)
        this.add.image(0, 0, 'office_map_clean').setOrigin(0, 0).setScale(scaleMap);
        this.add.image(tileWidth, 0, 'office_map_clean').setOrigin(0, 0).setScale(scaleMap);
        this.add.image(tileWidth * 2, 0, 'office_map_clean').setOrigin(0, 0).setScale(scaleMap);

        this.physics.world.setBounds(0, 0, totalWidth, totalHeight);
        this.cameras.main.setBounds(0, 0, totalWidth, totalHeight);

        // --- DEBUG: Log Click Coords ---
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            console.log(`World Coords: x=${Math.round(worldPoint.x)}, y=${Math.round(worldPoint.y)}`);
        });

        // --- Animations ---
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('character_anim', { start: 0, end: 2 }),
            frameRate: 8,
            repeat: -1,
            yoyo: true
        });
        this.anims.create({
            key: 'idle',
            frames: [{ key: 'character_anim', frame: 1 }],
            frameRate: 1
        });
        this.anims.create({
            key: 'idle_back',
            frames: [{ key: 'character_back' }],
            frameRate: 1
        });

        // Bot Anims
        for (let i = 1; i <= 10; i++) {
            this.anims.create({
                key: `walk_char_${i}`,
                frames: this.anims.generateFrameNumbers(`char_${i}`, { start: 0, end: 2 }),
                frameRate: 8,
                repeat: -1,
                yoyo: true
            });
            this.anims.create({
                key: `idle_char_${i}`,
                frames: [{ key: `char_${i}`, frame: 0 }],
                frameRate: 1
            });
        }

        // --- Bots ---
        this.bots = [];
        for (let i = 1; i <= 10; i++) {
            const x = Phaser.Math.Between(0, totalWidth);
            const y = Phaser.Math.Between(0, totalHeight);
            const bot = new Bot(this, x, y, `char_${i}`);
            this.bots.push(bot);
            (bot.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
        }

        // --- Player ---
        const savedSpriteUrl = localStorage.getItem('playerSprite');
        let playerTextureKey = 'character_anim';

        this.player = this.physics.add.sprite(445, 271, playerTextureKey);
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(100);

        this.player.setScale(0.1);
        this.player.body.setSize(100, 50);
        this.player.body.setOffset(100, 421);

        // --- Physics & Collisions ---
        // Reverted by request
        // this.physics.world.debugGraphic.setVisible(true);
        // this.physics.world.drawDebug = true;

        // --- Physics & Collisions ---
        this.obstacles = this.physics.add.staticGroup();

        // Helper to add invisible wall
        const createWall = (x: number, y: number, w: number, h: number) => {
            const wall = this.add.rectangle(x + w / 2, y + h / 2, w, h);
            this.physics.add.existing(wall, true); // true = static body
            this.obstacles.add(wall);
        };

        // --- Map Boundaries & Obstacles ---
        // Top Wall
        createWall(0, 0, totalWidth, 50);
        // Bottom Wall
        createWall(0, totalHeight - 50, totalWidth, 50);
        // Left Wall
        createWall(0, 0, 50, totalHeight);
        // Right Wall
        createWall(totalWidth - 50, 0, 50, totalHeight);

        // ============================================
        // INTERNAL OBSTACLES REMOVED BY REQUEST
        // ============================================

        // Add collider
        this.physics.add.collider(this.player, this.obstacles);

        if (savedSpriteUrl) {
            const customKey = 'custom_player';
            this.load.spritesheet(customKey, savedSpriteUrl, { frameWidth: 96, frameHeight: 128 });
            this.load.once('complete', () => {
                if (this.textures.exists(customKey)) {
                    this.player.setTexture(customKey);
                    this.player.setScale(0.37);
                    this.player.body.setSize(32, 16);
                    this.player.body.setOffset(32, 110);
                    // Also define secondary hit box if needed, or stick to this

                    this.anims.create({
                        key: 'walk_custom',
                        frames: this.anims.generateFrameNumbers(customKey, { start: 0, end: 2 }),
                        frameRate: 8,
                        repeat: -1,
                        yoyo: true
                    });
                    this.anims.create({
                        key: 'idle_custom',
                        frames: [{ key: customKey, frame: 1 }],
                        frameRate: 1
                    });
                    this.anims.create({
                        key: 'idle_back_custom',
                        frames: [{ key: customKey, frame: 10 }], // Frame 10 = Row 3, Middle (Back)
                        frameRate: 1
                    });
                    this.player.play('idle_custom');
                }
            });
            if (!this.load.isLoading()) {
                this.load.start();
            }
        }

        // Join Game Network
        const playerName = localStorage.getItem('playerName') || 'Guest';
        const playerPortrait = localStorage.getItem('playerPortrait') || '';

        // --- Player Name Tag ---
        this.playerNameText = this.add.text(this.player.x, this.player.y - 45, playerName, {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            resolution: 2
        }).setOrigin(0.5).setDepth(101);

        console.log('Joining game with:', { playerName, savedSpriteUrl, playerPortrait });
        this.socketManager.joinGame(playerName, savedSpriteUrl || '', playerPortrait);

        // FIX: Emit initial position immediately so server knows where we are
        this.socketManager.emitPlayerMovement(this.player.x, this.player.y);
        console.log(`[MainScene] Sent initial position: ${this.player.x}, ${this.player.y}`);

        // --- Camera ---
        this.cameras.main.setZoom(1.0);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, totalWidth, totalHeight);
        this.scale.on('resize', (_gameSize: Phaser.Structs.Size) => {
            this.cameras.main.setBounds(0, 0, totalWidth, totalHeight);
        });

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // --- Zone ---
        const zoneY = 500;
        const zoneW = 600;
        const zoneH = 400;
        const zoneX = totalWidth / 2;
        this.presentationZone = this.add.zone(zoneX, zoneY, zoneW, zoneH);
        this.physics.world.enable(this.presentationZone);
        (this.presentationZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        (this.presentationZone.body as Phaser.Physics.Arcade.Body).moves = false;

        // --- Stage "No Event" Text ---
        // --- Stage "No Event" Text ---
        // Centered but smaller and subtle
        this.noEventText = this.add.text(totalWidth / 2, 500, 'NO EVENT', {
            fontSize: '32px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff', // Bright White
            fontStyle: 'bold',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(1);
        this.noEventText.setShadow(2, 2, '#333333', 2, true, true);
        this.noEventText.setAlpha(1); // Fully Visible

        // Listen for stage updates to handle Countdown
        window.addEventListener('stageUpdate', ((e: CustomEvent) => {
            const eventData = e.detail;
            this.currentStageEvent = eventData;

            // Clear existing timer if any
            if (this.stageTimerEvent) {
                this.stageTimerEvent.remove(false);
                this.stageTimerEvent = undefined;
            }

            if (eventData) {
                this.noEventText.setVisible(true); // Show text (will be countdown)

                // Immediate update
                this.updateStageCountdown();

                // Start loop
                this.stageTimerEvent = this.time.addEvent({
                    delay: 1000,
                    callback: () => this.updateStageCountdown(),
                    loop: true
                });
            } else {
                this.noEventText.setText("NO EVENT");
                this.noEventText.setVisible(true); // Always visible when no event? User asked "NO EVENT" text.
            }
        }) as EventListener);

        // --- Seats ---
        const cx = totalWidth / 2;
        const minX = cx - 180;
        const maxX = cx + 180;
        const minY = 480;
        const maxY = 600;

        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(minX, maxX);
            const y = Phaser.Math.Between(minY, maxY);
            this.seats.push(new Phaser.Math.Vector2(x, y));
        }

        // --- Window Events ---
        window.addEventListener('triggerAutoSeat', () => {
            this.autoMoveToSeat();
        });

        window.addEventListener('sendChat', ((e: CustomEvent) => {
            const msg = e.detail;
            if (msg) this.socketManager.sendChat(msg);
        }) as EventListener);

        window.addEventListener('reqStartStage', ((e: CustomEvent) => {
            const { title, password } = e.detail;
            this.socketManager.startStageEvent(title, password);
        }) as EventListener);

        window.addEventListener('reqEndStage', ((e: CustomEvent) => {
            const { password } = e.detail;
            this.socketManager.endStageEvent(password);
        }) as EventListener);
    }

    private updateStageCountdown() {
        if (!this.currentStageEvent || !this.noEventText) return;

        const now = Date.now();
        const start = this.currentStageEvent.startTime || this.currentStageEvent.timestamp;
        const durationMins = this.currentStageEvent.duration || 30; // Default 30
        const end = start + durationMins * 60 * 1000;

        // Ensure style allows passing through
        this.noEventText.setColor('#ffffff');

        if (now < start) {
            // Counting down to Start
            const diff = start - now;
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            this.noEventText.setText(`STARTS IN ${mins}:${secs < 10 ? '0' : ''}${secs}`);
            this.noEventText.setColor('#ffff00'); // Yellow for emphasis
        } else if (now < end) {
            // Live
            const diff = end - now;
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            this.noEventText.setText(`LIVE • ENDS IN ${mins}:${secs < 10 ? '0' : ''}${secs}`);
            this.noEventText.setColor('#ff0000'); // Red for Live
        } else {
            // Ended
            this.noEventText.setText("NO EVENT");
            this.noEventText.setColor('#aaaaaa');
            if (this.stageTimerEvent) {
                this.stageTimerEvent.remove(false);
                this.stageTimerEvent = undefined;
            }
        }
    }

    update() {
        if (!this.player) return;

        // Update Debug Text
        this.updateDebugInfo();

        // Update Name Tags (ALWAYS do this first to avoid early returns causing lag)
        if (this.playerNameText && this.player) {
            this.playerNameText.setPosition(this.player.x, this.player.y - 45);
        }

        this.otherPlayersGroup.getChildren().forEach((child: any) => {
            const id = child.playerId;
            const text = this.otherPlayerNameTags.get(id);
            if (text) {
                text.setPosition(child.x, child.y - 45);
            }
        });

        const body = this.player.body;
        const speed = 200;

        // Auto-Moving
        if (this.isAutoMoving && this.targetSeat) {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetSeat.x, this.targetSeat.y);
            if (distance < 10) {
                body.setVelocity(0);
                this.player.setPosition(this.targetSeat.x, this.targetSeat.y);
                this.isAutoMoving = false;
                this.targetSeat = undefined;
                this.targetSeat = undefined;
                this.isSeated = true;
                const isCustom = this.player.texture.key === 'custom_player';
                this.player.anims.play(isCustom ? 'idle_back_custom' : 'idle_back', true);
                window.dispatchEvent(new CustomEvent('playerSeated')); // Notify UI
            } else {
                this.physics.moveToObject(this.player, this.targetSeat, speed);
                this.player.anims.play('walk', true);
                if (this.player.body.velocity.x < 0) this.player.setFlipX(true);
                else this.player.setFlipX(false);
            }
            this.socketManager.emitPlayerMovement(this.player.x, this.player.y);
            return;
        }

        if (!this.cursors) return;

        // Manual Input
        const hasInput = this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown;

        if (this.isSeated) {
            if (!hasInput) {
                const isCustom = this.player.texture.key === 'custom_player';
                this.player.anims.play(isCustom ? 'idle_back_custom' : 'idle_back', true);
                body.setVelocity(0);
                return;
            } else {
                this.isSeated = false;
            }
        }

        // Reset velocity every frame to stop movement if keys are released
        body.setVelocity(0);

        if (this.cursors.left.isDown) body.setVelocityX(-speed);
        else if (this.cursors.right.isDown) body.setVelocityX(speed);

        if (this.cursors.up.isDown) body.setVelocityY(-speed);
        else if (this.cursors.down.isDown) body.setVelocityY(speed);

        // Normalize and scale only if moving to avoid drift
        if (body.velocity.x !== 0 || body.velocity.y !== 0) {
            body.velocity.normalize().scale(speed);
        }

        const isCustom = this.player.texture.key === 'custom_player';
        const walkKey = isCustom ? 'walk_custom' : 'walk';
        const idleKey = isCustom ? 'idle_custom' : 'idle';

        if (hasInput) {
            this.player.anims.play(walkKey, true);
            this.player.setFlipX(this.cursors.left.isDown);
        } else {
            this.player.anims.play(idleKey, true);
        }

        // Emit movement if changed significantly
        // Check distance from last sent position to avoid spamming tiny micro-movements
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.lastSentPosition.x, this.lastSentPosition.y);

        if (dist > 1) { // Only send if moved > 1 pixel
            const now = Date.now();
            if (now - this.lastMoveTime > 20) { // Throttle 20ms (approx 50fps)
                this.socketManager.emitPlayerMovement(this.player.x, this.player.y);
                this.lastMoveTime = now;
                this.lastSentPosition.x = this.player.x;
                this.lastSentPosition.y = this.player.y;
            }
        }



        try {
            if (this.presentationZone) {
                const playerBounds = this.player.getBounds();
                const inZone = Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.presentationZone.getBounds());
                this.onZoneChange?.(inZone);
            }

            this.bots.forEach(bot => bot.update());
        } catch (e) {
            console.error("Error in MainScene update loop:", e);
        }
    }

    private addOtherPlayer(playerInfo: any) {
        // Prevent adding self
        if (this.socketManager && this.socketManager['socket'] && playerInfo.id === this.socketManager['socket'].id) {
            return;
        }

        if (this.otherPlayersGroup.getChildren().some((child: any) => child.playerId === playerInfo.id)) {
            return;
        }

        const x = playerInfo.x;
        const y = playerInfo.y;
        let textureKey = 'character_anim';

        const otherPlayer = this.physics.add.sprite(x, y, textureKey);
        (otherPlayer as any).playerId = playerInfo.id;
        this.otherPlayersGroup.add(otherPlayer);

        otherPlayer.setCollideWorldBounds(true);
        otherPlayer.setScale(0.1);
        otherPlayer.body.setSize(32, 16);
        otherPlayer.body.setOffset(32, 110);
        (otherPlayer.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        otherPlayer.setDepth(100);

        console.log(`[MainScene] Spawning OtherPlayer ${playerInfo.id} at ${x}, ${y}`);

        if (playerInfo.spriteUrl) {
            const customKey = `other_player_${playerInfo.id}`;
            const startAnim = () => {
                this.createWalkingAnims(customKey);
                if (otherPlayer.active) otherPlayer.play(`${customKey}_idle`);
            };

            if (this.textures.exists(customKey)) {
                otherPlayer.setTexture(customKey);
                otherPlayer.setScale(0.37);
                startAnim();
            } else {
                this.load.spritesheet(customKey, playerInfo.spriteUrl, { frameWidth: 96, frameHeight: 128 });
                this.load.once(`filecomplete-spritesheet-${customKey}`, () => {
                    console.log(`[MainScene] Loaded texture for ${playerInfo.id}`);
                    if (otherPlayer.active) {
                        otherPlayer.setTexture(customKey);
                        otherPlayer.setScale(0.37);
                        startAnim();
                    }
                });
                if (!this.load.isLoading()) {
                    this.load.start();
                }
            }
        } else {
            otherPlayer.play('idle');
        }

        // Add Name Tag
        const nameText = this.add.text(x, y - 45, playerInfo.name || 'Guest', {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            resolution: 2
        }).setOrigin(0.5).setDepth(101);
        this.otherPlayerNameTags.set(playerInfo.id, nameText);
    }

    private createWalkingAnims(key: string) {
        if (!this.anims.exists(`${key}_walk`)) {
            this.anims.create({
                key: `${key}_walk`,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 2 }),
                frameRate: 8,
                repeat: -1,
                yoyo: true
            });
            this.anims.create({
                key: `${key}_idle`,
                frames: [{ key: key, frame: 1 }],
                frameRate: 1
            });
        }
    }

    private showChatBubble(playerId: string, text: string) {
        let targetSprite: Phaser.GameObjects.Sprite | undefined;

        if (playerId === this.socketManager['socket'].id) {
            targetSprite = this.player;
        } else {
            targetSprite = this.otherPlayersGroup.getChildren().find(
                (p: any) => p.playerId === playerId
            ) as Phaser.GameObjects.Sprite;
        }

        if (targetSprite) {
            // Container to hold bubble parts
            const container = this.add.container(targetSprite.x, targetSprite.y - 80);

            // Text Object (Create first to measure size)
            const bubbleText = this.add.text(0, 0, text, {
                fontSize: '14px',
                color: '#000000',
                fontFamily: 'Arial',
                align: 'center',
                wordWrap: { width: 200, useAdvancedWrap: true }
            }).setOrigin(0.5);

            // Bounds
            const bounds = bubbleText.getBounds();
            const padding = 10;
            const width = bounds.width + padding * 2;
            const height = bounds.height + padding * 2;

            // Graphics for Bubble Shape
            const bubbleGraphics = this.add.graphics();
            bubbleGraphics.fillStyle(0xffffff, 1);
            bubbleGraphics.lineStyle(2, 0x000000, 1);

            // Rounded Rectangle
            bubbleGraphics.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
            bubbleGraphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);

            // Tail (Triangle)
            const tailHeight = 10;
            const tailWidth = 12;
            bubbleGraphics.beginPath();
            bubbleGraphics.moveTo(0, height / 2);
            bubbleGraphics.lineTo(-tailWidth / 2, height / 2);
            bubbleGraphics.lineTo(0, height / 2 + tailHeight);
            bubbleGraphics.lineTo(tailWidth / 2, height / 2);
            bubbleGraphics.closePath();
            bubbleGraphics.fillPath();
            bubbleGraphics.strokePath();

            // Note: Stroke on tail might overlap weirdly with rect, but good enough for comic style
            // Better look: re-draw rect and tail as one path or just fill tail over stroke? 
            // Simple approach: Fill tail white to cover rect stroke, then stroke tail edges?
            // For now, simple geometric shape is fine.

            // Add to container (Graphics first so it's behind text)
            container.add([bubbleGraphics, bubbleText]);
            container.setDepth(1000); // Always on top

            // Tween: Float up and Fade out
            this.tweens.add({
                targets: container,
                y: container.y - 30,
                alpha: 0,
                duration: 4000,
                delay: 2000, // Stay visible for 2s then fade
                onComplete: () => container.destroy()
            });
        }
    }

    public autoMoveToSeat() {
        if (this.isAutoMoving || this.isSeated) return;
        const seatIndex = Phaser.Math.Between(0, this.seats.length - 1);
        const seat = this.seats[seatIndex];

        // Instant Teleport
        this.player.setPosition(seat.x, seat.y);
        this.isSeated = true;
        const isCustom = this.player.texture.key === 'custom_player';
        this.player.anims.play(isCustom ? 'idle_back_custom' : 'idle_back', true);

        this.socketManager.emitPlayerMovement(this.player.x, this.player.y);
        window.dispatchEvent(new CustomEvent('playerSeated')); // Notify UI
    }

    private emitPlayerCount() {
        const others = this.otherPlayersGroup ? this.otherPlayersGroup.getLength() : 0;
        const total = others + 1; // +1 for self
        window.dispatchEvent(new CustomEvent('playerCountUpdate', { detail: total }));
    }

    private updateDebugInfo() {
        // ... existing debug logic (commented out) ...
    }

}
